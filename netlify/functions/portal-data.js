const SHEET_ID_ENV = 'MASTER_SHEET_ID';
const WEEK_SHEET_ID = '1rNKvAFmp43bq9hNB9tlU5-2DR0sCgS9Ziv-Kc2Z0pXg';
const VAGTPLAN_RANGE = 'A5:J1040';
const VAGTPLAN_EXTRA_RANGE = 'A433:J500';
const DAGSPROGRAM_RANGE = 'A5:L200';
const WEEK_RANGE = 'A8:R12';
const WEEK_FROM = '2026-08-30';
const WEEK_TO = '2026-09-13';
const WEEK_LOCATION = 'Gentukostdeildin, Hoydalar';
const MARIA_SYNC_LOCATION = 'Loftet, Studentaskúlin í Hoydølum';

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

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

function safePersonName(name, role) {
  const n = String(name || '').trim();
  const r = String(role || '').trim();
  if (!n) return '';
  if (/^stjerne\b/i.test(n) || /stjerne/i.test(r)) return '';
  if (/^mangler person/i.test(n)) return n;
  if (r.toLocaleLowerCase('fo-FO') === 'spíri') return firstName(n);
  return n;
}

function sanitizePublicText(value) {
  return String(value || '')
    .replace(/\bstjerne\b/gi, 'gæst')
    .replace(/\bstjerner\b/gi, 'gæster')
    .trim();
}

function normalizeDate(value, preferDayFirst = false) {
  const raw = String(value || '').trim().toLowerCase();
  if (/^\d{5}(?:\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
      const ms = Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000;
      const d = new Date(ms);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    }
  }
  let m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let month, day;
    if (preferDayFirst) { day = a; month = b; }
    else if (a > 12) { day = a; month = b; }
    else if (b > 12) { month = a; day = b; }
    else { month = a; day = b; }
    return `${m[3]}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
  m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  const months = {jan:1,feb:2,mar:3,apr:4,maj:5,jun:6,jul:7,aug:8,sep:9,okt:10,nov:11,dec:12};
  m = raw.match(/(\d{1,2})\.\s*([a-zæøå]+)\.?(?:\s+)(\d{4})/i);
  if (m) {
    const key = m[2].slice(0,3);
    const month = months[key];
    if (month) return `${m[3]}-${String(month).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
  }
  return String(value || '').trim();
}

function todayInFaroe() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Atlantic/Faroe', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

