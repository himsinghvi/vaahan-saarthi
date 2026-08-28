"""Agentic AI layer.

An orchestrator classifies the user's intent and routes to one of several
specialized agents. Each agent builds context from the user's garage and
produces a grounded reply plus contextual action cards.

When Azure OpenAI is configured, the orchestrator uses the LLM for intent
classification + natural language generation. Otherwise it falls back to a
deterministic, still-useful rule-based engine so the app works out of the box.
"""
from __future__ import annotations
import json
import re
from dataclasses import dataclass, field
from typing import Optional

from .config import get_settings
from .schemas import ActionCard, ChatResponse, Source
from .store import store
from .search import web_search, format_for_prompt
from .models_registry import registry


INTENTS = [
    "BUY_VEHICLE", "RTO", "DOCUMENT", "INSURANCE", "CHALLAN",
    "MAINTENANCE", "ACCIDENT", "SELL", "SCRAP", "TRAVEL", "GENERAL",
]

AGENT_FOR_INTENT = {
    "BUY_VEHICLE": "Buying Advisor Agent",
    "RTO": "RTO Rules Agent",
    "DOCUMENT": "Document Agent",
    "INSURANCE": "Insurance Agent",
    "CHALLAN": "Compliance Agent",
    "MAINTENANCE": "Maintenance Agent",
    "ACCIDENT": "Accident Assistant Agent",
    "SELL": "Selling Agent",
    "SCRAP": "Scrapping Agent",
    "TRAVEL": "Travel Agent",
    "GENERAL": "Vehicle Intelligence Agent",
}

_KEYWORDS = {
    "BUY_VEHICLE": ["buy", "which car", "should i buy", "ev or petrol", "budget", "recommend", "new car", "purchase"],
    "RTO": ["rto", "transfer", "ownership", "noc", "registration", "re-register", "address change", "hypothecation", "duplicate rc", "form 2", "form 3"],
    "DOCUMENT": ["document", "rc", "upload", "expiry", "digilocker", "extract"],
    "INSURANCE": ["insurance", "policy", "cover", "zero dep", "premium", "claim", "renew insurance"],
    "CHALLAN": ["challan", "fine", "penalty", "speeding", "violation", "e-challan"],
    "MAINTENANCE": ["service", "maintenance", "oil", "brake", "tyre", "battery", "sound", "noise"],
    "ACCIDENT": ["accident", "crash", "collision", "damage", "hit"],
    "SELL": ["sell", "resale", "worth", "value", "sale price"],
    "SCRAP": ["scrap", "deregister", "end of life", "rvsf", "old vehicle"],
    "TRAVEL": ["travel", "trip", "drive to", "road trip", "interstate", "goa", "highway"],
}

# Signals that the query needs current/real-world information → use web search.
_LIVE_KEYWORDS = [
    "latest", "current", "today", "now", "this year", "2024", "2025", "2026",
    "price", "prices", "cost of", "on-road price", "ex-showroom", "fuel price",
    "petrol price", "diesel price", "cng price", "electricity", "launch", "launched",
    "new model", "upcoming", "news", "recent", "rule", "rules", "policy", "notification",
    "subsidy", "fame", "incentive", "road tax", "interest rate", "compare", "vs",
    "best", "top", "review", "mileage of", "range of", "specifications", "specs",
    "available", "near me", "where", "how much is", "rate", "budget 2026", "gst",
]


def needs_live_data(message: str) -> bool:
    text = message.lower()
    return any(k in text for k in _LIVE_KEYWORDS)


@dataclass
class AgentResult:
    reply: str
    actions: list[ActionCard] = field(default_factory=list)


