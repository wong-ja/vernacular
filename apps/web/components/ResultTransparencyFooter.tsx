import { useState } from 'react';
import { MODEL_REGISTRY, type ModelEntry } from '@vernacular/shared';
import type { InferenceBackend } from '@vernacular/shared';

interface ProcessedModelInfo {
  asrModelId?: string;
  inferenceBackend?: InferenceBackend;
  translationModelId?: string;
  ttsModelId?: string;
  overallConfidence?: number;
  glossaryOverrideCount?: number;
  glossaryOverrides?: Array<{
    sourceTerm: string;
    overrideTerm: string;
    domain: string;
  }>;
  processingTimeMs?: number;
}

interface ResultTransparencyFooterProps {
  info: ProcessedModelInfo;
}

function getModel(id: string): ModelEntry | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}

function confidenceInterpretation(score: number | undefined): {
  label: string;
  color: string;
  message: string;
} {
  if (score === undefined || score === null) {
    return {
      label: 'No confidence score',
      color: 'text-text-tertiary',
      message: 'Confidence scoring was not available for this result.',
    };
  }
  if (score >= 0.85) {
    return {
      label: 'High confidence',
      color: 'text-success-text',
      message: 'High confidence \u2014 likely accurate.',
    };
  }
  if (score >= 0.7) {
    return {
      label: 'Medium confidence',
      color: 'text-warning-text',
      message: 'Medium confidence \u2014 review recommended.',
    };
  }
  return {
    label: 'Low confidence',
    color: 'text-error-text',
    message: 'Low confidence \u2014 human review strongly recommended.',
  };
}

function WatermarkNoticeForResult({ modelId }: { modelId?: string }) {
  if (!modelId) return null;
  const model = getModel(modelId);
  if (!model?.watermarked) return null;

  return (
    <div className="p-3 bg-warning-bg border border-warning rounded-md">
      <p className="text-xs font-medium text-warning-text">
        {'\u26A0\uFE0F'} Audio outputs from {model.name} include an imperceptible neural watermark (PerTh by Resemble AI).
      </p>
      {model.watermarkNote && (
        <details className="mt-1">
          <summary className="text-xs text-warning-text cursor-pointer hover:underline">
            About this watermark
          </summary>
          <p className="mt-1 text-xs text-warning-text whitespace-pre-wrap">
            {model.watermarkNote}
          </p>
        </details>
      )}
    </div>
  );
}

export default function ResultTransparencyFooter({ info }: ResultTransparencyFooterProps) {
  const [expanded, setExpanded] = useState(false);

  const asrModel = info.asrModelId ? getModel(info.asrModelId) : undefined;
  const translationModel = info.translationModelId ? getModel(info.translationModelId) : undefined;
  const ttsModel = info.ttsModelId ? getModel(info.ttsModelId) : undefined;
  const confidence = confidenceInterpretation(info.overallConfidence);
  const isLowConfidence =
    info.overallConfidence !== undefined &&
    info.overallConfidence !== null &&
    info.overallConfidence < 0.7;

  return (
    <div className="mt-6 border-t border-border pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        {expanded ? '\u25BC' : '\u25B6'} How this was processed
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-sm">
          {/* ASR Model */}
          {asrModel && (
            <div className="flex items-center justify-between py-1">
              <span className="text-text-secondary">Transcription:</span>
              <span className="text-text-primary">
                {asrModel.name}
                {info.inferenceBackend && ` (${info.inferenceBackend})`}
                {' \u2014 '}
                <a
                  href={asrModel.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info-text hover:underline"
                >
                  HuggingFace {'\u2197'}
                </a>
              </span>
            </div>
          )}

          {/* Translation Model */}
          {translationModel && (
            <div className="flex items-center justify-between py-1">
              <span className="text-text-secondary">Translation:</span>
              <span className="text-text-primary">
                {translationModel.name}
                {' \u2014 '}
                <a
                  href={translationModel.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info-text hover:underline"
                >
                  HuggingFace {'\u2197'}
                </a>
              </span>
            </div>
          )}

          {/* TTS Model */}
          {ttsModel && (
            <div className="flex items-center justify-between py-1">
              <span className="text-text-secondary">Voice output:</span>
              <span className="text-text-primary">
                {ttsModel.name}
                {' \u2014 '}
                <a
                  href={ttsModel.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info-text hover:underline"
                >
                  HuggingFace {'\u2197'}
                </a>
              </span>
            </div>
          )}

          {/* Confidence Score */}
          <div className={`flex items-center justify-between py-1 ${confidence.color}`}>
            <span className="text-text-secondary">Confidence:</span>
            <span className="font-medium">
              {info.overallConfidence !== undefined && info.overallConfidence !== null
                ? `${Math.round(info.overallConfidence * 100)}% \u2014 ${confidence.message}`
                : confidence.message}
            </span>
          </div>

          {/* Low confidence audio condition note */}
          {isLowConfidence && (
            <div className="p-3 bg-warning-bg border border-warning rounded-md text-xs text-warning-text">
              Low confidence often indicates noisy audio, multiple speakers, or a low-resource language. See audio quality tips.
            </div>
          )}

          {/* Glossary Overrides */}
          {info.glossaryOverrideCount !== undefined && info.glossaryOverrideCount > 0 && (
            <div className="py-1">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Glossary overrides applied:</span>
                <span className="font-medium text-text-primary">
                  {info.glossaryOverrideCount} term{info.glossaryOverrideCount !== 1 ? 's' : ''}
                </span>
              </div>
              {info.glossaryOverrides && info.glossaryOverrides.length > 0 && (
                <div className="mt-1 space-y-1">
                  {info.glossaryOverrides.map((override, i) => (
                    <div
                      key={i}
                      className="text-xs text-text-secondary flex items-center gap-2 bg-surface-2 rounded px-2 py-1"
                      title={`Domain: ${override.domain}`}
                    >
                      <span className="line-through text-text-tertiary">{override.sourceTerm}</span>
                      <span>{'\u2192'}</span>
                      <span className="font-medium text-text-primary">{override.overrideTerm}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watermark Notice */}
          <WatermarkNoticeForResult modelId={info.ttsModelId} />

          {/* Processing Time */}
          {info.processingTimeMs !== undefined && (
            <div className="flex items-center justify-between py-1">
              <span className="text-text-secondary">Processing time:</span>
              <span className="text-text-primary font-mono text-xs">
                {info.processingTimeMs < 1000
                  ? `${info.processingTimeMs}ms`
                  : `${(info.processingTimeMs / 1000).toFixed(1)}s`}
              </span>
            </div>
          )}

          {/* Report Error */}
          <div className="pt-2 border-t border-border-subtle">
            <button className="text-xs text-error-text hover:underline cursor-pointer">
              Report an error
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
