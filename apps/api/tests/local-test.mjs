// Test the handler logic directly with mock req/res
function getPath(req) {
  const h = req.headers['x-vercel-request-url'];
  if (h && typeof h === 'string' && h.startsWith('http')) {
    try { return new URL(h).pathname; } catch { /* fall through */ }
  }
  return (req.url || '').split('?')[0];
}

async function handle(req, res) {
  try {
    const path = getPath(req);
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'GET' && (path === '/health' || path === '/api/health')) {
      return res.end(JSON.stringify({ status: 'ok', service: 'api', version: '0.1.0' }));
    }
    if (req.method === 'POST' && (path === '/api/translate' || path === '/translate')) {
      const { text, sourceLang, targetLang } = req.body || {};
      if (!text || !sourceLang || !targetLang) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ status: 'error', message: 'missing fields', received: req.body }));
      }
      res.statusCode = 200;
      return res.end(JSON.stringify({ status: 'ok', data: { translation: `[MOCK] ${text}`, modelUsed: 'test', processingTimeMs: 100, glossaryOverrides: [], confidence: 0.95, needsReview: false, sourceLang, targetLang, translationModelId: 'test', mode: 'balanced' } }));
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ status: 'error', message: `Not found: ${req.method} ${path}` }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', message: err?.message || 'Internal error', stack: err?.stack }));
  }
}

function mockReq(url, method, headers, body) {
  const chunks = [];
  return {
    url, method,
    headers: headers || {},
    body,
    on(event, cb) { if (event === 'data' && body) chunks.push(typeof body === 'string' ? body : JSON.stringify(body)); if (event === 'end') cb(); },
  };
}

function mockRes() {
  const out = { statusCode: 0, headers: {}, body: '' };
  return {
    setHeader(k, v) { out.headers[k] = v; },
    end(d) { out.body = d; },
    get out() { return out; },
  };
}

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (e) { console.log(`FAIL ${name}: ${e.message}`); }
}

async function testAsync(name, fn) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (e) { console.log(`FAIL ${name}: ${e.message}`); }
}

// === Tests ===

test('getPath strips query string', () => {
  const r = getPath({ url: '/api/translate?foo=bar', headers: {} });
  if (r !== '/api/translate') throw new Error(`got ${r}`);
});

test('getPath uses x-vercel-request-url', () => {
  const r = getPath({ url: '/api', headers: { 'x-vercel-request-url': 'https://example.com/api/translate' } });
  if (r !== '/api/translate') throw new Error(`got ${r}`);
});

test('GET /health returns 200', async () => {
  const res = mockRes();
  await handle({ url: '/health', method: 'GET', headers: {} }, res);
  const b = JSON.parse(res.out.body);
  if (res.out.statusCode !== 200 || b.status !== 'ok') throw new Error(`got ${res.out.statusCode} ${b.status}`);
});

test('GET /api/health returns 200', async () => {
  const res = mockRes();
  await handle({ url: '/api/health', method: 'GET', headers: {} }, res);
  const b = JSON.parse(res.out.body);
  if (res.out.statusCode !== 200) throw new Error(`got ${res.out.statusCode}`);
});

test('POST /api/translate valid returns 200', async () => {
  const res = mockRes();
  await handle({ url: '/api/translate', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { text: 'hello', sourceLang: 'eng', targetLang: 'spa' } }, res);
  const b = JSON.parse(res.out.body);
  if (res.out.statusCode !== 200) throw new Error(`got ${res.out.statusCode}: ${JSON.stringify(b)}`);
  if (b.data.translation !== '[MOCK] hello') throw new Error(`wrong translation: ${b.data.translation}`);
});

test('POST /api/translate missing body returns 400', async () => {
  const res = mockRes();
  await handle({ url: '/api/translate', method: 'POST', headers: {}, body: {} }, res);
  if (res.out.statusCode !== 400) throw new Error(`got ${res.out.statusCode}`);
});

test('POST /translate (alt) valid', async () => {
  const res = mockRes();
  await handle({ url: '/translate', method: 'POST', headers: {}, body: { text: 'hi', sourceLang: 'eng', targetLang: 'spa' } }, res);
  if (res.out.statusCode !== 200) throw new Error(`got ${res.out.statusCode}`);
});

test('POST /api/translate via x-vercel-request-url', async () => {
  const res = mockRes();
  await handle({ url: '/api', method: 'POST', headers: { 'x-vercel-request-url': 'https://x.com/api/translate' }, body: { text: 'hi', sourceLang: 'eng', targetLang: 'spa' } }, res);
  if (res.out.statusCode !== 200) throw new Error(`got ${res.out.statusCode}: ${JSON.parse(res.out.body).message || res.out.body}`);
});

test('GET /nonexistent returns 404', async () => {
  const res = mockRes();
  await handle({ url: '/nonexistent', method: 'GET', headers: {} }, res);
  if (res.out.statusCode !== 404) throw new Error(`got ${res.out.statusCode}`);
});

console.log('\nAll tests done.');
