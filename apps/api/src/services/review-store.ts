import postgres from 'postgres';
import type { ReviewRecord } from '@vernacular/shared/src/shared-contract.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const sql = postgres(DATABASE_URL, {
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
});

export async function listReviews(orgId: string, status?: string): Promise<ReviewRecord[]> {
  if (status) {
    const rows = await sql`SELECT * FROM review_records WHERE org_id = ${orgId} AND status = ${status} ORDER BY reviewed_at DESC`;
    return rows.map(mapReview);
  }
  const rows = await sql`SELECT * FROM review_records WHERE org_id = ${orgId} ORDER BY reviewed_at DESC`;
  return rows.map(mapReview);
}

export async function getReview(id: string): Promise<ReviewRecord | undefined> {
  const [row] = await sql`SELECT * FROM review_records WHERE id = ${id}`;
  return row ? mapReview(row) : undefined;
}

export async function createReview(data: {
  logId: string;
  orgId: string;
  reviewerId: string;
  status: 'approved' | 'edited' | 'rejected';
  hasEdit?: boolean;
  editedContent?: string;
  flaggedTermCount?: number;
  flaggedTerms?: string[];
  reason?: string;
}): Promise<ReviewRecord> {
  const [row] = await sql`
    INSERT INTO review_records (log_id, org_id, reviewer_id, status, has_edit, edited_content, flagged_term_count, flagged_terms, reason)
    VALUES (${data.logId}, ${data.orgId}, ${data.reviewerId}, ${data.status}, ${data.hasEdit ?? false}, ${data.editedContent ?? null}, ${data.flaggedTermCount ?? 0}, ${data.flaggedTerms ?? []}, ${data.reason ?? null})
    RETURNING *
  `;
  return mapReview(row);
}

export async function updateReview(id: string, data: { status?: string; hasEdit?: boolean; editedContent?: string; reason?: string }): Promise<ReviewRecord | undefined> {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;

  const colMap: Record<string, string> = {
    status: 'status',
    hasEdit: 'has_edit',
    editedContent: 'edited_content',
    reason: 'reason',
  };

  for (const [key, col] of Object.entries(colMap)) {
    if (key in data) {
      sets.push(`${col} = $${idx++}`);
      vals.push((data as any)[key]);
    }
  }

  if (sets.length === 0) return getReview(id);

  sets.push(`reviewed_at = NOW()`);
  vals.push(id);
  const query = `UPDATE review_records SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
  const [row] = await sql.unsafe(query, vals);
  return row ? mapReview(row) : undefined;
}

function mapReview(row: any): ReviewRecord {
  return {
    id: row.id,
    logId: row.log_id,
    orgId: row.org_id,
    reviewerId: row.reviewer_id || '',
    status: row.status || 'pending',
    hasEdit: row.has_edit || false,
    editedContent: row.edited_content || undefined,
    flaggedTermCount: row.flagged_term_count || 0,
    flaggedTerms: row.flagged_terms || undefined,
    reason: row.reason || undefined,
    reviewedAt: row.reviewed_at ? (row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : String(row.reviewed_at)) : '',
  };
}
