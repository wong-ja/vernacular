import { useState, useRef } from 'react';
import type { FileTranslationResult, SessionEntry, ModelMode } from '@vernacular/shared';
import Button from '../components/ui/Button';
import LanguageSelector from '../components/LanguageSelector';
import ModelSelector from '../components/ModelSelector';
import HistoryPanel from '../components/HistoryPanel';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { useSessionHistory } from '../hooks/useSessionHistory';

type Stage = 'upload' | 'processing' | 'result';

export default function TranscribePage() {
  const { history, addEntry, clear } = useSessionHistory('transcribe');
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FileTranslationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [activeTab, setActiveTab] = useState<'transcript' | 'captions'>('transcript');
  const [sourceLang, setSourceLang] = useState('');
  const [targetLang, setTargetLang] = useState('eng_Latn');
  const [mode, setMode] = useState<ModelMode>('balanced');
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleTranscribe() {
    if (!file) return;
    setLoading(true);
    setError('');
    setStage('processing');
    setProgress(0);
    setProgressLabel('Uploading...');

    try {
      const progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p < 25) { setProgressLabel('Uploading...'); return 25; }
          if (p < 50) { setProgressLabel('Transcribing...'); return 50; }
          if (p < 75) { setProgressLabel('Translating...'); return 75; }
          if (p < 90) { setProgressLabel('Generating captions...'); return 90; }
          return p;
        });
      }, 3000);

      const formData = new FormData();
      formData.append('audio', file);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      clearInterval(progressInterval);
      setProgress(100);
      setProgressLabel('Complete');

      if (!res.ok) {
        const text = await res.text();
        let msg: string;
        try { msg = JSON.parse(text).message || text; } catch { msg = text || res.statusText; }
        setError(`API ${res.status}: ${msg}`);
        setStage('upload');
        setLoading(false);
        return;
      }

      const json = await res.json();
      if (json.status === 'ok') {
        setTimeout(() => {
          const d = json.data as FileTranslationResult;
          setResult(d);
          setStage('result');
          setLoading(false);
          addEntry({
            type: 'transcription',
            sourceLang: d.detectedLanguage || sourceLang || 'unknown',
            targetLang,
            domain: 'general',
            sourceText: file.name,
            translatedText: d.transcript.map((s) => s.translation || '').join('\n'),
            modelUsed: {
              asr: d.asrModelId || d.modelUsed,
              translation: d.translationModelId,
              mode,
            },
            confidence: d.overallConfidence,
            glossaryOverrides: d.glossaryOverrides,
          });
        }, 500);
      } else {
        setError(json.message || 'Transcription failed');
        setStage('upload');
        setLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setStage('upload');
      setLoading(false);
    }
  }

  function loadHistoryEntry(entry: SessionEntry) {
    setSourceLang(entry.sourceLang === 'unknown' ? '' : entry.sourceLang);
    setTargetLang(entry.targetLang);
    setResult({
      transcript: [{ text: entry.sourceText, start: 0, end: 0, confidence: entry.confidence, translation: entry.translatedText }],
      detectedLanguage: entry.sourceLang,
      targetLang: entry.targetLang,
      overallConfidence: entry.confidence,
      needsReview: false,
      captionsSrtUrl: '',
      captionsVttUrl: '',
      glossaryOverrides: entry.glossaryOverrides,
      modelUsed: entry.modelUsed.asr || entry.modelUsed.mode,
    });
    setStage('result');
  }

  function downloadCaption(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Step 1 — Upload */}
          {stage === 'upload' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-surface-1 border border-border rounded-xl shadow-xs p-4">
                <div className="grid grid-cols-2 gap-6">
                  <LanguageSelector value={sourceLang} onChange={setSourceLang} label="Audio language" includeAuto />
                  <LanguageSelector value={targetLang} onChange={setTargetLang} label="Translate to" />
                </div>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl bg-surface-1 p-12 text-center cursor-pointer hover:border-accent hover:bg-accent-subtle transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.mp4,.mov,.ogg,.flac,.m4a,.webm,.pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div>
                    <p className="text-lg font-medium text-text-primary">{file.name}</p>
                    <p className="text-sm text-text-secondary mt-1">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-3 text-sm text-error-text hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-text-primary">Drop your file here</p>
                    <p className="text-sm text-text-secondary mt-1">or click to browse</p>
                    <p className="text-xs text-text-tertiary mt-3">
                      MP3, WAV, MP4, MOV, OGG, FLAC, M4A, WEBM &middot; PDF, images (JPG, PNG)
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">Maximum file size: 100MB</p>
                  </div>
                )}
              </div>

              <div className="-mx-2">
                <ModelSelector sourceLang={sourceLang} targetLang={targetLang} defaultCollapsed />
              </div>

              {error && (
                <div className="p-4 bg-error-bg border border-error rounded-md text-sm text-error-text">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1" />
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="lg:hidden text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer px-3 py-1.5 border border-border rounded-lg"
                >
                  History ({history.entries.length})
                </button>
                <Button
                  onClick={handleTranscribe}
                  disabled={!file}
                  size="lg"
                  className="rounded-lg"
                >
                  Transcribe and translate
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Processing */}
          {stage === 'processing' && (
            <div className="max-w-xl mx-auto bg-surface-1 border border-border rounded-xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="font-heading text-lg font-semibold text-text-primary">Processing your file</h2>
                <p className="text-sm text-text-secondary">
                  {file?.name} &middot; {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ''}
                </p>
              </div>

              <ProgressBar value={progress} label={progressLabel} />

              <p className="text-sm text-text-tertiary text-center">Estimated time remaining: ~40 seconds</p>
              <p className="text-xs text-text-tertiary text-center">Audio is being processed on Vernacular&apos;s servers.</p>

              {error && (
                <div className="p-4 bg-error-bg border border-error rounded-md text-sm text-error-text">
                  {error}
                  <Button variant="secondary" size="sm" onClick={handleTranscribe} className="mt-2">Try again</Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Result */}
          {stage === 'result' && result && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex gap-1 bg-surface-1 border border-border rounded-lg p-1 w-fit">
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'transcript' ? 'bg-surface-3 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Transcript + Translation
                </button>
                <button
                  onClick={() => setActiveTab('captions')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'captions' ? 'bg-surface-3 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Download captions
                </button>
              </div>

              {activeTab === 'transcript' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 px-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    <span>Transcript</span>
                    <span>Translation</span>
                  </div>
                  <div className="space-y-2 max-h-[480px] overflow-y-auto">
                    {result.transcript.map((seg, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-2 gap-4 p-3 rounded-md text-sm ${
                          seg.confidence < 0.7
                            ? 'bg-warning-bg border-l-2 border-warning'
                            : 'bg-surface-1 border border-border'
                        }`}
                      >
                        <div>
                          <span className="text-xs text-text-tertiary font-mono">{formatTime(seg.start)}</span>
                          <p className="mt-1 text-text-primary">{seg.text}</p>
                          {seg.confidence < 0.7 && (
                            <span className="inline-block mt-1 text-xs text-warning-text">Low confidence</span>
                          )}
                        </div>
                        <div>
                          <p className="text-text-primary">{seg.translation || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'captions' && (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary">Download caption files for use with video players, social media, or presentation software.</p>
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => downloadCaption(result.captionsSrtUrl, 'captions.srt')}>Download SRT</Button>
                      <Button variant="secondary" onClick={() => downloadCaption(result.captionsVttUrl, 'captions.vtt')}>Download VTT</Button>
                      <Button variant="secondary" onClick={() => {
                        const text = result.transcript.map((s) => s.text).join('\n');
                        const blob = new Blob([text], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'transcript.txt'; a.click();
                        URL.revokeObjectURL(url);
                      }}>Download transcript .txt</Button>
                      <Button variant="secondary" onClick={() => {
                        const text = result.transcript.map((s) => s.translation || '').join('\n');
                        const blob = new Blob([text], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'translation.txt'; a.click();
                        URL.revokeObjectURL(url);
                      }}>Download translation .txt</Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <span className="text-text-secondary">Overall confidence:</span>
                <Badge variant={result.overallConfidence >= 0.85 ? 'high-confidence' : result.overallConfidence >= 0.7 ? 'medium-confidence' : 'low-confidence'}>
                  {Math.round(result.overallConfidence * 100)}%
                </Badge>
              </div>

              <p className="text-xs text-text-tertiary">
                Model: {result.modelUsed}{result.processingTimeMs ? ` \u00B7 ${(result.processingTimeMs / 1000).toFixed(1)}s` : ''}
              </p>
              <p className="text-xs text-text-tertiary">
                This transcript was generated by AI and may contain errors. Audio quality significantly affects accuracy.
                For high-stakes content, have results reviewed by a fluent speaker.
              </p>
            </div>
          )}
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
