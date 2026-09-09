export default async (request, context) => {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();
  html = html.replace(/<script src="\/credit-names\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace('</body>', '<script src="/credit-names.js?v=20260909-rulletekst-names"></script></body>');

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, max-age=0, must-revalidate');
  return new Response(html, { status: response.status, headers });
};

export const config = {
  path: '/credit.html'
};
