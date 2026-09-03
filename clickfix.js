(() => {
  const selector = '#mineContent .mine-next, #mineContent .mine-row';
  let touchStart = null;
  let lastOpen = 0;

  function resolveShiftDate(row) {
    const dateBox = row.querySelector('.mine-date');
    const day = Number(dateBox?.querySelector('strong')?.textContent || 0);
    const mon = String(dateBox?.querySelector('em')?.textContent || '').trim().toLowerCase().slice(0,3);
    const months = {jan:'01',feb:'02',mar:'03',apr:'04',maj:'05',jun:'06',jul:'07',aug:'08',sep:'09',okt:'10',nov:'11',dec:'12'};
    const mm = months[mon];
    if (!day || !mm) return '';
    return `2026-${mm}-${String(day).padStart(2,'0')}`;
  }

  function getOpenDate() {
    const open = document.querySelector('#allContent .call-card.open');
    return open?.dataset?.call || '';
  }

  function openShift(row) {
    const now = Date.now();
    if (now - lastOpen < 500) return;
    lastOpen = now;
    const date = row.dataset.shiftDate || resolveShiftDate(row);
    if (!date) return;
    row.dataset.shiftDate = date;
    if (typeof showPage === 'function') showPage('all');
    if (typeof renderAll === 'function') {
      requestAnimationFrame(() => {
        renderAll(date);
        setTimeout(() => {
          const card = document.querySelector(`[data-call="${date}"]`);
          if (card) {
            card.classList.add('open');
            card.scrollIntoView({behavior:'smooth', block:'start'});
          }
        }, 60);
      });
    }
  }

  function findRow(target) {
    return target && target.closest ? target.closest(selector) : null;
  }

  document.addEventListener('touchstart', (e) => {
    const row = findRow(e.target);
    if (!row || !e.touches?.length) return;
    touchStart = {row, x:e.touches[0].clientX, y:e.touches[0].clientY};
  }, {capture:true, passive:true});

  document.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const start = touchStart;
    touchStart = null;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const moved = Math.hypot(t.clientX-start.x, t.clientY-start.y);
    if (moved > 14) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openShift(start.row);
  }, {capture:true, passive:false});

  document.addEventListener('click', (e) => {
    const row = findRow(e.target);
    if (!row) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openShift(row);
  }, true);

  function prepareRows() {
    document.querySelectorAll(selector).forEach(row => {
      row.style.webkitTapHighlightColor = 'transparent';
      row.style.touchAction = 'manipulation';
      row.setAttribute('role','button');
      row.setAttribute('tabindex','0');
      if (!row.dataset.shiftDate) row.dataset.shiftDate = resolveShiftDate(row);
    });
  }

  function decorateMessages() {
    if (!document.getElementById('hoy-message-style')) {
      const style = document.createElement('style');
      style.id = 'hoy-message-style';
      style.textContent = `
        #homeMessages{gap:10px}
        #homeMessages .home-message{background:linear-gradient(135deg,#fff0f5 0%,#fff8fb 58%,#fff3e8 100%);border:1px solid #efc8d7;padding:15px 44px 15px 52px;box-shadow:0 10px 26px rgba(177,18,77,.10)}
        #homeMessages .home-message:before{content:'✉';position:absolute;left:15px;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:999px;background:#b1124d;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:900}
        #homeMessages .home-message strong{color:#7e123d}
        #homeMessages .home-message small{color:#775565}
        #home .messages-heading{display:flex;align-items:center;gap:8px;color:#a7154a}
        #home .messages-heading:before{content:'✉';width:23px;height:23px;border-radius:999px;background:#b1124d;color:#fff;display:inline-grid;place-items:center;font-size:12px}
      `;
      document.head.appendChild(style);
    }
    const box = document.getElementById('homeMessages');
    if (!box) return;
    let heading = box.previousElementSibling;
    if (heading?.classList?.contains('section-title')) {
      heading.textContent = 'MESSAGES';
      heading.classList.add('messages-heading');
    }
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = findRow(e.target);
    if (!row) return;
    e.preventDefault();
    openShift(row);
  }, true);

  if (typeof window.renderAll === 'function' && !window.__hoyRenderAllPatched) {
    window.__hoyRenderAllPatched = true;
    const originalRenderAll = window.renderAll;
    window.renderAll = function(openDate = '') {
      const preservedDate = openDate || getOpenDate();
      const result = originalRenderAll.call(this, preservedDate);
      if (preservedDate) {
        requestAnimationFrame(() => {
          const card = document.querySelector(`[data-call="${preservedDate}"]`);
          if (card) card.classList.add('open');
        });
      }
      return result;
    };
  }

  const observer = new MutationObserver(() => {
    prepareRows();
    decorateMessages();
  });
  observer.observe(document.documentElement, {subtree:true, childList:true});
  prepareRows();
  decorateMessages();
})();