def _garage_context(user_id: str) -> str:
    vehicles = store.vehicles_for(user_id)
    if not vehicles:
        return "The user has no vehicles yet."
    lines = []
    for v in vehicles:
        pend = [c for c in store.challans_for(user_id, v.id) if c.status == "pending"]
        lines.append(
            f"- {v.make} {v.model} {v.variant} ({v.registration_number}), {v.fuel_type}, "
            f"{v.odometer_km} km, compliance {v.compliance_score}/100, health {v.health_score}/100, "
            f"PUC {v.compliance.puc}, insurance {v.compliance.insurance}, pending challans {len(pend)}"
        )
    return "User's garage:\n" + "\n".join(lines)


def _vehicle_context(user_id: str, vehicle_id: Optional[str]) -> str:
    if not vehicle_id:
        return _garage_context(user_id)
    v = store.get_vehicle(user_id, vehicle_id)
    if not v:
        return _garage_context(user_id)
    pend = [c for c in store.challans_for(user_id, v.id) if c.status == "pending"]
    return (
        f"Focused vehicle: {v.make} {v.model} {v.variant} ({v.registration_number}), "
        f"{v.fuel_type}, registered {v.registration_date}, {v.odometer_km} km, "
        f"RTO {v.rto}, state {v.state}. Compliance score {v.compliance_score}/100, "
        f"health {v.health_score}/100. PUC {v.compliance.puc}, insurance {v.compliance.insurance}. "
        f"Pending challans: {len(pend)}."
    )


def classify_intent(message: str) -> str:
    text = message.lower()
    scores = {intent: 0 for intent in INTENTS}
    for intent, words in _KEYWORDS.items():
        for w in words:
            if w in text:
                scores[intent] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "GENERAL"


# ---------- Specialized agents (fallback logic) ----------
def agent_buy(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            "I can match you with the best vehicles for your needs. For your typical "
            "profile (city-heavy driving), an EV or a fuel-efficient compact SUV usually "
            "wins on 5-year cost. Tell me your budget, monthly km and what matters most "
            "(mileage, safety, space), and I'll rank the top 3 with a match score and a "
            "clear 'why'."
        ),
        actions=[
            ActionCard(label="Open Vehicle Finder", icon="✨", route="/buy", kind="primary"),
            ActionCard(label="EV vs Petrol calculator", icon="⚡", route="/buy#fuel", kind="secondary"),
            ActionCard(label="EMI calculator", icon="💰", route="/buy#emi", kind="secondary"),
        ],
    )


def agent_rto(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            "RTO processes vary by state, so I personalise everything. Tell me the service "
            "(ownership transfer, NOC / interstate, address change, duplicate RC, "
            "hypothecation removal) and I'll generate the exact forms, documents and a "
            "step-by-step checklist for your state."
        ),
        actions=[
            ActionCard(label="Open RTO Workflow Engine", icon="🏛", route="/rto", kind="primary"),
            ActionCard(label="Ownership transfer", icon="🔁", route="/rto?service=transfer", kind="secondary"),
            ActionCard(label="Interstate / NOC", icon="🛣", route="/rto?service=noc", kind="secondary"),
        ],
    )


def agent_document(msg: str, v) -> AgentResult:
    expiring = [d for d in store.documents_for(v.user_id) if d.status in ("expiring", "expired")]
    lines = "\n".join(f"• {d.title} — {d.status} ({d.expiry_date})" for d in expiring[:4]) or "All documents look valid."
    return AgentResult(
        reply=(
            "Your Document Vault keeps every RC, insurance and PUC in one place with "
            f"auto expiry detection.\n\n{lines}\n\nUpload any RC or policy PDF and I'll "
            "OCR it, classify it and set a renewal reminder automatically."
        ),
        actions=[
            ActionCard(label="Open Document Vault", icon="🗂", route="/documents", kind="primary"),
            ActionCard(label="Upload & auto-extract", icon="📤", route="/documents#upload", kind="secondary"),
        ],
    )


