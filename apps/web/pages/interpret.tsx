import { useState, useRef, useCallback, useEffect } from 'react';
import type { ModelMode } from '@vernacular/shared';
import LanguageSelector from '../components/LanguageSelector';
import Button from '../components/ui/Button';

type SpeakerMode = 'single' | 'two-way';

export default function InterpretPage() {
  const [speakerMode, setSpeakerMode] = useState<SpeakerMode>('single');
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionName, setSessionName] = useState('Untitled session');
  const [editingName, setEditingName] = useState(false);
  const [langA, setLangA] = useState('eng_Latn');
  const [langB, setLangB] = useState('spa_Latn');
  const [transcriptA, setTranscriptA] = useState('');
  const [translationA, setTranslationA] = useState('');
  const [transcriptB, setTranscriptB] = useState('');
  const [translationB, setTranslationB] = useState('');
  const [domain, setDomain] = useState('general');
  const [mode, setMode] = useState<ModelMode>('balanced');
  const [modeOpen, setModeOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (recording && !paused) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording, paused]);

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      setPaused(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) {
            // In production: send to inference for transcription
            setTranscriptA((prev) => prev + ' [audio segment] ');
          }
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setRecording(true);
        setPaused(false);
      } catch {
        // permission denied
      }
    }
  }

  function pauseResume() {
    if (paused) {
      setPaused(false);
    } else {
      setPaused(true);
    }
  }

  function formatElapsed(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <div className="max-w-container mx-auto px-4 py-6">
      <div className="flex gap-4">
        {/* Main area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Session header */}
          <div className="bg-surface-1 border border-border rounded-xl shadow-xs p-4 flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {recording && !paused && (
                <>
                  <span className="live-dot inline-block" />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9AE4E5' }}>LIVE</span>
                </>
              )}
              <span className="font-mono text-base text-text-primary">{formatElapsed(elapsed)}</span>
            </div>
            {editingName ? (
              <input
                autoFocus
                defaultValue={sessionName}
                onBlur={(e) => { setSessionName(e.target.value || 'Untitled session'); setEditingName(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSessionName((e.target as HTMLInputElement).value || 'Untitled session'); setEditingName(false); } }}
                className="text-sm font-medium bg-surface-2 border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
              />
            ) : (
              <button onClick={() => setEditingName(true)} className="text-sm font-medium text-text-primary hover:text-accent transition-colors cursor-pointer">
                {sessionName}
              </button>
            )}
            <div className="flex-1" />
            <div className="relative">
              <button onClick={() => setModeOpen(!modeOpen)} className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer" aria-label="Settings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              {modeOpen && (
                <div className="absolute right-0 top-10 w-56 bg-surface-1 border border-border rounded-lg shadow-md p-3 z-50 space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-tertiary">Model</span>
                    {(['fast', 'balanced', 'accurate', 'rare-language'] as const).map((m) => (
                      <button key={m} onClick={() => { setMode(m); setModeOpen(false); }} className={`text-xs px-2 py-1.5 rounded text-left ${mode === m ? 'bg-accent-subtle text-accent' : 'text-text-secondary hover:bg-surface-2'}`}>
                        {m === 'fast' ? 'Fast' : m === 'balanced' ? 'Balanced' : m === 'accurate' ? 'Accurate' : 'Rare Language'}
                      </button>
                    ))}
                  </div>
                  <div>
                    <span className="text-xs text-text-tertiary">Domain</span>
                    <select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full mt-1 bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none">
                      <option value="general">General</option>
                      <option value="medical">Medical</option>
                      <option value="legal">Legal</option>
                      <option value="education">Education</option>
                      <option value="civic">Civic</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <Button variant="destructive" size="sm" onClick={() => {}}>End session</Button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {(['single' as const, 'two-way' as const]).map((sm) => (
              <button
                key={sm}
                onClick={() => setSpeakerMode(sm)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  speakerMode === sm ? 'bg-accent-subtle border border-accent text-accent' : 'bg-surface-1 border border-border text-text-secondary hover:bg-surface-2'
                }`}
              >
                {sm === 'single' ? 'One speaker' : 'Two speakers'}
              </button>
            ))}
          </div>

          {/* Speaker panels */}
          <div className={`grid ${speakerMode === 'two-way' ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1'}`}>
            {/* Speaker A */}
            <div className="bg-surface-1 border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A8BEF7' }}>
                    Speaker A
                  </span>
                  <LanguageSelector value={langA} onChange={setLangA} label="" />
                </div>
                {recording && !paused && speakerMode === 'single' && (
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9AE4E5' }}>LISTENING</span>
                )}
              </div>

              <div className="flex flex-col items-center py-8">
                <button
                  onClick={toggleRecording}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    background: recording ? 'var(--color-error-bg)' : 'var(--color-surface-2)',
                    border: recording ? '2px solid var(--color-error)' : '2px solid #A8BEF7',
                  }}
                >
                  {recording ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--color-error-text)' }}>
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--color-accent)' }}>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  )}
                </button>
                {!recording && !paused && (
                  <p className="mt-3 text-xs text-text-tertiary">Press record to start interpreting</p>
                )}
              </div>

              {/* Transcript + Translation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-border-subtle">
                <div className="p-4 min-h-[120px]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Transcript</span>
                  <p className="mt-2 text-sm text-text-primary">{transcriptA || <span className="text-text-tertiary italic">Waiting for audio...</span>}</p>
                </div>
                <div className="p-4 min-h-[120px] border-t sm:border-t-0 sm:border-l border-border-subtle">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Translation</span>
                  <p className="mt-2 text-sm text-text-primary">{translationA || <span className="text-text-tertiary italic">Translation will appear here</span>}</p>
                </div>
              </div>
            </div>

            {/* Speaker B (two-way only) */}
            {speakerMode === 'two-way' && (
              <div className="bg-surface-1 border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#FBBEA2' }}>
                      Speaker B
                    </span>
                    <LanguageSelector value={langB} onChange={setLangB} label="" />
                  </div>
                  {recording && !paused && (
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9AE4E5' }}>LISTENING</span>
                  )}
                </div>

                <div className="flex flex-col items-center py-8">
                  <button
                    onClick={toggleRecording}
                    className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer"
                    style={{
                      background: recording ? 'var(--color-error-bg)' : 'var(--color-surface-2)',
                      border: recording ? '2px solid var(--color-error)' : '2px solid #FBBEA2',
                    }}
                  >
                    {recording ? (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--color-error-text)' }}>
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                      </svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--color-warning-text)' }}>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    )}
                  </button>
                  {!recording && !paused && (
                    <p className="mt-3 text-xs text-text-tertiary">Press record to start interpreting</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-border-subtle">
                  <div className="p-4 min-h-[120px]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Transcript</span>
                    <p className="mt-2 text-sm text-text-primary">{transcriptB || <span className="text-text-tertiary italic">Waiting for audio...</span>}</p>
                  </div>
                  <div className="p-4 min-h-[120px] border-t sm:border-t-0 sm:border-l border-border-subtle">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Translation</span>
                    <p className="mt-2 text-sm text-text-primary">{translationB || <span className="text-text-tertiary italic">Translation will appear here</span>}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div className="bg-surface-1 border border-border rounded-xl shadow-xs p-3 flex items-center gap-3 flex-wrap">
            {recording ? (
              <Button variant="destructive" size="sm" onClick={toggleRecording}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mr-1"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={toggleRecording}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1"><circle cx="12" cy="12" r="6"/></svg>
                Record
              </Button>
            )}
            {recording && (
              <Button variant="secondary" size="sm" onClick={pauseResume}>
                {paused ? 'Resume' : 'Pause'}
              </Button>
            )}
            <div className="flex-1" />
            <span className="text-xs text-text-tertiary">Domain: </span>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none">
              <option value="general">General</option>
              <option value="medical">Medical</option>
              <option value="legal">Legal</option>
              <option value="education">Education</option>
              <option value="civic">Civic</option>
            </select>
            <span className="text-xs text-text-tertiary">Model: </span>
            <select value={mode} onChange={(e) => setMode(e.target.value as ModelMode)} className="bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none">
              <option value="fast">Fast</option>
              <option value="balanced">Balanced</option>
              <option value="accurate">Accurate</option>
              <option value="rare-language">Rare Language</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
