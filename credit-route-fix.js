(() => {
  const CREDIT_PATH = '/credit.html';

  function makeDesktopLink() {
    const nav = document.querySelector('.desktop-nav');
    if (!nav) return;

    nav.querySelectorAll('.credit-nav-button,.credit-nav-hardlink').forEach(el => el.remove());

    const link = document.createElement('a');
    link.href = CREDIT_PATH;
    link.className = 'credit-nav-hardlink';
    link.innerHTML = '<span class="credit-nav-hardicon">◌</span><span>CREDITS</span>';

    const contact = [...nav.children].find(el => el.dataset?.page === 'contact');
    nav.insertBefore(link, contact || null);
  }

  function makeMoreLink() {
    const sheet = document.querySelector('.more-sheet');
    if (!sheet) return;

    sheet.querySelectorAll('.credit-more-link,.credit-more-hardlink').forEach(el => el.remove());

    const link = document.createElement('a');
    link.href = CREDIT_PATH;
    link.className = 'more-link credit-more-hardlink';
    link.innerHTML = '<span class="credit-nav-hardicon">◌</span><div>CREDITS<small>Se og kontrollér dit forslag til rulletekst</small></div><span>›</span>';

    const contact = [...sheet.querySelectorAll('.more-link')].find(el => el.dataset?.page === 'contact');
    sheet.insertBefore(link, contact || null);
  }

  function hardenButtons() {
    document.querySelectorAll('.credit-message-button').forEach(button => {
      if (button.dataset.creditHardened === '1') return;
      button.dataset.creditHardened = '1';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.assign(CREDIT_PATH);
      }, true);
    });

    const cta = document.getElementById('creditNameCta');
    if (cta && cta.dataset.creditHardened !== '1') {
      cta.dataset.creditHardened = '1';
      cta.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const name = String(document.getElementById('nameSelect')?.value || '').trim();
        const url = name ? `${CREDIT_PATH}?name=${encodeURIComponent(name)}&from=name` : CREDIT_PATH;
        window.location.assign(url);
      }, true);
    }
  }

  function addStyles() {
    if (document.getElementById('credit-route-hardfix-style')) return;
    const style = document.createElement('style');
    style.id = 'credit-route-hardfix-style';
    style.textContent = `
      .credit-nav-hardlink{min-height:48px;padding:12px 14px;border-radius:13px;font-weight:850;display:flex;align-items:center;gap:11px;color:#17233d;text-decoration:none}
      .credit-nav-hardlink:hover{background:#f8fafc}
      .credit-nav-hardicon{width:21px;height:21px;display:grid;place-items:center;font-size:18px;line-height:1;color:#b1124d}
      .credit-more-hardlink{text-decoration:none;color:#17233d}
    `;
    document.head.appendChild(style);
  }

  function apply() {
    if (location.pathname !== '/' && location.pathname !== '/index.html') return;
    addStyles();
    makeDesktopLink();
    makeMoreLink();
    hardenButtons();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(apply));
  observer.observe(document.documentElement, {subtree:true, childList:true});
  apply();
})();
