"""NLLB-200 translation service for Vernacular inference sidecar.
Self-hosted only. No external API calls.
"""

import os
import time
import asyncio
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model size selection — override via NLLB_MODEL_SIZE env var
# ---------------------------------------------------------------------------
_MODEL_SIZES = {
    "600M": "facebook/nllb-200-distilled-600M",
    "1.3B": "facebook/nllb-200-1.3B",
    "3.3B": "facebook/nllb-200-3.3B",
}

DEFAULT_SIZE = os.environ.get("NLLB_MODEL_SIZE", "3.3B")
MODEL_NAME = _MODEL_SIZES.get(DEFAULT_SIZE, _MODEL_SIZES["3.3B"])

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------
_model = None
_tokenizer = None
_model_loading = False
_model_loaded = False
_device = None

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    source_lang: str = Field(..., min_length=1, max_length=20)
    target_lang: str = Field(..., min_length=1, max_length=20)
    max_length: int = Field(default=512, ge=16, le=1024)


class TranslateResponse(BaseModel):
    translation: str
    model_id: str
    latency_ms: int


class LanguagesResponse(BaseModel):
    languages: list[dict]


class TestResponse(BaseModel):
    translation: str
    model_id: str
    latency_ms: int
    input_text: str

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/translate", tags=["translation"])


def _get_supported_languages():
    """Return a small representative list of NLLB-200 languages relevant to Vernacular."""
    return [
        {"code": "eng_Latn", "name": "English"},
        {"code": "spa_Latn", "name": "Spanish"},
        {"code": "tgl_Latn", "name": "Tagalog"},
        {"code": "yue_Hant", "name": "Cantonese"},
        {"code": "hmn_Latn", "name": "Hmong"},
        {"code": "zho_Hans", "name": "Chinese (Simplified)"},
        {"code": "zho_Hant", "name": "Chinese (Traditional)"},
        {"code": "vie_Latn", "name": "Vietnamese"},
        {"code": "kor_Hang", "name": "Korean"},
        {"code": "jpn_Jpan", "name": "Japanese"},
        {"code": "ara_Arab", "name": "Arabic"},
        {"code": "khm_Khmr", "name": "Khmer"},
        {"code": "mya_Mymr", "name": "Burmese"},
        {"code": "ilo_Latn", "name": "Ilocano"},
        {"code": "ceb_Latn", "name": "Cebuano"},
        {"code": "war_Latn", "name": "Waray"},
    ]


async def load_model():
    """Load NLLB-200 model and tokenizer. Called once at startup in background."""
    global _model, _tokenizer, _model_loading, _model_loaded, _device

    if _model_loaded:
        return

    _model_loading = True
    _model_loaded = False
    logger.info("Loading NLLB-200 model: %s", MODEL_NAME)
    start = time.time()

    try:
        import torch
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        _device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Using device: %s", _device)

        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForSeq2SeqLM.from_pretrained(
            MODEL_NAME,
            device_map="auto" if _device == "cuda" else None,
            torch_dtype=torch.float16 if _device == "cuda" else torch.float32,
            low_cpu_mem_usage=True,
        )
        if _device == "cpu":
            _model = _model.to(_device)

        elapsed = time.time() - start
        logger.info("NLLB-200 model loaded in %.1f seconds", elapsed)
        _model_loaded = True
    except Exception as exc:
        logger.error("Failed to load NLLB-200 model: %s", exc)
        _model = None
        _tokenizer = None
        _model_loaded = False
    finally:
        _model_loading = False


@router.get("/languages")
async def list_languages():
    return LanguagesResponse(languages=_get_supported_languages())


@router.post("")
async def translate(req: TranslateRequest):
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

    try:
        start = time.time()

        tokenizer = _tokenizer
        model = _model

        inputs = tokenizer(
            req.text,
            src_lang=req.source_lang,
            return_tensors="pt",
            truncation=True,
            max_length=1024,
        ).to(_device)

        forced_bos_token_id = tokenizer.lang_code_to_id.get(req.target_lang)
        if forced_bos_token_id is None:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported target language code: {req.target_lang}",
            )

        generated = model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_length=req.max_length,
            num_beams=4,
            early_stopping=True,
        )

        translation = tokenizer.decode(generated[0], skip_special_tokens=True)
        latency_ms = int((time.time() - start) * 1000)

        return TranslateResponse(
            translation=translation,
            model_id=MODEL_NAME,
            latency_ms=latency_ms,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Translation failed")
        raise HTTPException(status_code=500, detail=f"Translation failed: {exc}")


@router.get("/test")
async def test_translation():
    """Smoke-test endpoint: English to Spanish on a hardcoded sentence."""
    text = "The patient needs to take this medication twice daily for two weeks."
    source_lang = "eng_Latn"
    target_lang = "spa_Latn"

    if not _model_loaded:
        return {
            "status": "model_loading" if _model_loading else "model_not_available",
            "message": "Model is not ready yet",
        }

    test_req = TranslateRequest(
        text=text,
        source_lang=source_lang,
        target_lang=target_lang,
    )
    result = await translate(test_req)
    return TestResponse(
        translation=result.translation,
        model_id=result.model_id,
        latency_ms=result.latency_ms,
        input_text=text,
    )
