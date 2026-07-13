import { useState } from 'react';
import type { ModelTask } from '@vernacular/shared';
import { LANGUAGE_CONFIGS, MODEL_REGISTRY } from '@vernacular/shared';

type ExploreTab = 'languages' | 'models' | 'glossaries';

const TABS: { key: ExploreTab; label: string }[] = [
  { key: 'languages', label: 'Languages' },
  { key: 'models', label: 'Models' },
  { key: 'glossaries', label: 'Glossaries' },
];

const REGION_FILTERS = ['All', 'AAPI', 'European', 'African', 'Other'] as const;
const TASK_FILTERS: (ModelTask | 'all')[] = ['all', 'asr', 'translation', 'tts'];

function AccuracyDots({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 items-center">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: i <= rating ? '#A8BEF7' : 'var(--color-surface-3)',
          }}
        />
      ))}
    </span>
  );
}

function getLanguageRegion(code: string): string {
  const european = ['eng', 'fra', 'deu', 'por', 'ita', 'nld', 'rus', 'pol', 'tur', 'spa'];
  const aapi = ['tgl', 'vie', 'zho', 'yue', 'jpn', 'kor', 'tha', 'ind', 'msa', 'mya', 'lao', 'ceb', 'ilo', 'hmn', 'khm'];
  const african = ['yor', 'wol', 'hat'];
  const prefix = code.split('_')[0];
  if (european.includes(prefix)) return 'European';
  if (aapi.includes(prefix)) return 'AAPI';
  if (african.includes(prefix)) return 'African';
  return 'Other';
}

export default function ExplorePage() {
  const [tab, setTab] = useState<ExploreTab>('languages');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<ModelTask | 'all'>('all');
  const [modelSearch, setModelSearch] = useState('');

  const filteredLanguages = LANGUAGE_CONFIGS.filter((lang) => {
    if (regionFilter !== 'All' && getLanguageRegion(lang.code) !== regionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return lang.displayName.toLowerCase().includes(q) || lang.nativeName.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredModels = MODEL_REGISTRY.filter((m) => {
    if (taskFilter !== 'all' && m.task !== taskFilter) return false;
    if (modelSearch) {
      const q = modelSearch.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.developer.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[#A8BEF7] text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Languages Tab */}
      {tab === 'languages' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary font-heading">Supported languages &amp; models</h1>
            <p className="text-sm text-text-secondary mt-1">
              Phase 1 supports 12 language pairs. Expand with community contributions.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent w-64"
            />
            <div className="flex gap-1">
              {REGION_FILTERS.map((rf) => (
                <button
                  key={rf}
                  onClick={() => setRegionFilter(rf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    regionFilter === rf
                      ? 'bg-accent-subtle border border-accent text-accent'
                      : 'bg-surface-1 border border-border text-text-secondary hover:bg-surface-2'
                  }`}
                >
                  {rf}
                </button>
              ))}
            </div>
          </div>

          {/* Language cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLanguages.map((lang) => {
              const asr = MODEL_REGISTRY.find((m) => m.id === lang.defaultAsrModelId);
              const translation = MODEL_REGISTRY.find((m) => m.id === lang.defaultTranslationModelId);
              const tts = MODEL_REGISTRY.find((m) => m.id === lang.defaultTtsModelId);
              return (
                <div
                  key={lang.code}
                  className="bg-surface-1 border border-border rounded-xl p-5 hover:border-[#A8BEF7] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold text-text-primary">{lang.displayName}</h3>
                    <span className="text-sm text-text-secondary">{lang.nativeName}</span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-text-secondary w-[90px] shrink-0">ASR:</span>
                      <span className="text-sm font-medium text-text-primary">{asr?.name || lang.defaultAsrModelId}</span>
                      {asr && <AccuracyDots rating={asr.accuracyRating} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-text-secondary w-[90px] shrink-0">Translation:</span>
                      <span className="text-sm font-medium text-text-primary">{translation?.name || lang.defaultTranslationModelId}</span>
                      {translation && <AccuracyDots rating={translation.accuracyRating} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-text-secondary w-[90px] shrink-0">TTS:</span>
                      <span className="text-sm font-medium text-text-primary">{tts?.name || lang.defaultTtsModelId}</span>
                      {tts && <AccuracyDots rating={tts.accuracyRating} />}
                    </div>
                  </div>

                  {/* Licenses */}
                  <div className="mt-3 text-xs text-text-tertiary">
                    {[asr, translation, tts].filter(Boolean).map((m) => m!.license).filter((l, i, a) => a.indexOf(l) === i).join(' · ')}
                  </div>

                  {/* Low-resource warning */}
                  {lang.accuracyCaveat && (
                    <div className="mt-3 p-2.5 rounded-lg text-xs" style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', color: 'var(--color-warning-text)' }}>
                      Limited AI training data for this language. Community glossary contributions help most.
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">Community glossary: 0 terms</span>
                    <a href="#" className="text-xs font-medium" style={{ color: '#A8BEF7' }}>Contribute &rarr;</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Models Tab */}
      {tab === 'models' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary font-heading">All models</h1>
            <p className="text-sm text-text-secondary mt-1">
              Models are selected automatically based on language and mode. You can change any model before submitting.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Search by model name..."
              className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent w-64"
            />
            <div className="flex gap-1">
              {TASK_FILTERS.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTaskFilter(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    taskFilter === tf
                      ? 'bg-accent-subtle border border-accent text-accent'
                      : 'bg-surface-1 border border-border text-text-secondary hover:bg-surface-2'
                  }`}
                >
                  {tf === 'all' ? 'All' : tf === 'asr' ? 'ASR' : tf === 'tts' ? 'TTS' : 'Translation'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-2">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Model name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Developer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Task</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Languages</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Accuracy</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">License</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Watermark</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((m) => (
                    <tr
                      key={m.id}
                      className={`border-b border-border-subtle hover:bg-surface-2 transition-colors ${m.paidPhaseOnly ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <a href={m.huggingFaceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-text-primary hover:text-accent transition-colors inline-flex items-center gap-1">
                          {m.name}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{m.developer}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-subtle text-accent">
                          {m.task === 'asr' ? 'ASR' : m.task === 'tts' ? 'TTS' : m.task === 'translation' ? 'Translation' : m.task === 'pipeline' ? 'Pipeline' : 'ASR+TTS'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">{m.languages.length > 50 ? `${m.languages.length} languages` : m.languages[0]}</td>
                      <td className="px-4 py-3"><AccuracyDots rating={m.accuracyRating} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${m.licensePermission === 'open' ? 'text-success-text' : ''}`} style={m.licensePermission === 'non-commercial' ? { color: 'var(--color-warning-text)' } : {}}>
                          {m.licensePermission === 'open' ? 'Open' : 'NC'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-tertiary">
                        {m.watermarked ? (
                          <span className="text-warning-text">⚠ Watermarked</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {m.paidPhaseOnly ? (
                          <span className="text-xs text-text-tertiary" title="Not available in free tier — sends content to external service">Paid phase only</span>
                        ) : (
                          <span className="text-xs text-success-text">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Glossaries Tab */}
      {tab === 'glossaries' && (
        <div className="text-center py-16 space-y-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-text-tertiary">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <h2 className="text-lg font-semibold text-text-primary font-heading">No published glossaries yet</h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Create an org account to build and publish the first glossary for your community.
          </p>
          <a href="/orgs/signup" className="inline-block text-sm font-medium px-4 py-2 bg-accent text-accentOn rounded-md hover:bg-accent-hover transition-colors">
            Create org account
          </a>
        </div>
      )}
    </div>
  );
}
