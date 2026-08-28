"""Structured JSON extraction via Azure OpenAI."""
from __future__ import annotations
import json
import re
from typing import Any

from .config import get_settings


def _azure_client():
    from openai import AzureOpenAI
    s = get_settings()
    return AzureOpenAI(
        api_key=s.azure_openai_api_key,
        azure_endpoint=s.azure_openai_endpoint.rstrip("/"),
        api_version=s.azure_openai_api_version,
    ), s.azure_openai_deployment


def extract_json(system: str, user: str, temperature: float = 0.1) -> dict[str, Any] | None:
    """Ask the LLM to return a single JSON object. Returns None on failure."""
    s = get_settings()
    if not s.azure_enabled:
        return None
    client, model = _azure_client()
    messages = [
        {"role": "system", "content": system + " Reply with valid JSON only — no markdown fences."},
        {"role": "user", "content": user},
    ]
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_completion_tokens=1200,
            response_format={"type": "json_object"},
        )
    except Exception:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=1200,
            )
        except Exception:
            return None

    raw = (resp.choices[0].message.content or "").strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None
