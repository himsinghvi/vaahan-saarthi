"""Runtime-configurable LLM model registry.

Lets the user pick which model/deployment is used for ALL LLM calls at runtime
(via the Settings page), without restarting the server. The default comes from
the AZURE_OPENAI_DEPLOYMENT env var.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from .config import get_settings


@dataclass
class ModelOption:
    id: str            # deployment / model name sent to the API
    label: str         # friendly display name
    provider: str      # azure-openai / openai / etc.
    family: str        # gpt / codex / reasoning ...
    description: str = ""
    config: dict = field(default_factory=dict)


# Catalog of selectable models. `id` must match your Azure deployment name
# (or model name) for the call to succeed.
_CATALOG: list[ModelOption] = [
    ModelOption("gpt-5.4", "GPT-5.4", "azure-openai", "gpt", "Latest flagship, best reasoning & synthesis."),
    ModelOption("gpt-4o", "GPT-4o", "azure-openai", "gpt", "Fast, multimodal, great all-rounder."),
    ModelOption("gpt-4o-mini", "GPT-4o mini", "azure-openai", "gpt", "Cheaper & faster for simple queries."),
    ModelOption("gpt-4.1", "GPT-4.1", "azure-openai", "gpt", "Strong long-context reasoning."),
    ModelOption("o4-mini", "o4-mini (reasoning)", "azure-openai", "reasoning", "Reasoning-optimized, step-by-step."),
    ModelOption("codex", "Codex", "azure-openai", "codex", "Code-focused model for technical tasks."),
]

# IDs seeded at startup — used only for UI labelling, not delete restrictions.
_BUILTIN_IDS: set[str] = {m.id for m in _CATALOG}


class ModelRegistry:
    def __init__(self) -> None:
        self._selected = get_settings().azure_openai_deployment or "gpt-4o"

    @property
    def selected(self) -> str:
        return self._selected

    def set_selected(self, model_id: str) -> str:
        self._selected = model_id.strip()
        if not any(m.id == self._selected for m in _CATALOG) and self._selected:
            _CATALOG.append(ModelOption(
                self._selected, self._selected, "azure-openai", "custom",
                "Custom model / deployment.",
            ))
        return self._selected

    def add_model(self, opt: ModelOption) -> None:
        if not any(m.id == opt.id for m in _CATALOG):
            _CATALOG.append(opt)

    def delete_model(self, model_id: str) -> None:
        mid = model_id.strip()
        if not any(m.id == mid for m in _CATALOG):
            raise ValueError("Model not found")
        if len(_CATALOG) <= 1:
            raise ValueError("At least one model must remain in your config")
        # Mutate in place so all module references stay valid.
        _CATALOG[:] = [m for m in _CATALOG if m.id != mid]
        if self._selected == mid:
            fallback = next((m.id for m in _CATALOG if m.id == "gpt-4o"), _CATALOG[0].id)
            self._selected = fallback

    def is_builtin(self, model_id: str) -> bool:
        return model_id in _BUILTIN_IDS

    def options(self) -> list[ModelOption]:
        return list(_CATALOG)

    def selected_option(self) -> ModelOption:
        return next((m for m in _CATALOG if m.id == self._selected),
                    ModelOption(self._selected, self._selected, "azure-openai", "custom"))


registry = ModelRegistry()
