import { readFileSync } from 'node:fs';
import type { TranslateRequest, TranslateResponse, TranscribeResponse } from '@vernacular/shared';

const INFERENCE_BASE_URL = process.env.INFERENCE_BASE_URL || 'http://localhost:8000';

async function parseJsonSafe(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Inference sidecar returned non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }
}

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
    const errBody = await parseJsonSafe(response).catch(() => ({}) as Record<string, unknown>);
    throw new Error(`Inference sidecar /translate failed (${response.status}): ${JSON.stringify(errBody)}`);
  }

  const data = await parseJsonSafe(response);
  return {
    translation: data.translation as string,
    modelUsed: (data.model_id as string) || '',
    processingTimeMs: (data.latency_ms as number) || 0,
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
    const errBody = await parseJsonSafe(response).catch(() => ({}) as Record<string, unknown>);
    throw new Error(`Inference sidecar /transcribe failed (${response.status}): ${JSON.stringify(errBody)}`);
  }

  const data = await parseJsonSafe(response);
  return {
    segments: data.segments as TranscribeResponse['segments'],
    detectedLanguage: (data.detected_language as string) || '',
    overallConfidence: (data.overall_confidence as number) || 0,
    modelUsed: (data.model_used as string) || '',
    processingTimeMs: (data.latency_ms as number) || 0,
  };
}
