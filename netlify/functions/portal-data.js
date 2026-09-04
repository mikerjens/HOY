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

    // 8. september: ekstra optagelse af Benjamin Djurhuus’ Spírar, der går ind i Aulan.
    const sep8Base = {date:'2026-09-08',start:'13:00',end:'14:00',location:'Aulan, Hoydalar',activity:'Ekstra optagelse · indgang i Aulan'};
    ensureShift({...sep8Base,id:'TOR008IN',person:'Tórfríð',role:'Spíri',task:'Optagelse af Benjamin Djurhuus’ Spírar, der går ind i Aulan. Sammen med Naina Jórun.',status:'Bekræftet'});
    ensureShift({...sep8Base,id:'NAI008IN',person:'Naina Jórun',role:'Spíri',task:'Ekstra optagelse med Tórfríð: de går ind i Aulan. Afventer Naina Jóruns endelige bekræftelse.',status:'Afventer'});
    ensureShift({...sep8Base,id:'KEN008IN',person:'Kenneth Jørgensen',role:'Fotograf',task:'Fotograf på ekstra optagelse af Naina Jórun og Tórfríð, der går ind i Aulan.',status:'Bekræftet'});
    ensureShift({...sep8Base,id:'FIN008IN',person:'Finnur Koba',role:'Lagt til rættis / Klip',task:'Med på ekstra optagelse af Naina Jórun og Tórfríð, der går ind i Aulan.',status:'Planlagt'});

    // 10. september: den bekræftede fælles session erstatter de gamle forslag fra Week-planen.
    const staleSep10Ids = new Set(['WEEK035','WEEK036','BAND-P012','BAND-J012']);
    shifts = shifts.filter(x => !(x && x.date === '2026-09-10' && staleSep10Ids.has(x.id)));

    const sep10Location = 'Tórshavnar Musikkskúli, Landavegur 84, Tórshavn';
    const sep10Contact = 'Ved spørgsmål om lokalet kan Guðrun Sólja kontakte Ólavur Olsen direkte på +298 504740.';
    const sessionBase = {date:'2026-09-10',start:'11:00',end:'12:30',location:sep10Location,activity:'Sangtræning + optagelse',status:'Bekræftet'};
    ensureShift({...sessionBase,id:'GUD010FILM',person:'Guðrun Sólja Jacobsen',role:'Sangunderviser',task:'Fælles sangundervisning med Regin, Vón og Naina Jórun med fokus på sange til én stjerne. Sessionen filmes; Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet. '+sep10Contact});
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

    // Aktuel 8/9 event.
    program = program.filter(x => !(x && x.id === 'WP-IN-0908'));
    program.push({
      id:'WP-IN-0908',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'13:00',end:'14:00',
      activity:'Naina Jórun og Tórfríð går ind i Aulan',
      participants:'Naina Jórun, Tórfríð, Kenneth Jørgensen, Finnur Koba',
      responsible:'Kenneth Jørgensen / Finnur Koba',location:'Aulan, Hoydalar',status:'Delvist bekræftet',
      notes:'Tórfríð og Kenneth Jørgensen er bekræftet. Naina Jórun afventer endelig bekræftelse. Finnur Koba er planlagt med.'
    });

    // Aktuel 10/9 session.
    program = program.filter(x => !(x && x.date === '2026-09-10' && x.id === 'WP-GUD-0910'));
    program.push({
      id:'WP-GUD-0910',date:'2026-09-10',dayType:'Sangtræning + optagelse',part:'',start:'11:00',end:'12:30',
      activity:'Fælles sangtræning med Guðrun Sólja · optagelse',
      participants:'Guðrun Sólja Jacobsen, Regin, Vón, Naina Jórun, Maria Winther Olsen, Jónfinn Stenberg',
      responsible:'Guðrun Sólja Jacobsen / Maria Winther Olsen / Jónfinn Stenberg',
      location:sep10Location,status:'Bekræftet',
      notes:'Alle tre Spírar, Guðrun Sólja og Maria er bekræftet. Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet. '+sep10Contact
    });

    data.program = program.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')));

    return {...res,headers:{...(res.headers||{}),'cache-control':'no-store, max-age=0'},body:JSON.stringify(data)};
  } catch (e) {
    return res;
  }
};
