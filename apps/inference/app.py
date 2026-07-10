"""Vernacular inference — Gradio app for HF Spaces ZeroGPU.
Serves NLLB-200 translation + Whisper transcription via Gradio UI and API.
"""

import os
import time
import json
import logging
import re

# ---------------------------------------------------------------------------
# Monkey-patches for Gradio 4.44.1 + ZeroGPU bugs
# ---------------------------------------------------------------------------

# Patch: gradio_client JSON schema — bool values crash schema parser
import gradio_client.utils as _gc_utils

_orig_json_schema_to_python_type = _gc_utils._json_schema_to_python_type


def _patched_json_schema_to_python_type(schema, defs):
    if isinstance(schema, bool):
        return "boolean"
    return _orig_json_schema_to_python_type(schema, defs)


_gc_utils._json_schema_to_python_type = _patched_json_schema_to_python_type

_orig_get_type = _gc_utils.get_type


def _patched_get_type(schema):
    if isinstance(schema, bool):
        return "any"
    return _orig_get_type(schema)


_gc_utils.get_type = _patched_get_type

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------

import gradio as gr
from spaces import GPU

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Language data
# ---------------------------------------------------------------------------

_SUPPORTED_LANGUAGES = [
    ("English", "eng_Latn"),
    ("Spanish", "spa_Latn"),
    ("Tagalog", "tgl_Latn"),
    ("Cantonese", "yue_Hant"),
    ("Hmong", "hmn_Latn"),
    ("Chinese (Simplified)", "zho_Hans"),
    ("Chinese (Traditional)", "zho_Hant"),
    ("Vietnamese", "vie_Latn"),
    ("Korean", "kor_Hang"),
    ("Japanese", "jpn_Jpan"),
    ("Arabic", "ara_Arab"),
    ("Khmer", "khm_Khmr"),
    ("Burmese", "mya_Mymr"),
    ("Ilocano", "ilo_Latn"),
    ("Cebuano", "ceb_Latn"),
    ("Waray", "war_Latn"),
]

_MODEL_SIZES = {
    "600M": "facebook/nllb-200-distilled-600M",
    "1.3B": "facebook/nllb-200-1.3B",
    "3.3B": "facebook/nllb-200-3.3B",
}
DEFAULT_SIZE = os.environ.get("NLLB_MODEL_SIZE", "600M")
NLLB_MODEL_ID = _MODEL_SIZES.get(DEFAULT_SIZE, _MODEL_SIZES["600M"])

_HALLUCINATION_RE = re.compile(r"(\b\w+\b)(?:\s+\1){2,}", re.IGNORECASE)

# ---------------------------------------------------------------------------
# GPU-accelerated functions
# ---------------------------------------------------------------------------

_translation_cache = {}
_whisper_cache = {}


@GPU
def translate(text, source_lang, target_lang):
    """Translate text from source_lang to target_lang using NLLB-200."""
    global _translation_cache

    if not text.strip():
        return "", 0

    if "model" not in _translation_cache:
        import torch
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        logger.info("Loading NLLB-200: %s", NLLB_MODEL_ID)
        _translation_cache["tokenizer"] = AutoTokenizer.from_pretrained(NLLB_MODEL_ID)
        _translation_cache["model"] = AutoModelForSeq2SeqLM.from_pretrained(
            NLLB_MODEL_ID,
            torch_dtype=torch.float16,
            device_map="auto",
            low_cpu_mem_usage=True,
        )
        logger.info("NLLB-200 loaded")

    tokenizer = _translation_cache["tokenizer"]
    model = _translation_cache["model"]

    start = time.time()
    inputs = tokenizer(
        text,
        src_lang=source_lang,
        return_tensors="pt",
        truncation=True,
        max_length=1024,
    )
    forced_bos = tokenizer.lang_code_to_id.get(target_lang)
    if forced_bos is None:
        raise gr.Error(f"Unsupported target language code: {target_lang}")

    generated = model.generate(
        **inputs,
        forced_bos_token_id=forced_bos,
        max_length=512,
        num_beams=4,
        early_stopping=True,
    )
    translation = tokenizer.decode(generated[0], skip_special_tokens=True)
    latency = int((time.time() - start) * 1000)
    return translation, latency


