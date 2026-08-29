const SHEET_NAME = 'VAGTPLAN';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '"' && quoted && n === '"') { value += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === ',' && !quoted) { row.push(value); value = ''; continue; }
    if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && n === '\n') i++;
      row.push(value); value = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
      continue;
    }
    value += c;
  }
  if (value || row.length) { row.push(value); if (row.some(v => v !== '')) rows.push(row); }
  return rows;
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

function safePersonName(name, role) {
  const n = String(name || '').trim();
  const r = String(role || '').trim();
  if (!n) return '';
  if (/^stjerne\b/i.test(n) || /stjerne/i.test(r)) return '';
  if (/^mangler person/i.test(n)) return n;
  if (/spíri/i.test(r)) return firstName(n);
  return n;
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return raw;
  return `${m[3]}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
}

exports.handler = async function () {
  try {
    const sheetId = process.env.MASTER_SHEET_ID;
    if (!sheetId) {
      return { statusCode: 500, headers: {'content-type':'application/json'}, body: JSON.stringify({ error: 'MASTER_SHEET_ID mangler i Netlify.' }) };
    }

    const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const res = await fetch(url, { headers: { 'user-agent': 'HOYDALAR-2-portal' } });
    if (!res.ok) throw new Error(`Google Sheets svarede ${res.status}`);
    const csv = await res.text();
    const rows = parseCsv(csv);

    const headerIndex = rows.findIndex(r => String(r[0] || '').trim() === 'Vagt ID');
    if (headerIndex < 0) throw new Error('Kunne ikke finde VAGTPLAN header.');

    const shifts = rows.slice(headerIndex + 1).map(r => {
      const role = r[5] || '';
      const person = safePersonName(r[4], role);
      return {
        id: r[0] || '',
        date: normalizeDate(r[1]),
        start: r[2] || '',
        end: r[3] || '',
        person,
        role,
        task: r[6] || '',
        location: r[7] || '',
        activity: r[8] || '',
        status: r[9] || ''
      };
    }).filter(x => x.id && x.person);

    const people = [...new Set(shifts.map(x => x.person).filter(x => x && !/^mangler person/i.test(x)))]
      .sort((a,b) => a.localeCompare(b, 'da'));

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=30, s-maxage=30',
        'access-control-allow-origin': '*'
      },
      body: JSON.stringify({ updatedAt: new Date().toISOString(), people, shifts })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store'},
      body: JSON.stringify({ error: err.message || 'Ukendt fejl' })
    };
  }
};
