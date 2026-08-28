"""Provider schemas for adding custom LLM models."""
from __future__ import annotations

from fastapi import HTTPException

PROVIDER_SCHEMAS: dict[str, dict] = {
    "azure-openai": {
        "label": "Azure OpenAI",
        "icon": "☁️",
        "description": "Deployment on your Azure OpenAI / AI Foundry resource.",
        "id_field": "deployment_name",
        "fields": [
            {"key": "deployment_name", "label": "Deployment name", "type": "text", "required": True,
             "placeholder": "gpt-5.4", "help": "Exact deployment name — sent as the model parameter in API calls."},
            {"key": "endpoint", "label": "Endpoint URL", "type": "url", "required": False,
             "placeholder": "https://your-resource.openai.azure.com/",
             "help": "Optional. Leave blank to use AZURE_OPENAI_ENDPOINT from backend .env."},
            {"key": "api_version", "label": "API version", "type": "text", "required": False,
             "placeholder": "2024-08-01-preview", "default": "2024-08-01-preview"},
            {"key": "api_key", "label": "API key override", "type": "password", "required": False,
             "help": "Optional. Leave blank to use AZURE_OPENAI_API_KEY from .env."},
        ],
    },
    "openai": {
        "label": "OpenAI",
        "icon": "🟢",
        "description": "Direct OpenAI Platform models (gpt-4o, o-series, etc.).",
        "id_field": "model_id",
        "fields": [
            {"key": "model_id", "label": "Model ID", "type": "text", "required": True,
             "placeholder": "gpt-4o", "help": "e.g. gpt-4o, gpt-4o-mini, o3-mini"},
            {"key": "api_key", "label": "API key", "type": "password", "required": False,
             "help": "Optional runtime override. Prefer setting OPENAI_API_KEY in backend .env."},
            {"key": "organization", "label": "Organization ID", "type": "text", "required": False,
             "placeholder": "org-...", "help": "Optional OpenAI org header."},
            {"key": "base_url", "label": "Base URL", "type": "url", "required": False,
             "placeholder": "https://api.openai.com/v1", "default": "https://api.openai.com/v1"},
        ],
    },
    "anthropic": {
        "label": "Anthropic",
        "icon": "🟤",
        "description": "Claude models via the Anthropic API.",
        "id_field": "model_id",
        "fields": [
            {"key": "model_id", "label": "Model ID", "type": "text", "required": True,
             "placeholder": "claude-sonnet-4-20250514",
             "help": "Anthropic model string from your console."},
            {"key": "api_key", "label": "API key", "type": "password", "required": False,
             "help": "Optional override. Set ANTHROPIC_API_KEY in backend .env for production."},
            {"key": "api_version", "label": "API version header", "type": "text", "required": False,
             "placeholder": "2023-06-01", "default": "2023-06-01"},
            {"key": "max_tokens", "label": "Max output tokens", "type": "number", "required": False,
             "placeholder": "1200", "default": "1200"},
        ],
    },
    "google-gemini": {
        "label": "Google Gemini",
        "icon": "🔷",
        "description": "Gemini models via Google AI / Vertex.",
        "id_field": "model_id",
        "fields": [
            {"key": "model_id", "label": "Model ID", "type": "text", "required": True,
             "placeholder": "gemini-2.0-flash", "help": "e.g. gemini-2.0-flash, gemini-1.5-pro"},
            {"key": "api_key", "label": "API key", "type": "password", "required": False,
             "help": "Optional. Set GOOGLE_API_KEY or GEMINI_API_KEY in backend .env."},
            {"key": "project_id", "label": "GCP project (Vertex)", "type": "text", "required": False,
             "placeholder": "my-gcp-project", "help": "Only if using Vertex AI instead of AI Studio."},
            {"key": "location", "label": "Region (Vertex)", "type": "text", "required": False,
             "placeholder": "us-central1", "default": "us-central1"},
        ],
    },
    "openai-compatible": {
        "label": "OpenAI-compatible",
        "icon": "🔌",
        "description": "Any OpenAI-compatible endpoint (Groq, Together, local LM Studio, etc.).",
        "id_field": "model_id",
        "fields": [
            {"key": "base_url", "label": "Base URL", "type": "url", "required": True,
             "placeholder": "https://api.groq.com/openai/v1",
             "help": "Must expose /chat/completions compatible with OpenAI schema."},
            {"key": "model_id", "label": "Model ID", "type": "text", "required": True,
             "placeholder": "llama-3.3-70b-versatile"},
            {"key": "api_key", "label": "API key", "type": "password", "required": False,
             "help": "Bearer token for the compatible API."},
            {"key": "extra_headers", "label": "Extra headers (JSON)", "type": "textarea", "required": False,
             "placeholder": '{"HTTP-Referer": "https://vahanai.local"}',
             "help": "Optional JSON object of additional request headers."},
        ],
    },
}

SENSITIVE_KEYS = {"api_key", "api_secret", "secret"}


def list_providers() -> list[dict]:
    return [
        {"id": pid, "label": s["label"], "icon": s["icon"], "description": s["description"],
         "fields": s["fields"], "id_field": s["id_field"]}
        for pid, s in PROVIDER_SCHEMAS.items()
    ]


def sanitize_config(config: dict) -> dict:
    out = dict(config)
    for k in list(out.keys()):
        if any(s in k.lower() for s in SENSITIVE_KEYS) and out[k]:
            out[k] = "••••••" + str(out[k])[-4:] if len(str(out[k])) > 4 else "••••"
    return out


def build_model_from_request(provider: str, label: str, family: str, description: str, config: dict):
    from .models_registry import ModelOption

    schema = PROVIDER_SCHEMAS.get(provider)
    if not schema:
        raise HTTPException(400, f"Unknown provider: {provider}")

    cfg = {k: (v.strip() if isinstance(v, str) else v) for k, v in (config or {}).items() if v not in (None, "")}

    # Apply defaults
    for f in schema["fields"]:
        if f["key"] not in cfg and f.get("default"):
            cfg[f["key"]] = f["default"]

    missing = [f["label"] for f in schema["fields"] if f.get("required") and not cfg.get(f["key"])]
    if missing:
        raise HTTPException(400, f"Missing required fields: {', '.join(missing)}")

    id_field = schema["id_field"]
    model_id = cfg.get(id_field, "").strip()
    if not model_id:
        raise HTTPException(400, f"{id_field} is required")

    return ModelOption(
        id=model_id,
        label=label.strip() or model_id,
        provider=provider,
        family=family or "custom",
        description=description.strip() or schema["description"],
        config=cfg,
    )
