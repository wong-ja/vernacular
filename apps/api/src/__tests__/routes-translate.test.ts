import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { buildApp } from '../app.js';

vi.mock('../services/inference-client.js', () => ({
  callTranslate: vi.fn(),
}));

vi.mock('../services/org-store.js', () => ({
  listOrgs: () => Promise.resolve([]),
  getOrg: () => Promise.resolve(undefined),
  getOrgBySlug: () => Promise.resolve(undefined),
  createOrg: (d: any) => Promise.resolve({ id: 'mock-id', ...d, languages: d.languages || [], domains: d.domains || [], visibility: d.visibility || 'private', createdAt: new Date().toISOString() }),
  updateOrg: () => Promise.resolve(undefined),
  listTerms: () => Promise.resolve([]),
  createTerm: () => Promise.resolve({ id: 'mock-term-id' }),
  updateTerm: () => Promise.resolve(undefined),
  deleteTerm: () => Promise.resolve(false),
  listSuggestions: () => Promise.resolve([]),
  createSuggestion: () => Promise.resolve({ id: 'mock-suggestion-id' }),
  reviewSuggestion: () => Promise.resolve(undefined),
}));

vi.mock('../services/review-store.js', () => ({
  listReviews: () => Promise.resolve([]),
  getReview: () => Promise.resolve(undefined),
  createReview: () => Promise.resolve({ id: 'mock-review-id' }),
  updateReview: () => Promise.resolve(undefined),
}));

import { callTranslate } from '../services/inference-client.js';

let app: Awaited<ReturnType<typeof buildApp>>;

beforeEach(async () => {
  vi.clearAllMocks();
  app = await buildApp();
});

afterAll(async () => {
  if (app) await app.close();
});

describe('POST /api/translate', () => {
  it('returns 400 when text is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLang: 'eng_Latn', targetLang: 'spa_Latn' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().status).toBe('error');
    expect(res.json().message).toContain('text');
  });

  it('returns 400 when sourceLang is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { text: 'Hello', targetLang: 'spa_Latn' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when targetLang is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { text: 'Hello', sourceLang: 'eng_Latn' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 with translation for valid request', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Hola mundo',
      modelUsed: 'nllb-200-3.3B',
      processingTimeMs: 500,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: {
        text: 'Hello world',
        sourceLang: 'eng_Latn',
        targetLang: 'spa_Latn',
        domain: 'general',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
    expect(res.json().data.translation).toBe('Hola mundo');
    expect(res.json().data.sourceLang).toBe('eng_Latn');
    expect(res.json().data.targetLang).toBe('spa_Latn');
  });

  it('uses default domain "general" when not provided', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Hola',
      modelUsed: 'test',
      processingTimeMs: 100,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { text: 'Hello', sourceLang: 'eng_Latn', targetLang: 'spa_Latn' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('returns 500 when sidecar fails', async () => {
    vi.mocked(callTranslate).mockRejectedValue(new Error('Sidecar not running'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: {
        text: 'Hello',
        sourceLang: 'eng_Latn',
        targetLang: 'spa_Latn',
      },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().message).toContain('Sidecar not running');
  });

  it('sets needsReview when glossary overrides are present', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'blood pressure',
      modelUsed: 'test',
      processingTimeMs: 100,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: {
        text: 'blood pressure',
        sourceLang: 'eng_Latn',
        targetLang: 'spa_Latn',
        domain: 'medical',
        orgId: 'test-org',
      },
    });

    // No glossary terms stored, so no overrides → needsReview is false (speed < 10s)
    expect(res.statusCode).toBe(200);
    expect(res.json().data.needsReview).toBe(false);
  });

  it('handles empty text string', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { text: '', sourceLang: 'eng_Latn', targetLang: 'spa_Latn' },
    });
    expect(res.statusCode).toBe(400);
  });
});
