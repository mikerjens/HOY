(() => {
  const MASTER = '1uD5fjFA4GW6bYtYaxCgaGB0h-FVBbp8p3ialzJpOhyY';
  const RANGES = ['A405:J804','A805:J1122'];
  let synced = false;

  function parseCsv(text) {
    const rows=[]; let row=[], value='', quoted=false;
    for (let i=0;i<text.length;i++) {
      const c=text[i], n=text[i+1];
      if (c==='"' && quoted && n==='"') { value+='"'; i++; continue; }
      if (c==='"') { quoted=!quoted; continue; }
      if (c===',' && !quoted) { row.push(value); value=''; continue; }
      if ((c==='\n'||c==='\r') && !quoted) {
        if (c==='\r' && n==='\n') i++;
        row.push(value); value='';
        if (row.some(v=>String(v).trim()!=='')) rows.push(row);
        row=[]; continue;
      }
      value+=c;
    }
    if (value || row.length) { row.push(value); if (row.some(v=>String(v).trim()!=='')) rows.push(row); }
    return rows;
  }

  function dateValue(value) {
    const raw=String(value||'').trim();
    let m=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${String(Number(m[1])).padStart(2,'0')}-${String(Number(m[2])).padStart(2,'0')}`;
    m=raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) return `${m[3]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
  }

  function timeValue(value) {
    const raw=String(value||'').trim();
    let m=raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (m) {
      let h=Number(m[1]);
      if (m[3].toUpperCase()==='AM' && h===12) h=0;
      if (m[3].toUpperCase()==='PM' && h!==12) h+=12;
      return `${String(h).padStart(2,'0')}:${m[2]}`;
    }
    m=raw.match(/^(\d{1,2}):(\d{2})/);
    return m ? `${String(Number(m[1])).padStart(2,'0')}:${m[2]}` : '';
  }

  function personValue(name, role) {
    const n=String(name||'').trim(), r=String(role||'').trim();
    if (!n) return '';
    let m=n.match(/^Stjørna\s+([1-5])$/i); if (m) return `Stjørna ${m[1]}`;
    m=n.match(/^Stjerne\s+([A-E])$/i); if (m) return `Stjørna ${m[1].toUpperCase().charCodeAt(0)-64}`;
    if (/^stjerne\b/i.test(n) || /\bstjerne\b/i.test(r)) return '';
    if (r.toLocaleLowerCase('fo-FO')==='spíri') {
      if (/^Naina\s+Jórun(?:\s|$)/i.test(n)) return 'Naina Jórun';
      return n.split(/\s+/)[0] || n;
    }
    return n;
  }

  function clean(value) {
    return String(value||'').replace(/\bstjerner\b/gi,'gæster').replace(/\bstjerne\b/gi,'gæst').replace(/\s{2,}/g,' ').trim();
  }

  function faroeToday() {
    const p=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Atlantic/Faroe',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    return `${p.year}-${p.month}-${p.day}`;
  }

  async function fetchRange(range) {
    const url=`https://docs.google.com/spreadsheets/d/${MASTER}/gviz/tq?tqx=out:csv&sheet=VAGTPLAN&range=${encodeURIComponent(range)}&headers=0&_=${Date.now()}`;
    const r=await fetch(url,{cache:'no-store'});
    if (!r.ok) throw new Error(`VAGTPLAN ${range}: ${r.status}`);
    return parseCsv(await r.text());
  }

  async function sync() {
    if (synced) return;
    let data;
    try { data=DATA; } catch (_) { return; }
    if (!data || !Array.isArray(data.shifts)) return;

    try {
      const blocks=await Promise.all(RANGES.map(fetchRange));
      const today=faroeToday();
      const extras=blocks.flat().map(r=>{
        const status=clean(r[9])||'Planlagt';
        return {
          id:String(r[0]||'').trim(), date:dateValue(r[1]), start:timeValue(r[2]), end:timeValue(r[3]),
          person:personValue(r[4],r[5]), role:clean(r[5]), task:clean(r[6]), location:clean(r[7]), activity:clean(r[8]), status
        };
      }).filter(x=>x.id && x.id!=='Vagt ID' && x.person && x.date>=today && !/^(aflyst|annulleret|cancelled|canceled)$/i.test(x.status));

      const byId=new Map(data.shifts.map(x=>[x.id,x]));
      extras.forEach(x=>byId.set(x.id,{...(byId.get(x.id)||{}),...x}));
      data.shifts=[...byId.values()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||''))||String(a.person||'').localeCompare(String(b.person||''),'da'));
      data.people=[...new Set(data.shifts.map(x=>x.person).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'da'));
      synced=true;

      const selected=String(document.getElementById('nameSelect')?.value||'').trim();
      if (selected && typeof renderMine==='function') renderMine();
      if (typeof renderHome==='function') renderHome();
    } catch (e) {
      console.warn('Late VAGTPLAN sync failed', e);
    }
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    sync();
    if (synced || tries>20) clearInterval(timer);
  },300);
  document.addEventListener('change',e=>{ if (e.target?.id==='nameSelect') setTimeout(sync,0); });
})();
