import { getInferenceBaseUrl, sendJson, sendError, gradioCall } from './inference.js';

function readFormData(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
    setTimeout(() => reject(new Error('readFormData timeout')), 15000);
  });
}

function extractFileFromMultipart(body: Buffer, contentType: string): { buffer: Buffer; filename: string } | undefined {
  const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
  if (!boundary) return;
  const parts = body.toString('binary').split(`--${boundary}`);
  for (const part of parts) {
    if (!part.includes('Content-Disposition') || !part.includes('filename')) continue;
    const filename = part.match(/filename="([^"]*)"/)?.[1] || 'audio';
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const raw = part.substring(headerEnd + 4).replace(/\r\n--$/, '').replace(/\r\n$/, '');
    return { buffer: Buffer.from(raw, 'binary'), filename };
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return;
  }

  try {
    const base = getInferenceBaseUrl();
    const rawBody = await readFormData(req);
    const contentType = req.headers['content-type'] || '';

    const extracted = extractFileFromMultipart(rawBody, contentType);
    if (!extracted) {
      sendError(res, 400, 'No audio file found in upload');
      return;
    }

    // Upload file to Gradio's temp storage
    const uploadForm = new FormData();
    uploadForm.append('files', new Blob([new Uint8Array(extracted.buffer)]), extracted.filename);
    const uploadRes = await fetch(`${base}/gradio_api/upload`, {
      method: 'POST',
      body: uploadForm,
    });
    if (!uploadRes.ok) {
      const txt = await uploadRes.text().catch(() => '');
      sendError(res, 502, `Gradio upload error (${uploadRes.status}): ${txt.slice(0, 200)}`);
      return;
    }
    const uploadResult = await uploadRes.json() as { path: string }[];
    const filePath = uploadResult[0]?.path;
    if (!filePath) throw new Error('Gradio upload did not return a file path');

    // Call transcribe
    const data = await gradioCall(base, 'transcribe', [filePath, '']);

    const jsonStr = data[0] as string;
    let result: Record<string, unknown>;
    try { result = JSON.parse(jsonStr || '{}'); } catch { result = {}; }

    sendJson(res, 200, { status: 'ok', data: result });
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Internal error', { stack: err?.stack });
  }
}