def agent_insurance(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            f"For your {v.make} {v.model}, current cover includes Third-party, Own Damage "
            "and Zero Dep. Engine protection is not active — worth considering if you drive "
            "through waterlogged areas. I can analyse your policy PDF and answer 'what's "
            "covered vs not', or compare 3 renewal quotes."
        ),
        actions=[
            ActionCard(label="Open Insurance AI", icon="🛡", route="/insurance", kind="primary"),
            ActionCard(label="Analyse my policy", icon="🔍", route="/insurance#analyze", kind="secondary"),
        ],
    )


def agent_challan(msg: str, v) -> AgentResult:
    pend = [c for c in store.challans_for(v.user_id, v.id) if c.status == "pending"]
    total = sum(c.amount for c in pend)
    detail = "\n".join(f"• ₹{c.amount} — {c.offence} ({c.date})" for c in pend) or "No pending challans. 🎉"
    return AgentResult(
        reply=(
            f"You have {len(pend)} pending challan(s) totalling ₹{total} on "
            f"{v.registration_number}.\n\n{detail}\n\nI can explain each violation, the "
            "relevant rule and penalty, and guide you to pay or dispute."
        ),
        actions=[
            ActionCard(label="Open Challan Center", icon="🚨", route="/challans", kind="primary"),
            ActionCard(label="How to pay", icon="💳", route="/challans#pay", kind="secondary"),
        ],
    )


def agent_maintenance(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            f"Based on your {v.make} {v.model}'s age and {v.odometer_km:,} km, a brake pad "
            "inspection is recommended within ~2,000 km, and the next service is due in "
            "about 28 days (est. ₹8,000–₹12,000). Log fuel/service entries and I'll track "
            "mileage trends and predict upcoming costs."
        ),
        actions=[
            ActionCard(label="Open Maintenance Manager", icon="🔧", route="/maintenance", kind="primary"),
            ActionCard(label="Book a service", icon="📅", route="/maintenance#book", kind="secondary"),
        ],
    )


def agent_accident(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            "First — are you safe? If anyone is injured, call 112 immediately.\n\n"
            "Then I'll guide you step by step: 1) ensure safety, 2) photograph damage, "
            "number plates and location, 3) note the other vehicle's details, 4) check if "
            "a police report is needed, 5) start the insurance claim."
        ),
        actions=[
            ActionCard(label="Start Guided Process", icon="🚑", route="/accident", kind="primary"),
            ActionCard(label="Call insurance", icon="📞", route="/insurance", kind="secondary"),
        ],
    )


def agent_sell(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            f"Your {v.make} {v.model} has an estimated resale range around "
            f"₹{v.current_value/100000:.1f}L based on age, {v.odometer_km:,} km and current "
            "market. I can build a selling checklist (remove FASTag, close loan, RC "
            "transfer) and a step-by-step ownership-transfer tracker so it doesn't stay "
            "registered in your name."
        ),
        actions=[
            ActionCard(label="Open Sell Wizard", icon="💸", route="/sell", kind="primary"),
            ActionCard(label="Transfer tracker", icon="🔁", route="/sell#tracker", kind="secondary"),
        ],
    )


def agent_scrap(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            "I can check scrapping eligibility (age 15/20 yrs, fitness failure), find a "
            "nearby RVSF facility, estimate scrap value and walk you through "
            "deregistration and the Certificate of Deposit (usable for tax rebate on your "
            "next vehicle)."
        ),
        actions=[ActionCard(label="Open Scrapping Module", icon="♻️", route="/scrap", kind="primary")],
    )


def agent_travel(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            "Planning a trip? Before you leave I'll check insurance, PUC, tyres and coolant, "
            "remind you about FASTag and an emergency kit, and flag any state-specific "
            "requirements for interstate driving."
        ),
        actions=[ActionCard(label="Open Travel Assistant", icon="🧭", route="/travel", kind="primary")],
    )


