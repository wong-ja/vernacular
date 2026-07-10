import { applyGlossaryOverrides } from '@vernacular/glossary/src/index.js';
import type { TranslationRequest, TranslationResult, GlossaryTerm } from '@vernacular/shared/src/shared-contract.js';
import { callTranslate } from './inference-client.js';

const LOW_CONFIDENCE_THRESHOLD = 0.7;

/** Temporary in-memory glossary store. Replace with DB queries in Phase 1.6. */
function getOrgGlossary(orgId: string, sourceLang: string, targetLang: string, domain: string): GlossaryTerm[] {
  return [];
}

export async function runTranslation(req: TranslationRequest): Promise<TranslationResult> {
  const domain = req.domain || 'general';
  const startTime = Date.now();

  // 1. Call inference sidecar
  const sidecarResult = await callTranslate({
    text: req.text,
    sourceLang: req.sourceLang,
    targetLang: req.targetLang,
  });

  // 2. Apply glossary overrides
  let glossaryOverrides: GlossaryTerm[] = [];
  if (req.orgId) {
    glossaryOverrides = getOrgGlossary(req.orgId, req.sourceLang, req.targetLang, domain);
  }

  const overrideResult = applyGlossaryOverrides(
    sidecarResult.translation,
    glossaryOverrides.map((t) => ({
      id: t.id,
      orgId: t.orgId,
      sourceLang: t.sourceLang,
      targetLang: t.targetLang,
      domain: t.domain,
      sourceTerm: t.sourceTerm,
      targetTerm: t.targetTerm,
      baseModelTerm: t.baseModelTerm,
      notes: t.notes,
      approvedBy: t.approvedBy,
      approvedAt: new Date(t.approvedAt),
      usageCount: t.usageCount,
      isActive: true,
    })),
    req.sourceLang,
    req.targetLang,
    domain,
  );

  const needsReview = overrideResult.overrides.length > 0 || (sidecarResult.processingTimeMs ?? 0) > 10000;

  const processingTimeMs = Date.now() - startTime;

  return {
    translation: overrideResult.result,
    sourceLang: req.sourceLang,
    targetLang: req.targetLang,
    glossaryOverrides: overrideResult.overrides.map((o) => ({
      sourceTerm: o.sourceTerm,
      baseModelTerm: o.baseModelTerm,
      overrideTerm: o.overrideTerm,
      glossaryId: o.glossaryId,
      domain: o.domain,
    })),
    confidence: null,
    needsReview,
    modelUsed: sidecarResult.modelUsed,
    processingTimeMs,
  };
}
