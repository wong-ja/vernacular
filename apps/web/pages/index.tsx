import { useState } from 'react';
import type { TranslationResult } from '@vernacular/shared';
import { LANGUAGES, REGIONS, getLanguagesByRegion } from '@vernacular/shared';

const DOMAIN_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'medical', label: 'Medical' },
  { value: 'legal', label: 'Legal' },
  { value: 'education', label: 'Education' },
  { value: 'civic', label: 'Civic' },
];

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('eng_Latn');
  const [targetLang, setTargetLang] = useState('spa_Latn');
  const [domain, setDomain] = useState('general');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleTranslate() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang, targetLang, domain }),
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Vernacular</h1>
          <nav className="flex gap-4 text-sm">
            <a href="/" className="font-medium text-blue-600 dark:text-blue-400">Translate</a>
            <a href="/transcribe" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Transcribe</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Language Selectors */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">From</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {REGIONS.map((region) => (
                <optgroup key={region} label={region}>
                  {getLanguagesByRegion(region).map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <button
            onClick={flipLanguages}
            className="mb-0.5 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-lg"
            title="Swap languages"
          >
            &#8596;
          </button>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">To</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {REGIONS.map((region) => (
                <optgroup key={region} label={region}>
                  {getLanguagesByRegion(region).map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Domain */}
        <div>
          <label className="block text-sm font-medium mb-1">Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Text to translate</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-y"
            placeholder="Enter text to translate..."
          />
        </div>

        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          disabled={loading || !text.trim()}
          className="w-full py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Translating...' : 'Translate'}
        </button>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Translation</h2>
                {result.needsReview && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                    Needs review
                  </span>
                )}
              </div>
              <p className="text-base whitespace-pre-wrap">{result.translation}</p>
            </div>

            {/* Glossary Overrides */}
            {result.glossaryOverrides.length > 0 && (
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                <h3 className="text-sm font-medium mb-2">Glossary Overrides Applied</h3>
                <div className="space-y-1">
                  {result.glossaryOverrides.map((o, i) => (
                    <div key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded px-2 py-1">
                      <span className="line-through text-gray-400">{o.baseModelTerm}</span>
                      <span>{'\u2192'}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{o.overrideTerm}</span>
                      <span className="text-gray-400 ml-auto">({o.domain})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.processingTimeMs !== undefined && (
              <p className="text-xs text-gray-400">
                Processed in {(result.processingTimeMs / 1000).toFixed(1)}s using {result.modelUsed}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
