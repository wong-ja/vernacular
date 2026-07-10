import postgres from 'postgres';
import type { Organization, GlossaryTerm, GlossarySuggestion, SupportedLanguage } from '@vernacular/shared';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const sql = postgres(DATABASE_URL, {
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
});

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

  for (const [key, col] of Object.entries(colMap)) {
    if (key in data) {
      fields.push(`${col} = $${idx++}`);
      values.push((data as any)[key]);
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

  for (const [key, col] of Object.entries(colMap)) {
    if (key in data) {
      sets.push(`${col} = $${idx++}`);
      vals.push((data as any)[key]);
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

function mapOrg(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    languages: row.languages || [],
    domains: row.domains || [],
    visibility: row.visibility || 'private',
    createdAt: toISO(row.created_at),
  };
}

function mapTerm(row: any): GlossaryTerm {
  return {
    id: row.id,
    orgId: row.org_id,
    sourceLang: row.source_lang,
    targetLang: row.target_lang,
    domain: row.domain,
    sourceTerm: row.source_term,
    targetTerm: row.target_term,
    baseModelTerm: row.base_model_term || '',
    notes: row.notes || null,
    approvedBy: row.approved_by || '',
    approvedAt: toISO(row.approved_at),
    usageCount: row.usage_count || 0,
    isActive: row.is_active !== false,
  };
}

function mapSuggestion(row: any): GlossarySuggestion {
  return {
    id: row.id,
    orgId: row.org_id,
    suggestedBy: row.suggested_by || '',
    sourceLang: row.source_lang,
    targetLang: row.target_lang,
    domain: row.domain,
    sourceTerm: row.source_term,
    suggestedTerm: row.suggested_term,
    baseModelTerm: row.base_model_term || '',
    context: row.context || null,
    status: row.status || 'pending',
    reviewedBy: row.reviewed_by || null,
    reviewedAt: toISOOrNull(row.reviewed_at),
    createdAt: toISO(row.created_at),
  };
}
