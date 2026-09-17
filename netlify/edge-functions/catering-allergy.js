export default async (request, context) => {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();

  const banner = `
  <div class="allergy-alert" role="alert">
    <strong>VIGTIGT · LAKTOSE + GLUTEN</strong>
    <span>1 person skal ved alle måltider have en portion, der både er <b>laktosefri og glutenfri</b>. Hafnia skal informeres tydeligt ved bestilling og levering.</span>
  </div>`;

  const style = `<style>
  .allergy-alert{margin:0 0 18px;padding:15px 17px;border-radius:16px;border:2px solid #e49a20;background:#fff7e6;color:#6f4800;box-shadow:0 8px 24px rgba(159,104,14,.12);font-size:13px;line-height:1.45}
  .allergy-alert strong{display:block;color:#8a5200;font-size:13px;letter-spacing:.04em;margin-bottom:5px}
  .allergy-alert span{display:block;font-weight:800}
  .allergy-alert b{font-weight:1000}
  </style>`;

  if (!html.includes('VIGTIGT · LAKTOSE + GLUTEN')) {
    html = html.replace('</head>', `${style}</head>`);
    html = html.replace('<div class="tabs">', `${banner}<div class="tabs">`);
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, max-age=0, must-revalidate');
  headers.set('pragma', 'no-cache');
  headers.set('expires', '0');
  return new Response(html, { status: response.status, headers });
};

export const config = {
  path: ['/catering.html']
};
