export default async (request, context) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const webhookUrl = Netlify.env.get('MAKE_CREDIT_WEBHOOK_URL');
  if (!webhookUrl) {
    return Response.json({ error: 'Realtime webhook er ikke konfigureret' }, { status: 503 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Ugyldigt input' }, { status: 400 });
  }

  if (!payload?.person || !payload?.current_name || !payload?.client_event_id) {
    return Response.json({ error: 'Mangler nødvendige credit-felter' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'portal.fixer.fo',
        received_at: new Date().toISOString(),
        ...payload
      }),
      signal: controller.signal
    });

    if (!upstream.ok) {
      return Response.json({ error: 'Realtime modtager afviste indsendelsen' }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: 'Realtime levering fejlede' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
};

export const config = {
  path: '/credit-realtime'
};
