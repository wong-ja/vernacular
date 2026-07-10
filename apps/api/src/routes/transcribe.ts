import type { FastifyInstance } from 'fastify';
import type { FileTranslationResult, TranscriptionSegment } from '@vernacular/shared';
import { saveUpload, cleanupTempFiles } from '../services/file-processor.js';
import { generateSrt, generateVtt } from '../services/caption-generator.js';

const INFERENCE_BASE_URL = process.env.INFERENCE_BASE_URL || 'http://localhost:8000';

export async function transcribeRoutes(app: FastifyInstance) {
  app.post('/api/transcribe', async (request, reply) => {
    let file;
    try {
      file = await request.file();
    } catch {
      return reply.status(400).send({ status: 'error', message: 'Invalid multipart upload' });
    }
    if (!file) {
      return reply.status(400).send({ status: 'error', message: 'No file uploaded' });
    }

    let processed;
    try {
      processed = await saveUpload(file.file, file.filename, file.mimetype);

      if (processed.mediaType === 'image' || processed.mediaType === 'pdf') {
        return reply.status(400).send({
          status: 'error',
          message: `${processed.mediaType} transcription not yet supported — audio and video only`,
        });
      }

      if (processed.mediaType === 'unsupported') {
        return reply.status(400).send({
          status: 'error',
          message: `Unsupported file type: ${file.mimetype || file.filename}`,
        });
      }

      // Call inference sidecar /transcribe
      const formData = new FormData();
      const { readFileSync, statSync } = await import('node:fs');
      const blob = new Blob([readFileSync(processed.audioPath)], { type: 'audio/wav' });
      formData.append('audio', blob, 'audio.wav');

      const startTime = Date.now();
      const response = await fetch(`${INFERENCE_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(`Inference sidecar /transcribe failed (${response.status}): ${JSON.stringify(body)}`);
      }

      const data = await response.json();

      const segments: TranscriptionSegment[] = data.segments.map((s: any) => ({
        text: s.text,
        start: s.start,
        end: s.end,
        confidence: s.confidence,
      }));

      const srt = generateSrt(segments);
      const vtt = generateVtt(segments);

      const processingTimeMs = Date.now() - startTime;

      const result: FileTranslationResult = {
        transcript: segments,
        detectedLanguage: data.detected_language,
        targetLang: data.detected_language,
        overallConfidence: data.overall_confidence,
        needsReview: segments.some((s) => s.confidence < 0.7),
        captionsSrtUrl: `data:text/plain;base64,${Buffer.from(srt).toString('base64')}`,
        captionsVttUrl: `data:text/plain;base64,${Buffer.from(vtt).toString('base64')}`,
        glossaryOverrides: [],
        modelUsed: data.model_used,
        processingTimeMs,
      };

      return reply.send({ status: 'ok', data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      request.log.error({ err }, 'Transcription failed');
      return reply.status(500).send({ status: 'error', message });
    } finally {
      if (processed?.tempPaths) {
        await cleanupTempFiles(processed.tempPaths).catch(() => {});
      }
    }
  });
}
