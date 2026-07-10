import type { FastifyInstance } from 'fastify';
import { listOrgs, getOrg, getOrgBySlug, createOrg, updateOrg } from '../services/org-store.js';

export async function orgRoutes(app: FastifyInstance) {
  // List all organizations
  app.get('/api/orgs', async (_request, reply) => {
    const orgs = await listOrgs();
    return reply.send({ status: 'ok', data: orgs });
  });

  // Get organization by ID
  app.get<{ Params: { id: string } }>('/api/orgs/:id', async (request, reply) => {
    const org = await getOrg(request.params.id);
    if (!org) return reply.status(404).send({ status: 'error', message: 'Organization not found' });
    return reply.send({ status: 'ok', data: org });
  });

  // Create organization
  app.post<{ Body: { name: string; slug: string; languages?: string[]; domains?: string[]; visibility?: string } }>(
    '/api/orgs',
    async (request, reply) => {
      const { name, slug, languages, domains, visibility } = request.body;
      if (!name || !slug) {
        return reply.status(400).send({ status: 'error', message: 'name and slug are required' });
      }
      const existing = await getOrgBySlug(slug);
      if (existing) {
        return reply.status(409).send({ status: 'error', message: 'Slug already taken' });
      }
      const org = await createOrg({ name, slug, languages, domains, visibility });
      return reply.status(201).send({ status: 'ok', data: org });
    },
  );

  // Update organization
  app.patch<{ Params: { id: string }; Body: { name?: string; languages?: string[]; domains?: string[]; visibility?: string } }>(
    '/api/orgs/:id',
    async (request, reply) => {
      const body: Record<string, unknown> = {};
      if (request.body.name !== undefined) body.name = request.body.name;
      if (request.body.languages !== undefined) body.languages = request.body.languages;
      if (request.body.domains !== undefined) body.domains = request.body.domains;
      if (request.body.visibility !== undefined) body.visibility = request.body.visibility;

      const org = await updateOrg(request.params.id, body);
      if (!org) return reply.status(404).send({ status: 'error', message: 'Organization not found' });
      return reply.send({ status: 'ok', data: org });
    },
  );
}
