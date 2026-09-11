(() => {
  let lastKey = '';
  let running = false;

  function getState() {
    let data;
    try { data = DATA; } catch (_) { return null; }
    const select = document.getElementById('nameSelect');
    const name = String(select?.value || '').trim();
    if (!data || !Array.isArray(data.shifts) || !name) return null;
    return {data, name};
  }

  async function syncSelectedPerson(force = false) {
    if (running) return;
    const state = getState();
    if (!state) return;

    const key = `${state.name}|${String(state.data.updatedAt || '')}`;
    if (!force && key === lastKey) return;
    running = true;

    try {
      const r = await fetch(`/.netlify/functions/portal-person?name=${encodeURIComponent(state.name)}&_=${Date.now()}`, {cache:'no-store'});
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Kunne ikke hente personens vagter');
      if (!Array.isArray(j.shifts)) return;

      const byId = new Map(state.data.shifts.map(x => [String(x.id || ''), x]));
      for (const shift of j.shifts) byId.set(String(shift.id || ''), shift);
      state.data.shifts = [...byId.values()].sort((a,b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        String(a.start || '').localeCompare(String(b.start || '')) ||
        String(a.person || '').localeCompare(String(b.person || ''), 'da')
      );

      if (!state.data.people.includes(state.name)) {
        state.data.people.push(state.name);
        state.data.people.sort((a,b) => a.localeCompare(b,'da'));
      }

      lastKey = key;
      if (typeof renderHome === 'function') renderHome();
      if (typeof renderMine === 'function') renderMine();
    } catch (e) {
      console.warn('Person live sync failed', e);
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

  setInterval(() => syncSelectedPerson(false), 1200);
  setTimeout(() => syncSelectedPerson(true), 500);
})();
