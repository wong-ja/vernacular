import type { FastifyInstance } from 'fastify';
import type { TranslationRequest } from '@vernacular/shared/src/shared-contract.js';
import { runTranslation } from '../services/translation-pipeline.js';

export async function translateRoutes(app: FastifyInstance) {
  app.post<{ Body: TranslationRequest }>('/api/translate', async (request, reply) => {
    const { text, sourceLang, targetLang, orgId, domain } = request.body;

    if (!text || typeof text !== 'string' || text.length === 0) {
      return reply.status(400).send({ status: 'error', message: 'text is required' });
    }
    if (!sourceLang || !targetLang) {
      return reply.status(400).send({ status: 'error', message: 'sourceLang and targetLang are required' });
    }

    try {
      const result = await runTranslation({
        text,
        sourceLang,
        targetLang,
        orgId,
        domain: domain || 'general',
      });

      return reply.send({ status: 'ok', data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      request.log.error({ err }, 'Translation failed');
      return reply.status(500).send({ status: 'error', message });
    }
  });
}
