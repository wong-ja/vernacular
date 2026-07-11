export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({
    method: req.method,
    url: req.url,
    hasBody: req.body !== undefined,
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
    ),
    env: {
      INFERENCE_BASE_URL: process.env.INFERENCE_BASE_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || '',
    },
  }, null, 2));
}
