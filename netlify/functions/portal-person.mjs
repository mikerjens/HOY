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

async function fetchCsv(sheetId, params, userAgent) {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?${params}&_=${Date.now()}`;
  const response = await fetch(sheetUrl, {cache:'no-store', headers:{'cache-control':'no-cache','user-agent':userAgent}});
  if (!response.ok) throw new Error(`VAGTPLAN svarede ${response.status}`);
  return parseCsv(await response.text());
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const requestedName = String(url.searchParams.get('name') || '').trim();
    if (!requestedName) return Response.json({error:'name mangler'}, {status:400});

    const sheetId = Netlify.env.get('MASTER_SHEET_ID');
    if (!sheetId) throw new Error('MASTER_SHEET_ID mangler');

    const escapedName = requestedName.replace(/'/g, "''");
    const tq = `select A,B,C,D,E,F,G,H,I,J where E = '${escapedName}'`;
    const queryParams = `tqx=out:csv&sheet=VAGTPLAN&headers=0&tq=${encodeURIComponent(tq)}`;
    const rows = await fetchCsv(sheetId, queryParams, 'HOYDALAR-2-person-live');

    // Absolute fallback for Elin's Monday setup task. The row exists in Masterplan
    // at 539 and must always be visible in her personal schedule.
    if (requestedName === 'Elin Dagbjartsdóttir Neshamar') {
      try {
        const fallbackRows = await fetchCsv(sheetId, 'tqx=out:csv&sheet=VAGTPLAN&range=A539:J539&headers=0', 'HOYDALAR-2-elin-fallback');
        for (const r of fallbackRows) {
          if (String(r[4] || '').trim() === requestedName) rows.push(r);
        }
      } catch (_) {}
    }

    const {today, now} = faroeNow();
    const byId = new Map();
    for (const r of rows) {
      const shift = rowToShift(r);
      if (!shift.id || !shift.date || !shift.person) continue;
      if (/^(aflyst|annulleret|cancelled|canceled)$/i.test(shift.status)) continue;
      if (!(shift.date > today || (shift.date === today && (!shift.end || shift.end > now)))) continue;
      byId.set(shift.id, shift);
    }

    const shifts = [...byId.values()].sort((a,b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || ''));

    return Response.json({name:requestedName, shifts, updatedAt:new Date().toISOString()}, {
      headers:{'cache-control':'no-store, max-age=0, must-revalidate'}
    });
  } catch (error) {
    return Response.json({error:error.message || 'Ukendt fejl'}, {status:500, headers:{'cache-control':'no-store'}});
  }
};