async function fetchSheetCsv(sheetId, sheet, range) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&range=${encodeURIComponent(range)}&headers=0`;
  const res = await fetch(url, { headers: { 'user-agent': 'HOYDALAR-2-portal' } });
  if (!res.ok) throw new Error(`${sheet} svarede ${res.status}`);
  return parseCsv(await res.text());
}

function stripWeekName(value) {
  return String(value || '')
    .replace(/[🟡🔵🟠🟣🟢🔴]/g, '')
    .replace(/\s*•.*$/, '')
    .replace(/\(Spíri\)/gi, '')
    .trim();
}

function timedBlocks(text) {
  const out = [];
  const s = String(text || '').replace(/\r/g, '');
  const re = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s*\n([^\n]+)/g;
  let m;
  while ((m = re.exec(s))) {
    const label = stripWeekName(m[3]);
    if (!label || /frokost/i.test(label)) continue;
    out.push({ start: m[1], end: m[2], label });
  }
  return out;
}

function pushShift(list, data) {
  const person = safePersonName(data.person, data.role);
  if (!person || !data.date) return;
  list.push({
    id: data.id,
    date: data.date,
    start: data.start || '',
    end: data.end || '',
    person,
    role: data.role || '',
    task: data.task || '',
    location: data.location || '',
    activity: data.activity || '',
    status: data.status || 'Planlagt'
  });
}

function parseWeekPlan(rows) {
  const shifts = [];
  if (!rows.length) return shifts;
  const dateRow = rows[0] || [];
  // Band-rækkens første celle kan indeholde alle fire bandnavne, ikke kun Kim Hansen.
  // Find derfor rækken hvis Kim optræder i første celle eller BAND står i beskrivelseskolonnen.
  const kimRow = rows.find(r => /(^|\n)Kim Hansen(\n|$)/i.test(String(r[0] || '').trim()) || /^BAND\b/i.test(String(r[1] || '').trim())) || [];
  const mariaRow = rows.find(r => /^Maria\s*·\s*PLAN/i.test(String(r[0] || '').trim())) || [];
  const gudrunRow = rows.find(r => /^Guðrun Sólja Jacobsen/i.test(String(r[0] || '').trim())) || [];
  let seq = 1;
  for (let col = 2; col < dateRow.length; col++) {
    const date = normalizeDate(dateRow[col], true);
    if (!date || date < WEEK_FROM || date > WEEK_TO) continue;
    const kimText = String(kimRow[col] || '').trim();
    if (kimText) {
      const blocks = timedBlocks(kimText);
      const starts = blocks.map(b => b.start).sort();
      const ends = blocks.map(b => b.end).sort();
      pushShift(shifts, {id:`LIVEW${seq++}`,date,start:starts[0]||'',end:ends.slice(-1)[0]||'',person:'Kim Hansen',role:'Kapellmeistari',task:sanitizePublicText(kimText.replace(/\n+/g,' · ')),location:WEEK_LOCATION,activity:blocks.length?'Musik og Spíri træning':'Musikøvelse',status:/forslag/i.test(kimText)?'Forslag':'Planlagt'});
      blocks.forEach(b => {
        const name = stripWeekName(b.label);
        if (/jens/i.test(name) || /øvelse/i.test(name)) return;
        pushShift(shifts, {id:`LIVEW${seq++}`,date,start:b.start,end:b.end,person:name,role:'Spíri',task:`Træning med Kim Hansen${/jens/i.test(b.label)?' og Jens':''}`,location:WEEK_LOCATION,activity:'Spíri træning',status:/forslag/i.test(kimText)?'Forslag':'Planlagt'});
      });
    }
    const mariaText = String(mariaRow[col] || '').trim();
    if (mariaText) {
      timedBlocks(mariaText).forEach(b => {
        const name = stripWeekName(b.label);
        pushShift(shifts,{id:`LIVEW${seq++}`,date,start:b.start,end:b.end,person:name,role:'Spíri',task:'Sync med Maria. Maria har 1. prioritet.',location:MARIA_SYNC_LOCATION,activity:'Sync · Maria',status:'Planlagt'});
        pushShift(shifts,{id:`LIVEW${seq++}`,date,start:b.start,end:b.end,person:'Maria Winther Olsen',role:'Tilrettelæggelse, scenografi og talentkontakt',task:`Sync med ${name}. Maria har 1. prioritet.`,location:MARIA_SYNC_LOCATION,activity:'Sync',status:'Planlagt'});
      });
    }
    const gudrunText = String(gudrunRow[col] || '').trim();
    if (gudrunText) {
      const names = gudrunText.split(/\n+/).map(stripWeekName).filter(x => x && !/tider afventer/i.test(x));
      pushShift(shifts,{id:`LIVEW${seq++}`,date,person:'Guðrun Sólja Jacobsen',role:'Sangunderviser',task:`Sangtræning · ${names.join(', ')} · tider afventer`,location:WEEK_LOCATION,activity:'Ekstra sangtræning',status:'Afventer'});
      names.forEach(name=>pushShift(shifts,{id:`LIVEW${seq++}`,date,person:name,role:'Spíri',task:'Ekstra sangtræning med Guðrun Sólja Jacobsen · tider afventer',location:WEEK_LOCATION,activity:'Ekstra sangtræning',status:'Afventer'}));
    }
  }
  return shifts;
}

function makeWeekProgram(liveWeekShifts) {
  const spiri = liveWeekShifts.filter(x => x.role === 'Spíri');
  const byDate = new Map();
  spiri.forEach(x => { if (!byDate.has(x.date)) byDate.set(x.date, []); byDate.get(x.date).push(x); });
  const out = [];
  let seq = 1;
  for (const [date, rows] of byDate.entries()) {
    const locations = [...new Set(rows.map(x => x.location).filter(Boolean))];
    const hasKim = rows.some(x => /Spíri træning/i.test(x.activity));
    const hasMaria = rows.some(x => /Sync · Maria/i.test(x.activity));
    const hasGudrun = rows.some(x => /Ekstra sangtræning/i.test(x.activity));
    const dayType = [hasKim?'Musiktræning':'',hasMaria?'Sync':'',hasGudrun?'Sangtræning':''].filter(Boolean).join(' + ');
    const dayLocation = locations.length > 1 ? 'Flere locations · se program' : (locations[0] || 'Afklares');
    rows.sort((a,b)=>(a.start||'').localeCompare(b.start||'')||a.person.localeCompare(b.person,'da'));
    rows.forEach((x,i)=>{
      let what=x.activity;
      if(/Spíri træning/i.test(x.activity))what='Træning med Kim';
      if(/Sync · Maria/i.test(x.activity))what='Sync med Maria';
      if(/Ekstra sangtræning/i.test(x.activity))what='Sangtræning med Guðrun';
      out.push({id:`WP${seq++}`,date,dayType:i===0?dayType:'',part:'',start:x.start||'',end:x.end||'',activity:`${x.person} · ${what} · ${x.location}`,participants:x.person,responsible:/Kim/.test(what)?'Kim Hansen':/Maria/.test(what)?'Maria Winther Olsen':/Guðrun/.test(what)?'Guðrun Sólja Jacobsen':'',location:i===0?dayLocation:x.location,status:x.status||'Planlagt',notes:''});
    });
  }
  return out;
}

exports.handler = async function () {
  try {
    const sheetId = process.env[SHEET_ID_ENV];
    if (!sheetId) throw new Error('MASTER_SHEET_ID mangler i Netlify.');

    const [shiftRows, shiftExtraRows, programRows, weekRows] = await Promise.all([
      fetchSheetCsv(sheetId, 'VAGTPLAN', VAGTPLAN_RANGE),
      fetchSheetCsv(sheetId, 'VAGTPLAN', VAGTPLAN_EXTRA_RANGE),
      fetchSheetCsv(sheetId, 'DAGSPROGRAM', DAGSPROGRAM_RANGE),
      fetchSheetCsv(WEEK_SHEET_ID, 'Sheet1', WEEK_RANGE)
    ]);

    const today = todayInFaroe();
    let sRows = [...shiftRows, ...shiftExtraRows];
    if (sRows[0] && (String(sRows[0][0]).trim() === 'Vagt ID' || sRows[0].includes('Person'))) sRows = sRows.slice(1);

    const byId = new Map();
    sRows.forEach(r => {
      const id = String(r[0] || '').trim();
      if (id && id !== 'Vagt ID') byId.set(id, r);
    });
    sRows = [...byId.values()];

    let masterShifts = sRows.map(r => {
      const id = String(r[0] || '').trim();
      const role = r[5] || '';
      const person = safePersonName(r[4], role);
      return {id,date:normalizeDate(r[1],/^WEEK/i.test(id)),start:String(r[2]||'').trim(),end:String(r[3]||'').trim(),person,role:sanitizePublicText(role),task:sanitizePublicText(r[6]),location:sanitizePublicText(r[7]),activity:sanitizePublicText(r[8]),status:sanitizePublicText(r[9])};
    }).filter(x => x.id && x.person && x.date);

    const liveWeekShifts = parseWeekPlan(weekRows);
    const controlledPeople = new Set(['Kim Hansen','Maria Winther Olsen','Guðrun Sólja Jacobsen','Naina','Vón','Helge','Tórfríð','Regin','Vár']);
    masterShifts = masterShifts.filter(x => {
      if (/^WEEK/i.test(x.id)) return false;
      if (x.date >= WEEK_FROM && x.date <= WEEK_TO && controlledPeople.has(x.person)) return false;
      return true;
    });

    const shifts = [...masterShifts, ...liveWeekShifts].filter(x=>x.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||(a.start||'').localeCompare(b.start||'')||a.person.localeCompare(b.person,'da'));

    let pRows = programRows;
    if (pRows[0] && String(pRows[0][0]).trim() === 'Dato') pRows = pRows.slice(1);
    const baseProgram = pRows.map((r,i)=>({id:`P${i+1}`,date:normalizeDate(r[0]),dayType:sanitizePublicText(r[1]),part:sanitizePublicText(r[2]),start:String(r[3]||'').trim(),end:String(r[4]||'').trim(),activity:sanitizePublicText(r[5]),participants:sanitizePublicText(r[6]),responsible:sanitizePublicText(r[7]),location:sanitizePublicText(r[8]),status:sanitizePublicText(r[9]),notes:sanitizePublicText(r[10])})).filter(x=>x.date&&x.date>=today&&(x.activity||x.start||x.end));
    const weekProgram = makeWeekProgram(liveWeekShifts).filter(x=>x.date>=today);
    const program = [...baseProgram.filter(x=>x.date<WEEK_FROM||x.date>WEEK_TO),...weekProgram].sort((a,b)=>a.date.localeCompare(b.date)||(a.start||'').localeCompare(b.start||''));

    const people = [...new Set(shifts.map(x=>x.person).filter(x=>x&&!/^mangler person/i.test(x)))].sort((a,b)=>a.localeCompare(b,'da'));

    return {statusCode:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=30, s-maxage=30','access-control-allow-origin':'*'},body:JSON.stringify({updatedAt:new Date().toISOString(),today,people,shifts,program,weekLive:true,weekSourceThrough:WEEK_TO})};
  } catch (err) {
    return {statusCode:500,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},body:JSON.stringify({error:err.message||'Ukendt fejl'})};
  }
};
