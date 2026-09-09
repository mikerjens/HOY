(() => {
  function decorateCreditMessages() {
    document.querySelectorAll('.message-card').forEach(card => {
      const title = String(card.querySelector('.message-title')?.textContent || '').toLocaleLowerCase('da-DK');
      if (!title.includes('credit')) return;
      if (card.querySelector('.credit-message-button')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'credit-message-button';
      button.textContent = 'SE DINE CREDITS';
      button.addEventListener('click', () => {
        location.href = '/credit.html';
      });
      card.appendChild(button);
    });
  }

  if (!document.getElementById('credit-message-button-style')) {
    const style = document.createElement('style');
    style.id = 'credit-message-button-style';
    style.textContent = `
      .credit-message-button{margin-top:14px;border:0;border-radius:12px;padding:11px 15px;background:linear-gradient(100deg,#b1124d,#df4b7d);color:#fff;font-weight:950;font-size:12px;cursor:pointer;box-shadow:0 8px 18px rgba(177,18,77,.16)}
      .credit-message-button:hover{filter:brightness(.98)}
    `;
    document.head.appendChild(style);
  }

  const observer = new MutationObserver(decorateCreditMessages);
  observer.observe(document.documentElement, {subtree:true, childList:true});
  decorateCreditMessages();
})();
