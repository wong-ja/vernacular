import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { spawn, execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';

let _hasFfmpeg: boolean | null = null;

export function hasFFmpeg(): boolean {
  if (_hasFfmpeg === null) {
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      _hasFfmpeg = true;
    } catch {
      _hasFfmpeg = false;
    }
  }
  return _hasFfmpeg;
}

export type MediaType = 'audio' | 'video' | 'image' | 'pdf' | 'unsupported';

const TEMP_DIR = join(tmpdir(), 'vernacular-uploads');

export interface ProcessedFile {
  /** Path to the audio file ready for transcription (wav 16kHz mono) */
  audioPath: string;
  /** Original filename */
  originalName: string;
  /** Detected media type */
  mediaType: MediaType;
  /** Whether a temp file still needs cleanup */
  tempPaths: string[];
}

function detectMediaType(mimeType: string, filename: string): MediaType {
  const name = filename.toLowerCase();
  const ext = name.split('.').pop() || '';
  if (/^audio\//.test(mimeType) || ['wav', 'mp3', 'm4a', 'ogg', 'flac', 'aac', 'wma'].includes(ext)) {
    return 'audio';
  }
  if (/^video\//.test(mimeType) || ['mp4', 'webm', 'avi', 'mov', 'mkv', 'm4v'].includes(ext)) {
    return 'video';
  }
  if (/^image\//.test(mimeType) || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
    return 'image';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  return 'unsupported';
}

export async function saveUpload(stream: Readable, filename: string, mimeType: string): Promise<ProcessedFile> {
  await mkdir(TEMP_DIR, { recursive: true });

  const id = randomUUID();
  const ext = filename.split('.').pop() || 'bin';
  const originalPath = join(TEMP_DIR, `${id}.${ext}`);
  const writeStream = createWriteStream(originalPath);
  await pipeline(stream, writeStream);

  const mediaType = detectMediaType(mimeType, filename);
  const tempPaths: string[] = [originalPath];

  if (mediaType === 'audio') {
    return { audioPath: originalPath, originalName: filename, mediaType, tempPaths };
  }

  if (mediaType === 'video') {
    if (!hasFFmpeg()) {
      throw new Error('Video files require FFmpeg (not available on this server). Upload audio directly instead.');
    }
    const audioPath = join(TEMP_DIR, `${id}-audio.wav`);
    await extractAudio(originalPath, audioPath);
    tempPaths.push(audioPath);
    return { audioPath, originalName: filename, mediaType, tempPaths };
  }

  return { audioPath: originalPath, originalName: filename, mediaType, tempPaths };
}

async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      audioPath,
    ], { stdio: 'pipe' });
    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-200)}`));
    });
    proc.on('error', reject);
  });
}

export async function cleanupTempFiles(paths: string[]): Promise<void> {
  for (const p of paths) {
    try { await unlink(p); } catch { /* ok */ }
  }
}