def agent_general(msg: str, v) -> AgentResult:
    return AgentResult(
        reply=(
            f"I'm your AI vehicle companion. I know your {v.make} {v.model} inside out and "
            "can help with buying, RTO work, documents, insurance, challans, maintenance, "
            "selling and scrapping. What would you like to do?"
        ),
        actions=[
            ActionCard(label="Ask about my Creta", icon="🚗", route="/garage", kind="primary"),
            ActionCard(label="Check compliance", icon="✅", route="/dashboard", kind="secondary"),
        ],
    )


def agent_garage(message: str, intent: str, user_id: str) -> AgentResult:
    vehicles = store.vehicles_for(user_id)
    if not vehicles:
        return AgentResult(
            reply="Add a vehicle to your garage and I can help with everything about it.",
            actions=[ActionCard(label="Add a vehicle", icon="➕", route="/garage", kind="primary")],
        )
    names = ", ".join(f"{v.make} {v.model}" for v in vehicles)
    route_map = {
        "BUY_VEHICLE": "/buy", "RTO": "/rto", "DOCUMENT": "/documents",
        "INSURANCE": "/insurance", "CHALLAN": "/challans", "MAINTENANCE": "/maintenance",
        "ACCIDENT": "/accident", "SELL": "/sell", "SCRAP": "/scrap", "TRAVEL": "/travel",
    }
    route = route_map.get(intent, "/garage")
    if intent == "CHALLAN":
        pend = [c for c in store.challans_for(user_id) if c.status == "pending"]
        total = sum(c.amount for c in pend)
        extra = f"You have {len(pend)} pending challan(s) totalling ₹{total} across your garage."
    else:
        extra = f"I can see {len(vehicles)} vehicle(s): {names}."
    return AgentResult(
        reply=(
            f"{extra}\n\nOpen a vehicle profile for focused help on one vehicle, "
            "or tell me which registration number you're asking about."
        ),
        actions=[
            ActionCard(label="My Garage", icon="🚗", route="/garage", kind="primary"),
            ActionCard(label="Continue", icon="✨", route=route, kind="secondary"),
        ],
    )


_FALLBACK_AGENTS = {
    "BUY_VEHICLE": agent_buy, "RTO": agent_rto, "DOCUMENT": agent_document,
    "INSURANCE": agent_insurance, "CHALLAN": agent_challan, "MAINTENANCE": agent_maintenance,
    "ACCIDENT": agent_accident, "SELL": agent_sell, "SCRAP": agent_scrap,
    "TRAVEL": agent_travel, "GENERAL": agent_general,
}


