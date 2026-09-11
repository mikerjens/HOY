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
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const months = {jan:1,feb:2,mar:3,apr:4,maj:5,jun:6,jul:7,aug:8,sep:9,okt:10,nov:11,dec:12};
  m = raw.toLocaleLowerCase('da-DK').match(/(?:^[a-zæøå]+\.\s*)?(\d{1,2})\.\s*(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)\.?\s*(\d{4})$/i);
  if (m) {
    const month = months[m[2].toLowerCase()];
    return `${m[3]}-${String(month).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
  }
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

function legacyStarName(name) {
  const n = String(name || '').trim();
  const m = n.match(/^Stjerne\s+([A-E])$/i);
  if (!m) return '';
  return `Stjørna ${m[1].toUpperCase().charCodeAt(0) - 64}`;
}

function safePerson(name, role) {
  const n = String(name || '').trim();
  const r = String(role || '').trim();
  if (!n) return '';

  const currentStar = n.match(/^Stjørna\s+(\d+)$/i);
  if (currentStar) return `Stjørna ${Number(currentStar[1])}`;

  const legacyStar = legacyStarName(n);
  if (legacyStar) return legacyStar;

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
  const p = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', {
    timeZone:'Atlantic/Faroe', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(new Date()).filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
  return {today:`${p.year}-${p.month}-${p.day}`, now:`${p.hour}:${p.minute}`};
}

async function fetchCsv(sheetId, sheet, range, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&range=${encodeURIComponent(range)}&headers=0&_=${Date.now()}`;
    const response = await fetch(url, {
      cache:'no-store',
      signal: controller.signal,
      headers:{'user-agent':'HOYDALAR-2-portal-live','cache-control':'no-cache'}
    });
    if (!response.ok) throw new Error(`${sheet} svarede ${response.status}`);
    return parseCsv(await response.text());
  } finally {
    clearTimeout(timer);
  }
}

async function fetchVagtplanChunks(sheetId) {
  const ranges = ['A5:J404','A405:J804','A805:J1122'];
  const blocks = await Promise.all(ranges.map(range => fetchCsv(sheetId, 'VAGTPLAN', range)));
  return blocks.flat();
}

exports.handler = async function() {
  try {
    const sheetId = process.env.MASTER_SHEET_ID;
    if (!sheetId) throw new Error('MASTER_SHEET_ID mangler i Netlify.');

    const [shiftRows, programRows] = await Promise.all([
      fetchVagtplanChunks(sheetId),
      fetchCsv(sheetId, 'DAGSPROGRAM', 'A5:L200').catch(() => [])
    ]);

    const {today, now} = faroeNow();
    const isValidDate = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
    const active = x => x && isValidDate(x.date) && (x.date > today || (x.date === today && (!x.end || String(x.end) > now)));

    const byId = new Map();
    for (const r of shiftRows) {
      const id = String(r[0] || '').trim();
      if (!id || id === 'Vagt ID') continue;
      byId.set(id, r);
    }

    const shifts = [...byId.values()].map(r => {
      const role = publicText(r[5]);
      const status = publicText(r[9]) || 'Planlagt';
      return {
        id:String(r[0] || '').trim(),
        date:normalizeDate(r[1]),
        start:normalizeTime(r[2]),
        end:normalizeTime(r[3]),
        person:safePerson(r[4], r[5]),
        role,
        task:publicText(r[6]),
        location:publicText(r[7]),
        activity:publicText(r[8]),
        status
      };
    }).filter(x => x.id && x.person && active(x) && !isCancelled(x.status))
      .sort((a,b) => a.date.localeCompare(b.date) || (a.start||'').localeCompare(b.start||'') || a.person.localeCompare(b.person,'da'));

    let pRows = programRows;
    if (pRows[0] && String(pRows[0][0] || '').trim() === 'Dato') pRows = pRows.slice(1);

    const program = pRows.map((r,i) => {
      const status = publicText(r[9]);
      return {
        id:`P${i+1}`,
        date:normalizeDate(r[0]),
        dayType:publicText(r[1]),
        part:publicText(r[2]),
        start:normalizeTime(r[3]),
        end:normalizeTime(r[4]),
        activity:publicText(r[5]),
        participants:publicText(r[6]),
        responsible:publicText(r[7]),
        location:publicText(r[8]),
        status,
        notes:publicText(r[10])
      };
    }).filter(x => (x.activity || x.start || x.end) && active(x) && !isCancelled(x.status))
      .sort((a,b) => a.date.localeCompare(b.date) || (a.start||'').localeCompare(b.start||''));

    const people = [...new Set(shifts.map(x => x.person).filter(x => x && !/^mangler person/i.test(x)))]
      .sort((a,b) => a.localeCompare(b,'da'));

    return {
      statusCode:200,
      headers:{
        'content-type':'application/json; charset=utf-8',
        'cache-control':'no-store, max-age=0, must-revalidate',
        'pragma':'no-cache',
        'expires':'0'
      },
      body:JSON.stringify({
        updatedAt:new Date().toISOString(),
        today,
        people,
        shifts,
        program,
        liveMaster:true,
        chunkedVagtplan:true,
        source:'Hoydalar 2 Masterplan arbejdsfil'
      })
    };
  } catch (error) {
    return {
      statusCode:500,
      headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},
      body:JSON.stringify({error:error.name === 'AbortError' ? 'Google data svarede ikke inden for tidsgrænsen.' : (error.message || 'Ukendt datafejl')})
    };
  }
};
