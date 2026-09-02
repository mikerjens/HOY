const base = require('./portal-data.js');

exports.handler = async function(event, context) {
  const res = await base.handler(event, context);
  if (!res || res.statusCode !== 200) return res;
  try {
    const data = JSON.parse(res.body || '{}');
    const shifts = Array.isArray(data.shifts) ? data.shifts : [];
    const targetName = 'Eyðun Müller Thomsen';
    const targetDate = '2026-09-24';
    if (!shifts.some(x => x && x.person === targetName && x.date === targetDate)) {
      shifts.push({
        id: 'EYD024',
        date: targetDate,
        start: '13:30',
        end: '23:00',
        person: targetName,
        role: 'Fotograf / kamera · indkøring',
        task: 'Går med på kamera/foto under Del 4 for at lære funktionen, som han selv skal dække på Del 5 den 28. september.',
        location: 'Aulan, Hoydalar',
        activity: 'Optagelse, del 4 · indkøring kamera',
        status: 'Bekræftet'
      });
    }
    data.shifts = shifts.sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')) || String(a.person||'').localeCompare(String(b.person||''), 'da'));
    data.people = [...new Set(data.shifts.map(x => x.person).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'da'));
    return {
      ...res,
      headers: {...(res.headers||{}), 'cache-control':'no-store, max-age=0'},
      body: JSON.stringify(data)
    };
  } catch (e) {
    return res;
  }
};