class Orchestrator:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None
        if self.settings.azure_enabled:
            try:
                from openai import AzureOpenAI
                self._client = AzureOpenAI(
                    api_key=self.settings.azure_openai_api_key,
                    azure_endpoint=self.settings.azure_openai_endpoint,
                    api_version=self.settings.azure_openai_api_version,
                )
            except Exception:
                self._client = None

    def handle(self, message: str, vehicle_id: Optional[str], history: list, user_id: str) -> ChatResponse:
        intent = classify_intent(message)
        v = store.get_vehicle(user_id, vehicle_id) if vehicle_id else None

        if v:
            fallback = _FALLBACK_AGENTS.get(intent, agent_general)(message, v)
        else:
            fallback = agent_garage(message, intent, user_id)

        # Decide whether to pull live web data to ground the answer.
        use_search = self.settings.search_enabled and needs_live_data(message)
        sources: list[Source] = []
        search_context = ""
        if use_search:
            try:
                answer, results = web_search(self._search_query(message, v), max_results=5)
                if answer or results:
                    search_context = format_for_prompt(answer, results)
                    sources = [Source(title=r.title[:120], url=r.url) for r in results[:4] if r.url]
                else:
                    use_search = False
            except Exception:
                use_search = False

        if self._client is not None:
            try:
                reply = self._llm_reply(message, intent, vehicle_id, history, user_id, search_context)
                return ChatResponse(
                    intent=intent, agent=AGENT_FOR_INTENT.get(intent, "Agent"),
                    reply=reply, actions=fallback.actions,
                    powered_by=f"{registry.selected}" + ("+search" if use_search else ""),
                    used_search=use_search, sources=sources,
                )
            except Exception:
                pass  # fall through to rule-based reply

        # No LLM: if we have live search results, surface them directly.
        if use_search and search_context:
            reply = self._search_only_reply(message, search_context)
            return ChatResponse(
                intent=intent, agent=AGENT_FOR_INTENT.get(intent, "Agent"),
                reply=reply, actions=fallback.actions, powered_by="search",
                used_search=True, sources=sources,
            )

        return ChatResponse(intent=intent, agent=AGENT_FOR_INTENT.get(intent, "Agent"),
                            reply=fallback.reply, actions=fallback.actions, powered_by="fallback")

    def _search_query(self, message: str, v) -> str:
        # Bias generic queries toward India + vehicle context.
        q = message.strip()
        if v and any(w in message.lower() for w in ["my car", "my vehicle", "this car"]):
            q = f"{v.make} {v.model} {v.variant} {message}"
        if "india" not in q.lower():
            q = f"{q} India 2026"
        return q

    def _search_only_reply(self, message: str, search_context: str) -> str:
        # Simple, readable synthesis when no LLM is configured.
        return (
            "Here's the latest I found from the web:\n\n"
            + search_context
            + "\n\nNote: live web results — verify important figures on official sources."
        )

    def _llm_reply(self, message: str, intent: str, vehicle_id: Optional[str],
                   history: list, user_id: str, search_context: str = "") -> str:
        context = _vehicle_context(user_id, vehicle_id)
        system = (
            "You are Vaahan Saarthi, an expert, friendly AI companion for Indian vehicle owners. "
            "You cover the full lifecycle: buying, RTO/registration, documents, insurance, "
            "challans, maintenance, accidents, selling, ownership transfer and scrapping. "
            "Be concise, practical and India-specific (VAHAN, Sarathi, DigiLocker, RTO "
            "forms, state road tax). Never invent official confirmations; add a short "
            "disclaimer when data is AI-estimated. "
            "Format replies with short paragraphs, '- ' bullet lists for steps or facts, "
            "and **bold** for key labels. You may use ## or ### section titles sparingly "
            "(they will be rendered as styled headings). Do not use # top-level titles or --- dividers unless separating major sections. "
            f"Detected intent: {intent}. Context: {context}"
        )
        if vehicle_id:
            system += " Answer specifically about the focused vehicle in the context."
        else:
            system += " The user is asking at garage level — mention which vehicle if relevant, or compare across vehicles."
        if search_context:
            system += (
                "\n\nYou have LIVE WEB SEARCH RESULTS below. Use them to answer with "
                "current, accurate information and cite figures from them. If they conflict "
                "with your prior knowledge, prefer the live results.\n\n"
                f"LIVE RESULTS:\n{search_context}"
            )
        messages = [{"role": "system", "content": system}]
        for m in history[-6:]:
            role = m.role if hasattr(m, "role") else m.get("role")
            content = m.content if hasattr(m, "content") else m.get("content")
            messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})
        return self._chat_completion(messages)

    def _chat_completion(self, messages: list) -> str:
        """Call Azure OpenAI with the currently-selected model, handling both
        newer (max_completion_tokens, fixed temperature) and older (max_tokens,
        custom temperature) deployments."""
        model = registry.selected
        try:
            resp = self._client.chat.completions.create(
                model=model, messages=messages, max_completion_tokens=1200,
            )
        except Exception as e:
            msg = str(e).lower()
            if "max_completion_tokens" in msg or "max_tokens" in msg or "temperature" in msg or "unsupported" in msg:
                resp = self._client.chat.completions.create(
                    model=model, messages=messages, temperature=0.4, max_tokens=550,
                )
            else:
                raise
        return (resp.choices[0].message.content or "").strip()


orchestrator = Orchestrator()
