// packages/shared/src/inference-backends.ts
// Documents how Whisper models are served — these are deployment wrappers,
// not separate models. All use the same Whisper Large-v3 weights.

export interface InferenceBackendEntry {
  id: string;
  name: string;
  description: string;
  useCase: string;
  requirements: string;
  bestFor: string;
  notFor: string;
  installCmd: string;
}

export const INFERENCE_BACKENDS: InferenceBackendEntry[] = [
  {
    id: 'faster-whisper',
    name: 'faster-whisper',
    description: 'CTranslate2 backend. Optimizes for latency — fastest single-file transcription on any hardware.',
    useCase: 'Default for all real-time and single-file transcription.',
    requirements: 'Python, CTranslate2. Works on CPU and NVIDIA GPU. No VRAM minimum.',
    bestFor: 'Single file transcription, real-time streaming, CPU inference.',
    notFor: 'Batch processing of large archives (use insanely-fast-whisper instead).',
    installCmd: 'pip install faster-whisper',
  },
  {
    id: 'insanely-fast-whisper',
    name: 'insanely-fast-whisper',
    description: 'Flash Attention 2 + batch processing. Optimizes for throughput — processes many audio chunks in parallel. Transcribes 150 minutes of audio in under 98 seconds on an A100.',
    useCase: 'Batch processing of large audio file archives. Not for real-time or single-file use.',
    requirements: 'NVIDIA Ampere+ GPU (RTX 3000+, A100, H100), CUDA 11.8+, significant VRAM (batch-size 24 default). Flash Attention 2 compilation required.',
    bestFor: 'Organizations uploading many audio/video files at once. Maximum GPU throughput.',
    notFor: 'Real-time streaming, CPU inference, or hardware without Flash Attention 2 support.',
    installCmd: 'pipx install insanely-fast-whisper',
  },
  {
    id: 'whisperx',
    name: 'WhisperX',
    description: 'faster-whisper + Voice Activity Detection (VAD) + forced alignment + optional speaker diarization. Adds word-level timestamps and speaker labels on top of transcription.',
    useCase: 'Use in Accurate mode when users need speaker labels or precise word-level timestamps for captioning.',
    requirements: 'Python, faster-whisper, wav2vec2 (alignment). Speaker diarization requires pyannote-audio license and HuggingFace token.',
    bestFor: 'Captioning with word-level timestamps, multi-speaker audio where speaker ID matters.',
    notFor: 'Simple transcription where timestamps and speaker labels are not needed (adds processing time).',
    installCmd: 'pip install whisperx',
  },
];
