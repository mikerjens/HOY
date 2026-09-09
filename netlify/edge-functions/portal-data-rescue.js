export default async (request) => {
  const target = new URL('/.netlify/functions/portal-data-safe', request.url);
  const response = await fetch(target, {headers:{'cache-control':'no-cache'}});
  const headers = new Headers(response.headers);
  headers.set('cache-control','no-store, max-age=0');
  return new Response(response.body, {status:response.status, headers});
};

export const config = {
  path: '/.netlify/functions/portal-data'
};
