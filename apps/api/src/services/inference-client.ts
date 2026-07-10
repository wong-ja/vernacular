import type { TranslateRequest, TranslateResponse } from '@vernacular/shared';

const INFERENCE_BASE_URL = process.env.INFERENCE_BASE_URL || 'http://localhost:8000';

export async function callTranslate(req: TranslateRequest): Promise<TranslateResponse> {
  const url = `${INFERENCE_BASE_URL}/translate`;
  const body: Record<string, unknown> = {
    text: req.text,
    source_lang: req.sourceLang,
    target_lang: req.targetLang,
  };
  if (req.modelId) {
    body.model_id = req.modelId;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(`Inference sidecar /translate failed (${response.status}): ${JSON.stringify(errBody)}`);
  }

  const data = await response.json();
  return {
    translation: data.translation,
    modelUsed: data.model_id,
    processingTimeMs: data.latency_ms,
  };
}
