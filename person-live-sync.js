(() => {
  let lastKey = '';
  let running = false;
  let retryTimer = null;

  function getState() {
    let data;
    try { data = DATA; } catch (_) { return null; }
    const select = document.getElementById('nameSelect');
    const name = String(select?.value || '').trim();
    if (!data || !Array.isArray(data.shifts) || !name) return null;
    return {data, name};
  }

  function scheduleRetry() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => syncSelectedPerson(true), 2500);
  }

  async function syncSelectedPerson(force = false) {
    if (running) return;
    const state = getState();
    if (!state) return;

    const key = `${state.name}|${String(state.data.updatedAt || '')}`;
    if (!force && key === lastKey) return;
    running = true;

    try {
      const r = await fetch(`/.netlify/functions/portal-person?name=${encodeURIComponent(state.name)}&_=${Date.now()}`, {
        cache:'no-store',
        headers:{'cache-control':'no-cache'}
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Kunne ikke hente personens vagter');
      if (!Array.isArray(j.shifts)) throw new Error('Ugyldigt svar fra person-synk');

      // If the user changed name while the request was running, ignore this result.
      const currentName = String(document.getElementById('nameSelect')?.value || '').trim();
      if (currentName !== state.name) return;

      // The selected person's schedule is replaced, not merged. VAGTPLAN is source of truth.
      const others = state.data.shifts.filter(x => String(x.person || '').trim() !== state.name);
      state.data.shifts = [...others, ...j.shifts].sort((a,b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        String(a.start || '').localeCompare(String(b.start || '')) ||
        String(a.person || '').localeCompare(String(b.person || ''), 'da')
      );

      if (!state.data.people.includes(state.name)) {
        state.data.people.push(state.name);
        state.data.people.sort((a,b) => a.localeCompare(b,'da'));
      }

      lastKey = key;
      clearTimeout(retryTimer);
      if (typeof renderHome === 'function') renderHome();
      if (typeof renderMine === 'function') renderMine();
    } catch (e) {
      console.warn('Person live sync failed', e);
      scheduleRetry();
    } finally {
      running = false;
    }
  }

  document.addEventListener('change', e => {
    if (e.target?.id === 'nameSelect') {
      lastKey = '';
      setTimeout(() => syncSelectedPerson(true), 0);
    }
  });

  // Refresh the selected person's own schedule frequently, independently of the global portal refresh.
  setInterval(() => syncSelectedPerson(true), 30000);
  setTimeout(() => syncSelectedPerson(true), 350);
})();
