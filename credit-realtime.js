(() => {
  function makeEventId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `credit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function ensureEventField(form, id) {
    let input = form.querySelector('input[name="client_event_id"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'client_event_id';
      form.appendChild(input);
    }
    input.value = id;
  }

  async function sendRealtime(payload) {
    try {
      await fetch('/credit-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (_) {
      // Netlify Forms + timesynk er fortsat backup.
    }
  }

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'creditFeedback') return;

    const eventId = makeEventId();
    ensureEventField(form, eventId);

    const fd = new FormData(form);
    sendRealtime({
      event_type: 'change',
      client_event_id: eventId,
      submitted_at: new Date().toISOString(),
      person: String(fd.get('person') || ''),
      current_name: String(fd.get('current_name') || ''),
      current_role: String(fd.get('current_role') || ''),
      proposed_name: String(fd.get('proposed_name') || ''),
      proposed_role: String(fd.get('proposed_role') || ''),
      comment: String(fd.get('comment') || '')
    });
  }, true);
})();
