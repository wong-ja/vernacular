import { useState, useRef } from 'react';
import type { FileTranslationResult } from '@vernacular/shared';
import { LANGUAGES, REGIONS, getLanguagesByRegion } from '@vernacular/shared';

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FileTranslationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.status === 'ok') {
        setResult(json.data);
      } else {
        setError(json.message || 'Transcription failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function downloadCaption(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Vernacular</h1>
          <nav className="flex gap-4 text-sm">
            <a href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Translate</a>
            <a href="/transcribe" className="font-medium text-blue-600 dark:text-blue-400">Transcribe</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Language */}
        <div>
          <label className="block text-sm font-medium mb-1">Audio language (optional, leave blank for auto-detect)</label>
          <select
            value={''}
            onChange={(e) => {}}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="">Auto-detect</option>
            {REGIONS.map((region) => (
              <optgroup key={region} label={region}>
                {getLanguagesByRegion(region).map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* File Drop */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {file ? (
            <div>
              <p className="text-lg font-medium">{file.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="mt-2 text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium">Drop audio or video file here</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse</p>
              <p className="text-xs text-gray-400 mt-2">Supports MP3, WAV, MP4, MOV, M4A, and more</p>
            </div>
          )}
        </div>

        {/* Transcribe Button */}
        <button
          onClick={handleTranscribe}
          disabled={loading || !file}
          className="w-full py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Transcribe'}
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
            {/* Download Captions */}
            <div className="flex gap-3">
              <button
                onClick={() => downloadCaption(result.captionsSrtUrl, 'captions.srt')}
                className="flex-1 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Download SRT
              </button>
              <button
                onClick={() => downloadCaption(result.captionsVttUrl, 'captions.vtt')}
                className="flex-1 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Download VTT
              </button>
            </div>

            {/* Confidence */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
              <span className={result.overallConfidence >= 0.85 ? 'text-green-600' : result.overallConfidence >= 0.7 ? 'text-amber-600' : 'text-red-600'}>
                {Math.round(result.overallConfidence * 100)}%
              </span>
            </div>

            {/* Transcript Segments */}
            <div>
              <h3 className="text-sm font-medium mb-2">Transcript ({result.transcript.length} segments)</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.transcript.map((seg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-md text-sm ${
                      seg.confidence < 0.7
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400 font-mono">
                        {formatTime(seg.start)} &rarr; {formatTime(seg.end)}
                      </span>
                      <div className="flex items-center gap-2">
                        {seg.confidence < 0.7 && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            Low confidence
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{Math.round(seg.confidence * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100">{seg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Used */}
            <p className="text-xs text-gray-400">
              Model: {result.modelUsed} &middot; {result.processingTimeMs ? `${(result.processingTimeMs / 1000).toFixed(1)}s` : ''}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
