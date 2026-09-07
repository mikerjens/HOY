const base = require('./portal-data-base.js');

exports.handler = async function(event, context) {
  const res = await base.handler(event, context);
  if (!res || res.statusCode !== 200) return res;
  try {
    const data = JSON.parse(res.body || '{}');
    let shifts = Array.isArray(data.shifts) ? data.shifts : [];
    let program = Array.isArray(data.program) ? data.program : [];

    const upsert = s => {
      const i = shifts.findIndex(x => x && x.id === s.id);
      if (i >= 0) shifts[i] = {...shifts[i], ...s}; else shifts.push(s);
    };
    const fixNaina = v => String(v ?? '').replace(/\bNaina\b(?!\s+Jórun)/g,'Naina Jórun');
    const fixVar = v => /^Vár Isaksen$/i.test(String(v ?? '').trim()) ? 'Vár' : String(v ?? '').trim();

    // Brug kun aktive vagter.
    shifts = shifts.filter(x => x && !/^aflyst$/i.test(String(x.status||'').trim()));

    // 8. september: ingen orkestertræning og ingen frokost.
    // Kenneth laver beauty shots. Thomas Koba + Finnur Koba laver indgangsoptagelserne.
    const removeSep8 = new Set(['KEN008IN','KEN008IN2','KEN008IN3','WEEK033','BAND-P010','BAND-J010']);
    shifts = shifts.filter(x => !(x && x.date === '2026-09-08' && removeSep8.has(String(x.id||''))));

    const a={date:'2026-09-08',start:'13:00',end:'14:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const b={date:'2026-09-08',start:'14:00',end:'15:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const c={date:'2026-09-08',start:'15:00',end:'16:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const arr13='Naina Jórun + Tórfríð ankommer · indgang i Aulan';
    const arr14='Regin + Vón ankommer · indgang i Aulan';
    const arr15='Helge + Vár ankommer · indgang i Aulan';

    upsert({...a,id:'THO008IN1',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba. Naina Jórun og Tórfríð ankommer kl. 13:00.',activity:arr13});
    upsert({...a,id:'FIN008IN',person:'Finnur Koba',role:'Journalist',task:'Indgangsoptagelse sammen med Thomas Koba. Naina Jórun og Tórfríð ankommer kl. 13:00.',activity:arr13});
    upsert({...b,id:'THO008IN2',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba. Regin og Vón ankommer kl. 14:00.',activity:arr14});
    upsert({...b,id:'FIN008IN2',person:'Finnur Koba',role:'Journalist',task:'Indgangsoptagelse sammen med Thomas Koba. Regin og Vón ankommer kl. 14:00.',activity:arr14});
    upsert({...c,id:'THO008IN3',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba. Helge og Vár ankommer kl. 15:00.',activity:arr15});
    upsert({...c,id:'FIN008IN3',person:'Finnur Koba',role:'Journalist',task:'Indgangsoptagelse sammen med Thomas Koba. Helge og Vár ankommer kl. 15:00.',activity:arr15});
    upsert({id:'KEN008BEAUTY',date:'2026-09-08',start:'13:00',end:'16:00',person:'Kenneth Jørgensen',role:'Fotograf',task:'Filmer beauty shots af Hoydalar om eftermiddagen. Thomas Koba og Finnur Koba håndterer de tre indgangsoptagelser.',location:'Hoydalar',activity:'Beauty shots af Hoydalar',status:'Bekræftet'});

    // Bevar deltager-vagterne fra Masterplanen, men normalisér navne.
    shifts.forEach(x=>{ if(x){ x.person=fixVar(fixNaina(x.person)); x.task=fixNaina(x.task); x.activity=fixNaina(x.activity); }});

    // Dagsvisning for 8. september.
    program = program.filter(x => !(x && x.date === '2026-09-08'));
    const notes='Thomas Koba og Finnur Koba laver de tre indgangsoptagelser. Kenneth Jørgensen filmer beauty shots af Hoydalar 13:00–16:00.';
    program.push({id:'WP-IN-0908',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'13:00',end:'14:00',activity:arr13,participants:'Naina Jórun, Tórfríð, Benjamin Djurhuus, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Bekræftet',notes});
    program.push({id:'WP-IN-0908-HANS',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'14:00',end:'15:00',activity:arr14,participants:'Regin, Vón, Hans Poulsen, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Delvist bekræftet',notes});
    program.push({id:'WP-IN-0908-JENS',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'15:00',end:'16:00',activity:arr15,participants:'Helge, Vár, Jens L. Thomsen, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Bekræftet',notes});
    program.push({id:'WP-BEAUTY-0908',date:'2026-09-08',dayType:'Beauty shots',part:'',start:'13:00',end:'16:00',activity:'Kenneth Jørgensen filmer beauty shots af Hoydalar',participants:'Kenneth Jørgensen',responsible:'Kenneth Jørgensen',location:'Hoydalar',status:'Bekræftet',notes:'Foregår parallelt med indgangsoptagelserne i Aulan.'});

    // 10. september: fast fælles sangsession.
    const loc10='Tórshavnar Musikkskúli, Landavegur 84, Tórshavn';
    const contact10='Ved spørgsmål om lokalet kan Guðrun Sólja kontakte Ólavur Olsen direkte på +298 504740.';
    program = program.filter(x => !(x && x.date === '2026-09-10' && x.id === 'WP-GUD-0910'));
    program.push({id:'WP-GUD-0910',date:'2026-09-10',dayType:'Sangtræning + optagelse',part:'',start:'11:00',end:'12:30',activity:'Fælles sangtræning med Guðrun Sólja · optagelse',participants:'Guðrun Sólja Jacobsen, Regin, Vón, Naina Jórun, Maria Winther Olsen, Jónfinn Stenberg',responsible:'Guðrun Sólja Jacobsen / Maria Winther Olsen / Jónfinn Stenberg',location:loc10,status:'Bekræftet',notes:contact10});

    program.forEach(x=>{ if(x){ x.activity=fixNaina(x.activity); x.participants=fixNaina(x.participants); x.responsible=fixNaina(x.responsible); x.notes=fixNaina(x.notes); }});

    // Skjul afsluttede vagter/events i færøsk tid.
    const p=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Atlantic/Faroe',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    const today=`${p.year}-${p.month}-${p.day}`, now=`${p.hour}:${p.minute}`;
    const active=x=>x&&x.date&&(x.date>today||(x.date===today&&(!x.end||String(x.end)>now)));
    shifts=shifts.filter(active);
    program=program.filter(active);

    data.shifts=shifts.sort((x,y)=>String(x.date||'').localeCompare(String(y.date||''))||String(x.start||'').localeCompare(String(y.start||''))||String(x.person||'').localeCompare(String(y.person||''),'da'));
    data.people=[...new Set(data.shifts.map(x=>x.person).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'da'));
    data.program=program.sort((x,y)=>String(x.date||'').localeCompare(String(y.date||''))||String(x.start||'').localeCompare(String(y.start||'')));
    return {...res,headers:{...(res.headers||{}),'cache-control':'no-store, max-age=0'},body:JSON.stringify(data)};
  } catch(e) {
    return res;
  }
};