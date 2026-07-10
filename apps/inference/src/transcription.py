"""Whisper transcription service for Vernacular inference sidecar.
Self-hosted only. No external API calls.
Uses faster-whisper (CTranslate2 backend) for ASR.
"""

import os
import time
import tempfile
import logging
import re

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------
_model = None
_model_loading = False
_model_loaded = False


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class Segment(BaseModel):
    text: str
    start: float
    end: float
    confidence: float
    is_low_confidence: bool = False
    potentially_hallucinated: bool = False


class TranscribeResponse(BaseModel):
    segments: list[Segment]
    detected_language: str
    overall_confidence: float
    model_used: str
    latency_ms: int


class TestResult(BaseModel):
    segments: list[Segment]
    hallucination_guard_triggered: bool
    latency_ms: int

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/transcribe", tags=["transcription"])

_HALLUCINATION_PATTERN = re.compile(r"(\b\w+\b)(?:\s+\1){2,}", re.IGNORECASE)


def _check_hallucination(text: str) -> bool:
    """Detect repeated tokens — same word/phrase >3 times."""
    return bool(_HALLUCINATION_PATTERN.search(text))


async def load_model():
    """Load faster-whisper model once at startup."""
    global _model, _model_loading, _model_loaded

    if _model_loaded:
        return

    _model_loading = True
    _model_loaded = False
    logger.info("Loading faster-whisper large-v3 ...")
    start = time.time()

    try:
        from faster_whisper import WhisperModel

        device = "cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        logger.info("faster-whisper device=%s compute_type=%s", device, compute_type)

        _model = WhisperModel("large-v3", device=device, compute_type=compute_type)
        elapsed = time.time() - start
        logger.info("faster-whisper loaded in %.1f seconds", elapsed)
        _model_loaded = True
    except Exception as exc:
        logger.error("Failed to load faster-whisper: %s", exc)
        _model = None
        _model_loaded = False
    finally:
        _model_loading = False


def _segments_to_list(segments, overall_confidence: float) -> list[Segment]:
    result = []
    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue
        confidence = seg.avg_logprob if seg.avg_logprob is not None else 0.0
        confidence = max(-3.0, min(0.0, confidence))  # clamp
        # Convert avg_logprob to 0-1 scale for consistency
        normalized = (confidence + 3.0) / 3.0
        result.append(Segment(
            text=text,
            start=seg.start,
            end=seg.end,
            confidence=round(normalized, 4),
            is_low_confidence=confidence < -0.7,
            potentially_hallucinated=_check_hallucination(text),
        ))
    return result


@router.post("")
async def transcribe(
    audio: UploadFile = File(...),
    source_lang: str = Form(None),
):
    if not _model_loaded:
        if _model_loading:
            raise HTTPException(
                status_code=503,
                detail={"status": "loading", "retry_after": 30},
            )
        raise HTTPException(
            status_code=503,
            detail={"status": "model_not_available", "message": "Model failed to load"},
        )

    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio type")

    tmp_path = None
    try:
        # Write upload to temp file (must delete after processing — privacy)
        suffix = os.path.splitext(audio.filename or "upload.wav")[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name

        start = time.time()
        segments, info = _model.transcribe(
            tmp_path,
            language=source_lang,
            word_timestamps=True,
        )

        seg_list = list(segments)
        overall_conf = max(-3.0, min(0.0, info.duration if hasattr(info, 'duration') else 0.0))
        seg_out = _segments_to_list(seg_list, overall_conf)

        avg_confidence = (
            sum(s.confidence for s in seg_out) / len(seg_out)
            if seg_out else 0.0
        )

        latency_ms = int((time.time() - start) * 1000)

        return TranscribeResponse(
            segments=seg_out,
            detected_language=info.language,
            overall_confidence=round(avg_confidence, 4),
            model_used="faster-whisper-large-v3",
            latency_ms=latency_ms,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Transcription failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")
    finally:
        # Privacy: delete temp file immediately
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception as exc:
                logger.warning("Failed to delete temp file %s: %s", tmp_path, exc)


@router.get("/test")
async def test_transcribe():
    """Smoke-test: run on silence to verify hallucination guard triggers."""
    if not _model_loaded:
        return {
            "status": "model_loading" if _model_loading else "model_not_available",
            "message": "Model is not ready yet",
        }

    try:
        from scipy.io.wavfile import write as write_wav
        import numpy as np

        sample_rate = 16000
        silence = np.zeros(sample_rate * 5, dtype=np.int16)  # 5 seconds of silence

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        write_wav(tmp.name, sample_rate, silence)
        tmp_path = tmp.name
        tmp.close()

        start = time.time()
        segments, info = _model.transcribe(tmp_path, word_timestamps=True)
        seg_list = list(segments)
        seg_out = _segments_to_list(seg_list, 0.0)

        hallucination_triggered = any(s.potentially_hallucinated for s in seg_out)
        latency_ms = int((time.time() - start) * 1000)

        return TestResult(
            segments=seg_out,
            hallucination_guard_triggered=hallucination_triggered,
            latency_ms=latency_ms,
        )
    except Exception as exc:
        logger.exception("Test transcription failed")
        raise HTTPException(status_code=500, detail=f"Test failed: {exc}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
