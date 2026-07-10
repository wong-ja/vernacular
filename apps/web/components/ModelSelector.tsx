import { useState, useEffect, useCallback } from 'react';
import {
  MODEL_REGISTRY,
  MODE_PRESETS,
  LANGUAGE_CONFIGS,
  type ModelEntry,
  type ModelMode,
  type ModelTask,
  type LanguageConfig,
} from 'packages/shared/src/model-registry';

interface ModelSelectorProps {
  sourceLang?: string;
  targetLang?: string;
  fileDurationSeconds?: number;
  charCount?: number;
  onModeChange?: (mode: ModelMode) => void;
  onModelOverride?: (overrides: ModelOverrides) => void;
}

export interface ModelOverrides {
  asrModelId?: string;
  translationModelId?: string;
  ttsModelId?: string;
}

const ACCURACY_DOTS: Record<number, string> = {
  3: '\u2B24\u2B24\u2B24 best',
  2: '\u2B24\u2B24\u25CB very good',
  1: '\u2B24\u25CB\u25CB good',
};

const LICENSE_BADGE_OPEN: { bg: string; text: string; icon: string } = {
  bg: 'bg-green-100 dark:bg-green-900/30',
  text: 'text-green-800 dark:text-green-300',
  icon: '\u2713',
};

const LICENSE_BADGE_NC: { bg: string; text: string; icon: string } = {
  bg: 'bg-amber-100 dark:bg-amber-900/30',
  text: 'text-amber-800 dark:text-amber-300',
  icon: '\u26A0\uFE0F',
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
  const badge = isOpen ? LICENSE_BADGE_OPEN : LICENSE_BADGE_NC;
  const label = isOpen ? 'Open license' : 'Non-commercial';
  const tooltip = isOpen
    ? 'MIT or Apache 2.0 \u2014 any use, any product.'
    : 'Non-commercial means this model cannot be used in paid products. Vernacular is free \u2014 this is permitted.';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}
      title={tooltip}
    >
      {badge.icon} {label}
    </span>
  );
}

function WatermarkWarning({ model }: { model: ModelEntry }) {
  const [expanded, setExpanded] = useState(false);
  if (!model.watermarked || !model.watermarkNote) return null;

  return (
    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300"
      >
        <span aria-hidden="true">{'\u26A0\uFE0F'}</span>
        Audio outputs from this model include an imperceptible watermark.
        <span className="text-xs ml-1">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap">
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
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
      >
        {expanded ? 'Hide' : 'Show'} accuracy in real conditions
      </button>
      {expanded && (
        <table className="mt-1 w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-1 pr-2">Condition</th>
              <th className="text-left py-1 pr-2">WER</th>
              <th className="text-left py-1">Notes</th>
            </tr>
          </thead>
          <tbody>
            {werEntries.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-1 pr-2 text-gray-600 dark:text-gray-400">{row.condition}</td>
                <td className="py-1 pr-2 font-mono">{row.wer}</td>
                <td className="py-1 text-gray-500 dark:text-gray-400">{row.notes || ''}</td>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[80vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Choose {taskLabel} Model</h3>
        </div>
        <div className="p-2">
          {models.length === 0 && (
            <p className="p-3 text-sm text-gray-500">No models available for this task and language combination.</p>
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
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{model.name}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{model.developer}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{model.licenseNote}</p>
                {isDisabled && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    Not available \u2014 requires paid API
                  </p>
                )}
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
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
  const [realExpanded, setRealExpanded] = useState(false);
  const model = getModel(modelId);

  if (!model) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-red-500">Model not found: {modelId}</span>
      </div>
    );
  }

  const accuracyLabel = ACCURACY_DOTS[model.accuracyRating] || ACCURACY_DOTS[2];

  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{model.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{model.developer}</span>
            <LicenseBadge {...model} />
          </div>
          {model.watermarked && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {'\u26A0\uFE0F'} Audio outputs include an imperceptible watermark
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span title="Accuracy rating">{accuracyLabel}</span>
            <span title="Parameters">{model.params}</span>
          </div>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          className="ml-3 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors shrink-0"
        >
          Change
        </button>
      </div>

      <a
        href={model.huggingFaceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-1 text-xs text-blue-500 hover:underline"
      >
        Learn more {'\u2197'}
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
      setModelsExpanded(true);
    }
    const storedLic = localStorage.getItem('vernacular-licenses-expanded');
    if (storedLic === null) {
      setLicensesExpanded(true);
    }
  }, []);

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

  const modes: { key: ModelMode; icon: string; label: string }[] = [
    { key: 'fast', icon: '\u26A1', label: 'Fast' },
    { key: 'balanced', icon: '\u2696\uFE0F', label: 'Balanced' },
    { key: 'accurate', icon: '\uD83C\uDFAF', label: 'Accurate' },
    { key: 'rare-language', icon: '\uD83C\uDF0D', label: 'Rare Language' },
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
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === m.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{preset.userFacingDescription}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Estimated speed: {preset.estimatedSpeedPerMinuteAudio}
        </p>
      </div>

      {/* WHAT MODELS WILL BE USED */}
      <div>
        <button
          onClick={() => setModelsExpanded(!modelsExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {modelsExpanded ? '\u25BC' : '\u25B6'} What models will be used?
        </button>
        {modelsExpanded && (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
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
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-800 dark:text-blue-300">
          {langConfig.userNotice}
        </div>
      )}

      {langConfig?.accuracyCaveat && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <p className="text-sm text-amber-800 dark:text-amber-300">{langConfig.accuracyCaveat}</p>
          <button className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400 underline hover:no-underline">
            Contribute to the community glossary {'\u2197'}
          </button>
        </div>
      )}

      {/* INFERENCE BACKEND NOTICE */}
      {mode === 'accurate' && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md text-sm text-indigo-800 dark:text-indigo-300">
          In Accurate mode, WhisperX is used {'\u2014'} it adds speaker detection and precise word timing. This takes longer but improves caption quality.
        </div>
      )}

      {/* PRIVACY CONFIRMATION */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          {'\uD83D\uDD12'} All processing happens on Vernacular&apos;s own servers.
        </p>
        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
          Your audio and text are never sent to Google, Microsoft, OpenAI, AssemblyAI, Deepgram, or any other external service. Files are discarded after processing.
        </p>
      </div>

      {/* ESTIMATED TIME */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Estimated processing time: {estimatedTime}
        </p>
      </div>

      {/* LICENSE SUMMARY */}
      <div>
        <button
          onClick={() => setLicensesExpanded(!licensesExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          {licensesExpanded ? '\u25BC' : '\u25B6'} About model licenses
        </button>
        {licensesExpanded && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>{'\u2713'} Open (MIT / Apache 2.0) {'\u2014'} any use, any product</p>
            <p>{'\u26A0\uFE0F'} Non-commercial (CC-BY-NC / CPML) {'\u2014'} cannot be used in paid products. Vernacular is free and non-commercial {'\u2014'} all models listed are permitted.</p>
            <p>{'\u26A0\uFE0F'} Watermarked models {'\u2014'} add invisible tags to audio output. See individual model details for specifics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
