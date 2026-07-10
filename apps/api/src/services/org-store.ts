import type { Organization, GlossaryTerm, GlossarySuggestion } from '@vernacular/shared';
import { sql } from './db.js';

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export async function listOrgs(): Promise<Organization[]> {
  const rows = await sql`SELECT * FROM organizations ORDER BY created_at DESC`;
  return rows.map(mapOrg);
}

export async function getOrg(id: string): Promise<Organization | undefined> {
  const [row] = await sql`SELECT * FROM organizations WHERE id = ${id}`;
  return row ? mapOrg(row) : undefined;
}

export async function getOrgBySlug(slug: string): Promise<Organization | undefined> {
  const [row] = await sql`SELECT * FROM organizations WHERE slug = ${slug}`;
  return row ? mapOrg(row) : undefined;
}

export async function createOrg(data: { name: string; slug: string; languages?: string[]; domains?: string[]; visibility?: string }): Promise<Organization> {
  const [row] = await sql`
    INSERT INTO organizations (name, slug, languages, domains, visibility)
    VALUES (${data.name}, ${data.slug}, ${data.languages || []}, ${data.domains || []}, ${data.visibility || 'private'})
    RETURNING *
  `;
  return mapOrg(row);
}

export async function updateOrg(id: string, data: Partial<Organization>): Promise<Organization | undefined> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const colMap: Record<string, string> = {
    name: 'name',
    languages: 'languages',
    domains: 'domains',
    visibility: 'visibility',
  };

  const d = data as Record<string, unknown>;
  for (const [key, col] of Object.entries(colMap)) {
    if (key in data) {
      fields.push(`${col} = $${idx++}`);
      values.push(d[key]);
    }
  }

  if (fields.length === 0) return getOrg(id);

  values.push(id);
  const query = `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  const [row] = await sql.unsafe(query, values);
  return row ? mapOrg(row) : undefined;
}

// ---------------------------------------------------------------------------
// Glossary Terms
// ---------------------------------------------------------------------------

export async function listTerms(orgId: string): Promise<GlossaryTerm[]> {
  const rows = await sql`SELECT * FROM glossary_terms WHERE org_id = ${orgId} ORDER BY created_at DESC`;
  return rows.map(mapTerm);
}

export async function createTerm(data: Omit<GlossaryTerm, 'id' | 'usageCount' | 'approvedAt'>): Promise<GlossaryTerm> {
  const [row] = await sql`
    INSERT INTO glossary_terms (org_id, source_lang, target_lang, domain, source_term, target_term, base_model_term, notes, approved_by, is_active)
    VALUES (${data.orgId}, ${data.sourceLang}, ${data.targetLang}, ${data.domain}, ${data.sourceTerm}, ${data.targetTerm}, ${data.baseModelTerm}, ${data.notes}, ${data.approvedBy}, ${data.isActive})
    RETURNING *
  `;
  return mapTerm(row);
}

export async function updateTerm(id: string, data: Partial<GlossaryTerm>): Promise<GlossaryTerm | undefined> {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;

  const colMap: Record<string, string> = {
    sourceLang: 'source_lang',
    targetLang: 'target_lang',
    domain: 'domain',
    sourceTerm: 'source_term',
    targetTerm: 'target_term',
    baseModelTerm: 'base_model_term',
    notes: 'notes',
    approvedBy: 'approved_by',
    isActive: 'is_active',
  };

  const d = data as Record<string, unknown>;
  for (const [key, col] of Object.entries(colMap)) {
    if (key in data) {
      sets.push(`${col} = $${idx++}`);
      vals.push(d[key]);
    }
  }

  if (sets.length === 0) return getTerm(id);

  vals.push(id);
  const query = `UPDATE glossary_terms SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
  const [row] = await sql.unsafe(query, vals);
  return row ? mapTerm(row) : undefined;
}

async function getTerm(id: string): Promise<GlossaryTerm | undefined> {
  const [row] = await sql`SELECT * FROM glossary_terms WHERE id = ${id}`;
  return row ? mapTerm(row) : undefined;
}

