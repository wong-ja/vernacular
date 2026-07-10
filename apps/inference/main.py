"""Vernacular inference sidecar — Python/FastAPI.
Serves ASR (Whisper), translation (NLLB-200), and TTS models.
Self-hosted only. No external API calls.
"""

import asyncio
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.translation import router as translation_router, load_model as load_translation_model
from src.transcription import router as transcription_router, load_model as load_transcription_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Vernacular inference sidecar ...")
    # Kick off model loading in background (non-blocking)
    # Order: NLLB-200 first (larger), then Whisper
    asyncio.create_task(load_translation_model())
    asyncio.create_task(load_transcription_model())
    yield
    logger.info("Shutting down Vernacular inference sidecar.")


app = FastAPI(
    title="Vernacular Inference Sidecar",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translation_router)
app.include_router(transcription_router)

_models_loaded: list[str] = []


@app.get("/health")
async def health():
    from src.translation import _model_loaded as nllb_loaded, MODEL_NAME
    from src.transcription import _model_loaded as whisper_loaded

    loaded = []
    if nllb_loaded:
        loaded.append(MODEL_NAME)
    if whisper_loaded:
        loaded.append("faster-whisper-large-v3")
    return {"status": "ok", "service": "inference", "models_loaded": loaded}
