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
  if (/^\d{5}(?:\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (Number.isFinite(serial)) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    }
  }
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
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
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

function clean(value) {
  return String(value || '')
    .replace(/\bstjerner\b/gi, 'gæster')
    .replace(/\bstjerne\b/gi, 'gæst')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizePerson(name, role) {
  const n = String(name || '').trim();
  const r = String(role || '').trim();
  if (!n) return '';
  let m = n.match(/^Stjørna\s+([1-5])$/i);
  if (m) return `Stjørna ${m[1]}`;
  m = n.match(/^Stjerne\s+([A-E])$/i);
  if (m) return `Stjørna ${m[1].toUpperCase().charCodeAt(0) - 64}`;
  if (r.toLocaleLowerCase('fo-FO') === 'spíri') {
    if (/^Naina\s+Jórun(?:\s|$)/i.test(n)) return 'Naina Jórun';
    return n.split(/\s+/)[0] || n;
  }
  return n;
}

function rowToShift(r) {
  const status = clean(r[9]) || 'Planlagt';
  return {
    id:String(r[0] || '').trim(),
    date:normalizeDate(r[1]),
    start:normalizeTime(r[2]),
    end:normalizeTime(r[3]),
    person:normalizePerson(r[4], r[5]),
    role:clean(r[5]),
    task:clean(r[6]),
    location:clean(r[7]),
    activity:clean(r[8]),
    status
  };
}

function faroeNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', {
    timeZone:'Atlantic/Faroe', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(new Date()).filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
  return {today:`${p.year}-${p.month}-${p.day}`, now:`${p.hour}:${p.minute}`};
}

async function fetchRange(sheetId, range) {
  const params = `tqx=out:csv&sheet=VAGTPLAN&range=${encodeURIComponent(range)}&headers=0`;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?${params}&_=${Date.now()}-${Math.random()}`;
  const response = await fetch(sheetUrl, {
    cache:'no-store',
    headers:{'cache-control':'no-cache, no-store, max-age=0','pragma':'no-cache','user-agent':'HOYDALAR-2-person-chunk'}
  });
  if (!response.ok) throw new Error(`VAGTPLAN ${range} svarede ${response.status}`);
  return parseCsv(await response.text());
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const requestedName = String(url.searchParams.get('name') || '').trim();
    if (!requestedName) return Response.json({error:'name mangler'}, {status:400});

    const sheetId = Netlify.env.get('MASTER_SHEET_ID');
    if (!sheetId) throw new Error('MASTER_SHEET_ID mangler');

    // Read VAGTPLAN in bounded chunks and then re-read the active week in a small
    // overlay range. The small overlay is intentionally last so newly inserted
    // rows around 14–16 September win over any stale Google GViz chunk response.
    const ranges = ['A5:J404','A405:J804','A805:J1122'];
    const blocks = await Promise.all(ranges.map(range => fetchRange(sheetId, range)));
    const activeWeekOverlay = await fetchRange(sheetId, 'A45:J75').catch(() => []);
    const rows = [...blocks.flat(), ...activeWeekOverlay];

    const {today, now} = faroeNow();
    const byId = new Map();
    for (const r of rows) {
      const shift = rowToShift(r);
      if (!shift.id || shift.id === 'Vagt ID' || !shift.date || !shift.person) continue;
      if (shift.person !== requestedName) continue;
      if (/^(aflyst|annulleret|cancelled|canceled)$/i.test(shift.status)) continue;
      if (!(shift.date > today || (shift.date === today && (!shift.end || shift.end > now)))) continue;
      byId.set(shift.id, shift);
    }

    const shifts = [...byId.values()].sort((a,b) =>
      a.date.localeCompare(b.date) ||
      (a.start || '').localeCompare(b.start || '') ||
      (a.end || '').localeCompare(b.end || '')
    );

    return Response.json({
      name:requestedName,
      shifts,
      count:shifts.length,
      source:'VAGTPLAN chunked person sync + active-week overlay',
      updatedAt:new Date().toISOString()
    }, {
      headers:{
        'cache-control':'no-store, max-age=0, must-revalidate',
        'pragma':'no-cache',
        'expires':'0'
      }
    });
  } catch (error) {
    return Response.json({error:error.message || 'Ukendt fejl'}, {
      status:500,
      headers:{'cache-control':'no-store','pragma':'no-cache'}
    });
  }
};