export async function deleteTerm(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM glossary_terms WHERE id = ${id}`;
  return result.count > 0;
}

// ---------------------------------------------------------------------------
// Glossary Suggestions
// ---------------------------------------------------------------------------

export async function listSuggestions(orgId: string, status?: string): Promise<GlossarySuggestion[]> {
  if (status) {
    return (await sql`SELECT * FROM glossary_suggestions WHERE org_id = ${orgId} AND status = ${status} ORDER BY created_at DESC`).map(mapSuggestion);
  }
  return (await sql`SELECT * FROM glossary_suggestions WHERE org_id = ${orgId} ORDER BY created_at DESC`).map(mapSuggestion);
}

export async function createSuggestion(data: Omit<GlossarySuggestion, 'id' | 'createdAt' | 'status' | 'reviewedBy' | 'reviewedAt'>): Promise<GlossarySuggestion> {
  const [row] = await sql`
    INSERT INTO glossary_suggestions (org_id, suggested_by, source_lang, target_lang, domain, source_term, suggested_term, base_model_term, context)
    VALUES (${data.orgId}, ${data.suggestedBy}, ${data.sourceLang}, ${data.targetLang}, ${data.domain}, ${data.sourceTerm}, ${data.suggestedTerm}, ${data.baseModelTerm}, ${data.context})
    RETURNING *
  `;
  return mapSuggestion(row);
}

export async function reviewSuggestion(id: string, status: 'approved' | 'rejected' | 'modified', reviewedBy: string): Promise<GlossarySuggestion | undefined> {
  const [row] = await sql`
    UPDATE glossary_suggestions SET status = ${status}, reviewed_by = ${reviewedBy}, reviewed_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!row) return undefined;

  // If approved, auto-create a glossary term
  if (status === 'approved') {
    await createTerm({
      orgId: row.org_id,
      sourceLang: row.source_lang,
      targetLang: row.target_lang,
      domain: row.domain,
      sourceTerm: row.source_term,
      targetTerm: row.suggested_term,
      baseModelTerm: row.base_model_term || '',
      notes: row.context,
      approvedBy: reviewedBy,
      isActive: true,
    });
  }

  return mapSuggestion(row);
}

// ---------------------------------------------------------------------------
// Mappers (snake_case → camelCase)
// ---------------------------------------------------------------------------

function toISO(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  return String(val ?? '');
}

function toISOOrNull(val: unknown): string | null {
  if (val == null) return null;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

type DbRow = Record<string, unknown>;

function mapOrg(row: DbRow): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    languages: (row.languages as string[]) || [],
    domains: (row.domains as string[]) || [],
    visibility: (row.visibility as Organization['visibility']) || 'private',
    createdAt: toISO(row.created_at),
  };
}

function mapTerm(row: DbRow): GlossaryTerm {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    sourceLang: row.source_lang as string,
    targetLang: row.target_lang as string,
    domain: row.domain as string,
    sourceTerm: row.source_term as string,
    targetTerm: row.target_term as string,
    baseModelTerm: (row.base_model_term as string) || '',
    notes: (row.notes as string) || null,
    approvedBy: (row.approved_by as string) || '',
    approvedAt: toISO(row.approved_at),
    usageCount: (row.usage_count as number) || 0,
    isActive: row.is_active !== false,
  };
}

function mapSuggestion(row: DbRow): GlossarySuggestion {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    suggestedBy: (row.suggested_by as string) || '',
    sourceLang: row.source_lang as string,
    targetLang: row.target_lang as string,
    domain: row.domain as string,
    sourceTerm: row.source_term as string,
    suggestedTerm: row.suggested_term as string,
    baseModelTerm: (row.base_model_term as string) || '',
    context: (row.context as string) || null,
    status: (row.status as GlossarySuggestion['status']) || 'pending',
    reviewedBy: (row.reviewed_by as string) || null,
    reviewedAt: toISOOrNull(row.reviewed_at),
    createdAt: toISO(row.created_at),
  };
}
