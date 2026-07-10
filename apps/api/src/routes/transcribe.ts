import type { FastifyInstance } from 'fastify';
import type { FileTranslationResult } from '@vernacular/shared';
import { saveUpload, cleanupTempFiles } from '../services/file-processor.js';
import { generateSrt, generateVtt } from '../services/caption-generator.js';
import { callTranscribe } from '../services/inference-client.js';

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

      const data = await callTranscribe(processed.audioPath);

      const srt = generateSrt(data.segments);
      const vtt = generateVtt(data.segments);

      const result: FileTranslationResult = {
        transcript: data.segments,
        detectedLanguage: data.detectedLanguage,
        targetLang: data.detectedLanguage,
        overallConfidence: data.overallConfidence,
        needsReview: data.segments.some((s) => s.confidence < 0.7),
        captionsSrtUrl: `data:text/plain;base64,${Buffer.from(srt).toString('base64')}`,
        captionsVttUrl: `data:text/plain;base64,${Buffer.from(vtt).toString('base64')}`,
        glossaryOverrides: [],
        modelUsed: data.modelUsed,
        processingTimeMs: data.processingTimeMs,
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
