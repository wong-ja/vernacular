# apps/inference/main.py
"""Vernacular inference sidecar — Python/FastAPI.
Serves ASR (Whisper), translation (NLLB-200), and TTS models.
Self-hosted only. No external API calls.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Vernacular Inference Sidecar",
    version="0.1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "inference", "models_loaded": []}
