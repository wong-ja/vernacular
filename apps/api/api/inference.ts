export function getInferenceBaseUrl(): string {
  try { return process.env.INFERENCE_BASE_URL || 'http://localhost:8000'; }
  catch { return 'http://localhost:8000'; }
}

export async function readJsonBody(req: any): Promise<any> {
  if (req.body) return req.body;
  const raw = req.rawBody || req.bodyRaw;
  if (raw && typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
  if (raw && Buffer.isBuffer(raw)) { try { return JSON.parse(raw.toString()); } catch { return {}; } }
  if (req[Symbol.asyncIterator]) {
    return (async () => {
      let body = '';
      for await (const chunk of req) body += Buffer.isBuffer(chunk) ? chunk.toString() : chunk;
      try { return JSON.parse(body || '{}'); } catch { return {}; }
    })();
  }
  return new Promise((resolve) => {
    let data = '';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    };
    try { req.on('data', (c: any) => { data += Buffer.isBuffer(c) ? c.toString() : c; }); req.on('end', finish); req.on('error', finish); } catch { /* */ }
    setTimeout(finish, 500);
  });
}

export function sendJson(res: any, code: number, data: Record<string, unknown>): void {
  res.statusCode = code;
  res.end(JSON.stringify(data));
}

export function sendError(res: any, code: number, message: string, extra?: Record<string, unknown>): void {
  sendJson(res, code, { status: 'error', message, ...extra });
}

function isJsonResponse(res: Response, body: string): boolean {
  return (res.headers.get('content-type') || '').includes('json') || body.startsWith('{') || body.startsWith('[');
}

/** Call a Gradio 4.x function. Makes a single fast attempt — caller retries if space is sleeping. */
export async function gradioCall(baseUrl: string, fnName: string, args: unknown[]): Promise<unknown[]> {
  const patterns = [
    { path: `/api/call/${fnName}/`, body: { data: args } },
    { path: `/api/call/${fnName}`, body: { data: args } },
    { path: `/api/predict/`, body: { data: args, api_name: fnName } },
    { path: `/api/predict`, body: { data: args, api_name: fnName } },
  ];

  for (const { path, body } of patterns) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    let submitRes: Response;
    try {
      submitRes = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
    } catch {
      clearTimeout(timer);
      continue; // timeout or network error — try next pattern
    }
    clearTimeout(timer);

    const bodyText = await submitRes.text().catch(() => '');

    // HTML response = space is sleeping / not ready
    if (!isJsonResponse(submitRes, bodyText)) {
      continue;
    }

    if (!submitRes.ok) {
      throw new Error(`Gradio submit error (${submitRes.status}): ${bodyText.slice(0, 300)}`);
    }

    let submitResult: Record<string, unknown>;
    try { submitResult = JSON.parse(bodyText); } catch { continue; }

    if (!submitResult.event_id) {
      return (submitResult.data as unknown[]) || [];
    }

    const eventId = submitResult.event_id as string;
    for (let i = 0; i < 180; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      for (const suffix of [`/${eventId}/`, `/${eventId}`]) {
        const pollRes = await fetch(`${baseUrl}${path}${suffix}`);
        if (!pollRes.ok) continue;
        const text = await pollRes.text();
        let resultData: unknown[] | null = null;
        let complete = false;
        for (const ln of text.split('\n')) {
          if (ln.startsWith('event: complete')) complete = true;
          if (ln.startsWith('data: ')) {
            try { resultData = JSON.parse(ln.slice(6)); } catch { /* skip */ }
          }
        }
        if (complete && resultData) return resultData;
      }
    }
    throw new Error('Gradio inference timed out');
  }
  throw new Error('Space is starting up — retry in a moment');
}
