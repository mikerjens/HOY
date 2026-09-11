(() => {
  function norm(s) {
    return String(s || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');
  }

  function addStyles() {
    if (document.getElementById('hoy-mine-task-style')) return;
    const style = document.createElement('style');
    style.id = 'hoy-mine-task-style';
    style.textContent = `
      .mine-task-detail{margin-top:9px;padding:10px 11px;border-radius:11px;background:#f7f9fc;border:1px solid #e5eaf1;color:#44536b;font-size:12px;font-weight:750;line-height:1.45}
      .mine-task-detail strong{display:block;margin-bottom:3px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#6b778c}
      .mine-task-detail.important{background:#fff6e8;border-color:#f2d2a2;color:#684815}
      .mine-task-detail.important strong{color:#9a5a08}
    `;
    document.head.appendChild(style);
  }

  function decorate() {
    addStyles();
    const select = document.getElementById('nameSelect');
    const mine = document.getElementById('mineContent');
    if (!select || !mine || !select.value) return;

    let data;
    try { data = DATA; } catch (_) { return; }
    if (!data || !Array.isArray(data.shifts)) return;

    const name = String(select.value || '').trim();
    const list = data.shifts
      .filter(x => x.person === name)
      .sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')) || String(a.start||'').localeCompare(String(b.start||'')));
    if (!list.length) return;

    const cards = [];
    const next = mine.querySelector('.mine-next');
    if (next) cards.push(next);
    mine.querySelectorAll('.mine-list .mine-row').forEach(row => {
      if (!String(row.textContent || '').includes('Dette er din eneste kommende vagt')) cards.push(row);
    });

    cards.forEach((card, i) => {
      const shift = list[i];
      if (!shift) return;
      const task = String(shift.task || '').trim();
      const activity = String(shift.activity || '').trim();
      if (!task || norm(task) === norm(activity)) return;

      const key = String(shift.id || `${shift.date}-${shift.start}`);
      if (card.querySelector(`.mine-task-detail[data-task-id="${CSS.escape(key)}"]`)) return;

      const detail = document.createElement('div');
      detail.className = 'mine-task-detail' + (/^vigtig\s+besked/i.test(task) ? ' important' : '');
      detail.dataset.taskId = key;
      const label = document.createElement('strong');
      label.textContent = /^vigtig\s+besked/i.test(task) ? 'Vigtig besked' : 'Opgave';
      const text = document.createElement('span');
      text.textContent = task.replace(/^VIGTIG\s+BESKED:\s*/i, '');
      detail.append(label, text);

      const body = card.children[1] || card;
      body.appendChild(detail);
    });
  }

  const observer = new MutationObserver(() => requestAnimationFrame(decorate));
  observer.observe(document.documentElement, {subtree:true, childList:true});
  document.addEventListener('change', e => {
    if (e.target?.id === 'nameSelect') setTimeout(decorate, 0);
  });
  decorate();
})();
