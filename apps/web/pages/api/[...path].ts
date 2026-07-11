import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'node:http';
import https from 'node:https';

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/+$/, '');

function parseUrl(url: string) {
  const u = new URL(url);
  return { hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? '443' : '80'), protocol: u.protocol, path: u.pathname + u.search };
}

function proxyReq(target: string, method: string | undefined, headers: Record<string, string>, body: string | undefined): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const { hostname, port, protocol, path } = parseUrl(target);
    const mod = protocol === 'https:' ? https : http;
    const opts = { hostname, port, path, method, headers: { ...headers, 'content-length': body ? String(Buffer.byteLength(body)) : '0' } };
    const req = mod.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        const hdrs: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (['content-encoding', 'transfer-encoding', 'connection'].includes(k)) continue;
          if (v !== undefined) hdrs[k] = Array.isArray(v) ? v[0] : v;
        }
        resolve({ status: res.statusCode || 500, headers: hdrs, body: Buffer.concat(chunks).toString('utf-8') });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const path = Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path as string) || '';
    const target = `${API_URL}/api/${path}`;
    const headers: Record<string, string> = {};
    for (const h of ['content-type', 'authorization', 'x-org-id']) {
      const v = req.headers[h];
      if (v) headers[h] = Array.isArray(v) ? v[0] : v;
    }
    const body = req.body ? JSON.stringify(req.body) : undefined;
    const result = await proxyReq(target, req.method, headers, body);
    res.status(result.status);
    for (const [k, v] of Object.entries(result.headers)) {
      if (v !== undefined) res.setHeader(k, v);
    }
    res.send(result.body);
  } catch (err: any) {
    res.status(502).json({ status: 'error', message: `Proxy error: ${err?.message || 'Unknown'}` });
  }
}
