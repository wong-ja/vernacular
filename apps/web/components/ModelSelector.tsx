import { useState, useEffect, useCallback } from 'react';
import {
  MODEL_REGISTRY,
  MODE_PRESETS,
  LANGUAGE_CONFIGS,
  type ModelEntry,
  type ModelMode,
  type ModelTask,
  type LanguageConfig,
  type ModelOverrides,
} from '@vernacular/shared';

interface ModelSelectorProps {
  sourceLang?: string;
  targetLang?: string;
  fileDurationSeconds?: number;
  charCount?: number;
  onModeChange?: (mode: ModelMode) => void;
  onModelOverride?: (overrides: ModelOverrides) => void;
  defaultCollapsed?: boolean;
}

const ACCURACY_DOTS: Record<number, string> = {
  3: '\u2B24\u2B24\u2B24 best',
  2: '\u2B24\u2B24\u25CB very good',
  1: '\u2B24\u25CB\u25CB good',
};

function getLanguageConfig(code: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS.find((c) => c.code === code);
}

function getModel(id: string): ModelEntry | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}

function getModelsForTask(task: ModelTask, langCode?: string): ModelEntry[] {
  return MODEL_REGISTRY.filter((m) => {
    if (m.task !== task) return false;
    if (langCode) {
      return (
        m.languageCodes.includes(langCode) ||
        m.languageCodes.includes('all-200-nllb-languages') ||
        m.languageCodes.includes('plus-1100-more') ||
        m.languageCodes.includes('plus-95-more') ||
        m.languageCodes.includes('plus-50-more')
      );
    }
    return true;
  });
}

function estimateProcessingTime(
  mode: ModelMode,
  fileDurationSeconds?: number,
  charCount?: number
): string {
  const preset = MODE_PRESETS[mode];
  if (fileDurationSeconds && fileDurationSeconds > 0) {
    const minutes = fileDurationSeconds / 60;
    const estimate = preset.estimatedSpeedPerMinuteAudio;
    const match = estimate.match(/(\d+)\u2013(\d+)/);
    if (match) {
      const low = parseInt(match[1], 10) * minutes;
      const high = parseInt(match[2], 10) * minutes;
      if (low < 5) return `~${Math.round(low)} seconds`;
      return `~${Math.round(low)}\u2013${Math.round(high)} seconds`;
    }
    if (estimate.includes('Under')) {
      const num = parseInt(estimate.replace(/\D/g, ''), 10);
      return `~${Math.round(num * minutes)} seconds`;
    }
    return estimate;
  }
  if (charCount && charCount > 0) {
    const words = charCount / 5;
    const secs = words * 0.5;
    if (secs < 10) return `~${Math.round(secs)} seconds`;
    return `~${Math.round(secs / 10) * 10} seconds`;
  }
  return preset.estimatedSpeedPerMinuteAudio;
}

