-- Vernacular Database Schema
-- Run against Neon postgres with: psql $DATABASE_URL < db-init.sql

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  languages TEXT[],
  domains TEXT[],
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Glossary Terms
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  source_term TEXT NOT NULL,
  target_term TEXT NOT NULL,
  base_model_term TEXT,
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, source_lang, target_lang, domain, source_term)
);

-- Glossary Suggestions (pending approval)
CREATE TABLE IF NOT EXISTS glossary_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  suggested_by TEXT,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  domain TEXT NOT NULL,
  source_term TEXT NOT NULL,
  suggested_term TEXT NOT NULL,
  base_model_term TEXT,
  context TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interaction Logs (metadata only — never content)
CREATE TABLE IF NOT EXISTS interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NULL,
  interaction_type TEXT NOT NULL,
  source_lang TEXT,
  target_lang TEXT,
  domain TEXT,
  char_count INTEGER,
  audio_duration_seconds INTEGER NULL,
  overall_confidence DECIMAL,
  needs_review BOOLEAN,
  glossary_override_count INTEGER DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review Records
CREATE TABLE IF NOT EXISTS review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID REFERENCES interaction_logs(id),
  org_id UUID REFERENCES organizations(id),
  reviewer_id TEXT,
  status TEXT NOT NULL,
  has_edit BOOLEAN DEFAULT FALSE,
  edited_content TEXT,
  flagged_term_count INTEGER DEFAULT 0,
  flagged_terms TEXT[],
  reason TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_glossary_terms_lookup
  ON glossary_terms(org_id, source_lang, target_lang, domain);
CREATE INDEX IF NOT EXISTS idx_glossary_suggestions_org
  ON glossary_suggestions(org_id, status);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_org
  ON interaction_logs(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_review_records_log
  ON review_records(log_id);
