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
      if (i >= 0) shifts[i] = {...shifts[i], ...s};
      else shifts.push(s);
    };
    const fixNaina = v => String(v ?? '').replace(/\bNaina\b(?!\s+Jórun)/g, 'Naina Jórun');
    const fixVar = v => /^Vár Isaksen$/i.test(String(v ?? '').trim()) ? 'Vár' : String(v ?? '').trim();

    shifts = shifts.filter(x => x && !/^aflyst$/i.test(String(x.status||'').trim()));
    const staleIds = new Set([
      'KEN008IN','KEN008IN2','KEN008IN3','WEEK033','BAND-P010','BAND-J010',
      'WEEK034','BAND-P011','BAND-J011','WEEK037','BAND-P013','BAND-J013'
    ]);
    shifts = shifts.filter(x => !(x && staleIds.has(String(x.id||''))));

    // 8. september: ingen orkestertræning og ingen frokost.
    const a={date:'2026-09-08',start:'13:00',end:'14:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const b={date:'2026-09-08',start:'14:00',end:'15:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const c={date:'2026-09-08',start:'15:00',end:'16:00',location:'Aulan, Hoydalar',status:'Bekræftet'};
    const arr13='Naina Jórun + Tórfríð ankommer · indgang i Aulan';
    const arr14='Regin + Vón ankommer · indgang i Aulan';
    const arr15='Helge + Vár ankommer · indgang i Aulan';

    upsert({...a,id:'TOR008IN',person:'Tórfríð',role:'Spíri',task:'Indgangsoptagelse i Aulan sammen med Naina Jórun og Benjamin Djurhuus.',activity:arr13});
    upsert({...a,id:'NAI008IN',person:'Naina Jórun',role:'Spíri',task:'Indgangsoptagelse i Aulan sammen med Tórfríð og Benjamin Djurhuus.',activity:arr13});
    upsert({...a,id:'BEN008IN',person:'Benjamin Djurhuus',role:'Musikproducer / rådgiver',task:'Med på indgangsoptagelsen med Naina Jórun og Tórfríð.',activity:arr13});
    upsert({...a,id:'THO008IN1',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba.',activity:arr13});
    upsert({...a,id:'FIN008IN',person:'Finnur Koba',role:'Journalist / optagelse',task:'Indgangsoptagelse sammen med Thomas Koba.',activity:arr13});

    upsert({...b,id:'REG008IN2',person:'Regin',role:'Spíri',task:'Indgangsoptagelse i Aulan sammen med Vón og Hans Poulsen.',activity:arr14});
    upsert({...b,id:'VON008IN2',person:'Vón',role:'Spíri',task:'Indgangsoptagelse i Aulan sammen med Regin og Hans Poulsen.',activity:arr14,status:'Afventer'});
    upsert({...b,id:'HAN008IN2',person:'Hans Poulsen',role:'Musikproducer / rådgiver',task:'Med på indgangsoptagelsen med Regin og Vón.',activity:arr14});
    upsert({...b,id:'THO008IN2',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba.',activity:arr14});
    upsert({...b,id:'FIN008IN2',person:'Finnur Koba',role:'Journalist / optagelse',task:'Indgangsoptagelse sammen med Thomas Koba.',activity:arr14});

    upsert({...c,id:'HEL008IN3',person:'Helge',role:'Spíri',task:'Indgangsoptagelse i Aulan sammen med Vár og Jens L. Thomsen.',activity:arr15});
    upsert({...c,id:'VAR008IN3',person:'Vár',role:'Spíri',task:'Indgangsoptagelse i Aulan sammen med Helge og Jens L. Thomsen.',activity:arr15});
    upsert({...c,id:'JEN008IN3',person:'Jens L. Thomsen',role:'Musikproducer / rådgiver',task:'Med på indgangsoptagelsen med Helge og Vár.',activity:arr15});
    upsert({...c,id:'THO008IN3',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Indgangsoptagelse sammen med Finnur Koba.',activity:arr15});
    upsert({...c,id:'FIN008IN3',person:'Finnur Koba',role:'Journalist / optagelse',task:'Indgangsoptagelse sammen med Thomas Koba.',activity:arr15});

    upsert({id:'KEN008BEAUTY',date:'2026-09-08',start:'08:00',end:'16:00',person:'Kenneth Jørgensen',role:'Fotograf',task:'Filmer beauty shots af Hoydalar kl. 08:00–16:00. Dette er Kenneths eneste opgave den 8. september.',location:'Hoydalar',activity:'Beauty shots af Hoydalar',status:'Bekræftet'});
    upsert({id:'VAR008VEST',date:'2026-09-08',start:'17:00',end:'19:00',person:'Vár',role:'Spíri',task:'Filmes i Vestmanna af Thomas Koba og Finnur Koba.',location:'Vestmanna',activity:'Optagelse · Vár i Vestmanna',status:'Planlagt'});
    upsert({id:'THO008VEST',date:'2026-09-08',start:'17:00',end:'19:00',person:'Thomas Koba',role:'Fotograf / optagelse',task:'Filmer Vár i Vestmanna sammen med Finnur Koba.',location:'Vestmanna',activity:'Optagelse · Vár i Vestmanna',status:'Planlagt'});
    upsert({id:'FIN008VEST',date:'2026-09-08',start:'17:00',end:'19:00',person:'Finnur Koba',role:'Journalist / optagelse',task:'Filmer Vár i Vestmanna sammen med Thomas Koba.',location:'Vestmanna',activity:'Optagelse · Vár i Vestmanna',status:'Planlagt'});

    // 9. september: BENJAMIN-SUPER-DAG.
    const loc9='Gentukostdeildin, Hoydalar';
    upsert({id:'KIM009',date:'2026-09-09',start:'11:00',end:'18:00',person:'Kim Hansen',role:'Kapellmeistari',task:'BENJAMIN-SUPER-DAG. Tórfríð 12:00–15:00 og Naina Jórun 15:00–18:00.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'PAU009',date:'2026-09-09',start:'11:00',end:'18:00',person:'Pauli Reinert Poulsen',role:'Tónleikari',task:'BENJAMIN-SUPER-DAG med Kim & Co.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'JOH009',date:'2026-09-09',start:'11:00',end:'18:00',person:'Jóhannus á Rógvu Joensen',role:'Tónleikari',task:'BENJAMIN-SUPER-DAG med Kim & Co.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'TOR009',date:'2026-09-09',start:'12:00',end:'15:00',person:'Tórfríð',role:'Spíri',task:'Træning med Kim & Co. Benjamin Djurhuus deltager som musikproducer.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'NAI009',date:'2026-09-09',start:'15:00',end:'18:00',person:'Naina Jórun',role:'Spíri',task:'Træning med Kim & Co. Benjamin Djurhuus deltager som musikproducer.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'BEN009',date:'2026-09-09',start:'12:00',end:'18:00',person:'Benjamin Djurhuus',role:'Musikproducer / rådgiver',task:'Musikproducer under Tórfríð 12:00–15:00 og Naina Jórun 15:00–18:00.',location:loc9,activity:'BENJAMIN-SUPER-DAG',status:'Bekræftet'});
    upsert({id:'JON009LUNCH',date:'2026-09-09',start:'11:00',end:'12:00',person:'Jonna Fritsdóttir Mortensen',role:'Catering / madansvarlig',task:'Sørger for let orkesterfrokost til Kim Hansen, Pauli Reinert Poulsen og Jóhannus á Rógvu Joensen.',location:loc9,activity:'BENJAMIN-SUPER-DAG · Orkesterfrokost',status:'Bekræftet'});
    upsert({id:'KEN009FILM',date:'2026-09-09',start:'12:00',end:'18:00',person:'Kenneth Jørgensen',role:'Fotograf',task:'Film Tórfríð 12:00–15:00. Film derefter Naina Jórun 15:00–18:00. Ved spørgsmål: kontakt Michael Koba.',location:loc9,activity:'BENJAMIN-SUPER-DAG · filmoptagelse',status:'Bekræftet'});

    // 10. september: HANS-DAY + sangsession.
    const loc10='Gentukostdeildin, Hoydalar';
    const music10=[
      ['KIM010B','Kim Hansen','Kapellmeistari','10:00','18:30','HANS-DAY. Vón 12:30–15:30 og Regin 15:30–18:30.'],
      ['PAU010B','Pauli Reinert Poulsen','Tónleikari','10:00','18:30','HANS-DAY med Kim & Co.'],
      ['JOH010B','Jóhannus á Rógvu Joensen','Tónleikari','10:00','18:30','HANS-DAY med Kim & Co.'],
      ['VON010B','Vón','Spíri','12:30','15:30','HANS-DAY · træning med Kim & Co.'],
      ['REG010B','Regin','Spíri','15:30','18:30','HANS-DAY · træning med Kim & Co.'],
      ['HAN010B','Hans Poulsen','Musikproducer / rådgiver','11:00','18:30','HANS-DAY · med sammen med Kim & Co. under orkesterøvelsen.']
    ];
    music10.forEach(([id,person,role,start,end,task])=>upsert({id,date:'2026-09-10',start,end,person,role,task,location:loc10,activity:'HANS-DAY',status:'Bekræftet'}));

    const singLoc='Tórshavnar Musikkskúli, Landavegur 84, Tórshavn';
    const singBase={date:'2026-09-10',start:'11:00',end:'12:30',location:singLoc,activity:'Sangtræning + optagelse',status:'Bekræftet'};
    upsert({...singBase,id:'GUD010FILM',person:'Guðrun Sólja Jacobsen',role:'Sangunderviser',task:'Fælles sangtræning med Regin, Vón og Naina Jórun. Sessionen filmes.'});
    upsert({...singBase,id:'REG010FILM',person:'Regin',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sessionen filmes.'});
    upsert({...singBase,id:'VON010FILM',person:'Vón',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sessionen filmes.'});
    upsert({...singBase,id:'NAI010FILM',person:'Naina Jórun',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sessionen filmes.'});
    upsert({...singBase,id:'MAR010FILM',person:'Maria Winther Olsen',role:'Instruktør / tilrettelægger',task:'Instruktør på fælles sangtræning.'});
    upsert({...singBase,id:'JON010FILM',person:'Jónfinn Stenberg',role:'Fotograf',task:'Fotograf på fælles sangtræning.'});

    // 11. september: JENS-DAY.
    const loc11='Gentukostdeildin, Hoydalar';
    const music11=[
      ['KIM011B','Kim Hansen','Kapellmeistari','10:00','18:30','JENS-DAY. Vár 12:00–15:00 og Helge 15:00–18:30.'],
      ['PAU011B','Pauli Reinert Poulsen','Tónleikari','10:00','18:30','JENS-DAY med Kim & Co.'],
      ['JOH011B','Jóhannus á Rógvu Joensen','Tónleikari','10:00','18:30','JENS-DAY med Kim & Co.'],
      ['VAR011B','Vár','Spíri','12:00','15:00','JENS-DAY · træning med Kim & Co.'],
      ['HEL011B','Helge','Spíri','15:00','18:30','JENS-DAY · træning med Kim & Co.'],
      ['JEN011B','Jens L. Thomsen','Musikproducer / rådgiver','10:00','18:30','JENS-DAY · med sammen med Kim & Co. under orkesterøvelsen.']
    ];
    music11.forEach(([id,person,role,start,end,task])=>upsert({id,date:'2026-09-11',start,end,person,role,task,location:loc11,activity:'JENS-DAY',status:'Bekræftet'}));

    // 12. og 13. september: orkestret har fri.
    shifts = shifts.filter(x => !(x && ['2026-09-12','2026-09-13'].includes(x.date) && /orkester|musikøvelse|spíri træning/i.test(String(x.activity||'')+' '+String(x.task||''))));

    upsert({id:'EYD024',date:'2026-09-24',start:'13:30',end:'23:00',person:'Eyðun Müller Thomsen',role:'Fotograf / kamera · indkøring',task:'Går med på kamera/foto under Del 4 for at lære funktionen til Del 5.',location:'Aulan, Hoydalar',activity:'Optagelse, del 4 · indkøring kamera',status:'Bekræftet'});

    shifts.forEach(x=>{
      if (!x) return;
      x.person=fixVar(fixNaina(x.person));
      x.task=fixNaina(x.task);
      x.activity=fixNaina(x.activity);
    });

    // Dagsvisning for uge 37.
    program = program.filter(x => !(x && x.date >= '2026-09-08' && x.date <= '2026-09-13'));

    program.push({id:'WP-LIGHT-0908',date:'2026-09-08',dayType:'Forberedelse',part:'',start:'08:00',end:'16:00',activity:'Lysopsætning i Aulan',participants:'Hans Petur Hansen, Jónfinn Stenberg, Súni Joensen',responsible:'Teknisk hold',location:'Aulan, Hoydalar',status:'Bekræftet',notes:'Ingen orkestertræning og ingen frokost.'});
    program.push({id:'WP-BEAUTY-0908',date:'2026-09-08',dayType:'Beauty shots',part:'',start:'08:00',end:'16:00',activity:'Kenneth Jørgensen filmer beauty shots af Hoydalar',participants:'Kenneth Jørgensen',responsible:'Kenneth Jørgensen',location:'Hoydalar',status:'Bekræftet',notes:'Kenneths eneste opgave den 8. september.'});
    program.push({id:'WP-IN-0908',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'13:00',end:'14:00',activity:arr13,participants:'Naina Jórun, Tórfríð, Benjamin Djurhuus, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Bekræftet',notes:'Ingen orkestertræning og ingen frokost.'});
    program.push({id:'WP-IN-0908-HANS',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'14:00',end:'15:00',activity:arr14,participants:'Regin, Vón, Hans Poulsen, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Delvist bekræftet',notes:'Vón afventer bekræftelse.'});
    program.push({id:'WP-IN-0908-JENS',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'15:00',end:'16:00',activity:arr15,participants:'Helge, Vár, Jens L. Thomsen, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Aulan, Hoydalar',status:'Bekræftet',notes:''});
    program.push({id:'WP-VEST-0908',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'17:00',end:'19:00',activity:'Vár filmes i Vestmanna',participants:'Vár, Thomas Koba, Finnur Koba',responsible:'Thomas Koba / Finnur Koba',location:'Vestmanna',status:'Planlagt',notes:'Ca. 17:00–19:00.'});

    program.push({id:'WP-LIGHT-0909',date:'2026-09-09',dayType:'Forberedelse',part:'',start:'08:00',end:'16:00',activity:'Lysopsætning i Aulan',participants:'Hans Petur Hansen, Jónfinn Stenberg, Súni Joensen',responsible:'Teknisk hold',location:'Aulan, Hoydalar',status:'Bekræftet',notes:''});
    program.push({id:'WP-BEN-0909-1',date:'2026-09-09',dayType:'BENJAMIN-SUPER-DAG',part:'',start:'11:00',end:'12:00',activity:'Kim & Co. møder · orkesterfrokost',participants:'Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen',responsible:'Jonna Fritsdóttir Mortensen',location:loc9,status:'Bekræftet',notes:'Let frokost.'});
    program.push({id:'WP-BEN-0909-2',date:'2026-09-09',dayType:'BENJAMIN-SUPER-DAG',part:'',start:'12:00',end:'15:00',activity:'Tórfríð træner med Kim & Co. · Kenneth filmer',participants:'Tórfríð, Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Benjamin Djurhuus, Kenneth Jørgensen',responsible:'Kim Hansen / Benjamin Djurhuus',location:loc9,status:'Bekræftet',notes:''});
    program.push({id:'WP-BEN-0909-3',date:'2026-09-09',dayType:'BENJAMIN-SUPER-DAG',part:'',start:'15:00',end:'18:00',activity:'Naina Jórun træner med Kim & Co. · Kenneth filmer',participants:'Naina Jórun, Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Benjamin Djurhuus, Kenneth Jørgensen',responsible:'Kim Hansen / Benjamin Djurhuus',location:loc9,status:'Bekræftet',notes:''});

    program.push({id:'WP-GUD-0910',date:'2026-09-10',dayType:'Sangtræning + optagelse',part:'',start:'11:00',end:'12:30',activity:'Fælles sangtræning med Guðrun Sólja · optagelse',participants:'Guðrun Sólja Jacobsen, Regin, Vón, Naina Jórun, Maria Winther Olsen, Jónfinn Stenberg',responsible:'Guðrun Sólja Jacobsen / Maria Winther Olsen / Jónfinn Stenberg',location:singLoc,status:'Bekræftet',notes:''});
    program.push({id:'WP-MUS-0910-1',date:'2026-09-10',dayType:'HANS-DAY',part:'',start:'10:00',end:'12:30',activity:'HANS-DAY · Kim & Co. øver',participants:'Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Hans Poulsen',responsible:'Kim Hansen / Hans Poulsen',location:loc10,status:'Bekræftet',notes:'Ingen orkesterfrokost planlagt.'});
    program.push({id:'WP-MUS-0910-2',date:'2026-09-10',dayType:'HANS-DAY',part:'',start:'12:30',end:'15:30',activity:'HANS-DAY · Vón træner med Kim & Co.',participants:'Vón, Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Hans Poulsen',responsible:'Kim Hansen / Hans Poulsen',location:loc10,status:'Bekræftet',notes:''});
    program.push({id:'WP-MUS-0910-3',date:'2026-09-10',dayType:'HANS-DAY',part:'',start:'15:30',end:'18:30',activity:'HANS-DAY · Regin træner med Kim & Co.',participants:'Regin, Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Hans Poulsen',responsible:'Kim Hansen / Hans Poulsen',location:loc10,status:'Bekræftet',notes:''});

    program.push({id:'WP-MUS-0911-1',date:'2026-09-11',dayType:'JENS-DAY',part:'',start:'10:00',end:'12:00',activity:'JENS-DAY · Kim & Co. øver',participants:'Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Jens L. Thomsen',responsible:'Kim Hansen / Jens L. Thomsen',location:loc11,status:'Bekræftet',notes:'Ingen orkesterfrokost planlagt.'});
    program.push({id:'WP-MUS-0911-2',date:'2026-09-11',dayType:'JENS-DAY',part:'',start:'12:00',end:'15:00',activity:'JENS-DAY · Vár træner med Kim & Co.',participants:'Vár, Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Jens L. Thomsen',responsible:'Kim Hansen / Jens L. Thomsen',location:loc11,status:'Bekræftet',notes:''});
    program.push({id:'WP-MUS-0911-3',date:'2026-09-11',dayType:'JENS-DAY',part:'',start:'15:00',end:'18:30',activity:'JENS-DAY · Helge træner med Kim & Co.',participants:'Helge, Kim Hansen, Pauli Reinert Poulsen, Jóhannus á Rógvu Joensen, Jens L. Thomsen',responsible:'Kim Hansen / Jens L. Thomsen',location:loc11,status:'Bekræftet',notes:''});

    program.forEach(x=>{
      if (!x) return;
      x.activity=fixNaina(x.activity);
      x.participants=fixNaina(x.participants);
      x.responsible=fixNaina(x.responsible);
      x.notes=fixNaina(x.notes);
    });

    const p=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{
      timeZone:'Atlantic/Faroe',year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
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