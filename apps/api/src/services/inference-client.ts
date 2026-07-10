import { readFileSync } from 'node:fs';
import type { TranslateRequest, TranslateResponse, TranscribeResponse } from '@vernacular/shared';

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

export async function callTranscribe(audioPath: string): Promise<TranscribeResponse> {
  const blob = new Blob([readFileSync(audioPath)], { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('audio', blob, 'audio.wav');

  const response = await fetch(`${INFERENCE_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Inference sidecar /transcribe failed (${response.status}): ${JSON.stringify(body)}`);
  }

  const data = await response.json();
  return {
    segments: data.segments,
    detectedLanguage: data.detected_language,
    overallConfidence: data.overall_confidence,
    modelUsed: data.model_used,
    processingTimeMs: data.latency_ms,
  };
}
