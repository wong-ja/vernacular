import { getInferenceBaseUrl, sendError } from './inference';

function readFormData(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
    setTimeout(() => reject(new Error('readFormData timeout')), 15000);
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return;
  }

  try {
    const base = getInferenceBaseUrl();
    const body = await readFormData(req);
    const contentType = req.headers['content-type'] || 'application/octet-stream';

    const submitRes = await fetch(`${base}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body as unknown as BodyInit,
    });

    if (!submitRes.ok) {
      const txt = await submitRes.text().catch(() => '');
      sendError(res, 502, `Inference error (${submitRes.status}): ${txt.slice(0, 200)}`);
      return;
    }

    const result = await submitRes.json() as Record<string, unknown>;
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok', data: result }));
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Internal error', { stack: err?.stack });
  }
}
