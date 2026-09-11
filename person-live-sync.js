(() => {
  let running = false;
  let retryTimer = null;
  let observerTimer = null;

  function getState() {
    let data;
    try { data = DATA; } catch (_) { return null; }
    const select = document.getElementById('nameSelect');
    const name = String(select?.value || '').trim();
    if (!data || !Array.isArray(data.shifts) || !name) return null;
    return {data, name};
  }

  function signature(list) {
    return (list || [])
      .map(x => [x.id,x.date,x.start,x.end,x.person,x.activity,x.task].map(v => String(v || '')).join('|'))
      .sort()
      .join('||');
  }

  function scheduleRetry(ms = 1800) {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => syncSelectedPerson(true), ms);
  }

  async function syncSelectedPerson(force = false) {
    if (running) return;
    const state = getState();
    if (!state) return;
    running = true;

    try {
      const r = await fetch(`/.netlify/functions/portal-person?name=${encodeURIComponent(state.name)}&_=${Date.now()}`, {
        cache:'no-store',
        headers:{'cache-control':'no-cache'}
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Kunne ikke hente personens vagter');
      if (!Array.isArray(j.shifts)) throw new Error('Ugyldigt svar fra person-synk');

      const currentName = String(document.getElementById('nameSelect')?.value || '').trim();
      if (currentName !== state.name) return;

      const currentPersonal = state.data.shifts
        .filter(x => String(x.person || '').trim() === state.name)
        .sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')));

      const freshPersonal = [...j.shifts].sort((a,b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        String(a.start || '').localeCompare(String(b.start || '')) ||
        String(a.end || '').localeCompare(String(b.end || ''))
      );

      const changed = signature(currentPersonal) !== signature(freshPersonal);
      if (!changed && !force) return;

      if (changed) {
        const others = state.data.shifts.filter(x => String(x.person || '').trim() !== state.name);
        state.data.shifts = [...others, ...freshPersonal].sort((a,b) =>
          String(a.date || '').localeCompare(String(b.date || '')) ||
          String(a.start || '').localeCompare(String(b.start || '')) ||
          String(a.person || '').localeCompare(String(b.person || ''), 'da')
        );

        if (!state.data.people.includes(state.name)) {
          state.data.people.push(state.name);
          state.data.people.sort((a,b) => a.localeCompare(b,'da'));
        }

        if (typeof renderHome === 'function') renderHome();
        if (typeof renderMine === 'function') renderMine();
      }

      clearTimeout(retryTimer);
    } catch (e) {
      console.warn('Person live sync failed', e);
      scheduleRetry();
    } finally {
      running = false;
    }
  }

  function queueSelfHeal() {
    clearTimeout(observerTimer);
    observerTimer = setTimeout(() => syncSelectedPerson(false), 80);
  }

  document.addEventListener('change', e => {
    if (e.target?.id === 'nameSelect') setTimeout(() => syncSelectedPerson(true), 0);
  });

  window.addEventListener('pageshow', () => setTimeout(() => syncSelectedPerson(true), 100));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(() => syncSelectedPerson(true), 100);
  });

  const observer = new MutationObserver(queueSelfHeal);
  observer.observe(document.documentElement, {subtree:true, childList:true});

  // Fast initial correction, then periodic safety check.
  setTimeout(() => syncSelectedPerson(true), 250);
  setTimeout(() => syncSelectedPerson(true), 1200);
  setInterval(() => syncSelectedPerson(false), 10000);
})();
