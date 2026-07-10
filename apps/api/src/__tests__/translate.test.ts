import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the inference client and org store
vi.mock('../services/inference-client.js', () => ({
  callTranslate: vi.fn(),
}));

vi.mock('../services/org-store.js', () => ({
  listTerms: () => Promise.resolve([]),
}));

import { callTranslate } from '../services/inference-client.js';
import { runTranslation } from '../services/translation-pipeline.js';

describe('translation pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls inference sidecar and returns translation', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Hola mundo',
      modelUsed: 'facebook/nllb-200-3.3B',
      processingTimeMs: 500,
    });

    const result = await runTranslation({
      text: 'Hello world',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
      domain: 'general',
    });

    expect(result.translation).toBe('Hola mundo');
    expect(result.modelUsed).toBe('facebook/nllb-200-3.3B');
    expect(result.sourceLang).toBe('eng_Latn');
    expect(result.targetLang).toBe('spa_Latn');
    expect(result.glossaryOverrides).toEqual([]);
  });

  it('applies glossary overrides when orgId is provided', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'El paciente tiene hipertensión.',
      modelUsed: 'facebook/nllb-200-3.3B',
      processingTimeMs: 400,
    });

    const result = await runTranslation({
      text: 'The patient has hypertension.',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
      domain: 'medical',
      orgId: 'test-org',
    });

    // No glossary terms exist in the in-memory store, so no overrides
    expect(result.translation).toBe('El paciente tiene hipertensión.');
    expect(result.glossaryOverrides).toEqual([]);
  });

  it('flags needsReview when processing is slow', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Hola',
      modelUsed: 'test-model',
      processingTimeMs: 15000, // > 10s threshold
    });

    const result = await runTranslation({
      text: 'Hello',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(result.needsReview).toBe(true);
  });

  it('passes correct source and target languages to sidecar', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Buenos días',
      modelUsed: 'test-model',
      processingTimeMs: 200,
    });

    await runTranslation({
      text: 'Good morning',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(callTranslate).toHaveBeenCalledWith({
      text: 'Good morning',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
      modelId: 'nllb-200-600m',
    });
  });

  it('uses "general" domain when domain is not provided', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Hello',
      modelUsed: 'test',
      processingTimeMs: 50,
    });

    const result = await runTranslation({
      text: 'Hello',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(result.translation).toBe('Hello');
    expect(result.needsReview).toBe(false);
  });

  it('does not flag needsReview when processing is fast and no overrides', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Rápido',
      modelUsed: 'test',
      processingTimeMs: 50,
    });

    const result = await runTranslation({
      text: 'Fast',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(result.needsReview).toBe(false);
  });

  it('returns processingTimeMs from the pipeline', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Test',
      modelUsed: 'test',
      processingTimeMs: 100,
    });

    const result = await runTranslation({
      text: 'Test',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.modelUsed).toBe('test');
  });

  it('handles sidecar returning zero processing time', async () => {
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Cero',
      modelUsed: 'test',
      processingTimeMs: 0,
    });

    const result = await runTranslation({
      text: 'Zero',
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(result.needsReview).toBe(false);
  });

  it('handles very long text (1000+ chars)', async () => {
    const longText = 'Hello '.repeat(200).trim();
    vi.mocked(callTranslate).mockResolvedValue({
      translation: 'Hola '.repeat(200).trim(),
      modelUsed: 'test',
      processingTimeMs: 300,
    });

    const result = await runTranslation({
      text: longText,
      sourceLang: 'eng_Latn',
      targetLang: 'spa_Latn',
    });

    expect(result.translation).toBeTruthy();
    expect(result.translation.length).toBeGreaterThan(500);
  });
});
