import type { FastifyInstance } from 'fastify';
import { listTerms, createTerm, updateTerm, deleteTerm, listSuggestions, createSuggestion, reviewSuggestion } from '../services/org-store.js';

interface CreateTermBody {
  sourceLang: string;
  targetLang: string;
  domain?: string;
  sourceTerm: string;
  targetTerm: string;
  baseModelTerm?: string;
  notes?: string | null;
  approvedBy?: string;
  isActive?: boolean;
}

interface PatchTermBody {
  sourceLang?: string;
  targetLang?: string;
  domain?: string;
  sourceTerm?: string;
  targetTerm?: string;
  baseModelTerm?: string;
  notes?: string | null;
  approvedBy?: string;
  isActive?: boolean;
}

interface CreateSuggestionBody {
  sourceLang: string;
  targetLang: string;
  domain?: string;
  sourceTerm: string;
  suggestedTerm: string;
  baseModelTerm?: string;
  context?: string | null;
  suggestedBy?: string;
}

interface ReviewSuggestionBody {
  status: 'approved' | 'rejected' | 'modified';
  reviewedBy: string;
}

export async function glossaryRoutes(app: FastifyInstance) {
  app.get<{ Params: { orgId: string } }>('/api/orgs/:orgId/terms', async (request, reply) => {
    const terms = await listTerms(request.params.orgId);
    return reply.send({ status: 'ok', data: terms });
  });

  app.post<{ Params: { orgId: string }; Body: CreateTermBody }>('/api/orgs/:orgId/terms', async (request, reply) => {
    const { sourceLang, targetLang, domain, sourceTerm, targetTerm, baseModelTerm, notes, approvedBy, isActive } = request.body;
    if (!sourceLang || !targetLang || !sourceTerm || !targetTerm) {
      return reply.status(400).send({ status: 'error', message: 'sourceLang, targetLang, sourceTerm, targetTerm are required' });
    }
    const term = await createTerm({
      orgId: request.params.orgId,
      sourceLang,
      targetLang,
      domain: domain || 'general',
      sourceTerm,
      targetTerm,
      baseModelTerm: baseModelTerm || '',
      notes: notes || null,
      approvedBy: approvedBy || 'system',
      isActive: isActive !== false,
    });
    return reply.status(201).send({ status: 'ok', data: term });
  });

  app.patch<{ Params: { orgId: string; termId: string }; Body: PatchTermBody }>('/api/orgs/:orgId/terms/:termId', async (request, reply) => {
    const body: Record<string, unknown> = {};
    if (request.body.sourceLang !== undefined) body.sourceLang = request.body.sourceLang;
    if (request.body.targetLang !== undefined) body.targetLang = request.body.targetLang;
    if (request.body.domain !== undefined) body.domain = request.body.domain;
    if (request.body.sourceTerm !== undefined) body.sourceTerm = request.body.sourceTerm;
    if (request.body.targetTerm !== undefined) body.targetTerm = request.body.targetTerm;
    if (request.body.baseModelTerm !== undefined) body.baseModelTerm = request.body.baseModelTerm;
    if (request.body.notes !== undefined) body.notes = request.body.notes;
    if (request.body.approvedBy !== undefined) body.approvedBy = request.body.approvedBy;
    if (request.body.isActive !== undefined) body.isActive = request.body.isActive;

    const term = await updateTerm(request.params.termId, body);
    if (!term) return reply.status(404).send({ status: 'error', message: 'Term not found' });
    return reply.send({ status: 'ok', data: term });
  });

  app.delete<{ Params: { orgId: string; termId: string } }>('/api/orgs/:orgId/terms/:termId', async (request, reply) => {
    const deleted = await deleteTerm(request.params.termId);
    if (!deleted) return reply.status(404).send({ status: 'error', message: 'Term not found' });
    return reply.send({ status: 'ok', data: { deleted: true } });
  });

  app.get<{ Params: { orgId: string }; Querystring: { status?: string } }>('/api/orgs/:orgId/suggestions', async (request, reply) => {
    const suggestions = await listSuggestions(request.params.orgId, request.query.status);
    return reply.send({ status: 'ok', data: suggestions });
  });

  app.post<{ Params: { orgId: string }; Body: CreateSuggestionBody }>('/api/orgs/:orgId/suggestions', async (request, reply) => {
    const { sourceLang, targetLang, domain, sourceTerm, suggestedTerm, baseModelTerm, context, suggestedBy } = request.body;
    if (!sourceLang || !targetLang || !sourceTerm || !suggestedTerm) {
      return reply.status(400).send({ status: 'error', message: 'sourceLang, targetLang, sourceTerm, suggestedTerm are required' });
    }
    const suggestion = await createSuggestion({
      orgId: request.params.orgId,
      suggestedBy: suggestedBy || 'anonymous',
      sourceLang,
      targetLang,
      domain: domain || 'general',
      sourceTerm,
      suggestedTerm,
      baseModelTerm: baseModelTerm || '',
      context: context || null,
    });
    return reply.status(201).send({ status: 'ok', data: suggestion });
  });

  app.patch<{ Params: { orgId: string; suggestionId: string }; Body: ReviewSuggestionBody }>(
    '/api/orgs/:orgId/suggestions/:suggestionId/review',
    async (request, reply) => {
      const { status, reviewedBy } = request.body;
      if (!status || !reviewedBy) {
        return reply.status(400).send({ status: 'error', message: 'status and reviewedBy are required' });
      }
      const suggestion = await reviewSuggestion(request.params.suggestionId, status, reviewedBy);
      if (!suggestion) return reply.status(404).send({ status: 'error', message: 'Suggestion not found' });
      return reply.send({ status: 'ok', data: suggestion });
    },
  );
}
