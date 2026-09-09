(() => {
  const SHEET_ID = '1liibQb_gMQqGknF-pAvCQEnVF8aFRloIBaU9pyykhck';
  const RANGE = 'A4:I160';

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

  function isPlaceholder(name) {
    const n = String(name || '').trim();
    return /^Stjerne\s+[A-E]$/i.test(n) || /navn afventer/i.test(n) || /^Statist\b/i.test(n);
  }

  async function replaceCreditNames() {
    const select = document.getElementById('creditName');
    if (!select || select.dataset.rulletekstNames === '1') return;

    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=RULLETEKST&range=${encodeURIComponent(RANGE)}&headers=0&_=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;

      let rows = parseCsv(await response.text());
      if (rows[0] && String(rows[0][0]).trim() === 'Rækkefølge') rows = rows.slice(1);

      const selected = String(new URLSearchParams(location.search).get('name') || select.value || '').trim();
      const names = [...new Set(rows
        .map(row => String(row[2] || '').trim())
        .filter(name => name && !isPlaceholder(name)))]
        .sort((a, b) => a.localeCompare(b, 'da'));

      select.innerHTML = '<option value="">VÆLG DIT NAVN</option>' + names
        .map(name => `<option value="${name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}">${name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</option>`)
        .join('');

      if (selected && names.includes(selected)) select.value = selected;
      select.dataset.rulletekstNames = '1';
    } catch (_) {
      // Keep the existing list as fallback if Google is temporarily unavailable.
    }
  }

  replaceCreditNames();
  setTimeout(replaceCreditNames, 250);
})();
