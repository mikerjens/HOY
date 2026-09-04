const base = require('./portal-data-base.js');

exports.handler = async function(event, context) {
  const res = await base.handler(event, context);
  if (!res || res.statusCode !== 200) return res;

  try {
    const data = JSON.parse(res.body || '{}');
    let shifts = Array.isArray(data.shifts) ? data.shifts : [];

    // 6. september er helt fri.
    shifts = shifts.filter(x => !(x && x.date === '2026-09-06'));

    const ensureShift = shift => {
      const i = shifts.findIndex(x => x && x.id === shift.id);
      if (i >= 0) shifts[i] = { ...shifts[i], ...shift };
      else shifts.push(shift);
    };

    // Kendt kamera-indkøring.
    ensureShift({
      id:'EYD024',date:'2026-09-24',start:'13:30',end:'23:00',
      person:'Eyðun Müller Thomsen',role:'Fotograf / kamera · indkøring',
      task:'Går med på kamera/foto under Del 4 for at lære funktionen, som han selv skal dække på Del 5 den 28. september.',
      location:'Aulan, Hoydalar',activity:'Optagelse, del 4 · indkøring kamera',status:'Bekræftet'
    });

    // 5. september: alle bekræftede sangtræninger hos Guðrun Sólja.
    const singing = (id, person, start, end) => ({
      id,date:'2026-09-05',start,end,person,role:'Spíri',
      task:'Sangtræning med Guðrun Sólja Jacobsen.',
      location:'Lítli Skúli, 56B Hoyvíksvegur',activity:'Sangtræning · Guðrun Sólja',status:'Bekræftet'
    });
    ensureShift(singing('NAINA005G','Naina Jórun','11:00','12:00'));
    ensureShift(singing('VAR005G','Vár','12:00','13:00'));
    ensureShift(singing('VON005G','Vón','13:00','14:00'));
    ensureShift(singing('HEL005G','Helge','14:00','16:00'));

    const gudrun = (id, person, start, end) => ({
      id,date:'2026-09-05',start,end,person:'Guðrun Sólja Jacobsen',role:'Sangunderviser',
      task:`Sangtræning med ${person}.`,location:'Lítli Skúli, 56B Hoyvíksvegur',
      activity:`Sangtræning · ${person}`,status:'Bekræftet'
    });
    ensureShift(gudrun('GUD005NAI','Naina Jórun','11:00','12:00'));
    ensureShift(gudrun('GUD005VAR','Vár','12:00','13:00'));
    ensureShift(gudrun('GUD005VON','Vón','13:00','14:00'));
    ensureShift(gudrun('GUD005HEL','Helge','14:00','16:00'));

    // 7. september: Vár skal lande på portalnavnet "Vár".
    ensureShift({
      id:'WEEK031',date:'2026-09-07',start:'12:00',end:'15:00',person:'Vár',role:'Spíri',
      task:'Træning med Kim Hansen og orkestret. Jens L. Thomsen deltager som Várs musikproducer.',
      location:'Aulan, Hoydalar',activity:'Spíri træning',status:'Bekræftet'
    });

    // 8. september kl. 13-14: Benjamins Spírar.
    const sep8Benjamin = {date:'2026-09-08',start:'13:00',end:'14:00',location:'Aulan, Hoydalar',activity:'Ekstra optagelse · indgang i Aulan'};
    ensureShift({...sep8Benjamin,id:'TOR008IN',person:'Tórfríð',role:'Spíri',task:'Ekstra optagelse med Naina Jórun: de går ind i Aulan.',status:'Bekræftet'});
    ensureShift({...sep8Benjamin,id:'NAI008IN',person:'Naina Jórun',role:'Spíri',task:'Ekstra optagelse med Tórfríð: de går ind i Aulan.',status:'Bekræftet'});
    ensureShift({...sep8Benjamin,id:'KEN008IN',person:'Kenneth Jørgensen',role:'Fotograf',task:'Fotograf på ekstra optagelse af Naina Jórun og Tórfríð.',status:'Bekræftet'});
    ensureShift({...sep8Benjamin,id:'FIN008IN',person:'Finnur Koba',role:'Lagt til rættis / Klip',task:'Med på ekstra optagelse af Naina Jórun og Tórfríð.',status:'Bekræftet'});
    ensureShift({...sep8Benjamin,id:'BEN008IN',person:'Benjamin Djurhuus',role:'Musikproducer / rådgiver',task:'Med på ekstra optagelse af Naina Jórun og Tórfríð.',status:'Bekræftet'});

    // 8. september kl. 14-15: Hans Poulsens Spírar.
    const sep8Hans = {date:'2026-09-08',start:'14:00',end:'15:00',location:'Aulan, Hoydalar',activity:'Ekstra optagelse · indgang i Aulan'};
    ensureShift({...sep8Hans,id:'REG008IN2',person:'Regin',role:'Spíri',task:'Ekstra optagelse med Vón: de går ind i Aulan.',status:'Afventer'});
    ensureShift({...sep8Hans,id:'VON008IN2',person:'Vón',role:'Spíri',task:'Ekstra optagelse med Regin: de går ind i Aulan.',status:'Afventer'});
    ensureShift({...sep8Hans,id:'KEN008IN2',person:'Kenneth Jørgensen',role:'Fotograf',task:'Fotograf på ekstra optagelse af Regin og Vón.',status:'Bekræftet'});
    ensureShift({...sep8Hans,id:'FIN008IN2',person:'Finnur Koba',role:'Lagt til rættis / Klip',task:'Planlagt med på ekstra optagelse af Regin og Vón.',status:'Afventer'});
    ensureShift({...sep8Hans,id:'HAN008IN2',person:'Hans Poulsen',role:'Musikproducer / rådgiver',task:'Med på ekstra optagelse af Regin og Vón.',status:'Bekræftet'});

    // 8. september kl. 15-16: Jens L. Thomsens Spírar.
    const sep8Jens = {date:'2026-09-08',start:'15:00',end:'16:00',location:'Aulan, Hoydalar',activity:'Ekstra optagelse · indgang i Aulan'};
    ensureShift({...sep8Jens,id:'HEL008IN3',person:'Helge',role:'Spíri',task:'Ekstra optagelse med Vár: de går ind i Aulan.',status:'Bekræftet'});
    ensureShift({...sep8Jens,id:'VAR008IN3',person:'Vár',role:'Spíri',task:'Ekstra optagelse med Helge: de går ind i Aulan.',status:'Bekræftet'});
    ensureShift({...sep8Jens,id:'KEN008IN3',person:'Kenneth Jørgensen',role:'Fotograf',task:'Foreslået fotograf på ekstra optagelse af Helge og Vár.',status:'Afventer'});
    ensureShift({...sep8Jens,id:'FIN008IN3',person:'Finnur Koba',role:'Lagt til rættis / Klip',task:'Med på ekstra optagelse af Helge og Vár.',status:'Bekræftet'});
    ensureShift({...sep8Jens,id:'JEN008IN3',person:'Jens L. Thomsen',role:'Musikproducer / rådgiver',task:'Med på ekstra optagelse af Helge og Vár.',status:'Bekræftet'});

    // 10. september: aktuel fælles session.
    const staleSep10Ids = new Set(['WEEK035','WEEK036','BAND-P012','BAND-J012']);
    shifts = shifts.filter(x => !(x && x.date === '2026-09-10' && staleSep10Ids.has(x.id)));
    const sep10Location = 'Tórshavnar Musikkskúli, Landavegur 84, Tórshavn';
    const sep10Contact = 'Ved spørgsmål om lokalet kan Guðrun Sólja kontakte Ólavur Olsen direkte på +298 504740.';
    const sessionBase = {date:'2026-09-10',start:'11:00',end:'12:30',location:sep10Location,activity:'Sangtræning + optagelse',status:'Bekræftet'};
    ensureShift({...sessionBase,id:'GUD010FILM',person:'Guðrun Sólja Jacobsen',role:'Sangunderviser',task:'Fælles sangundervisning med Regin, Vón og Naina Jórun. Sessionen filmes; Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet. '+sep10Contact});
    ensureShift({...sessionBase,id:'REG010FILM',person:'Regin',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sessionen filmes.'});
    ensureShift({...sessionBase,id:'VON010FILM',person:'Vón',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sessionen filmes.'});
    ensureShift({...sessionBase,id:'NAI010FILM',person:'Naina Jórun',role:'Spíri',task:'Fælles sangtræning med Guðrun Sólja. Sessionen filmes.'});
    ensureShift({...sessionBase,id:'MAR010FILM',person:'Maria Winther Olsen',role:'Instruktør / tilrettelægger',task:'Instruktør på fælles sangundervisning med Guðrun Sólja, Regin, Vón og Naina Jórun.'});
    ensureShift({...sessionBase,id:'JON010FILM',person:'Jónfinn Stenberg',role:'Fotograf',task:'Fotograf på fælles sangundervisning med Guðrun Sólja, Regin, Vón og Naina Jórun.'});

    // Navnenormalisering i portalens personvælger.
    const fixNaina = value => String(value ?? '').replace(/\bNaina\b(?!\s+Jórun)/g, 'Naina Jórun');
    const fixVarPerson = value => {
      const v = String(value ?? '').trim();
      return /^Vár Isaksen$/i.test(v) ? 'Vár' : v;
    };
    shifts.forEach(x => {
      if (!x) return;
      x.person = fixVarPerson(fixNaina(x.person));
      x.task = fixNaina(x.task);
      x.activity = fixNaina(x.activity);
    });

    data.shifts = shifts.sort((a,b) =>
      String(a.date||'').localeCompare(String(b.date||'')) ||
      String(a.start||'').localeCompare(String(b.start||'')) ||
      String(a.person||'').localeCompare(String(b.person||''), 'da')
    );
    data.people = [...new Set(data.shifts.map(x => x.person).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'da'));

    let program = Array.isArray(data.program) ? data.program : [];
    program = program.filter(x => !(x && x.date === '2026-09-06'));
    program.forEach(x => {
      if (!x) return;
      x.activity = fixNaina(x.activity);
      x.participants = fixNaina(x.participants);
      x.responsible = fixNaina(x.responsible);
      x.notes = fixNaina(x.notes);
    });

    // 8/9 dagsprogrammer.
    program = program.filter(x => !(x && ['WP-IN-0908','WP-IN-0908-HANS','WP-IN-0908-JENS'].includes(x.id)));
    program.push({id:'WP-IN-0908',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'13:00',end:'14:00',activity:'Naina Jórun og Tórfríð går ind i Aulan',participants:'Naina Jórun, Tórfríð, Benjamin Djurhuus, Kenneth Jørgensen, Finnur Koba',responsible:'Benjamin Djurhuus / Kenneth Jørgensen / Finnur Koba',location:'Aulan, Hoydalar',status:'Bekræftet',notes:'Naina Jórun, Tórfríð, Benjamin Djurhuus, Kenneth Jørgensen og Finnur Koba er bekræftet.'});
    program.push({id:'WP-IN-0908-HANS',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'14:00',end:'15:00',activity:'Regin og Vón går ind i Aulan',participants:'Regin, Vón, Hans Poulsen, Kenneth Jørgensen, Finnur Koba',responsible:'Hans Poulsen / Kenneth Jørgensen / Finnur Koba',location:'Aulan, Hoydalar',status:'Delvist bekræftet',notes:'Hans Poulsen og Kenneth Jørgensen er bekræftet. Regin, Vón og Finnur Koba afventer bekræftelse.'});
    program.push({id:'WP-IN-0908-JENS',date:'2026-09-08',dayType:'Ekstra optagelse',part:'',start:'15:00',end:'16:00',activity:'Helge og Vár går ind i Aulan',participants:'Helge, Vár, Jens L. Thomsen, Kenneth Jørgensen, Finnur Koba',responsible:'Jens L. Thomsen / Kenneth Jørgensen / Finnur Koba',location:'Aulan, Hoydalar',status:'Delvist bekræftet',notes:'Helge, Vár, Jens L. Thomsen og Finnur Koba er bekræftet. Kenneth Jørgensen afventer bekræftelse.'});

    // 10/9 dagsprogram.
    program = program.filter(x => !(x && x.date === '2026-09-10' && x.id === 'WP-GUD-0910'));
    program.push({id:'WP-GUD-0910',date:'2026-09-10',dayType:'Sangtræning + optagelse',part:'',start:'11:00',end:'12:30',activity:'Fælles sangtræning med Guðrun Sólja · optagelse',participants:'Guðrun Sólja Jacobsen, Regin, Vón, Naina Jórun, Maria Winther Olsen, Jónfinn Stenberg',responsible:'Guðrun Sólja Jacobsen / Maria Winther Olsen / Jónfinn Stenberg',location:sep10Location,status:'Bekræftet',notes:'Alle tre Spírar, Guðrun Sólja og Maria er bekræftet. Jónfinn Stenberg er sat som fotograf indtil evt. anden fotograf er fundet. '+sep10Contact});

    data.program = program.sort((a,b)=>
      String(a.date||'').localeCompare(String(b.date||'')) ||
      String(a.start||'').localeCompare(String(b.start||''))
    );

    return {...res,headers:{...(res.headers||{}),'cache-control':'no-store, max-age=0'},body:JSON.stringify(data)};
  } catch (e) {
    return res;
  }
};
