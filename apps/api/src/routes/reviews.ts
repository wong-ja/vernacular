import type { FastifyInstance } from 'fastify';
import { listReviews, getReview, createReview, updateReview } from '../services/review-store.js';

interface CreateReviewBody {
  logId: string;
  reviewerId: string;
  status: 'approved' | 'edited' | 'rejected';
  hasEdit?: boolean;
  editedContent?: string;
  flaggedTermCount?: number;
  flaggedTerms?: string[];
  reason?: string;
}

interface UpdateReviewBody {
  status?: 'approved' | 'edited' | 'rejected';
  hasEdit?: boolean;
  editedContent?: string;
  reason?: string;
}

export async function reviewRoutes(app: FastifyInstance) {
  // List reviews for an organization, optionally filtered by status
  app.get<{ Params: { orgId: string }; Querystring: { status?: string } }>(
    '/api/orgs/:orgId/reviews',
    async (request, reply) => {
      const reviews = await listReviews(request.params.orgId, request.query.status);
      return reply.send({ status: 'ok', data: reviews });
    },
  );

  // Get a single review
  app.get<{ Params: { id: string } }>('/api/reviews/:id', async (request, reply) => {
    const review = await getReview(request.params.id);
    if (!review) return reply.status(404).send({ status: 'error', message: 'Review not found' });
    return reply.send({ status: 'ok', data: review });
  });

  // Create a review
  app.post<{ Params: { orgId: string }; Body: CreateReviewBody }>(
    '/api/orgs/:orgId/reviews',
    async (request, reply) => {
      const { logId, reviewerId, status, hasEdit, editedContent, flaggedTermCount, flaggedTerms, reason } = request.body;
      if (!logId || !reviewerId || !status) {
        return reply.status(400).send({ status: 'error', message: 'logId, reviewerId, and status are required' });
      }
      const review = await createReview({
        logId,
        orgId: request.params.orgId,
        reviewerId,
        status,
        hasEdit,
        editedContent,
        flaggedTermCount,
        flaggedTerms,
        reason,
      });
      return reply.status(201).send({ status: 'ok', data: review });
    },
  );

  // Update a review
  app.patch<{ Params: { id: string }; Body: UpdateReviewBody }>(
    '/api/reviews/:id',
    async (request, reply) => {
      const review = await updateReview(request.params.id, request.body);
      if (!review) return reply.status(404).send({ status: 'error', message: 'Review not found' });
      return reply.send({ status: 'ok', data: review });
    },
  );
}
