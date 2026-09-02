(() => {
  function resolveShiftDate(row) {
    const dateBox = row.querySelector('.mine-date');
    const day = Number(dateBox?.querySelector('strong')?.textContent || 0);
    const mon = String(dateBox?.querySelector('em')?.textContent || '').trim().toLowerCase().slice(0,3);
    const months = {jan:'01',feb:'02',mar:'03',apr:'04',maj:'05',jun:'06',jul:'07',aug:'08',sep:'09',okt:'10',nov:'11',dec:'12'};
    const mm = months[mon];
    if (!day || !mm) return '';
    return `2026-${mm}-${String(day).padStart(2,'0')}`;
  }

  function openShift(row) {
    const date = resolveShiftDate(row);
    if (!date) return;
    if (typeof showPage === 'function') showPage('all');
    if (typeof renderAll === 'function') setTimeout(() => renderAll(date), 20);
  }

  document.addEventListener('click', (event) => {
    const row = event.target.closest('#mineContent .mine-next, #mineContent .mine-row');
    if (!row) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openShift(row);
  }, true);
})();
