(() => {
  function cleanEventName(value) {
    const s = String(value || '').trim();
    if (!s) return '';
    return s.split(' · ')[0].trim();
  }

  function eventKey(x) {
    return `${String(x.date || '')}|${cleanEventName(x.activity || x.dayType || x.part || x.task || '')}|${String(x.location || '')}`;
  }

  function buildShiftEvents() {
    const groups = new Map();
    const shifts = Array.isArray(window.DATA?.shifts) ? window.DATA.shifts : [];
    for (const x of shifts) {
      if (!x?.date) continue;
      const title = cleanEventName(x.activity || x.task || x.role || 'Produktionsaktivitet');
      if (!title) continue;
      const key = `${x.date}|${title}|${String(x.location || '')}`;
      if (!groups.has(key)) groups.set(key, {date:x.date,title,location:x.location || '',starts:[],ends:[],source:'shift'});
      const g = groups.get(key);
      if (x.start) g.starts.push(String(x.start));
      if (x.end) g.ends.push(String(x.end));
    }
    return [...groups.values()].map(g => ({
      ...g,
      start:g.starts.sort()[0] || '',
      end:g.ends.sort().slice(-1)[0] || ''
    }));
  }

  function buildProgramEvents() {
    const groups = new Map();
    const program = Array.isArray(window.DATA?.program) ? window.DATA.program : [];
    for (const x of program) {
      if (!x?.date) continue;
      const title = cleanEventName(x.part || x.dayType || x.activity || 'Produktionsdag');
      const key = `${x.date}|${title}|${String(x.location || '')}`;
      if (!groups.has(key)) groups.set(key, {date:x.date,title,location:x.location || '',starts:[],ends:[],source:'program'});
      const g = groups.get(key);
      if (x.start) g.starts.push(String(x.start));
      if (x.end) g.ends.push(String(x.end));
    }
    return [...groups.values()].map(g => ({
      ...g,
      start:g.starts.sort()[0] || '',
      end:g.ends.sort().slice(-1)[0] || ''
    }));
  }

  function nextProductionEvent() {
    const all = [...buildShiftEvents(), ...buildProgramEvents()]
      .filter(x => x.date)
      .sort((a,b) => String(a.date).localeCompare(String(b.date)) || String(a.start || '').localeCompare(String(b.start || '')));
    return all[0] || null;
  }

  function renderCorrectNextEvent() {
    const box = document.getElementById('nextDay');
    if (!box || !window.DATA) return;
    const e = nextProductionEvent();
    if (!e) {
      box.innerHTML = '<div class="focus-kicker">Næste begivenhed</div><div class="focus-title">Ingen kommende begivenheder</div>';
      return;
    }
    const p = typeof dateParts === 'function' ? dateParts(e.date) : {long:e.date};
    const escLocal = typeof esc === 'function' ? esc : (v => String(v ?? ''));
    const time = e.start ? `${e.start}${e.end ? ' – ' + e.end : ''}` : 'Tid afventer';
    box.innerHTML = `<div class="focus-kicker">Næste begivenhed</div><div class="focus-title">${escLocal(e.title)}</div><div class="focus-meta">${escLocal(p.long)}<br>${escLocal(time)} · ${escLocal(e.location || 'Location afventer')}</div><button class="focus-action" id="nextEventOpenDay">SE DAGEN</button>`;
    document.getElementById('nextEventOpenDay')?.addEventListener('click', () => {
      if (typeof personalDay !== 'undefined') personalDay = {name:'',date:''};
      if (typeof showPage === 'function') showPage('all');
      if (typeof renderAll === 'function') renderAll(e.date);
    });
  }

  function patchRenderHome() {
    if (window.__hoyNextEventPatched || typeof window.renderHome !== 'function') return;
    window.__hoyNextEventPatched = true;
    const original = window.renderHome;
    window.renderHome = function(...args) {
      const result = original.apply(this, args);
      renderCorrectNextEvent();
      return result;
    };
    renderCorrectNextEvent();
  }

  patchRenderHome();
  setTimeout(patchRenderHome, 0);
  setTimeout(renderCorrectNextEvent, 500);
})();
