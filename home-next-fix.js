(() => {
  function getData() {
    try {
      if (typeof DATA !== 'undefined' && DATA) return DATA;
    } catch (e) {}
    return window.DATA || null;
  }

  function cleanEventName(value) {
    const s = String(value || '').trim();
    if (!s) return '';
    return s.split(' · ')[0].trim();
  }

  function displayTitle(value) {
    return String(value || '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function buildShiftEvents(data) {
    const groups = new Map();
    const shifts = Array.isArray(data?.shifts) ? data.shifts : [];
    for (const x of shifts) {
      if (!x?.date) continue;
      const title = cleanEventName(x.activity || x.task || x.role || 'Produktionsaktivitet');
      if (!title) continue;
      const key = `${x.date}|${title}|${String(x.location || '')}`;
      if (!groups.has(key)) groups.set(key, {date:x.date,title,location:x.location || '',starts:[],ends:[],source:'shift',count:0});
      const g = groups.get(key);
      g.count += 1;
      if (x.start) g.starts.push(String(x.start));
      if (x.end) g.ends.push(String(x.end));
    }
    return [...groups.values()].map(g => ({
      ...g,
      start:g.starts.sort()[0] || '',
      end:g.ends.sort().slice(-1)[0] || ''
    }));
  }

  function buildProgramEvents(data) {
    const groups = new Map();
    const program = Array.isArray(data?.program) ? data.program : [];
    for (const x of program) {
      if (!x?.date) continue;
      const title = [x.part, x.dayType].filter(Boolean).join(' · ') || cleanEventName(x.activity || 'Produktionsdag');
      const key = `${x.date}|${title}|${String(x.location || '')}`;
      if (!groups.has(key)) groups.set(key, {date:x.date,title,location:x.location || '',starts:[],ends:[],source:'program',count:0});
      const g = groups.get(key);
      g.count += 1;
      if (x.start) g.starts.push(String(x.start));
      if (x.end) g.ends.push(String(x.end));
    }
    return [...groups.values()].map(g => ({
      ...g,
      start:g.starts.sort()[0] || '',
      end:g.ends.sort().slice(-1)[0] || ''
    }));
  }

  function minutes(value) {
    const m = String(value || '').match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  function faroeClock() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', {
      timeZone:'Atlantic/Faroe', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
    }).formatToParts(new Date()).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
    return {date:`${parts.year}-${parts.month}-${parts.day}`, minute:Number(parts.hour) * 60 + Number(parts.minute)};
  }

  function importance(e) {
    const s = String(e.title || '').toLocaleLowerCase('da-DK');
    let score = Math.min(Number(e.count || 0), 20);
    if (e.source === 'program') score += 40;
    if (/super[ -]?dag|\bday\b|prøvedag|optagedag|teknisk test|sangundervisning/.test(s)) score += 60;
    if (/optagelse|træning med orkester|orkesterøvelse/.test(s)) score += 25;
    if (/lysopsætning|catering|frokost|mad|klargøring/.test(s)) score -= 30;
    return score;
  }

  function nextProductionEvent(data) {
    const all = [...buildShiftEvents(data), ...buildProgramEvents(data)].filter(x => x.date);
    if (!all.length) return null;

    const now = faroeClock();
    const active = all.filter(e => {
      if (e.date !== now.date) return false;
      const start = minutes(e.start), end = minutes(e.end);
      if (end == null) return false;
      return (start == null || start <= now.minute) && end > now.minute;
    });

    if (active.length) {
      return active.sort((a,b) => importance(b) - importance(a) || String(a.start || '').localeCompare(String(b.start || '')))[0];
    }

    const future = all.filter(e => {
      if (e.date > now.date) return true;
      if (e.date < now.date) return false;
      const start = minutes(e.start);
      return start == null || start > now.minute;
    });
    if (!future.length) return null;

    const firstDate = future.map(e => e.date).sort()[0];
    return future.filter(e => e.date === firstDate)
      .sort((a,b) => importance(b) - importance(a) || String(a.start || '').localeCompare(String(b.start || '')))[0];
  }

  function renderCorrectNextEvent() {
    const box = document.getElementById('nextDay');
    const data = getData();
    if (!box || !data) return;
    const e = nextProductionEvent(data);
    if (!e) {
      box.innerHTML = '<div class="focus-kicker">Næste begivenhed</div><div class="focus-title">Ingen kommende begivenheder</div>';
      return;
    }
    const p = typeof dateParts === 'function' ? dateParts(e.date) : {long:e.date};
    const escLocal = typeof esc === 'function' ? esc : (v => String(v ?? ''));
    const time = e.start ? `${e.start}${e.end ? ' – ' + e.end : ''}` : 'Tid afventer';
    box.innerHTML = `<div class="focus-kicker">Næste begivenhed</div><div class="focus-title">${escLocal(displayTitle(e.title))}</div><div class="focus-meta">${escLocal(p.long)}<br>${escLocal(time)} · ${escLocal(e.location || 'Location afventer')}</div><button class="focus-action" id="nextEventOpenDay">SE DAGEN</button>`;
    document.getElementById('nextEventOpenDay')?.addEventListener('click', () => {
      try { if (typeof personalDay !== 'undefined') personalDay = {name:'',date:''}; } catch (e) {}
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
  setTimeout(renderCorrectNextEvent, 300);
  setTimeout(renderCorrectNextEvent, 900);
})();
