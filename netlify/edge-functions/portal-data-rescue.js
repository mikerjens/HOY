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
  if (m) return `${m[3]}-${String(Number(m[1])).padStart(2,'0')}-${String(Number(m[2])).padStart(2,'0')}`;
  m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return `${m[3]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
  return raw;
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
  return m ? `${String(Number(m[1])).padStart(2,'0')}:${m[2]}` : raw;
}

function starName(value) {
  const n = String(value || '').trim();
  let m = n.match(/^Stjørna\s+([1-5])$/i);
  if (m) return `Stjørna ${m[1]}`;
  m = n.match(/^Stjerne\s+([A-E])$/i);
  if (m) return `Stjørna ${m[1].toUpperCase().charCodeAt(0) - 64}`;
  return '';
}

export default async (request) => {
  const target = new URL('/.netlify/functions/portal-data-safe', request.url);
  const response = await fetch(target, {headers:{'cache-control':'no-cache'}});
  if (!response.ok) return response;

  try {
    const data = await response.json();
    const sheetId = Netlify.env.get('MASTER_SHEET_ID');
    if (!sheetId) throw new Error('MASTER_SHEET_ID mangler');

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=VAGTPLAN&range=A80:J340&headers=0&_=${Date.now()}`;
    const starResponse = await fetch(sheetUrl, {cache:'no-store', headers:{'cache-control':'no-cache','user-agent':'HOYDALAR-2-stars'}});
    if (!starResponse.ok) throw new Error(`VAGTPLAN svarede ${starResponse.status}`);

    const rows = parseCsv(await starResponse.text());
    const stars = rows.map(r => {
      const person = starName(r[4]);
      if (!person) return null;
      return {
        id:String(r[0] || '').trim(),
        date:normalizeDate(r[1]),
        start:normalizeTime(r[2]),
        end:normalizeTime(r[3]),
        person,
        role:'Stjørna',
        task:String(r[6] || '').trim(),
        location:String(r[7] || '').trim(),
        activity:String(r[8] || '').trim(),
        status:String(r[9] || '').trim() || 'Planlagt'
      };
    }).filter(x => x && x.id && x.date);

    const byId = new Map((Array.isArray(data.shifts) ? data.shifts : []).map(x => [x.id, x]));
    for (const s of stars) byId.set(s.id, {...(byId.get(s.id) || {}), ...s});
    data.shifts = [...byId.values()].sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')) || String(a.person||'').localeCompare(String(b.person||''),'da'));
    data.people = [...new Set(data.shifts.map(x => x.person).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'da'));
    data.starSync = true;

    const headers = new Headers(response.headers);
    headers.set('content-type','application/json; charset=utf-8');
    headers.set('cache-control','no-store, max-age=0');
    headers.delete('content-length');
    return new Response(JSON.stringify(data), {status:200, headers});
  } catch (error) {
    const headers = new Headers(response.headers);
    headers.set('cache-control','no-store, max-age=0');
    return new Response(response.body, {status:response.status, headers});
  }
};

export const config = {
  path: '/.netlify/functions/portal-data'
};
