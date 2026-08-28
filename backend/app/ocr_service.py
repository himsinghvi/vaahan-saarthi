"""OCR for uploaded RC / document images and PDFs.

Uses OCR.space (free tier — register at ocr.space for a key, or use demo key).
Falls back to Azure OpenAI vision when configured and OCR.space fails.
"""
from __future__ import annotations
import base64
import json
import logging
import mimetypes
import urllib.request

from .config import get_settings

log = logging.getLogger(__name__)

OCR_SPACE_URL = "https://api.ocr.space/parse/image"


def _mime_for(filename: str, content_type: str | None) -> str:
    if content_type and content_type != "application/octet-stream":
        return content_type
    guessed, _ = mimetypes.guess_type(filename or "")
    return guessed or "application/octet-stream"


def _ocr_space(content: bytes, filename: str, mime: str) -> str:
    s = get_settings()
    api_key = s.ocr_space_api_key or "helloworld"

    boundary = "----VaahanSaarthiOCR7MA4YWxk"
    body_parts: list[bytes] = []

    def add_field(name: str, value: str) -> None:
        body_parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode()
        )

    add_field("apikey", api_key)
    add_field("language", "eng")
    add_field("isOverlayRequired", "false")
    add_field("OCREngine", "2")
    add_field("detectOrientation", "true")
    add_field("scale", "true")
    if mime == "application/pdf":
        add_field("filetype", "PDF")

    safe_name = (filename or "upload").replace('"', "")
    body_parts.append(
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{safe_name}\"\r\n"
        f"Content-Type: {mime}\r\n\r\n".encode()
    )
    body_parts.append(content)
    body_parts.append(f"\r\n--{boundary}--\r\n".encode())
    body = b"".join(body_parts)

    req = urllib.request.Request(
        OCR_SPACE_URL,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode())

    if data.get("IsErroredOnProcessing"):
        raise RuntimeError(data.get("ErrorMessage") or "OCR.space processing error")

    chunks: list[str] = []
    for block in data.get("ParsedResults") or []:
        txt = (block.get("ParsedText") or "").strip()
        if txt:
            chunks.append(txt)
    return "\n".join(chunks)


def _azure_vision_ocr(content: bytes, mime: str) -> str:
    s = get_settings()
    if not s.azure_enabled:
        raise RuntimeError("Azure OpenAI not configured")

    from openai import AzureOpenAI

    client = AzureOpenAI(
        api_key=s.azure_openai_api_key,
        azure_endpoint=s.azure_openai_endpoint.rstrip("/"),
        api_version=s.azure_openai_api_version,
    )
    b64 = base64.b64encode(content).decode()
    data_url = f"data:{mime};base64,{b64}"
    deployment = s.azure_openai_deployment

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Extract ALL visible text from this Indian vehicle document image/PDF page. "
                        "Return plain text only — preserve labels, numbers, dates and line breaks. "
                        "Do not summarize."
                    ),
                },
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        }
    ]
    try:
        resp = client.chat.completions.create(
            model=deployment,
            messages=messages,
            max_completion_tokens=4000,
        )
    except Exception:
        resp = client.chat.completions.create(
            model=deployment,
            messages=messages,
            max_tokens=4000,
        )
    return (resp.choices[0].message.content or "").strip()


def ocr_bytes(content: bytes, filename: str = "upload", content_type: str | None = None) -> tuple[str, str]:
    """Run OCR on file bytes. Returns (text, engine_name)."""
    if not content:
        raise ValueError("Empty file")

    mime = _mime_for(filename, content_type)
    if mime not in ("application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"):
        # Still attempt — OCR.space accepts many formats
        pass

    # PDF and images via OCR.space
    try:
        text = _ocr_space(content, filename, mime)
        if text.strip():
            return text, "ocr.space"
    except Exception as exc:
        log.warning("OCR.space failed: %s", exc)

    # Vision fallback for images only (PDF vision support varies)
    if mime.startswith("image/"):
        try:
            text = _azure_vision_ocr(content, mime)
            if text.strip():
                return text, "azure-vision"
        except Exception as exc:
            log.warning("Azure vision OCR failed: %s", exc)

    raise RuntimeError(
        "Could not read text from this file. Try a clearer photo or PDF, "
        "or register a free key at ocr.space and set OCR_SPACE_API_KEY in backend/.env"
    )
