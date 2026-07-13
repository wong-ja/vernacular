import { getInferenceBaseUrl, readJsonBody, sendJson, sendError } from './inference.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return;
  }

  try {
    const parsed = await readJsonBody(req);
    const { text, sourceLang, targetLang } = parsed;

    if (!text || !sourceLang || !targetLang) {
      sendError(res, 400, 'text, sourceLang, and targetLang required', { received: parsed });
      return;
    }

    const base = getInferenceBaseUrl();
    const inferRes = await fetch(`${base}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });

    if (!inferRes.ok) {
      const txt = await inferRes.text().catch(() => '');
      sendError(res, 502, `Inference error (${inferRes.status}): ${txt.slice(0, 300)}`);
      return;
    }

    const result = await inferRes.json();
    sendJson(res, 200, result);
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Internal error', { stack: err?.stack });
  }
}
