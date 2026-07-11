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
