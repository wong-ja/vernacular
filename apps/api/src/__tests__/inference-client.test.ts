import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { callTranslate } from '../services/inference-client.js';

function mockResponse(overrides: Partial<{
  ok: boolean;
  status: number;
  body: string;
}>): any {
  const body = overrides.body || '{}';
  return {
    ok: overrides.ok ?? true,
    status: overrides.status ?? 200,
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
  };
}

describe('callTranslate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns translation response on success', async () => {
    mockFetch.mockResolvedValue(mockResponse({
      body: JSON.stringify({
        translation: 'Hola mundo',
        model_id: 'nllb-200-3.3B',
        latency_ms: 500,
      }),
    }));

    const result = await callTranslate({
      text: 'Hello world',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(result.translation).toBe('Hola mundo');
    expect(result.modelUsed).toBe('nllb-200-3.3B');
    expect(result.processingTimeMs).toBe(500);
  });

  it('sends correct request body to inference server', async () => {
    mockFetch.mockResolvedValue(mockResponse({
      body: JSON.stringify({
        translation: 'Bonjour',
        model_id: 'test',
        latency_ms: 100,
      }),
    }));

    await callTranslate({
      text: 'Hello',
      sourceLang: 'eng_Latn',
      targetLang: 'fra_Latn',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/translate'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"text":"Hello"'),
      }),
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.source_lang).toBe('eng_Latn');
    expect(callBody.target_lang).toBe('fra_Latn');
  });

  it('uses INFERENCE_BASE_URL env var when set', async () => {
    const oldEnv = process.env.INFERENCE_BASE_URL;
    process.env.INFERENCE_BASE_URL = 'http://custom:8080';

    vi.resetModules();
    const fresh = await import('../services/inference-client.js');

    mockFetch.mockResolvedValue(mockResponse({
      body: JSON.stringify({
        translation: 'Hola',
        model_id: 'test',
        latency_ms: 100,
      }),
    }));

    await fresh.callTranslate({
      text: 'Hello',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://custom:8080/translate',
      expect.anything(),
    );

    process.env.INFERENCE_BASE_URL = oldEnv;
  });

  it('throws on HTTP error response', async () => {
    mockFetch.mockResolvedValue(mockResponse({
      ok: false,
      status: 502,
      body: JSON.stringify({ error: 'Model not loaded' }),
    }));

    await expect(callTranslate({
      text: 'Hello',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    })).rejects.toThrow('Inference sidecar /translate failed');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(callTranslate({
      text: 'Hello',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    })).rejects.toThrow('ECONNREFUSED');
  });
});
