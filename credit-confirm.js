(() => {
  const CONFIRM_MARKER = '__CONFIRMED__';

  function ensureStyles() {
    if (document.getElementById('credit-confirm-style')) return;
    const style = document.createElement('style');
    style.id = 'credit-confirm-style';
    style.textContent = `
      #creditBox .actions{gap:10px;flex-wrap:wrap;align-items:center}
      .credit-confirm-btn{border:0;border-radius:13px;padding:12px 16px;background:#116d52;color:#fff;font-weight:950;cursor:pointer}
      .credit-confirm-btn:hover{filter:brightness(.98)}
      .credit-confirm-btn:disabled{opacity:.72;cursor:default}
      .credit-confirm-btn.confirmed{background:#e9f8f2;color:#116d52;border:1px solid #bfe6d8}
      .credit-confirm-note{margin-top:12px;border-radius:13px;background:#ebfaf4;color:#116d52;padding:12px;font-weight:850;font-size:13px}
      @media(max-width:620px){#creditBox .actions{justify-content:stretch}.credit-confirm-btn,#openEdit{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function setNoticeText() {
    const notice = document.querySelector('#creditBox .notice');
    if (!notice || notice.dataset.confirmText === '1') return;
    notice.dataset.confirmText = '1';
    notice.innerHTML = 'Kanna, um navn og funktión hjá tær eru røtt. Er alt rætt, trýst á <strong>GÓÐKENN NAVN OG FUNKTIÓN</strong>. Um okkurt skal broytast, trýst á <strong>Foreslå ændring</strong>.<br><span class="deadline">Freistin er mánadagin 28. september 2026.</span>';
  }

  async function confirmCredit(button) {
    const c = window.CREDIT;
    if (!c || !c.name) return;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'SENDIR…';
    try {
      const body = new URLSearchParams();
      body.set('form-name', 'credit-feedback');
      body.set('person', c.name);
      body.set('current_name', c.name);
      body.set('proposed_name', c.name);
      body.set('current_role', c.role || '');
      body.set('proposed_role', c.role || '');
      body.set('comment', CONFIRM_MARKER);
      const response = await fetch('/', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: body.toString()
      });
      if (!response.ok) throw new Error('Kunne ikke sende bekræftelse');
      button.textContent = 'GÓÐKENT';
      button.classList.add('confirmed');
      const box = document.getElementById('creditBox');
      if (box && !document.getElementById('creditConfirmNote')) {
        const note = document.createElement('div');
        note.id = 'creditConfirmNote';
        note.className = 'credit-confirm-note';
        note.textContent = 'Takk. Navn og funktión hjá tær eru góðkend.';
        box.appendChild(note);
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = oldText;
      alert('Bekræftelsen kunne ikke sendes. Prøv igen.');
    }
  }

  function decorate() {
    ensureStyles();
    const actions = document.querySelector('#creditBox .actions');
    const edit = document.getElementById('openEdit');
    const c = window.CREDIT;
    if (!actions || !edit || !c) return;

    setNoticeText();
    if (document.getElementById('confirmCreditBtn')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'confirmCreditBtn';
    button.className = 'credit-confirm-btn';
    const alreadyConfirmed = String(c.status || '').toLocaleLowerCase('da-DK').includes('bekræftet af bruger');
    button.textContent = alreadyConfirmed ? 'GÓÐKENT' : 'GÓÐKENN NAVN OG FUNKTIÓN';
    if (alreadyConfirmed) {
      button.disabled = true;
      button.classList.add('confirmed');
    } else {
      button.addEventListener('click', () => confirmCredit(button));
    }
    actions.insertBefore(button, edit);
  }

  const observer = new MutationObserver(() => requestAnimationFrame(decorate));
  observer.observe(document.documentElement, {subtree:true, childList:true});
  decorate();
})();
