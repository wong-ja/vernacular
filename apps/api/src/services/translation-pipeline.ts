import { applyGlossaryOverrides } from '@vernacular/glossary';
import type { TranslationRequest, TranslationResult, GlossaryTerm, ModelMode, ModelOverrides } from '@vernacular/shared';
import { MODE_PRESETS, LANGUAGE_CONFIGS } from '@vernacular/shared';
import { callTranslate } from './inference-client.js';
import { listTerms } from './org-store.js';

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
    glossaryOverrides = await listTerms(req.orgId);
  }

  const overrideResult = applyGlossaryOverrides(
    sidecarResult.translation,
    glossaryOverrides,
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


