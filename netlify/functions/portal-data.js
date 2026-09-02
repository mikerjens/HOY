const base = require('./portal-data-base.js');

exports.handler = async function(event, context) {
  const res = await base.handler(event, context);
  if (!res || res.statusCode !== 200) return res;
  try {
    const data = JSON.parse(res.body || '{}');
    const shifts = Array.isArray(data.shifts) ? data.shifts : [];

    const ensureShift = shift => {
      if (!shifts.some(x => x && x.id === shift.id)) shifts.push(shift);
    };

    ensureShift({
      id: 'EYD024',
      date: '2026-09-24',
      start: '13:30',
      end: '23:00',
      person: 'Eyðun Müller Thomsen',
      role: 'Fotograf / kamera · indkøring',
      task: 'Går med på kamera/foto under Del 4 for at lære funktionen, som han selv skal dække på Del 5 den 28. september.',
      location: 'Aulan, Hoydalar',
      activity: 'Optagelse, del 4 · indkøring kamera',
      status: 'Bekræftet'
    });

    const sessionBase = {
      date: '2026-09-10',
      start: '11:00',
      end: '12:30',
      location: 'Location afventer',
      activity: 'Sangtræning + optagelse'
    };

    ensureShift({
      ...sessionBase,
      id: 'GUD010FILM',
      person: 'Guðrun Sólja Jacobsen',
      role: 'Sangunderviser',
      task: 'Fælles sangundervisning med Regin, Vón og Naina Jórun med fokus på sange til én stjerne. Sessionen skal filmes; fotograf afventer.',
      status: 'Bekræftet'
    });
    ensureShift({
      ...sessionBase,
      id: 'REG010FILM',
      person: 'Regin',
      role: 'Spíri',
      task: 'Fælles sangtræning med Guðrun Sólja. Sange til én stjerne. Sessionen skal filmes; fotograf afventer.',
      status: 'Bekræftet'
    });
    ensureShift({
      ...sessionBase,
      id: 'VON010FILM',
      person: 'Vón',
      role: 'Spíri',
      task: 'Fælles sangtræning med Guðrun Sólja. Sange til én stjerne. Sessionen skal filmes; fotograf afventer.',
      status: 'Bekræftet'
    });
    ensureShift({
      ...sessionBase,
      id: 'NAI010FILM',
      person: 'Naina',
      role: 'Spíri',
      task: 'Fælles sangtræning med Guðrun Sólja. Sange til én stjerne. Sessionen skal filmes; fotograf afventer.',
      status: 'Bekræftet'
    });
    ensureShift({
      ...sessionBase,
      id: 'MAR010FILM',
      person: 'Maria Winther Olsen',
      role: 'Instruktør / tilrettelægger',
      task: 'Deltager i fælles sangundervisning med Guðrun Sólja, Regin, Vón og Naina Jórun. Fokus på sange til én stjerne. Sessionen filmes; fotograf afventer.',
      status: 'Bekræftet'
    });
    ensureShift({
      ...sessionBase,
      id: 'JON010FILM',
      person: 'Jónfinn Stenberg',
      role: 'Foto-koordinering',
      task: 'Ansvarlig for at finde og aftale fotograf til optagelse af den fælles sangundervisning. Selve fotografen afventer endelig aftale.',
      status: 'Bekræftet'
    });

    data.shifts = shifts.sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')) || String(a.person||'').localeCompare(String(b.person||''), 'da'));
    data.people = [...new Set(data.shifts.map(x => x.person).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'da'));

    const program = Array.isArray(data.program) ? data.program : [];
    if (!program.some(x => x && x.id === 'WP-GUD-0910')) {
      program.push({
        id: 'WP-GUD-0910',
        date: '2026-09-10',
        dayType: 'Sangtræning + optagelse',
        part: '',
        start: '11:00',
        end: '12:30',
        activity: 'Guðrun Sólja med Regin, Vón, Naina Jórun og Maria · Jónfinn finder fotograf',
        participants: 'Guðrun Sólja Jacobsen, Regin, Vón, Naina Jórun, Maria Winther Olsen, Jónfinn Stenberg',
        responsible: 'Guðrun Sólja Jacobsen / Jónfinn Stenberg',
        location: 'Location afventer',
        status: 'Bekræftet',
        notes: 'Alle tre Spírar, Guðrun Sólja og Maria er bekræftet. Jónfinn har ansvar for at finde og aftale fotograf.'
      });
    } else {
      const p = program.find(x => x && x.id === 'WP-GUD-0910');
      p.activity = 'Guðrun Sólja med Regin, Vón, Naina Jórun og Maria · Jónfinn finder fotograf';
      p.participants = 'Guðrun Sólja Jacobsen, Regin, Vón, Naina Jórun, Maria Winther Olsen, Jónfinn Stenberg';
      p.responsible = 'Guðrun Sólja Jacobsen / Jónfinn Stenberg';
      p.status = 'Bekræftet';
      p.notes = 'Alle tre Spírar, Guðrun Sólja og Maria er bekræftet. Jónfinn har ansvar for at finde og aftale fotograf.';
    }
    data.program = program.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')));

    return {
      ...res,
      headers: {...(res.headers||{}), 'cache-control':'no-store, max-age=0'},
      body: JSON.stringify(data)
    };
  } catch (e) {
    return res;
  }
};
