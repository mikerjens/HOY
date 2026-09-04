const base = require('./portal-data-base.js');

exports.handler = async function(event, context) {
  const res = await base.handler(event, context);
  if (!res || res.statusCode !== 200) return res;
  try {
    const data = JSON.parse(res.body || '{}');
    let shifts = Array.isArray(data.shifts) ? data.shifts : [];

    const ensureShift = shift => {
      const i = shifts.findIndex(x => x && x.id === shift.id);
      if (i >= 0) shifts[i] = {...shifts[i], ...shift};
      else shifts.push(shift);
    };

    ensureShift({
      id: 'EYD024', date: '2026-09-24', start: '13:30', end: '23:00',
      person: 'Eyðun Müller Thomsen', role: 'Fotograf / kamera · indkøring',
      task: 'Går med på kamera/foto under Del 4 for at lære funktionen, som han selv skal dække på Del 5 den 28. september.',
      location: 'Aulan, Hoydalar', activity: 'Optagelse, del 4 · indkøring kamera', status: 'Bekræftet'
    });

    // 10. september: den bekræftede fælles session erstatter de gamle forslag fra Week-planen.
    const staleSep10Ids = new Set(['WEEK035','WEEK036','BAND-P012','BAND-J012']);
    shifts = shifts.filter(x => !(x && x.date === '2026-09-10' && staleSep10Ids.has(x.id)));

    const sessionBase = {date:'2026-09-10',start:'11:00',end:'12:30',location:'Afklares',activity:'Sangtræning + optagelse',status:'Bekræftet'};
    ensureShift({...sessionBase,id:'GUD010FILM',person:'Guðrun Sólja Jacobsen',role:'Sangunderviser',task:'Fælles sangundervisning med Regin, Vón og Naina Jórun med fokus på sange til én stjerne. Sessionen filmes; Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet.'});
    ensureShift({...sessionBase,id:'REG010FILM',person:'Regin',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sange til én stjerne. Sessionen filmes; Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet.'});
    ensureShift({...sessionBase,id:'VON010FILM',person:'Vón',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sange til én stjerne. Sessionen filmes; Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet.'});
    ensureShift({...sessionBase,id:'NAI010FILM',person:'Naina Jórun',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sange til én stjerne. Sessionen filmes; Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet.'});
    ensureShift({...sessionBase,id:'MAR010FILM',person:'Maria Winther Olsen',role:'Instruktør / tilrettelægger',task:'Instruktør på fælles sangundervisning med Guðrun Sólja, Regin, Vón og Naina Jórun. Fokus på sange til én stjerne. Sessionen filmes; Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet.'});
    ensureShift({...sessionBase,id:'JON010FILM',person:'Jónfinn Stenberg',role:'Fotograf',task:'Fotograf på fælles sangundervisning med Guðrun Sólja, Regin, Vón og Naina Jórun. Jónfinn dækker optagelsen indtil evt. anden fotograf er fundet.'});

    const fixNaina = value => String(value ?? '').replace(/\bNaina\b(?!\s+Jórun)/g, 'Naina Jórun');
    shifts.forEach(x => {
      if (!x) return;
      x.person = fixNaina(x.person);
      x.task = fixNaina(x.task);
      x.activity = fixNaina(x.activity);
    });

    data.shifts = shifts.sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')) || String(a.person||'').localeCompare(String(b.person||''), 'da'));
    data.people = [...new Set(data.shifts.map(x => x.person).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'da'));

    let program = Array.isArray(data.program) ? data.program : [];
    program.forEach(x => {
      if (!x) return;
      x.activity = fixNaina(x.activity);
      x.participants = fixNaina(x.participants);
      x.responsible = fixNaina(x.responsible);
      x.notes = fixNaina(x.notes);
    });

    // Fjern evt. gammel 10/9 programtekst og læg den aktuelle, bekræftede version ind.
    program = program.filter(x => !(x && x.date === '2026-09-10' && x.id === 'WP-GUD-0910'));
    program.push({
      id:'WP-GUD-0910',
      date:'2026-09-10',
      dayType:'Sangtræning + optagelse',
      part:'',
      start:'11:00',
      end:'12:30',
      activity:'Fælles sangtræning med Guðrun Sólja · optagelse',
      participants:'Guðrun Sólja Jacobsen, Regin, Vón, Naina Jórun, Maria Winther Olsen, Jónfinn Stenberg',
      responsible:'Guðrun Sólja Jacobsen / Maria Winther Olsen / Jónfinn Stenberg',
      location:'Afklares',
      status:'Bekræftet',
      notes:'Alle tre Spírar, Guðrun Sólja og Maria er bekræftet. Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet.'
    });

    data.program = program.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')));

    return {...res,headers:{...(res.headers||{}),'cache-control':'no-store, max-age=0'},body:JSON.stringify(data)};
  } catch (e) {
    return res;
  }
};
