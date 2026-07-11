import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'node:http';
import https from 'node:https';

export const config = { api: { bodyParser: false } };

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/+$/, '');

function parseUrl(url: string) {
  const u = new URL(url);
  return { hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? '443' : '80'), protocol: u.protocol, path: u.pathname + u.search };
}

function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const path = Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path as string) || '';
    const target = `${API_URL}/api/${path}`;
    const headers: Record<string, string> = {};
    for (const h of ['content-type', 'authorization', 'x-org-id', 'content-length']) {
      const v = req.headers[h];
      if (v) headers[h] = Array.isArray(v) ? v[0] : v;
    }

    const rawBody = await readRawBody(req);

    const { hostname, port, protocol, path: targetPath } = parseUrl(target);
    const mod = protocol === 'https:' ? https : http;

    const result = await new Promise<{ status: number; headers: Record<string, string>; body: string }>((resolve, reject) => {
      const opts = { hostname, port, path: targetPath, method: req.method, headers: { ...headers, 'content-length': String(rawBody.length) } };
      const preq = mod.request(opts, (pRes) => {
        const chunks: Buffer[] = [];
        pRes.on('data', (c: Buffer) => chunks.push(c));
        pRes.on('end', () => {
          const hdrs: Record<string, string> = {};
          for (const [k, v] of Object.entries(pRes.headers)) {
            if (['content-encoding', 'transfer-encoding', 'connection'].includes(k)) continue;
            if (v !== undefined) hdrs[k] = Array.isArray(v) ? v[0] : v;
          }
          resolve({ status: pRes.statusCode || 500, headers: hdrs, body: Buffer.concat(chunks).toString('utf-8') });
        });
      });
      preq.on('error', reject);
      preq.write(rawBody);
      preq.end();
    });

    res.status(result.status);
    for (const [k, v] of Object.entries(result.headers)) {
      if (v !== undefined) res.setHeader(k, v);
    }
    res.send(result.body);
  } catch (err: any) {
    res.status(502).json({ status: 'error', message: `Proxy error: ${err?.message || 'Unknown'}` });
  }
}