@GPU
def transcribe(audio_path, source_lang):
    """Transcribe audio file using faster-whisper."""
    global _whisper_cache

    if not audio_path or not os.path.exists(audio_path):
        return json.dumps({"error": "No audio file provided"}), 0

    if "model" not in _whisper_cache:
        from faster_whisper import WhisperModel

        logger.info("Loading faster-whisper large-v3...")
        _whisper_cache["model"] = WhisperModel(
            "large-v3", device="cuda", compute_type="float16"
        )
        logger.info("faster-whisper loaded")

    model = _whisper_cache["model"]

    start = time.time()
    segments, info = model.transcribe(
        audio_path,
        language=source_lang or None,
        word_timestamps=True,
    )
    seg_list = list(segments)
    result = []
    for seg in seg_list:
        t = seg.text.strip()
        if not t:
            continue
        conf = max(-3.0, min(0.0, seg.avg_logprob if seg.avg_logprob is not None else 0.0))
        result.append({
            "text": t,
            "start": seg.start,
            "end": seg.end,
            "confidence": round((conf + 3.0) / 3.0, 4),
            "is_low_confidence": conf < -0.7,
            "potentially_hallucinated": bool(_HALLUCINATION_RE.search(t)),
        })
    avg_conf = sum(s["confidence"] for s in result) / len(result) if result else 0.0
    latency = int((time.time() - start) * 1000)
    output = {
        "segments": result,
        "detected_language": info.language,
        "overall_confidence": round(avg_conf, 4),
        "model_used": "faster-whisper-large-v3",
        "latency_ms": latency,
    }
    return json.dumps(output, indent=2), latency


# ---------------------------------------------------------------------------
# Gradio UI
# ---------------------------------------------------------------------------

CUSTOM_CSS = """footer { display: none !important; }"""

with gr.Blocks(
    title="Vernacular Inference",
    theme=gr.themes.Soft(),
    css=CUSTOM_CSS,
) as demo:
    gr.Markdown(
        "# Vernacular Inference\n"
        "NLLB-200 translation + faster-whisper transcription. "
        "Models load on first request."
    )

    with gr.Tab("Translate"):
        with gr.Row():
            src_lang = gr.Dropdown(
                choices=_SUPPORTED_LANGUAGES,
                label="Source language",
                value="eng_Latn",
            )
            tgt_lang = gr.Dropdown(
                choices=_SUPPORTED_LANGUAGES,
                label="Target language",
                value="spa_Latn",
            )
        text_input = gr.Textbox(
            label="Text to translate",
            lines=5,
            placeholder="Enter text to translate...",
        )
        with gr.Row():
            translate_btn = gr.Button("Translate", variant="primary", scale=1)
            clear_btn = gr.Button("Clear", scale=0)
        text_output = gr.Textbox(label="Translation", lines=5, interactive=False)
        latency_out = gr.Number(label="Latency (ms)", interactive=False)

        translate_btn.click(
            translate,
            inputs=[text_input, src_lang, tgt_lang],
            outputs=[text_output, latency_out],
            api_name="translate",
        )
        clear_btn.click(lambda: ("", 0), outputs=[text_output, latency_out])

    with gr.Tab("Transcribe"):
        audio_input = gr.Audio(type="filepath", label="Upload or record audio")
        lang_opts = gr.Dropdown(
            choices=[("Auto-detect", "")] + _SUPPORTED_LANGUAGES,
            label="Language (optional)",
            value="",
        )
        with gr.Row():
            transcribe_btn = gr.Button("Transcribe", variant="primary", scale=1)
            clear_btn2 = gr.Button("Clear", scale=0)
        json_output = gr.Textbox(label="Result (JSON)", lines=12, interactive=False)
        latency_out2 = gr.Number(label="Latency (ms)", interactive=False)

        transcribe_btn.click(
            transcribe,
            inputs=[audio_input, lang_opts],
            outputs=[json_output, latency_out2],
            api_name="transcribe",
        )
        clear_btn2.click(lambda: ("", 0), outputs=[json_output, latency_out2])

demo.queue()

if __name__ == "__main__":
    demo.launch(share=True)
