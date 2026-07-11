import { useState, useEffect, useCallback } from 'react';
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

const CONF = {
  high: { label: 'High confidence', variant: 'high-confidence' as const },
  medium: { label: 'Medium confidence', variant: 'medium-confidence' as const },
  low: { label: 'Low confidence', variant: 'low-confidence' as const },
};

function conf(score: number | null | undefined) {
  if (score == null) return null;
  if (score >= 0.85) return CONF.high;
  if (score >= 0.7) return CONF.medium;
  return CONF.low;
}

const LS_PAIR = 'vernacular-lang-pair';
const LS_REV = 'vernacular-reverse';

function loadPair(): [string, string] {
  if (typeof window === 'undefined') return ['eng_Latn', 'spa_Latn'];
  try {
    const p = JSON.parse(localStorage.getItem(LS_PAIR) || 'null') as unknown;
    if (Array.isArray(p) && p.length === 2 && typeof p[0] === 'string' && typeof p[1] === 'string') return p as [string, string];
  } catch { /* */ }
  return ['eng_Latn', 'spa_Latn'];
}

function loadRev(): boolean {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem(LS_REV) === 'true'; } catch { return false; }
}

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [[srcLang, tgtLang], setPair] = useState<[string, string]>(loadPair);
  const [domain, setDomain] = useState('general');
  const [mode, setMode] = useState<ModelMode>('balanced');
  const [overrides, setOverrides] = useState<ModelOverrides>({});
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revOn, setRevOn] = useState(loadRev);
  const [revResult, setRevResult] = useState<string | null>(null);
  const [revLoading, setRevLoading] = useState(false);
  const [revError, setRevError] = useState('');
  const [revCopied, setRevCopied] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(LS_PAIR, JSON.stringify([srcLang, tgtLang])); } catch { /* */ }
  }, [srcLang, tgtLang]);
  useEffect(() => {
    try { localStorage.setItem(LS_REV, String(revOn)); } catch { /* */ }
  }, [revOn]);

  const doTranslate = useCallback(async (s: string, t: string, txt: string): Promise<TranslationResult> => {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: txt, sourceLang: s, targetLang: t, domain, mode, modelOverrides: overrides }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      try { throw new Error(JSON.parse(body).message || body || res.statusText); }
      catch (e) { if (e instanceof SyntaxError) throw new Error(body || res.statusText); throw e; }
    }
    const json = await res.json();
    if (json.status !== 'ok') throw new Error(json.message || 'Translation failed');
    return json.data as TranslationResult;
  }, [domain, mode, overrides]);

  async function handleTranslate() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setRevResult(null);
    setRevError('');
    setRevLoading(false);
    try {
      const data = await doTranslate(srcLang, tgtLang, text);
      setResult(data);
      if (revOn && data.translation) {
        setRevLoading(true);
        doTranslate(tgtLang, srcLang, data.translation)
          .then((r) => { setRevResult(r.translation); setRevLoading(false); })
          .catch((e) => { setRevError(e instanceof Error ? e.message : 'Reverse failed'); setRevLoading(false); });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function flip() {
    setPair([tgtLang, srcLang]);
    setResult(null);
    setError('');
    setRevResult(null);
    setRevError('');
  }

  const copy = useCallback(async (txt: string, set: (v: boolean) => void) => {
    try { await navigator.clipboard.writeText(txt); set(true); setTimeout(() => set(false), 2000); } catch { /* */ }
  }, []);

  const c = result ? conf(result.confidence) : null;
  const lowConf = c === CONF.low;

  return (
    <div className="max-w-container mx-auto px-6 py-10 space-y-6">

      {/* Language selection card */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-52">
            <LanguageSelector value={srcLang} onChange={(v) => { setPair([v, tgtLang]); setResult(null); setError(''); }} label="Source" />
          </div>
          <button
            onClick={flip}
            className="shrink-0 mb-0.5 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-surface-2 hover:bg-accent-subtle hover:border-accent transition-colors cursor-pointer text-text-secondary hover:text-accent"
            title="Swap languages"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16l-4-4 4-4" /><path d="M3 12h18" /><path d="M17 8l4 4-4 4" />
            </svg>
          </button>
          <div className="w-52">
            <LanguageSelector value={tgtLang} onChange={(v) => { setPair([srcLang, v]); setResult(null); setError(''); }} label="Target" />
          </div>
          <label className="flex items-center gap-1.5 shrink-0 mb-0.5 h-10 px-3 rounded-lg border border-border bg-surface-2 cursor-pointer select-none hover:border-accent transition-colors text-sm text-text-secondary">
            <input type="checkbox" checked={revOn} onChange={(e) => setRevOn(e.target.checked)} className="accent-accent w-3.5 h-3.5" />
            Reverse
          </label>
        </div>
      </div>

      {/* I/O columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Source text</h2>
            <span className="text-xs text-text-tertiary">{text.length} / 5,000</span>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type text to translate..."
            rows={8}
            className="min-h-[240px] border-0 bg-surface-2 rounded-lg resize-y"
          />
          {text.length > 0 && (
            <button onClick={() => setText('')} className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              Clear text
            </button>
          )}
        </div>

        {/* Output */}
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Translation</h2>
            {result && !loading && (
              <span className="text-xs text-text-tertiary font-mono">
                {result.processingTimeMs != null && (result.processingTimeMs < 1000 ? `${result.processingTimeMs}ms` : `${(result.processingTimeMs / 1000).toFixed(1)}s`)}
              </span>
            )}
          </div>

          <div className="min-h-[240px] flex flex-col">
            {loading && (
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <Skeleton lines={4} />
                <p className="text-xs text-text-tertiary">Translating with NLLB-200...</p>
              </div>
            )}

            {!loading && !result && !error && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-text-tertiary text-sm">Translation will appear here.</p>
              </div>
            )}

            {error && (
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)', border: '1px solid var(--color-error)' }}>
                  {error}
                </div>
                <div><Button variant="secondary" size="sm" onClick={handleTranslate}>Try again</Button></div>
              </div>
            )}

            {result && !loading && (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <p className="text-base text-text-primary whitespace-pre-wrap leading-relaxed">
                  {result.translation}
                </p>

                <div className="flex items-center gap-2 pt-3 border-t border-border-subtle flex-wrap">
                  <button
                    onClick={() => copy(result.translation, setCopied)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-2 hover:bg-accent-subtle rounded-md px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Copied</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy</>
                    )}
                  </button>
                  <button onClick={() => {
                    const blob = new Blob([result.translation], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `vernacular-${srcLang}-${tgtLang}.txt`; a.click();
                    URL.revokeObjectURL(url);
                  }} className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-2 hover:bg-accent-subtle rounded-md px-3 py-1.5 transition-colors cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Download
                  </button>
                  {c && <Badge variant={c.variant}>{c.label}</Badge>}
                </div>
                {lowConf && <p className="text-xs text-warning-text">Low confidence &mdash; consider having this reviewed by a fluent speaker.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Glossary */}
      {result && result.glossaryOverrides.length > 0 && (
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <details className="text-sm">
            <summary className="text-text-secondary hover:text-text-primary cursor-pointer font-medium">
              {result.glossaryOverrides.length} community term{result.glossaryOverrides.length > 1 ? 's' : ''} applied
            </summary>
            <div className="mt-3 space-y-1">
              {result.glossaryOverrides.map((o, i) => (
                <div key={i} className="text-xs text-text-secondary flex items-center gap-2 bg-surface-2 rounded-md px-3 py-1.5">
                  <span className="line-through text-text-tertiary">{o.baseModelTerm}</span>
                  <span>&rarr;</span>
                  <span className="font-medium text-text-primary">{o.overrideTerm}</span>
                  <span className="text-text-tertiary ml-auto">({o.domain})</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Reverse */}
      {revOn && (revResult || revLoading || revError) && (
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Reverse translation <span className="text-text-tertiary font-normal">({tgtLang} &rarr; {srcLang})</span>
          </h3>
          {revLoading && <div className="space-y-2"><Skeleton lines={2} /><p className="text-xs text-text-tertiary">Translating back...</p></div>}
          {revError && <p className="text-sm" style={{ color: 'var(--color-error-text)' }}>{revError}</p>}
          {revResult && !revLoading && (
            <>
              <p className="text-base text-text-primary whitespace-pre-wrap leading-relaxed">{revResult}</p>
              <button onClick={() => copy(revResult, setRevCopied)} className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-2 hover:bg-accent-subtle rounded-md px-3 py-1.5 transition-colors cursor-pointer">
                {revCopied ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Copied</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* Domain + Model */}
      <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Domain</label>
            <select value={domain} onChange={(e) => setDomain(e.target.value)}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            >
              {DOMAIN_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        <ModelSelector sourceLang={srcLang} targetLang={tgtLang} charCount={text.length}
          onModeChange={(m) => setMode(m)} onModelOverride={(o) => setOverrides(o)} />
      </div>

      {/* Translate */}
      <div className="flex justify-center">
        <Button onClick={handleTranslate} disabled={loading || !text.trim()} loading={loading} size="lg">
          {loading ? 'Translating...' : 'Translate'}
        </Button>
      </div>

      {result && (
        <ResultTransparencyFooter info={{
          translationModelId: result.translationModelId || result.modelUsed,
          overallConfidence: result.confidence ?? undefined,
          glossaryOverrideCount: result.glossaryOverrides.length,
          glossaryOverrides: result.glossaryOverrides.map((o) => ({ sourceTerm: o.sourceTerm, overrideTerm: o.overrideTerm, domain: o.domain })),
          processingTimeMs: result.processingTimeMs,
        }} />
      )}

      <p className="text-xs text-text-tertiary text-center">
        Translation is generated by AI. For high-stakes content &mdash; medical, legal, or official
        documents &mdash; have results reviewed by a fluent speaker.
      </p>
    </div>
  );
}
