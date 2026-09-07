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

    // Kun aktive vagter.
    shifts = shifts.filter(x => x && !/^aflyst$/i.test(String(x.status||'').trim()));

    // 8. september: ingen orkestertræning og ingen frokost.
    // Thomas + Finnur laver indgangsoptagelser. Kenneth laver beauty shots.
    const stale8 = new Set(['KEN008IN','KEN008IN2','KEN008IN3','WEEK033','BAND-P010','BAND-J010']);
    shifts = shifts.filter(x => !(x && x.date === '2026-09-08' && stale8.has(String(x.id||''))));

    const a={date:'2026-09-08',start:'13:00',end:'14:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const b={date:'2026-09-08',start:'14:00',end:'15:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const c={date:'2026-09-08',start:'15:00',end:'16:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const arr13='Naina Jórun + Tórfríð ankommer · indgang i Aulan';
    const arr14='Regin + Vón ankommer · indgang i Aulan';
    const arr15='Helge + Vár ankommer · indgang i Aulan';

    upsert({...a,id:'THO008IN1',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba. Naina Jórun og Tórfríð ankommer kl. 13:00.',activity:arr13});
    upsert({...a,id:'FIN008IN',person:'Finnur Koba',role:'Journalist / optagelse',task:'Indgangsoptagelse sammen med Thomas Koba. Naina Jórun og Tórfríð ankommer kl. 13:00.',activity:arr13});
    upsert({...b,id:'THO008IN2',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba. Regin og Vón ankommer kl. 14:00.',activity:arr14});
    upsert({...b,id:'FIN008IN2',person:'Finnur Koba',role:'Journalist / optagelse',task:'Indgangsoptagelse sammen med Thomas Koba. Regin og Vón ankommer kl. 14:00.',activity:arr14});
    upsert({...c,id:'THO008IN3',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba. Helge og Vár ankommer kl. 15:00.',activity:arr15});
    upsert({...c,id:'FIN008IN3',person:'Finnur Koba',role:'Journalist / optagelse',task:'Indgangsoptagelse sammen med Thomas Koba. Helge og Vár ankommer kl. 15:00.',activity:arr15});
    upsert({id:'KEN008BEAUTY',date:'2026-09-08',start:'13:00',end:'16:00',person:'Kenneth Jørgensen',role:'Fotograf',task:'Filmer beauty shots af Hoydalar om eftermiddagen. Thomas Koba og Finnur Koba håndterer de tre indgangsoptagelser.',location:'Hoydalar',activity:'Beauty shots af Hoydalar',status:'Bekræftet'});

    // Sen optagelse 8. september i Vestmanna.
    upsert({id:'VAR008VEST',date:'2026-09-08',start:'17:00',end:'19:00',person:'Vár',role:'Spíri',task:'Filmes i Vestmanna af Thomas Koba og Finnur Koba.',location:'Vestmanna',activity:'Optagelse · Vár i Vestmanna',status:'Planlagt'});
    upsert({id:'THO008VEST',date:'2026-09-08',start:'17:00',end:'19:00',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Filmer Vár i Vestmanna sammen med Finnur Koba.',location:'Vestmanna',activity:'Optagelse · Vár i Vestmanna',status:'Planlagt'});
    upsert({id:'FIN008VEST',date:'2026-09-08',start:'17:00',end:'19:00',person:'Finnur Koba',role:'Journalist / optagelse',task:'Filmer Vár i Vestmanna sammen med Thomas Koba.',location:'Vestmanna',activity:'Optagelse · Vár i Vestmanna',status:'Planlagt'});

    // 9. september: BENJAMIN-SUPER-DAG. Fjern gamle Week-rækker/duplikater og brug den aktuelle Masterplan.
    const sep9People = new Set(['Kim Hansen','Pauli Reinert Poulsen','Jóhannus á Rógvu Joensen','Tórfríð','Naina Jórun','Benjamin Djurhuus','Jonna Fritsdóttir Mortensen','Kenneth Jørgensen']);
    shifts = shifts.filter(x => {
      if (!x || x.date !== '2026-09-09') return true;
      const p = fixVar(fixNaina(x.person));
      if (!sep9People.has(p)) return true;
      return !(/week-fil|musikøvelse|bandøvelse|musiktræning|træning med orkester|BENJAMIN-SUPER-DAG/i.test(String(x.activity||'')+' '+String(x.task||'')) || /Gentukostdeildin/i.test(String(x.location||'')));
    });

    const loc9='Gentukostdeildin, Hoydalar';
    upsert({id:'KIM009',date:'2026-09-09',start:'11:00',end:'18:00',person:'Kim Hansen',role:'Kapellmeistari',task:'BENJAMIN-SUPER-DAG. Øvelse med orkestret. Tórfríð 12:00–15:00 og Naina Jórun 15:00–18:00. Benjamin Djurhuus er musikproducer 12:00–18:00.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'PAU009',date:'2026-09-09',start:'11:00',end:'18:00',person:'Pauli Reinert Poulsen',role:'Tónleikari',task:'BENJAMIN-SUPER-DAG med Kim & Co. og to Spírar.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'JOH009',date:'2026-09-09',start:'11:00',end:'18:00',person:'Jóhannus á Rógvu Joensen',role:'Tónleikari',task:'BENJAMIN-SUPER-DAG med Kim & Co. og to Spírar.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'TOR009',date:'2026-09-09',start:'12:00',end:'15:00',person:'Tórfríð',role:'Spíri',task:'Træning med Kim & Co. Benjamin Djurhuus deltager som musikproducer.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'NAI009',date:'2026-09-09',start:'15:00',end:'18:00',person:'Naina Jórun',role:'Spíri',task:'Træning med Kim & Co. Benjamin Djurhuus deltager som musikproducer.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'BEN009',date:'2026-09-09',start:'12:00',end:'18:00',person:'Benjamin Djurhuus',role:'Musikproducer / rådgiver',task:'Musikproducer på træning med Tórfríð 12:00–15:00 og Naina Jórun 15:00–18:00 sammen med Kim & Co.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'JON009LUNCH',date:'2026-09-09',start:'11:00',end:'12:00',person:'Jonna Fritsdóttir Mortensen',role:'Catering / madansvarlig',task:'Sørger for orkesterfrokost til Kim Hansen, Pauli Reinert Poulsen og Jóhannus á Rógvu Joensen. Let frokost med pålæg, brød m.m.',location:loc9,activity:'BENJAMIN-SUPER-DAG · Orkesterfrokost',status:'Bekræftet'});
    upsert({id:'KEN009FILM',date:'2026-09-09',start:'12:00',end:'18:00',person:'Kenneth Jørgensen',role:'Fotograf',task:'Film Tórfríð under øvelse med Kim & Co. 12:00–15:00. Film derefter Naina Jórun 15:00–18:00. Ved spørgsmål til selve optagelsen: kontakt Michael Koba.',location:loc9,activity:'BENJAMIN-SUPER-DAG · filmoptagelse',status:'Bekræftet'});

    shifts.forEach(x=>{ if(x){ x.person=fixVar(fixNaina(x.person)); x.task=fixNaina(x.task); x.activity=fixNaina(x.activity); }});

    // Dagsvisning 8. september.
    program = program.filter(x => !(x && x.date === '2026-09-08'));
    const notes8='Thomas Koba og Finnur Koba laver de tre indgangsoptagelser. Kenneth Jørgensen filmer beauty shots af Hoydalar 13:00–16:00. Ingen orkestertræning og ingen frokost.';
    program.push({id:'WP-IN-0908',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'13:00',end:'14:00',activity:arr13,participants:'Naina Jórun, Tórfríð, Benjamin Djurhuus, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Bekræftet',notes:notes8});
    program.push({id:'WP-IN-0908-HANS',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'14:00',end:'15:00',activity:arr14,participants:'Regin, Vón, Hans Poulsen, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Delvist bekræftet',notes:notes8});
    program.push({id:'WP-IN-0908-JENS',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'15:00',end:'16:00',activity:arr15,participants:'Helge, Vár, Jens L. Thomsen, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Bekræftet',notes:notes8});
    program.push({id:'WP-BEAUTY-0908',date:'2026-09-08',dayType:'Beauty shots',part:'',start:'13:00',end:'16:00',activity:'Kenneth Jørgensen filmer beauty shots af Hoydalar',participants:'Kenneth Jørgensen',responsible:'Kenneth Jørgensen',location:'Hoydalar',status:'Bekræftet',notes:'Foregår parallelt med indgangsoptagelserne i Aulan.'});
    program.push({id:'WP-VEST-0908',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'17:00',end:'19:00',activity:'Vár filmes i Vestmanna',participants:'Vár, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Vestmanna',status:'Planlagt',notes:'Ca. 17:00–19:00.'});

    // Dagsvisning 9. september.
    program = program.filter(x => !(x && x.date === '2026-09-09'));
    program.push({id:'WP-BEN-0909-1',date:'2026-09-09',dayType:'BENJAMIN-SUPER-DAG',part:'',start:'11:00',end:'12:00',activity:'Kim & Co. møder · orkesterfrokost',participants:'Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen',responsible:'Jonna Fritsdóttir Mortensen',location:loc9,status:'Bekræftet',notes:'Let frokost. Vár Miðberg er i Danmark.'});
    program.push({id:'WP-BEN-0909-2',date:'2026-09-09',dayType:'BENJAMIN-SUPER-DAG',part:'',start:'12:00',end:'15:00',activity:'Tórfríð træner med Kim & Co. · Kenneth filmer',participants:'Tórfríð, Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Benjamin Djurhuus, Kenneth Jørgensen',responsible:'Kim Hansen / Benjamin Djurhuus',location:loc9,status:'Bekræftet',notes:'Kenneth filmer Tórfríð under øvelsen.'});
    program.push({id:'WP-BEN-0909-3',date:'2026-09-09',dayType:'BENJAMIN-SUPER-DAG',part:'',start:'15:00',end:'18:00',activity:'Naina Jórun træner med Kim & Co. · Kenneth filmer',participants:'Naina Jórun, Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Benjamin Djurhuus, Kenneth Jørgensen',responsible:'Kim Hansen / Benjamin Djurhuus',location:loc9,status:'Bekræftet',notes:'Kenneth filmer Naina Jórun under øvelsen.'});

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