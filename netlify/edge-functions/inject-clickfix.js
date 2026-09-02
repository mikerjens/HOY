export default async (request, context) => {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();
  if (!html.includes('/clickfix.js')) {
    html = html.replace('</body>', '<script src="/clickfix.js?v=20260902-1924"></script></body>');
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, max-age=0');
  return new Response(html, { status: response.status, headers });
};
