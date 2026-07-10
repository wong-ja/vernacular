import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { translateRoutes } from './routes/translate.js';
import { transcribeRoutes } from './routes/transcribe.js';
import { orgRoutes } from './routes/orgs.js';
import { glossaryRoutes } from './routes/glossary.js';
import { reviewRoutes } from './routes/reviews.js';

export function buildApp() {
  const isDev = process.env.NODE_ENV !== 'production';
  const logger = isDev
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : true;

  const app = Fastify({ logger });

  app.register(cors, { origin: true });
  app.register(multipart, { limits: { fileSize: 500 * 1024 * 1024 } });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'api',
    version: '0.1.0',
  }));

  app.register(translateRoutes);
  app.register(transcribeRoutes);
  app.register(orgRoutes);
  app.register(glossaryRoutes);
  app.register(reviewRoutes);

  return app;
}
