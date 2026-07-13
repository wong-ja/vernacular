import { useState, useCallback } from 'react';
import type { SessionEntry, SessionHistory, HistoryMode } from '@vernacular/shared';

function genId() {
  return Math.random().toString(36).substring(2, 10);
}

export function useSessionHistory(mode: HistoryMode) {
  const [history, setHistory] = useState<SessionHistory>({
    sessionId: genId(),
    startedAt: new Date(),
    mode,
    entries: [],
  });
  const [prevModelLabel, setPrevModelLabel] = useState<string | null>(null);

  const addEntry = useCallback((entry: Omit<SessionEntry, 'id' | 'timestamp'>) => {
    const full: SessionEntry = { id: genId(), timestamp: new Date(), ...entry };
    setHistory((h) => ({ ...h, entries: [...h.entries, full] }));
    const label = entry.modelUsed.mode + (entry.modelUsed.translation ? ` (${entry.modelUsed.translation})` : '');
    setPrevModelLabel(label);
    return full;
  }, []);

  const clear = useCallback(() => {
    setHistory({ sessionId: genId(), startedAt: new Date(), mode, entries: [] });
    setPrevModelLabel(null);
  }, [mode]);

  const modelChanged = prevModelLabel !== null;

  return { history, addEntry, clear, modelChanged, prevModelLabel };
}
