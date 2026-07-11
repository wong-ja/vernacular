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

/**
 * Submit a job to the Gradio /api/predict endpoint and poll for the result.
 * Gradio 4.x with queue enabled returns an event_id immediately; we poll
 * /api/predict/{event_id} until the status is "complete".
 */
async function gradioPredict(apiName: string, data: unknown[]): Promise<unknown[]> {
  const submitUrl = `${INFERENCE_BASE_URL}/api/predict`;
  const submitResponse = await fetch(submitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, api_name: apiName }),
  });

  if (!submitResponse.ok) {
    const errBody = await parseJsonSafe(submitResponse).catch(() => ({}));
    throw new Error(`Gradio /api/predict submit failed (${submitResponse.status}): ${JSON.stringify(errBody)}`);
  }

  const submitResult = await submitResponse.json() as Record<string, unknown>;

  // Non-queued mode: result returned directly
  if (!submitResult.event_id) {
    if (submitResult.success === false) {
      throw new Error(`Gradio API error: ${JSON.stringify(submitResult.errors)}`);
    }
    return (submitResult.data as unknown[]) || [];
  }

  // Queued mode: poll for result
  const eventId = submitResult.event_id as string;
  const maxAttempts = 120; // 2 minutes at 1 s intervals
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const pollUrl = `${INFERENCE_BASE_URL}/api/predict/${eventId}`;
    const pollResponse = await fetch(pollUrl);
    if (!pollResponse.ok) continue;
    const pollResult = (await pollResponse.json()) as Record<string, unknown>;
    if (pollResult.status === 'complete') {
      if (pollResult.success === false) {
        throw new Error(`Gradio API error: ${JSON.stringify(pollResult.errors)}`);
      }
      return (pollResult.data as unknown[]) || [];
    }
  }
  throw new Error(`Gradio /api/predict timed out for event ${eventId}`);
}

export async function callTranslate(req: TranslateRequest): Promise<TranslateResponse> {
  const data = await gradioPredict('translate', [
    req.text,
    req.sourceLang,
    req.targetLang,
  ]);
  return {
    translation: (data[0] as string) || '',
    modelUsed: req.modelId || 'NLLB-200',
    processingTimeMs: (data[1] as number) || 0,
  };
}

export async function callTranscribe(audioPath: string): Promise<TranscribeResponse> {
  // Step 1: upload audio file to Gradio
  const blob = new Blob([readFileSync(audioPath)], { type: 'audio/wav' });
  const uploadForm = new FormData();
  uploadForm.append('files', blob, 'audio.wav');

  const uploadResponse = await fetch(`${INFERENCE_BASE_URL}/api/upload`, {
    method: 'POST',
    body: uploadForm,
  });

  if (!uploadResponse.ok) {
    const errBody = await parseJsonSafe(uploadResponse).catch(() => ({}));
    throw new Error(`Gradio /api/upload failed (${uploadResponse.status}): ${JSON.stringify(errBody)}`);
  }

  const uploadResult = (await uploadResponse.json()) as Array<{ path: string }>;
  if (!uploadResult || !uploadResult[0]?.path) {
    throw new Error('Gradio /api/upload returned no file path');
  }
  const uploadedPath = uploadResult[0].path;

  // Step 2: predict
  const data = await gradioPredict('transcribe', [uploadedPath, '']);

  // data[0] is a JSON string of the transcription result
  const raw = (data[0] as string) || '{}';
  const parsed = JSON.parse(raw) as {
    segments?: TranscribeResponse['segments'];
    detected_language?: string;
    overall_confidence?: number;
    model_used?: string;
    latency_ms?: number;
  };

  return {
    segments: parsed.segments || [],
    detectedLanguage: parsed.detected_language || '',
    overallConfidence: parsed.overall_confidence || 0,
    modelUsed: parsed.model_used || '',
    processingTimeMs: parsed.latency_ms || 0,
  };
}
