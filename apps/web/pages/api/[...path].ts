import type { NextApiRequest, NextApiResponse } from 'next';

const API_URL = (typeof process !== 'undefined'
  ? (process.env.API_URL || 'http://localhost:3001')
  : ''
).replace(/\/+$/, '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path as string) || '';
  const qParams = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue;
    if (Array.isArray(v)) v.forEach((x) => qParams.append(k, x));
    else qParams.append(k, v as string);
  }
  const qs = qParams.toString();
  const target = `${API_URL}/api/${path}${qs ? `?${qs}` : ''}`;

  const headers = new Headers();
  const forwardHeaders = ['content-type', 'authorization', 'x-org-id'];
  for (const h of forwardHeaders) {
    const v = req.headers[h];
    if (v) headers.set(h, Array.isArray(v) ? v[0] : v);
  }

  try {
    const body = req.body ? JSON.stringify(req.body) : undefined;
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: body || undefined,
    });

    const responseBody = await response.text();
    res.status(response.status);
    for (const [k, v] of response.headers.entries()) {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(k)) {
        res.setHeader(k, v);
      }
    }
    res.send(responseBody);
  } catch (err: any) {
    res.status(502).json({
      status: 'error',
      message: `Proxy error: ${err?.message || 'Unknown error'}`,
    });
  }
}
