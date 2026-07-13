import type { SessionHistory, SessionEntry } from '@vernacular/shared';

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function modelBadge(entry: SessionEntry) {
  const m = entry.modelUsed.translation || entry.modelUsed.asr || entry.modelUsed.mode;
  return (
    <span className="inline-block px-1.5 py-0.5 rounded-full bg-surface-2 text-[10px] text-text-tertiary leading-tight">
      {m}
    </span>
  );
}

interface HistoryPanelProps {
  history: SessionHistory;
  onSelect: (entry: SessionEntry) => void;
  onClear: () => void;
}

export default function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-widest">
          Session history
        </span>
        {history.entries.length > 0 && (
          <button onClick={onClear} className="text-xs text-text-tertiary hover:text-text-primary transition-colors cursor-pointer">
            Clear
          </button>
        )}
      </div>

      {history.entries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary mb-3">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-sm text-text-tertiary">Translations will appear here</p>
          <p className="text-xs text-text-tertiary mt-1">Your history is stored locally and cleared when you close the tab.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {history.entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onSelect(entry)}
              className="w-full text-left px-4 py-3 border-b border-border-subtle hover:bg-surface-2 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: '#A8BEF7' }}>
                  {entry.sourceLang} &rarr; {entry.targetLang}
                </span>
                <span className="font-mono text-[11px] text-text-tertiary">{formatTime(entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp))}</span>
              </div>
              <div className="mt-1">{modelBadge(entry)}</div>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-2">
                {entry.sourceText}
              </p>
              <p className="text-xs text-text-primary italic leading-relaxed line-clamp-2 mt-0.5">
                {entry.translatedText}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