function LicenseBadge({ license, licensePermission, licenseNote }: ModelEntry) {
  const isOpen = licensePermission === 'open';
  const label = isOpen ? 'Open license' : 'Non-commercial';
  const tooltip = isOpen
    ? 'MIT or Apache 2.0 \u2014 any use, any product.'
    : 'Non-commercial means this model cannot be used in paid products. Vernacular is free \u2014 this is permitted.';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        isOpen ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text'
      }`}
      title={tooltip}
    >
      {isOpen ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      )} {label}
    </span>
  );
}

function WatermarkWarning({ model }: { model: ModelEntry }) {
  const [expanded, setExpanded] = useState(false);
  if (!model.watermarked || !model.watermarkNote) return null;

  return (
    <div className="mt-2 p-3 bg-warning-bg border border-warning rounded-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-warning-text"
      >
        <span aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        Audio outputs from this model include an imperceptible watermark.
        <span className="text-xs ml-1">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      {expanded && (
        <p className="mt-2 text-sm text-warning-text whitespace-pre-wrap">
          {model.watermarkNote}
        </p>
      )}
    </div>
  );
}

function AccuracyInRealConditions({ werEntries }: { werEntries: NonNullable<ModelEntry['realWorldWER']> }) {
  const [expanded, setExpanded] = useState(false);
  if (!werEntries.length) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-text-secondary hover:text-text-primary underline cursor-pointer"
      >
        {expanded ? 'Hide' : 'Show'} accuracy in real conditions
      </button>
      {expanded && (
        <table className="mt-1 w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 pr-2 text-text-secondary font-medium">Condition</th>
              <th className="text-left py-1 pr-2 text-text-secondary font-medium">WER</th>
              <th className="text-left py-1 text-text-secondary font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {werEntries.map((row, i) => (
              <tr key={i} className="border-b border-border-subtle">
                <td className="py-1 pr-2 text-text-secondary">{row.condition}</td>
                <td className="py-1 pr-2 font-mono text-text-primary">{row.wer}</td>
                <td className="py-1 text-text-tertiary">{row.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ModelPicker({
  task,
  langCode,
  currentModelId,
  onSelect,
  onClose,
}: {
  task: ModelTask;
  langCode?: string;
  currentModelId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const models = getModelsForTask(task, langCode);
  const taskLabel = task === 'asr' ? 'Transcription' : task === 'translation' ? 'Translation' : 'Voice output';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-surface-1 rounded-lg shadow-lg border border-border w-full max-w-lg max-h-[80vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Choose {taskLabel} Model</h3>
        </div>
        <div className="p-2">
          {models.length === 0 && (
            <p className="p-3 text-sm text-text-tertiary">No models available for this task and language combination.</p>
          )}
          {models.map((model) => {
            const isCurrent = model.id === currentModelId;
            const isDisabled = model.paidPhaseOnly;

            return (
              <button
                key={model.id}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    onSelect(model.id);
                    onClose();
                  }
                }}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  isCurrent
                    ? 'bg-accent-subtle border border-accent'
                    : 'hover:bg-surface-2'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-text-primary">{model.name}</span>
                    <span className="ml-2 text-xs text-text-tertiary">{model.developer}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-xs bg-accent-subtle text-accent px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">{model.licenseNote}</p>
                {isDisabled && (
                  <p className="text-xs text-warning-text mt-1 font-medium">
                    Not available \u2014 requires paid API
                  </p>
                )}
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-surface-2 text-text-primary rounded-md hover:bg-surface-3 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ModelRow({
  label,
  task,
  modelId,
  langCode,
  onOverride,
}: {
  label: string;
  task: ModelTask;
  modelId: string;
  langCode?: string;
  onOverride: (task: ModelTask, modelId: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const model = getModel(modelId);

  if (!model) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-error-text">Model not found: {modelId}</span>
      </div>
    );
  }

  const accuracyLabel = ACCURACY_DOTS[model.accuracyRating] || ACCURACY_DOTS[2];

  return (
    <div className="py-3 border-b border-border-subtle last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-text-primary">{model.name}</span>
            <span className="text-xs text-text-tertiary">{model.developer}</span>
            <LicenseBadge {...model} />
          </div>
          {model.watermarked && (
            <p className="text-xs text-warning-text mt-1 inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Audio outputs include an imperceptible watermark
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
            <span title="Accuracy rating">{accuracyLabel}</span>
            <span title="Parameters">{model.params}</span>
          </div>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          className="ml-3 px-2.5 py-1 text-xs font-medium text-info-text hover:bg-accent-subtle rounded transition-colors shrink-0 cursor-pointer"
        >
          Change
        </button>
      </div>

      <a
        href={model.huggingFaceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-1 text-xs text-info-text hover:underline"
      >
        Learn more
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>

      <WatermarkWarning model={model} />
      <AccuracyInRealConditions werEntries={model.realWorldWER || []} />

      {pickerOpen && (
        <ModelPicker
          task={task}
          langCode={langCode}
          currentModelId={modelId}
          onSelect={(id) => onOverride(task, id)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default function ModelSelector({
  sourceLang,
  targetLang,
  fileDurationSeconds,
  charCount,
  onModeChange,
  onModelOverride,
  defaultCollapsed = false,
}: ModelSelectorProps) {
  const [mode, setMode] = useState<ModelMode>('balanced');
  const [modelsExpanded, setModelsExpanded] = useState<boolean>(false);
  const [licensesExpanded, setLicensesExpanded] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<ModelOverrides>({});

  const langCode = targetLang || sourceLang;
  const langConfig = langCode ? getLanguageConfig(langCode) : undefined;

  const asrModelId = overrides.asrModelId || (langConfig?.defaultAsrModelId ?? MODE_PRESETS[mode].asrModelId);
  const translationModelId = overrides.translationModelId || (langConfig?.defaultTranslationModelId ?? MODE_PRESETS[mode].translationModelId);
  const ttsModelId = overrides.ttsModelId || (langConfig?.defaultTtsModelId ?? MODE_PRESETS[mode].ttsModelId);

  useEffect(() => {
    const stored = localStorage.getItem('vernacular-models-expanded');
    if (stored === null) {
      setModelsExpanded(!defaultCollapsed);
    }
    const storedLic = localStorage.getItem('vernacular-licenses-expanded');
    if (storedLic === null) {
      setLicensesExpanded(!defaultCollapsed);
    }
  }, [defaultCollapsed]);

  useEffect(() => {
    localStorage.setItem('vernacular-models-expanded', String(modelsExpanded));
  }, [modelsExpanded]);

  useEffect(() => {
    localStorage.setItem('vernacular-licenses-expanded', String(licensesExpanded));
  }, [licensesExpanded]);

  const handleModeChange = useCallback(
    (newMode: ModelMode) => {
      setMode(newMode);
      setOverrides({});
      onModeChange?.(newMode);
    },
    [onModeChange]
  );

  const handleOverride = useCallback(
    (task: ModelTask, modelId: string) => {
      const upd: ModelOverrides = { ...overrides };
      if (task === 'asr') upd.asrModelId = modelId;
      else if (task === 'translation') upd.translationModelId = modelId;
      else if (task === 'tts') upd.ttsModelId = modelId;
      setOverrides(upd);
      onModelOverride?.(upd);
    },
    [overrides, onModelOverride]
  );

  const preset = MODE_PRESETS[mode];
  const estimatedTime = estimateProcessingTime(mode, fileDurationSeconds, charCount);

  const modes: { key: ModelMode; icon: React.ReactNode; label: string }[] = [
    { key: 'fast', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ), label: 'Fast' },
    { key: 'balanced', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="3" x2="12" y2="20"/>
        <path d="M3 9l4 4 4-4M17 9l4 4-4 4"/>
        <line x1="3" y1="20" x2="21" y2="20"/>
      </svg>
    ), label: 'Balanced' },
    { key: 'accurate', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ), label: 'Accurate' },
    { key: 'rare-language', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ), label: 'Rare Language' },
  ];

  return (
    <div className="space-y-5">
      {/* MODE TOGGLE BAR */}
      <div>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => handleModeChange(m.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                mode === m.key
                  ? 'bg-accent-subtle border border-accent text-accent'
                  : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-text-secondary">{preset.userFacingDescription}</p>
        <p className="text-xs text-text-tertiary mt-1">
          Estimated speed: {preset.estimatedSpeedPerMinuteAudio}
        </p>
      </div>

      {/* WHAT MODELS WILL BE USED */}
      <div>
        <button
          onClick={() => setModelsExpanded(!modelsExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-accent transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${modelsExpanded ? '' : '-rotate-90'}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          What models will be used?
        </button>
        {modelsExpanded && (
          <div className="mt-2 p-4 bg-surface-2 rounded-lg border border-border">
            <ModelRow
              label="Transcription"
              task="asr"
              modelId={asrModelId}
              langCode={langCode}
              onOverride={handleOverride}
            />
            <ModelRow
              label="Translation"
              task="translation"
              modelId={translationModelId}
              langCode={langCode}
              onOverride={handleOverride}
            />
            <ModelRow
              label="Voice output"
              task="tts"
              modelId={ttsModelId}
              langCode={langCode}
              onOverride={handleOverride}
            />
          </div>
        )}
      </div>

      {/* PER-LANGUAGE NOTICE */}
      {langConfig?.userNotice && (
        <div className="p-3 bg-info-bg border border-info rounded-md text-sm text-info-text">
          {langConfig.userNotice}
        </div>
      )}

      {langConfig?.accuracyCaveat && (
        <div className="p-3 bg-warning-bg border border-warning rounded-md">
          <p className="text-sm text-warning-text">{langConfig.accuracyCaveat}</p>
          <button className="mt-2 text-xs font-medium text-warning-text underline hover:no-underline cursor-pointer inline-flex items-center gap-0.5">
            Contribute to the community glossary
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      )}

      {/* INFERENCE BACKEND NOTICE */}
      {mode === 'accurate' && (
        <div className="p-3 bg-accent-subtle border border-accent rounded-md text-sm text-accent">
          In Accurate mode, WhisperX is used {'\u2014'} it adds speaker detection and precise word timing. This takes longer but improves caption quality.
        </div>
      )}

      {/* PRIVACY CONFIRMATION */}
      <div className="p-4 bg-success-bg border border-success rounded-md">
        <p className="text-sm font-medium text-success-text inline-flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          All processing happens on Vernacular&apos;s own servers.
        </p>
        <p className="text-sm text-success-text mt-1">
          Your audio and text are never sent to Google, Microsoft, OpenAI, AssemblyAI, Deepgram, or any other external service. Files are discarded after processing.
        </p>
      </div>

      {/* ESTIMATED TIME */}
      <div>
        <p className="text-sm text-text-secondary">
          Estimated processing time: {estimatedTime}
        </p>
      </div>

      {/* LICENSE SUMMARY */}
      <div>
        <button
          onClick={() => setLicensesExpanded(!licensesExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${licensesExpanded ? '' : '-rotate-90'}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          About model licenses
        </button>
        {licensesExpanded && (
          <div className="mt-2 p-3 bg-surface-2 rounded-md text-xs text-text-secondary space-y-1">
            <p className="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Open (MIT / Apache 2.0) {'\u2014'} any use, any product
            </p>
            <p className="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Non-commercial (CC-BY-NC / CPML) {'\u2014'} cannot be used in paid products. Vernacular is free and non-commercial {'\u2014'} all models listed are permitted.
            </p>
            <p className="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Watermarked models {'\u2014'} add invisible tags to audio output. See individual model details for specifics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
