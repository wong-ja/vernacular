import { applyGlossaryOverrides } from '@vernacular/glossary';
import type { TranslationRequest, TranslationResult, GlossaryTerm, ModelMode, ModelOverrides } from '@vernacular/shared';
import { MODE_PRESETS, LANGUAGE_CONFIGS } from '@vernacular/shared';
import { callTranslate } from './inference-client.js';

const LOW_CONFIDENCE_THRESHOLD = 0.7;

function getLanguageConfig(code: string) {
  return LANGUAGE_CONFIGS.find((c) => c.code === code);
}

function resolveModels(
  sourceLang: string,
  targetLang: string,
  mode?: ModelMode,
  overrides?: ModelOverrides,
): { translationModelId: string; asrModelId: string } {
  const resolvedMode: ModelMode = mode || 'balanced';
  const langConfig = getLanguageConfig(targetLang) || getLanguageConfig(sourceLang);
  const preset = MODE_PRESETS[resolvedMode];

  const translationModelId =
    overrides?.translationModelId ||
    langConfig?.defaultTranslationModelId ||
    preset.translationModelId;

  const asrModelId =
    overrides?.asrModelId ||
    langConfig?.defaultAsrModelId ||
    preset.asrModelId;

  return { translationModelId, asrModelId };
}

export async function runTranslation(req: TranslationRequest): Promise<TranslationResult> {
  const domain = req.domain || 'general';
  const startTime = Date.now();

  const { translationModelId } = resolveModels(req.sourceLang, req.targetLang, req.mode, req.modelOverrides);

  const sidecarResult = await callTranslate({
    text: req.text,
    sourceLang: req.sourceLang,
    targetLang: req.targetLang,
    modelId: translationModelId,
  });

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
    translationModelId,
    mode: req.mode || 'balanced',
    processingTimeMs,
  };
}

function getOrgGlossary(_orgId: string, _sourceLang: string, _targetLang: string, _domain: string): GlossaryTerm[] {
  return [];
}
