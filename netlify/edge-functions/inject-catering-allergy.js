export default async (request, context) => {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();
  const alert = `<div class="catering-allergy-alert" role="alert"><strong>VIGTIGT · LAKTOSEALLERGI</strong><span>1 person har laktoseallergi. Ved alle måltider skal mindst 1 portion være laktosefri. <b>HAFNIA:</b> dette skal fremgå tydeligt ved bestilling og levering.</span></div>`;
  const style = `<style>.catering-allergy-alert{margin:0 0 18px;padding:16px 18px;border:2px solid #b1124d;border-radius:18px;background:#fff0f5;color:#6f1236;box-shadow:0 10px 26px rgba(177,18,77,.12);font-size:14px;line-height:1.45}.catering-allergy-alert strong{display:block;font-size:14px;font-weight:1000;letter-spacing:.04em;margin-bottom:5px}.catering-allergy-alert span{display:block;font-weight:800}.catering-allergy-alert b{font-weight:1000}@media(max-width:700px){.catering-allergy-alert{padding:14px 15px;font-size:13px}}</style>`;

  if (!html.includes('catering-allergy-alert')) {
    html = html.replace('</head>', `${style}</head>`);
    html = html.replace('<div class="tabs">', `${alert}<div class="tabs">`);
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, max-age=0, must-revalidate');
  return new Response(html, { status: response.status, headers });
};

export const config = {
  path: '/catering.html'
};
