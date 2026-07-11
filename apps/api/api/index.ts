const INFERENCE_BASE_URL = (() => {
  try { return process.env.INFERENCE_BASE_URL || 'http://localhost:8000'; }
  catch { return 'http://localhost:8000'; }
})();

function getPath(req: any): string {
  const h = req.headers['x-vercel-request-url'];
  if (h && typeof h === 'string' && h.startsWith('http')) {
    try { return new URL(h).pathname; } catch { /* fall through */ }
  }
  return (req.url || '').split('?')[0];
}

function readBody(req: any): Promise<any> {
  // Already parsed by framework
  if (req.body) return req.body;

  // Already a raw string/buffer
  const raw = req.rawBody || req.bodyRaw;
  if (raw && typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
  if (raw && Buffer.isBuffer(raw)) { try { return JSON.parse(raw.toString()); } catch { return {}; } }

  // Try async iterable (ReadableStream / modern Vercel runtime)
  if (req[Symbol.asyncIterator]) {
    return (async () => {
      let body = '';
      for await (const chunk of req) body += Buffer.isBuffer(chunk) ? chunk.toString() : chunk;
      try { return JSON.parse(body || '{}'); } catch { return {}; }
    })();
  }

  // Fallback: stream events
  return new Promise((resolve) => {
    let data = '';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve({}); }
    };
    try {
      req.on('data', (c: any) => { data += Buffer.isBuffer(c) ? c.toString() : c; });
      req.on('end', finish);
      req.on('error', finish);
    } catch { /* stream may already be consumed */ }
    setTimeout(finish, 500);
  });
}

export default async function handler(req: any, res: any) {
  const path = getPath(req);
  res.setHeader('Content-Type', 'application/json');

  try {
    // Debug — echo request info (always works)
    if (path === '/api/debug') {
      return res.end(JSON.stringify({
        method: req.method,
        url: req.url,
        path,
        hasBody: req.body !== undefined,
        headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])),
        env: {
          INFERENCE_BASE_URL: process.env.INFERENCE_BASE_URL ? 'SET' : 'NOT SET',
          NODE_ENV: process.env.NODE_ENV || '',
        },
      }, null, 2));
    }

    // Health
    if (req.method === 'GET' && (path === '/health' || path === '/api/health')) {
      return res.end(JSON.stringify({ status: 'ok', service: 'api', version: '0.1.0' }));
    }

    // Translate
    if (req.method === 'POST' && (path === '/api/translate' || path === '/translate')) {
      const parsed = await readBody(req);
      const { text, sourceLang, targetLang } = parsed;
      if (!text || !sourceLang || !targetLang) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ status: 'error', message: 'text, sourceLang, and targetLang required', received: parsed }));
      }

      const submitRes = await fetch(`${INFERENCE_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [text, sourceLang, targetLang], api_name: 'translate' }),
      });
      if (!submitRes.ok) {
        const txt = await submitRes.text().catch(() => '');
        throw new Error(`Inference error (${submitRes.status}): ${txt.slice(0, 200)}`);
      }
      const submitResult = await submitRes.json() as Record<string, unknown>;
      let data: unknown[] = [];
      if (!submitResult.event_id) {
        if (submitResult.success === false) throw new Error(`Inference error: ${JSON.stringify(submitResult.errors)}`);
        data = (submitResult.data as unknown[]) || [];
      } else {
        const eventId = submitResult.event_id as string;
        let found = false;
        for (let i = 0; i < 120; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const pollRes = await fetch(`${INFERENCE_BASE_URL}/api/predict/${eventId}`);
          if (!pollRes.ok) continue;
          const pollResult = await pollRes.json() as Record<string, unknown>;
          if (pollResult.status === 'complete') {
            if (pollResult.success === false) throw new Error(`Inference error: ${JSON.stringify(pollResult.errors)}`);
            data = (pollResult.data as unknown[]) || [];
            found = true;
            break;
          }
        }
        if (!found) throw new Error('Inference timed out');
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({
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
      }));
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ status: 'error', message: `Not found: ${req.method} ${path}` }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ status: 'error', message: err?.message || 'Internal error', stack: err?.stack }));
  }
}
