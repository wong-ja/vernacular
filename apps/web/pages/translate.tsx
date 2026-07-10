import { useState } from 'react';
import type { TranslationResult, ModelMode, ModelOverrides } from '@vernacular/shared';
import ModelSelector from '../components/ModelSelector';
import ResultTransparencyFooter from '../components/ResultTransparencyFooter';
import LanguageSelector from '../components/LanguageSelector';
import Button from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

const DOMAIN_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'medical', label: 'Medical' },
  { value: 'legal', label: 'Legal' },
  { value: 'education', label: 'Education' },
  { value: 'civic', label: 'Civic' },
];

function confidenceConfig(score: number | null | undefined): { label: string; variant: 'high-confidence' | 'medium-confidence' | 'low-confidence'; message: string; dots: string } {
  if (score === null || score === undefined) return { label: 'No score', variant: 'medium-confidence', message: '', dots: '\u2B24\u2B24\u25CB' };
  if (score >= 0.85) return { label: 'High confidence', variant: 'high-confidence', message: '', dots: '\u2B24\u2B24\u2B24' };
  if (score >= 0.7) return { label: 'Medium confidence', variant: 'medium-confidence', message: '', dots: '\u2B24\u2B24\u25CB' };
  return { label: 'Low confidence', variant: 'low-confidence', message: 'Low confidence \u2014 consider having this reviewed by a fluent speaker.', dots: '\u2B24\u25CB\u25CB' };
}

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('eng_Latn');
  const [targetLang, setTargetLang] = useState('spa_Latn');
  const [domain, setDomain] = useState('general');
  const [mode, setMode] = useState<ModelMode>('balanced');
  const [modelOverrides, setModelOverrides] = useState<ModelOverrides>({});
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleTranslate() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang, targetLang, domain, mode, modelOverrides }),
      });
      const json = await res.json();
      if (json.status === 'ok') {
        setResult(json.data);
      } else {
        setError(json.message || 'Translation failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function flipLanguages() {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result.translation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vernacular-${sourceLang}-${targetLang}-translation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Input */}
        <div className="space-y-4">
          <LanguageSelector value={sourceLang} onChange={setSourceLang} label="Source language" />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type text to translate..."
            rows={8}
          />
          <div className="flex items-center justify-between text-sm text-text-tertiary">
            <span>{text.length} / 5,000 characters</span>
            {text.length > 0 && (
              <button onClick={() => setText('')} className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right — Output */}
        <div className="space-y-4">
          <LanguageSelector value={targetLang} onChange={setTargetLang} label="Target language" />

          <div className="min-h-[280px] bg-surface-1 border border-border rounded-lg p-6">
            {loading && (
              <div className="space-y-3">
                <Skeleton lines={4} />
                <p className="text-xs text-text-tertiary mt-2">Translating with NLLB-200 3.3B...</p>
              </div>
            )}

            {!loading && !result && !error && (
              <div className="h-full flex items-center justify-center">
                <p className="text-text-tertiary text-sm">Translation will appear here.</p>
              </div>
            )}

            {error && (
              <div className="space-y-3">
                <div className="p-4 bg-error-bg border border-error rounded-md text-sm text-error-text">
                  {error}
                </div>
                <Button variant="secondary" size="sm" onClick={handleTranslate}>Try again</Button>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                <p className="text-base text-text-primary whitespace-pre-wrap leading-relaxed">
                  {result.translation}
                </p>

                {result.glossaryOverrides.length > 0 && (
                  <div>
                    <button
                      className="text-xs text-accent hover:underline cursor-pointer"
                      onClick={() => {
                        const el = document.getElementById('glossary-detail-' + sourceLang);
                        if (el) el.classList.toggle('hidden');
                      }}
                    >
                      {result.glossaryOverrides.length} community term{result.glossaryOverrides.length > 1 ? 's' : ''} applied {'\u2193'}
                    </button>
                    <div id={`glossary-detail-${sourceLang}`} className="hidden mt-2 space-y-1">
                      {result.glossaryOverrides.map((o, i) => (
                        <div key={i} className="text-xs text-text-secondary flex items-center gap-2 bg-surface-2 rounded px-2 py-1">
                          <span className="line-through text-text-tertiary">{o.baseModelTerm}</span>
                          <span>{'\u2192'}</span>
                          <span className="font-medium text-text-primary">{o.overrideTerm}</span>
                          <span className="text-text-tertiary ml-auto">({o.domain})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Badge variant={confidenceConfig(result.confidence).variant}>
                    {confidenceConfig(result.confidence).dots} {confidenceConfig(result.confidence).label}
                  </Badge>
                </div>

                {result.confidence !== null && result.confidence < 0.7 && (
                  <p className="text-xs text-warning-text">
                    Low confidence \u2014 consider having this reviewed by a fluent speaker.
                  </p>
                )}
              </div>
            )}
          </div>

          {result && (
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? 'Copied \u2713' : 'Copy'}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                Download .txt
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Domain + Model Selector */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="bg-surface-2 border border-border rounded-md px-[14px] py-[10px] text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
          >
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <ModelSelector
          sourceLang={sourceLang}
          targetLang={targetLang}
          charCount={text.length}
          onModeChange={(m) => setMode(m)}
          onModelOverride={(o) => setModelOverrides(o)}
        />
      </div>

      {/* Translate Button */}
      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleTranslate}
          disabled={loading || !text.trim()}
          loading={loading}
          size="lg"
        >
          {loading ? 'Translating...' : 'Translate'}
        </Button>
      </div>

      {/* Transparency Footer */}
      {result && (
        <ResultTransparencyFooter
          info={{
            translationModelId: result.translationModelId || result.modelUsed,
            overallConfidence: result.confidence ?? undefined,
            glossaryOverrideCount: result.glossaryOverrides.length,
            glossaryOverrides: result.glossaryOverrides.map((o) => ({
              sourceTerm: o.sourceTerm,
              overrideTerm: o.overrideTerm,
              domain: o.domain,
            })),
            processingTimeMs: result.processingTimeMs,
          }}
        />
      )}

      {/* Persistent notice */}
      <p className="mt-8 text-xs text-text-tertiary text-center">
        Translation is generated by AI. For high-stakes content \u2014 medical, legal, or official
        documents \u2014 have results reviewed by a fluent speaker.
      </p>
    </div>
  );
}
