import { getInferenceBaseUrl, readJsonBody, sendJson, sendError } from './inference';

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
    const submitRes = await fetch(`${base}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [text, sourceLang, targetLang], api_name: 'translate' }),
    });

    if (!submitRes.ok) {
      const txt = await submitRes.text().catch(() => '');
      sendError(res, 502, `Inference error (${submitRes.status}): ${txt.slice(0, 200)}`);
      return;
    }

    const submitResult = await submitRes.json() as Record<string, unknown>;
    let data: unknown[] = [];

    if (!submitResult.event_id) {
      if (submitResult.success === false) {
        sendError(res, 502, `Inference error: ${JSON.stringify(submitResult.errors)}`);
        return;
      }
      data = (submitResult.data as unknown[]) || [];
    } else {
      const eventId = submitResult.event_id as string;
      let found = false;
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await fetch(`${base}/api/predict/${eventId}`);
        if (!pollRes.ok) continue;
        const pollResult = await pollRes.json() as Record<string, unknown>;
        if (pollResult.status === 'complete') {
          if (pollResult.success === false) {
            sendError(res, 502, `Inference error: ${JSON.stringify(pollResult.errors)}`);
            return;
          }
          data = (pollResult.data as unknown[]) || [];
          found = true;
          break;
        }
      }
      if (!found) {
        sendError(res, 504, 'Inference timed out');
        return;
      }
    }

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
