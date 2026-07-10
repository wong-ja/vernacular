// packages/shared/src/shared-contract.ts
// VERIFIED JULY 2026 — single source of truth for inter-service data shapes.
// All API request/response shapes live here. No service redefines these types.

// ─────────────────────────────────────────────
// LANGUAGE TYPES
// ─────────────────────────────────────────────

export type SupportedLanguage =
  | 'eng_Latn'
  | 'spa_Latn'
  | 'tgl_Latn'
  | 'yue_Hant'
  | 'zho_Hans'
  | 'zho_Hant'
  | 'vie_Latn'
  | 'hmn_Latn'
  | 'khm_Khmr'
  | 'hat_Latn'
  | 'jpn_Jpan'
  | 'kor_Hang'
  | 'ara_Arab'
  | 'fra_Latn'
  | 'deu_Latn'
  | 'por_Latn'
  | 'ita_Latn'
  | 'nld_Latn'
  | 'hin_Deva'
  | 'rus_Cyrl';

// ─────────────────────────────────────────────
// TRANSLATION PIPELINE
// ─────────────────────────────────────────────

export type TranslationDomain = 'medical' | 'legal' | 'education' | 'civic' | 'general';

export interface TranslationRequest {
  text: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  orgId?: string;
  domain?: TranslationDomain;
}

export interface TranslationResult {
  translation: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  glossaryOverrides: GlossaryOverride[];
  confidence: number | null;
  needsReview: boolean;
  modelUsed: string;
  reverseTranslation?: string;
  processingTimeMs?: number;
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence: number;
  translation?: string;
  glossaryOverrides?: GlossaryOverride[];
}

export interface FileTranslationResult {
  transcript: TranscriptionSegment[];
  detectedLanguage: SupportedLanguage;
  targetLang: SupportedLanguage;
  overallConfidence: number;
  needsReview: boolean;
  captionsSrtUrl: string;
  captionsVttUrl: string;
  glossaryOverrides: GlossaryOverride[];
  modelUsed: string;
  processingTimeMs?: number;
}

export interface TextToSpeechRequest {
  text: string;
  lang: SupportedLanguage;
  modelId?: string;
}

export interface TextToSpeechResult {
  audioBase64: string;
  format: 'wav' | 'mp3';
  modelUsed: string;
  watermarked: boolean;
}

// ─────────────────────────────────────────────
// GLOSSARY
// ─────────────────────────────────────────────

export interface GlossaryTerm {
  id: string;
  orgId: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  domain: string;
  sourceTerm: string;
  targetTerm: string;
  baseModelTerm: string;
  notes: string | null;
  approvedBy: string;
  approvedAt: string;
  usageCount: number;
}

export interface GlossaryOverride {
  sourceTerm: string;
  baseModelTerm: string;
  overrideTerm: string;
  glossaryId: string;
  domain: string;
}

export interface GlossarySuggestion {
  id: string;
  orgId: string;
  suggestedBy: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  domain: string;
  sourceTerm: string;
  suggestedTerm: string;
  baseModelTerm: string;
  context: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────
// ORGANIZATIONS
// ─────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  languages: SupportedLanguage[];
  domains: string[];
  visibility: 'private' | 'published' | 'federated';
  createdAt: string;
}

export type OrgVisibility = 'private' | 'published' | 'federated';

// ─────────────────────────────────────────────
// REVIEW WORKFLOW
// ─────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'approved' | 'edited' | 'rejected';

export interface ReviewRecord {
  id: string;
  logId: string;
  orgId: string;
  reviewerId: string;
  status: ReviewStatus;
  hasEdit: boolean;
  editedContent?: string;
  flaggedTermCount: number;
  flaggedTerms?: string[];
  reason?: string;
  reviewedAt: string;
}

// ─────────────────────────────────────────────
// INTERACTION LOG (metadata only — never content)
// ─────────────────────────────────────────────

export type InteractionType = 'text_translation' | 'file_transcription' | 's2st';

export interface InteractionLog {
  id: string;
  orgId: string | null;
  interactionType: InteractionType;
  sourceLang: SupportedLanguage | null;
  targetLang: SupportedLanguage | null;
  domain: string | null;
  charCount: number | null;
  audioDurationSeconds: number | null;
  overallConfidence: number | null;
  needsReview: boolean;
  glossaryOverrideCount: number;
  modelUsed: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// INFERENCE SIDECAR CONTRACTS
// ─────────────────────────────────────────────

export interface TranscribeRequest {
  audioBase64: string;
  sourceLang?: SupportedLanguage;
}

export interface TranscribeResponse {
  segments: TranscriptionSegment[];
  detectedLanguage: SupportedLanguage;
  overallConfidence: number;
  modelUsed: string;
  processingTimeMs: number;
}

export interface TranslateRequest {
  text: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
}

export interface TranslateResponse {
  translation: string;
  modelUsed: string;
  processingTimeMs: number;
}

// ─────────────────────────────────────────────
// API HEALTH
// ─────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  uptime?: number;
}
