import { useState, useEffect, useCallback } from 'react';
import type { TranslationResult, ModelMode, ModelOverrides, SessionEntry } from '@vernacular/shared';
import { MODE_PRESETS } from '@vernacular/shared';
import ResultTransparencyFooter from '../components/ResultTransparencyFooter';
import LanguageSelector from '../components/LanguageSelector';
import HistoryPanel from '../components/HistoryPanel';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { useSessionHistory } from '../hooks/useSessionHistory';

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
  const { history, addEntry, clear } = useSessionHistory('translate');
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [modelSwitchNotice, setModelSwitchNotice] = useState<string | null>(null);

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
      addEntry({
        type: 'translation',
        sourceLang: srcLang,
        targetLang: tgtLang,
        domain,
        sourceText: text,
        translatedText: data.translation,
        modelUsed: {
          translation: data.translationModelId || data.modelUsed,
          mode,
        },
        confidence: data.confidence ?? 0,
        glossaryOverrides: data.glossaryOverrides,
      });
      if (modelSwitchNotice) setModelSwitchNotice(null);
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

  function handleModeChange(newMode: ModelMode) {
    if (result && newMode !== mode) {
      setModelSwitchNotice(`Switching to ${newMode === 'fast' ? 'Fast' : newMode === 'balanced' ? 'Balanced' : newMode === 'accurate' ? 'Accurate' : 'Rare Language'} mode. Previous translations used ${mode === 'fast' ? 'Fast' : mode === 'balanced' ? 'Balanced' : mode === 'accurate' ? 'Accurate' : 'Rare Language'} mode and will remain in history.`);
    }
    setMode(newMode);
    setOverrides({});
  }

  function loadHistoryEntry(entry: SessionEntry) {
    setText(entry.sourceText);
    setPair([entry.sourceLang as 'eng_Latn' | 'spa_Latn', entry.targetLang as 'eng_Latn' | 'spa_Latn']);
    setResult({
      translation: entry.translatedText,
      sourceLang: entry.sourceLang,
      targetLang: entry.targetLang,
      confidence: entry.confidence,
      glossaryOverrides: entry.glossaryOverrides,
      modelUsed: entry.modelUsed.translation || entry.modelUsed.mode,
      needsReview: false,
    });
    setError('');
  }

  const copy = useCallback(async (txt: string, set: (v: boolean) => void) => {
    try { await navigator.clipboard.writeText(txt); set(true); setTimeout(() => set(false), 2000); } catch { /* */ }
  }, []);

  const c = result ? conf(result.confidence) : null;
  const lowConf = c === CONF.low;

  return (
    <div className="max-w-container mx-auto px-4 py-6">
      <div className="flex gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Row 1: Language selector + mode toggle */}
          <div className="bg-surface-1 border border-border rounded-xl shadow-xs p-4">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex items-end gap-2 flex-wrap shrink-0">
                <div className="w-44">
                  <LanguageSelector value={srcLang} onChange={(v) => { setPair([v, tgtLang]); setResult(null); setError(''); }} label="Source" />
                </div>
                <button
                  onClick={flip}
                  className="shrink-0 mb-0.5 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-surface-2 hover:bg-surface-3 hover:border-border-strong transition-all active:scale-[0.96] cursor-pointer text-text-secondary"
                  aria-label="Swap languages"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
                    <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
                  </svg>
                </button>
                <div className="w-44">
                  <LanguageSelector value={tgtLang} onChange={(v) => { setPair([srcLang, v]); setResult(null); setError(''); }} label="Target" />
                </div>
                <label className="flex items-center gap-1.5 shrink-0 mb-0.5 h-10 px-3 rounded-lg border border-border bg-surface-2 cursor-pointer select-none hover:border-accent transition-colors text-sm text-text-secondary">
                  <input type="checkbox" checked={revOn} onChange={(e) => setRevOn(e.target.checked)} className="accent-accent w-3.5 h-3.5" />
                  Reverse
                </label>
              </div>

              <div className="flex-1 min-w-0 lg:border-l lg:border-border lg:pl-4">
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { key: 'fast' as const, label: 'Fast', icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    )},
                    { key: 'balanced' as const, label: 'Balanced', icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="12" y1="3" x2="12" y2="20"/>
                        <path d="M3 9l4 4 4-4M17 9l4 4-4 4"/>
                        <line x1="3" y1="20" x2="21" y2="20"/>
                      </svg>
                    )},
                    { key: 'accurate' as const, label: 'Accurate', icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="6"/>
                        <circle cx="12" cy="12" r="2"/>
                      </svg>
                    )},
                    { key: 'rare-language' as const, label: 'Rare', icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    )},
                  ]).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => handleModeChange(m.key)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
                        mode === m.key
                          ? 'bg-accent-subtle border border-accent text-accent'
                          : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary border border-transparent'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                  {MODE_PRESETS[mode].userFacingDescription}
                  <span className="text-text-tertiary ml-1">&middot; {MODE_PRESETS[mode].estimatedSpeedPerMinuteAudio}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Model switch notice */}
          {modelSwitchNotice && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)', color: 'var(--color-info-text)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span className="flex-1">{modelSwitchNotice}</span>
              <button onClick={() => setModelSwitchNotice(null)} className="text-info-text/60 hover:text-info-text cursor-pointer">&times;</button>
            </div>
          )}

          {/* Row 2: I/O card */}
          <div className="bg-surface-1 border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-widest">Source text</span>
                  <span className="text-xs text-text-tertiary">{text.length} / 5,000</span>
                </div>
                <div className="flex-1 p-0">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste text..."
                    className="w-full min-h-[240px] h-full p-4 bg-surface-2 text-base text-text-primary placeholder-text-tertiary resize-none border-none outline-none focus:outline-none leading-relaxed font-sans"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div>
                    {text.length > 0 && (
                      <button onClick={() => setText('')} className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden lg:block w-px bg-border" />

              <div className="flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-widest">Translation</span>
                  {result?.processingTimeMs != null && !loading && (
                    <span className="text-xs text-text-tertiary lowercase">
                      {result.processingTimeMs < 1000 ? `${result.processingTimeMs}ms` : `${(result.processingTimeMs / 1000).toFixed(1)}s`}
                    </span>
                  )}
                </div>
                <div className="flex-1 p-4 bg-surface-2 min-h-[240px]">
                  {loading && (
                    <div className="space-y-3">
                      <Skeleton lines={4} />
                      <p className="text-xs text-text-tertiary">Translating with NLLB-200...</p>
                    </div>
                  )}

                  {!loading && !result && !error && (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-text-secondary text-sm italic">Translation will appear here.</p>
                    </div>
                  )}

                  {error && (
                    <div className="flex flex-col justify-center h-full space-y-3">
                      <p className="text-sm" style={{ color: 'var(--color-error-text)' }}>{error}</p>
                      <div><Button variant="secondary" size="sm" onClick={handleTranslate}>Retry</Button></div>
                    </div>
                  )}

                  {result && !loading && (
                    <div className="flex flex-col h-full">
                      <p className="text-base text-text-primary whitespace-pre-wrap leading-relaxed flex-1">
                        {result.translation}
                      </p>
                      <div className="flex items-center gap-2 pt-3 mt-auto border-t border-border-subtle">
                        <button
                          onClick={() => copy(result.translation, setCopied)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-accent transition-colors cursor-pointer"
                        >
                          {copied ? (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Copied</>
                          ) : (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy</>
                          )}
                        </button>
                        <button onClick={() => {
                          const blob = new Blob([result.translation], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = `vernacular-${srcLang}-${tgtLang}.txt`; a.click();
                          URL.revokeObjectURL(url);
                        }} className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-accent transition-colors cursor-pointer">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          .txt
                        </button>
                        {c && <Badge variant={c.variant}>{c.label}</Badge>}
                        {lowConf && <span className="text-xs text-warning-text ml-auto">Low confidence</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reverse */}
          {revOn && (revResult || revLoading || revError) && (
            <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Reverse &middot; {tgtLang} &rarr; {srcLang}
              </span>
              {revLoading && <div className="space-y-2"><Skeleton lines={2} /><p className="text-xs text-text-tertiary">Translating back...</p></div>}
              {revError && <p className="text-sm" style={{ color: 'var(--color-error-text)' }}>{revError}</p>}
              {revResult && !revLoading && (
                <>
                  <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{revResult}</p>
                  <button onClick={() => copy(revResult, setRevCopied)} className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-accent transition-colors cursor-pointer">
                    {revCopied ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Copied</> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy</>}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Row 3: Domain + Translate */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <select value={domain} onChange={(e) => setDomain(e.target.value)}
                className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors h-9"
              >
                {DOMAIN_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="lg:hidden text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer px-3 py-1.5 border border-border rounded-lg"
              >
                History ({history.entries.length})
              </button>
              <Button onClick={handleTranslate} disabled={loading || !text.trim()} loading={loading} size="lg" className="w-full md:max-w-[200px] rounded-lg disabled:border disabled:border-border">
                {loading ? 'Translating...' : 'Translate'}
              </Button>
            </div>
          </div>

          {/* Glossary */}
          {result && result.glossaryOverrides.length > 0 && (
            <div className="bg-surface-1 border border-border rounded-lg p-4">
              <details className="text-xs">
                <summary className="text-text-secondary hover:text-text-primary cursor-pointer font-medium">
                  {result.glossaryOverrides.length} community term{result.glossaryOverrides.length > 1 ? 's' : ''} applied
                </summary>
                <div className="mt-2 space-y-1">
                  {result.glossaryOverrides.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-text-secondary bg-surface-2 rounded px-2 py-1">
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

          {/* Privacy notice */}
          <div className="flex items-start gap-2.5 p-3.5 bg-success-bg border border-success-border rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-success-text" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-success-text">All processing happens on Vernacular&apos;s own servers.</p>
              <p className="text-sm text-success-text opacity-80 mt-0.5">
                Your audio and text are never sent to Google, Microsoft, OpenAI, AssemblyAI, Deepgram, or any other external service. Files are discarded after processing.
              </p>
            </div>
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
            AI-generated translation. For high-stakes content &mdash; medical, legal, or official
            documents &mdash; have results reviewed by a fluent speaker.
          </p>
        </div>

        {/* History panel — desktop sidebar */}
        <div className="hidden lg:block w-[320px] shrink-0">
          <div className="bg-surface-1 border border-border rounded-xl shadow-xs sticky top-20 h-[calc(100vh-6rem)] overflow-hidden">
            <HistoryPanel history={history} onSelect={loadHistoryEntry} onClear={clear} />
          </div>
        </div>
      </div>

      {/* History drawer — tablet/mobile */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setHistoryOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface-1 border-l border-border shadow-lg animate-slide-in-right">
            <HistoryPanel history={history} onSelect={(e) => { loadHistoryEntry(e); setHistoryOpen(false); }} onClear={clear} />
          </div>
        </div>
      )}
    </div>
  );
}
