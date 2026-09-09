const SHEET_ID_ENV = 'MASTER_SHEET_ID';
const CREDIT_RANGE = 'A4:I160';

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

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase('da-DK');
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async function(event) {
  try {
    const sheetId = process.env[SHEET_ID_ENV];
    if (!sheetId) throw new Error('MASTER_SHEET_ID mangler i Netlify.');

    const name = String(event.queryStringParameters?.name || '').trim();
    if (!name) return json(400, {error: 'Navn mangler.'});

    const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=RULLETEKST&range=${encodeURIComponent(CREDIT_RANGE)}&headers=0&_=${Date.now()}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'user-agent': 'HOYDALAR-2-credit',
        'cache-control': 'no-cache'
      }
    });

    if (!response.ok) throw new Error(`RULLETEKST svarede ${response.status}`);

    let rows = parseCsv(await response.text());
    if (rows[0] && String(rows[0][0]).trim() === 'Rækkefølge') rows = rows.slice(1);

    const hit = rows.find(row => normalize(row[2]) === normalize(name));
    if (!hit) return json(200, {credit: null, name});

    const credit = {
      order: String(hit[0] || '').trim(),
      section: String(hit[1] || '').trim(),
      name: String(hit[2] || '').trim(),
      role: String(hit[3] || '').trim(),
      type: String(hit[4] || '').trim(),
      source: String(hit[5] || '').trim(),
      include: String(hit[6] || '').trim(),
      control: String(hit[7] || '').trim(),
      note: String(hit[8] || '').trim()
    };
    credit.status = credit.include || credit.control || 'Til kontrol';

    return json(200, {credit});
  } catch (error) {
    return json(500, {error: error.message || 'Ukendt fejl'});
  }
};
