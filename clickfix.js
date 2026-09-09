(() => {
  const selector = '#mineContent .mine-next, #mineContent .mine-row';
  let touchStart = null;
  let lastOpen = 0;
  const messageLoadingStarted = Date.now();
  const MESSAGE_LOADING_MAX_MS = 6000;
  let suppressedEmptyMessagesHtml = '';
  let messagesResolved = false;

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

  function guardMessageLoading() {
    const box = document.getElementById('homeMessages');
    if (!box || messagesResolved) return;

    const text = String(box.textContent || '').trim().toLocaleLowerCase('da-DK');
    const hasRealMessage = [...box.querySelectorAll('.home-message')].some(el => {
      if (el.classList.contains('hoy-message-loading')) return false;
      return !String(el.textContent || '').toLocaleLowerCase('da-DK').includes('ingen nye beskeder');
    });

    if (hasRealMessage) {
      messagesResolved = true;
      return;
    }

    const elapsed = Date.now() - messageLoadingStarted;
    const isPrematureEmptyState = text.includes('ingen nye beskeder');

    if (isPrematureEmptyState && elapsed < MESSAGE_LOADING_MAX_MS) {
      if (!suppressedEmptyMessagesHtml) suppressedEmptyMessagesHtml = box.innerHTML;
      if (!box.querySelector('.hoy-message-loading')) {
        box.innerHTML = '<div class="home-message hoy-message-loading"><strong>Indlæser beskeder…</strong><small>Et øjeblik</small></div>';
      }
      return;
    }

    if (elapsed >= MESSAGE_LOADING_MAX_MS && box.querySelector('.hoy-message-loading')) {
      box.innerHTML = suppressedEmptyMessagesHtml || '<div class="home-message"><strong>Ingen nye beskeder</strong><small>Vigtige ændringer vises her</small></div>';
      messagesResolved = true;
    }
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
        #homeMessages .hoy-message-loading{pointer-events:none}
        #homeMessages .hoy-message-loading:after{display:none!important}
        #home .messages-heading{display:flex;align-items:center;gap:8px;color:#a7154a}
        #home .messages-heading:before{content:'✉';width:23px;height:23px;border-radius:999px;background:#b1124d;color:#fff;display:inline-grid;place-items:center;font-size:12px}
      `;
      document.head.appendChild(style);
    }
    const box = document.getElementById('homeMessages');
    if (!box) return;
    const heading = box.previousElementSibling;
    if (heading?.classList?.contains('section-title') && heading.textContent !== 'MESSAGES') {
      heading.textContent = 'MESSAGES';
      heading.classList.add('messages-heading');
    }
    guardMessageLoading();
  }

  function ensureCreditStyles() {
    if (document.getElementById('hoy-credit-flow-style')) return;
    const style = document.createElement('style');
    style.id = 'hoy-credit-flow-style';
    style.textContent = `
      .credit-name-cta{display:none;width:100%;margin-top:8px;border:0;border-radius:12px;padding:10px 11px;background:linear-gradient(100deg,#b1124d,#df4b7d);color:#fff;font-size:11px;font-weight:950;line-height:1.25;text-align:center;box-shadow:0 8px 18px rgba(177,18,77,.16)}
      .credit-name-cta.show{display:block}
      .credit-name-cta small{display:block;font-size:9px;font-weight:750;opacity:.9;margin-top:3px}
      .credit-nav-icon{width:21px;height:21px;display:grid;place-items:center;font-size:18px;line-height:1;color:#b1124d}
      .desktop-nav .credit-nav-button{color:#17233d}
      .desktop-nav .credit-nav-button:hover{background:#f8fafc}
      .more-link.credit-more-link{--nav-color:#b1124d}
      @media(min-width:760px){.desktop-nav{transition:margin-top .16s ease}body.credit-cta-open .desktop-nav{margin-top:118px}}
      @media(max-width:759px){.name-wrap:has(.credit-name-cta.show){padding-bottom:8px}.credit-name-cta{border-radius:999px;padding:9px 12px;font-size:10px}}
    `;
    document.head.appendChild(style);
  }

  function goCreditWithName() {
    const select = document.getElementById('nameSelect');
    const name = String(select?.value || '').trim();
    if (!name) return;
    location.href = `/credit.html?name=${encodeURIComponent(name)}&from=name`;
  }

  function updateCreditCta() {
    const select = document.getElementById('nameSelect');
    const cta = document.getElementById('creditNameCta');
    if (!select || !cta) return;
    const name = String(select.value || '').trim();
    const visible = Boolean(name);
    cta.classList.toggle('show', visible);
    cta.setAttribute('aria-hidden', visible ? 'false' : 'true');
    document.body.classList.toggle('credit-cta-open', visible);
    if (name) {
      const html = `SE DIT FORSLAG TIL CREDITS<small>${name}</small>`;
      if (cta.innerHTML !== html) cta.innerHTML = html;
    }
  }

  function ensureCreditFlow() {
    if (location.pathname !== '/' && location.pathname !== '/index.html') return;
    ensureCreditStyles();

    const nameWrap = document.querySelector('.name-wrap');
    const select = document.getElementById('nameSelect');
    if (nameWrap && select && !document.getElementById('creditNameCta')) {
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.id = 'creditNameCta';
      cta.className = 'credit-name-cta';
      cta.setAttribute('aria-hidden','true');
      cta.addEventListener('click', goCreditWithName);
      nameWrap.appendChild(cta);
      select.addEventListener('change', () => requestAnimationFrame(updateCreditCta));
    }

    const desktopNav = document.querySelector('.desktop-nav');
    if (desktopNav && !desktopNav.querySelector('.credit-nav-button')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'credit-nav-button';
      button.innerHTML = '<span class="credit-nav-icon">◌</span><span>CREDITS</span>';
      button.addEventListener('click', () => { location.href = '/credit.html'; });
      const contact = [...desktopNav.children].find(x => x.dataset?.page === 'contact');
      desktopNav.insertBefore(button, contact || null);
    }

    const moreSheet = document.querySelector('.more-sheet');
    if (moreSheet && !moreSheet.querySelector('.credit-more-link')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'more-link credit-more-link';
      button.innerHTML = '<span class="credit-nav-icon">◌</span><div>CREDITS<small>Se og kontrollér dit forslag til rulletekst</small></div><span>›</span>';
      button.addEventListener('click', () => { location.href = '/credit.html'; });
      const contact = [...moreSheet.querySelectorAll('.more-link')].find(x => x.dataset?.page === 'contact');
      moreSheet.insertBefore(button, contact || null);
    }

    updateCreditCta();
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
    ensureCreditFlow();
  });
  observer.observe(document.documentElement, {subtree:true, childList:true});
  prepareRows();
  decorateMessages();
  ensureCreditFlow();
  setTimeout(guardMessageLoading, MESSAGE_LOADING_MAX_MS + 50);
})();
