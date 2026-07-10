import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({ execSync: vi.fn() }));
import { execSync } from 'node:child_process';

// The module caches hasFFmpeg on first call, so we test with a fresh FFmpeg-absent
// environment by using saveUpload which throws when FFmpeg is absent for video files.
describe('hasFFmpeg / saveUpload integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws for video files when FFmpeg is absent', async () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not found'); });

    // Re-import to get a fresh module instance
    vi.resetModules();
    const fp = await import('../services/file-processor.js');
    const { Readable } = await import('node:stream');

    const stream = Readable.from([Buffer.from('test')]);
    await expect(fp.saveUpload(stream, 'test.mp4', 'video/mp4'))
      .rejects.toThrow('Video files require FFmpeg');
  });

  it('saves audio files without requiring FFmpeg', async () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not found'); });
    vi.resetModules();
    const fp = await import('../services/file-processor.js');
    const { Readable } = await import('node:stream');

    const stream = Readable.from([Buffer.from('test')]);
    const result = await fp.saveUpload(stream, 'test.mp3', 'audio/mpeg');

    expect(result.mediaType).toBe('audio');
    expect(result.audioPath).toBeTruthy();
    expect(result.originalName).toBe('test.mp3');

    // Cleanup
    await fp.cleanupTempFiles(result.tempPaths);
  });

  it('detects unsupported media types', async () => {
    vi.resetModules();
    const fp = await import('../services/file-processor.js');
    const { Readable } = await import('node:stream');

    const stream = Readable.from([Buffer.from('test')]);
    const result = await fp.saveUpload(stream, 'test.xyz', 'application/octet-stream');

    expect(result.mediaType).toBe('unsupported');
    expect(result.audioPath).toBeTruthy(); // Falls back to original path

    await fp.cleanupTempFiles(result.tempPaths);
  });

  it('cleanupTempFiles does not throw on missing files', async () => {
    vi.resetModules();
    const fp = await import('../services/file-processor.js');
    await expect(fp.cleanupTempFiles(['/nonexistent/path'])).resolves.toBeUndefined();
  });
});
