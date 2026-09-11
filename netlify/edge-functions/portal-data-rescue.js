function parseCsv(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quoted && n === '"') { value += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === ',' && !quoted) { row.push(value); value = ''; continue; }
    if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && n === '\n') i++;
      row.push(value); value = '';
      if (row.some(v => String(v).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    value += c;
  }
  if (value || row.length) {
    row.push(value);
    if (row.some(v => String(v).trim() !== '')) rows.push(row);
  }
  return rows;
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]);
    let month = a, day = b;
    if (a > 12) { day = a; month = b; }
    else if (b > 12) { month = a; day = b; }
    return `${m[3]}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
  m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return `${m[3]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return '';
}

function normalizeTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (m) {
    let h = Number(m[1]);
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2,'0')}:${m[2]}`;
  }
  m = raw.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${String(Number(m[1])).padStart(2,'0')}:${m[2]}` : '';
}

function publicText(value) {
  return String(value || '')
    .replace(/\bstjerner\b/gi, 'gæster')
    .replace(/\bstjerne\b/gi, 'gæst')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function safePerson(name, role) {
  const n = String(name || '').trim();
  const r = String(role || '').trim();
  if (!n) return '';

  let m = n.match(/^Stjørna\s+([1-5])$/i);
  if (m) return `Stjørna ${m[1]}`;
  m = n.match(/^Stjerne\s+([A-E])$/i);
  if (m) return `Stjørna ${m[1].toUpperCase().charCodeAt(0) - 64}`;

  if (/^stjerne\b/i.test(n) || /\bstjerne\b/i.test(r)) return '';
  if (/^mangler person/i.test(n)) return n;
  if (r.toLocaleLowerCase('fo-FO') === 'spíri') {
    if (/^Naina\s+Jórun(?:\s|$)/i.test(n)) return 'Naina Jórun';
    return n.split(/\s+/)[0] || n;
  }
  return n;
}

function isCancelled(status) {
  return /^(aflyst|annulleret|cancelled|canceled)$/i.test(String(status || '').trim());
}

function faroeNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', {
    timeZone:'Atlantic/Faroe', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(new Date()).filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
  return {today:`${parts.year}-${parts.month}-${parts.day}`, now:`${parts.hour}:${parts.minute}`};
}

async function fetchRange(sheetId, range) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=VAGTPLAN&range=${encodeURIComponent(range)}&headers=0&_=${Date.now()}-${Math.random()}`;
  const response = await fetch(url, {
    cache:'no-store',
    headers:{
      'cache-control':'no-cache, no-store, max-age=0',
      'pragma':'no-cache',
      'user-agent':'HOYDALAR-2-live-merge'
    }
  });
  if (!response.ok) throw new Error(`VAGTPLAN ${range} svarede ${response.status}`);
  return parseCsv(await response.text());
}

export default async (request, context) => {
  const target = new URL('/.netlify/functions/portal-data-safe', request.url);
  const response = await fetch(target, {headers:{'cache-control':'no-cache, no-store','pragma':'no-cache'}});
  if (!response.ok) return response;

  try {
    const data = await response.json();
    const sheetId = Netlify.env.get('MASTER_SHEET_ID');
    if (!sheetId) throw new Error('MASTER_SHEET_ID mangler');

    // Large chunks give complete coverage. A small active-week overlay is fetched
    // last so newly inserted rows around 14–16 September override stale GViz data.
    const blocks = await Promise.all([
      fetchRange(sheetId, 'A5:J404'),
      fetchRange(sheetId, 'A405:J804'),
      fetchRange(sheetId, 'A805:J1122'),
      fetchRange(sheetId, 'A45:J75')
    ]);
    const rows = blocks.flat();

    const {today, now} = faroeNow();
    const active = x => x.date && (x.date > today || (x.date === today && (!x.end || x.end > now)));

    const liveShifts = rows.map(r => {
      const status = publicText(r[9]) || 'Planlagt';
      return {
        id:String(r[0] || '').trim(),
        date:normalizeDate(r[1]),
        start:normalizeTime(r[2]),
        end:normalizeTime(r[3]),
        person:safePerson(r[4], r[5]),
        role:publicText(r[5]),
        task:publicText(r[6]),
        location:publicText(r[7]),
        activity:publicText(r[8]),
        status
      };
    }).filter(x => x.id && x.id !== 'Vagt ID' && x.person && active(x) && !isCancelled(x.status));

    const byId = new Map((Array.isArray(data.shifts) ? data.shifts : []).map(x => [x.id, x]));
    for (const shift of liveShifts) byId.set(shift.id, {...(byId.get(shift.id) || {}), ...shift});

    data.shifts = [...byId.values()].sort((a,b) =>
      String(a.date||'').localeCompare(String(b.date||'')) ||
      String(a.start||'').localeCompare(String(b.start||'')) ||
      String(a.person||'').localeCompare(String(b.person||''),'da')
    );
    data.people = [...new Set(data.shifts.map(x => x.person).filter(x => x && !/^mangler person/i.test(x)))].sort((a,b)=>a.localeCompare(b,'da'));
    data.fullVagtplanMerge = true;
    data.chunkedVagtplanMerge = true;
    data.activeWeekOverlay = true;

    const headers = new Headers(response.headers);
    headers.set('content-type','application/json; charset=utf-8');
    headers.set('cache-control','no-store, max-age=0, must-revalidate');
    headers.set('pragma','no-cache');
    headers.set('expires','0');
    headers.delete('content-length');
    return new Response(JSON.stringify(data), {status:200, headers});
  } catch (error) {
    const headers = new Headers(response.headers);
    headers.set('cache-control','no-store, max-age=0');
    headers.delete('content-length');
    return new Response(await response.text(), {status:response.status, headers});
  }
};

export const config = {
  path: '/.netlify/functions/portal-data'
};
