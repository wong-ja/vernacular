const INFERENCE_BASE_URL = process.env.INFERENCE_BASE_URL || 'http://localhost:8000';

async function gradioPredict(apiName: string, data: unknown[]): Promise<unknown[]> {
  const submitRes = await fetch(`${INFERENCE_BASE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, api_name: apiName }),
  });
  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => '');
    throw new Error(`Inference error (${submitRes.status}): ${text.slice(0, 200)}`);
  }
  const submitResult = await submitRes.json() as Record<string, unknown>;
  if (!submitResult.event_id) {
    if (submitResult.success === false) throw new Error(`Inference error: ${JSON.stringify(submitResult.errors)}`);
    return (submitResult.data as unknown[]) || [];
  }
  const eventId = submitResult.event_id as string;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const pollRes = await fetch(`${INFERENCE_BASE_URL}/api/predict/${eventId}`);
    if (!pollRes.ok) continue;
    const pollResult = await pollRes.json() as Record<string, unknown>;
    if (pollResult.status === 'complete') {
      if (pollResult.success === false) throw new Error(`Inference error: ${JSON.stringify(pollResult.errors)}`);
      return (pollResult.data as unknown[]) || [];
    }
  }
  throw new Error('Inference timed out');
}

export default async function handler(req: any, res: any) {
  res.setHeader?.('Content-Type', 'application/json');
  try {
    const originalUrl = (req.headers['x-vercel-request-url'] || req.url || '') as string;
    const path = originalUrl.startsWith('http') ? new URL(originalUrl).pathname : req.url;

    if (req.method === 'GET' && (path === '/health' || path === '/api/health')) {
      return res.end?.(JSON.stringify({ status: 'ok', service: 'api', version: '0.1.0' }));
    }

    if (req.method === 'POST' && (path === '/api/translate' || path === '/translate')) {
      let body = '';
      await new Promise<void>((resolve) => {
        req.on('data', (chunk: string) => { body += chunk; });
        req.on('end', () => resolve());
      });
      const { text, sourceLang, targetLang } = JSON.parse(body);
      if (!text || !sourceLang || !targetLang) {
        res.statusCode = 400;
        return res.end?.(JSON.stringify({ status: 'error', message: 'text, sourceLang, and targetLang required' }));
      }
      const data = await gradioPredict('translate', [text, sourceLang, targetLang]);
      const result = {
        translation: (data[0] as string) || '',
        modelUsed: 'NLLB-200',
        processingTimeMs: (data[1] as number) || 0,
      };
      res.statusCode = 200;
      return res.end?.(JSON.stringify({ status: 'ok', data: { ...result, glossaryOverrides: [], confidence: null, needsReview: false, sourceLang, targetLang, translationModelId: 'NLLB-200', mode: 'balanced', processingTimeMs: result.processingTimeMs } }));
    }

    res.statusCode = 404;
    res.end?.(JSON.stringify({ status: 'error', message: `Not found: ${req.method} ${path}` }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end?.(JSON.stringify({ status: 'error', message: err?.message || 'Internal error' }));
  }
}
