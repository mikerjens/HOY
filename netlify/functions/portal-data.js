const live = require('./portal-data-safe.js');

exports.handler = async function(event, context) {
  const res = await live.handler(event, context);
  if (!res) return res;

  res.headers = {
    ...(res.headers || {}),
    'cache-control': 'no-store, max-age=0, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0'
  };
  return res;
};
