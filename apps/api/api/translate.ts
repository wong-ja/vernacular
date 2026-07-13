import { getInferenceBaseUrl, readJsonBody, sendJson, sendError, gradioCall } from './inference.js';

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
    const data = await gradioCall(base, 'translate', [text, sourceLang, targetLang]);

    sendJson(res, 200, {
      status: 'ok',
      data: {
        translation: (data[0] as string) || '',
        modelUsed: 'NLLB-200',
        processingTimeMs: (data[1] as number) || 0,
        glossaryOverrides: [],
        confidence: null,
        needsReview: false,
        sourceLang,
        targetLang,
        translationModelId: 'NLLB-200',
        mode: 'balanced',
      },
    });
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Internal error', { stack: err?.stack });
  }
}
