import { useState } from 'react';
import { MODEL_REGISTRY, type ModelEntry } from 'packages/shared/src/model-registry';
import type { InferenceBackend } from 'packages/shared/src/model-registry';

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
      color: 'text-gray-500',
      message: 'Confidence scoring was not available for this result.',
    };
  }
  if (score >= 0.85) {
    return {
      label: 'High confidence',
      color: 'text-green-600 dark:text-green-400',
      message: 'High confidence \u2014 likely accurate.',
    };
  }
  if (score >= 0.7) {
    return {
      label: 'Medium confidence',
      color: 'text-amber-600 dark:text-amber-400',
      message: 'Medium confidence \u2014 review recommended.',
    };
  }
  return {
    label: 'Low confidence',
    color: 'text-red-600 dark:text-red-400',
    message: 'Low confidence \u2014 human review strongly recommended.',
  };
}

function WatermarkNoticeForResult({ modelId }: { modelId?: string }) {
  if (!modelId) return null;
  const model = getModel(modelId);
  if (!model?.watermarked) return null;

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
        {'\u26A0\uFE0F'} Audio outputs from {model.name} include an imperceptible neural watermark (PerTh by Resemble AI).
      </p>
      {model.watermarkNote && (
        <details className="mt-1">
          <summary className="text-xs text-amber-700 dark:text-amber-400 cursor-pointer hover:underline">
            About this watermark
          </summary>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 whitespace-pre-wrap">
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
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        {expanded ? '\u25BC' : '\u25B6'} How this was processed
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-sm">
          {/* ASR Model */}
          {asrModel && (
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400">Transcription:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {asrModel.name}
                {info.inferenceBackend && ` (${info.inferenceBackend})`}
                {' \u2014 '}
                <a
                  href={asrModel.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  HuggingFace {'\u2197'}
                </a>
              </span>
            </div>
          )}

          {/* Translation Model */}
          {translationModel && (
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400">Translation:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {translationModel.name}
                {' \u2014 '}
                <a
                  href={translationModel.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  HuggingFace {'\u2197'}
                </a>
              </span>
            </div>
          )}

          {/* TTS Model */}
          {ttsModel && (
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400">Voice output:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {ttsModel.name}
                {' \u2014 '}
                <a
                  href={ttsModel.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  HuggingFace {'\u2197'}
                </a>
              </span>
            </div>
          )}

          {/* Confidence Score */}
          <div className={`flex items-center justify-between py-1 ${confidence.color}`}>
            <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
            <span className="font-medium">
              {info.overallConfidence !== undefined && info.overallConfidence !== null
                ? `${Math.round(info.overallConfidence * 100)}% \u2014 ${confidence.message}`
                : confidence.message}
            </span>
          </div>

          {/* Low confidence audio condition note */}
          {isLowConfidence && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-xs text-amber-800 dark:text-amber-300">
              Low confidence often indicates noisy audio, multiple speakers, or a low-resource language. See audio quality tips.
            </div>
          )}

          {/* Glossary Overrides */}
          {info.glossaryOverrideCount !== undefined && info.glossaryOverrideCount > 0 && (
            <div className="py-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Glossary overrides applied:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {info.glossaryOverrideCount} term{info.glossaryOverrideCount !== 1 ? 's' : ''}
                </span>
              </div>
              {info.glossaryOverrides && info.glossaryOverrides.length > 0 && (
                <div className="mt-1 space-y-1">
                  {info.glossaryOverrides.map((override, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded px-2 py-1"
                      title={`Domain: ${override.domain}`}
                    >
                      <span className="line-through text-gray-400">{override.sourceTerm}</span>
                      <span>{'\u2192'}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{override.overrideTerm}</span>
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
              <span className="text-gray-600 dark:text-gray-400">Processing time:</span>
              <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                {info.processingTimeMs < 1000
                  ? `${info.processingTimeMs}ms`
                  : `${(info.processingTimeMs / 1000).toFixed(1)}s`}
              </span>
            </div>
          )}

          {/* Report Error */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <button className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 underline">
              Report an error
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
