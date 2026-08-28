"""Vehicle lookup by registration number and field extraction from RC OCR text."""
from __future__ import annotations
import re
from datetime import date, timedelta
from typing import Any

from .llm_extract import extract_json
from .ocr_service import ocr_bytes
from .rto_codes import find_reg_in_text, normalize_reg, parse_rto
from .search import format_for_prompt, web_search

# Public reference records (demo plates + commonly searched examples)
KNOWN_REGISTRY: dict[str, dict[str, Any]] = {
    "MH12AB1234": {
        "registration_number": "MH12AB1234",
        "make": "Hyundai", "model": "Creta", "variant": "SX(O) Turbo",
        "fuel_type": "Petrol", "registration_date": "2022-06-12",
        "owner_name": "Himanshu", "rto": "Pune (MH12)", "state": "Maharashtra",
        "hypothecation": True, "financier": "HDFC Bank",
        "engine_number": "••••MASKED", "chassis_number": "••••MASKED",
    },
    "MH12CD5678": {
        "registration_number": "MH12CD5678",
        "make": "Honda", "model": "Activa 6G", "variant": "STD",
        "fuel_type": "Petrol", "registration_date": "2020-03-04",
        "owner_name": "Priya", "rto": "Pune (MH12)", "state": "Maharashtra",
        "hypothecation": False, "financier": None,
        "engine_number": "••••MASKED", "chassis_number": "••••MASKED",
    },
    "MH14EV0099": {
        "registration_number": "MH14EV0099",
        "make": "Tata", "model": "Nexon EV", "variant": "Max XZ+",
        "fuel_type": "EV", "registration_date": "2024-01-20",
        "owner_name": "Himanshu", "rto": "Pimpri-Chinchwad (MH14)", "state": "Maharashtra",
        "hypothecation": False, "financier": None,
        "engine_number": "••••MASKED", "chassis_number": "••••MASKED",
    },
}

_FUEL_MAP = {
    "PETROL": "Petrol", "DIESEL": "Diesel", "CNG": "CNG", "LPG": "CNG",
    "ELECTRIC": "EV", "EV": "EV", "BATTERY": "EV", "HYBRID": "Hybrid",
    "PETROL/CNG": "CNG", "DIESEL/CNG": "CNG",
}

_RC_FIELD_PATTERNS: list[tuple[str, str]] = [
    ("owner_name", r"(?:Owner(?:'?s)?\s*Name|Registered\s*Owner)\s*[:\-]?\s*([A-Z][A-Za-z\s\.]{2,50}?)(?:\s*\n|\s*(?:Maker|Manufacturer|Reg|Model|Fuel|Chassis|Engine)\b)"),
    ("make", r"(?:Maker(?:'?s)?|Manufacturer|Make)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s\.\/&\-]{2,50}?)(?:\s*\n|\s*(?:Model|Reg|Fuel|Chassis|Engine|Owner)\b)"),
    ("model", r"(?:Model(?:\s*Name)?)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s\.\+\-]{1,40}?)(?:\s*\n|\s*(?:Fuel|Reg|Chassis|Engine|Owner|Maker|Colour|Color)\b)"),
    ("fuel_type", r"(?:Fuel(?:\s*Type)?|Fuel\s*Used)\s*[:\-]?\s*([A-Za-z/+\s]{3,18}?)(?:\s*\n|\s*(?:Reg|Model|Chassis|Engine|Owner|Maker|Colour|Color)\b)"),
    ("registration_date", r"(?:Reg(?:n|istration)?\.?\s*Date|Date\s*of\s*Reg(?:istration)?)\s*[:\-]?\s*(\d{1,2}[\-/\.]\d{1,2}[\-/\.]\d{2,4})"),
    ("engine_number", r"(?:Engine(?:\s*No\.?|\s*Number)?)\s*[:\-]?\s*([A-Z0-9]{5,20})"),
    ("chassis_number", r"(?:Chassis(?:\s*No\.?|\s*Number)?)\s*[:\-]?\s*([A-Z0-9]{5,20})"),
    ("financier", r"(?:Financier|Financer|Hypothecation\s*(?:by|to)?)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s\.\-&]{2,40}?)(?:\s*\n|\s*(?:Reg|Model|Owner)\b)"),
    ("variant", r"(?:Variant|Trim|Sub[\-\s]?Model)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s\.\+\-]{1,30}?)(?:\s*\n|\s*(?:Fuel|Reg|Model)\b)"),
]

_DOC_TYPE_KEYWORDS = {
    "Insurance": ["insurance", "policy", "idv", "premium", "insured", "insurer", "cover note"],
    "PUC": ["pollution", "puc", "emission", "pollution under control", "pucc"],
    "RC": ["registration certificate", "certificate of registration", "regn certificate", "form 23"],
    "Invoice": ["tax invoice", "invoice", "bill of supply", "dealer invoice"],
    "Driving Licence": ["driving licence", "driving license", "dl no", "licence to drive"],
}


def _clean_val(val: str) -> str:
    return re.sub(r"\s+", " ", val).strip(" .:-\n\t")


def _normalize_fuel(raw: str) -> str:
    key = raw.upper().strip()
    for k, v in _FUEL_MAP.items():
        if k in key:
            return v
    return "Petrol"


def _normalize_date(raw: str) -> str:
    raw = raw.strip().replace(".", "-").replace("/", "-")
    parts = raw.split("-")
    if len(parts) != 3:
        return raw
    d, m, y = parts
    if len(y) == 2:
        y = "20" + y if int(y) < 50 else "19" + y
    try:
        return date(int(y), int(m), int(d)).isoformat()
    except ValueError:
        try:
            return date(int(y), int(d), int(m)).isoformat()
        except ValueError:
            return raw


def _regex_extract_rc(text: str) -> dict[str, Any]:
    upper = text.upper()
    out: dict[str, Any] = {}

    reg = find_reg_in_text(text)
    if reg:
        out["registration_number"] = reg

    for field, pattern in _RC_FIELD_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = _clean_val(m.group(1))
            if field == "fuel_type":
                out[field] = _normalize_fuel(val)
            elif field == "registration_date":
                out[field] = _normalize_date(val)
            elif field == "make":
                # Trim common suffixes from maker description
                val = re.sub(r"\s*(LTD|LIMITED|PVT|PRIVATE|INDIA|MOTOR).*$", "", val, flags=re.I).strip()
                out[field] = val.title() if val.isupper() else val
            else:
                out[field] = val

    if "hypothecation" not in out:
        if re.search(r"hypothec|financier|financer|hire purchase|loan", upper):
            out["hypothecation"] = True

    rto_info = parse_rto(out.get("registration_number") or find_reg_in_text(text) or "")
    if rto_info.get("state") and "state" not in out:
        out["state"] = rto_info["state"]
    if rto_info.get("rto") and "rto" not in out:
        out["rto"] = rto_info["rto"]

    return out


def _llm_extract_rc(text: str, reg_hint: str = "") -> dict[str, Any]:
    system = (
        "You extract structured fields from Indian vehicle Registration Certificate (RC) OCR text. "
        "Return JSON with keys: registration_number, owner_name, make, model, variant, fuel_type "
        "(one of Petrol/Diesel/CNG/EV/Hybrid), registration_date (YYYY-MM-DD), engine_number, "
        "chassis_number, financier, hypothecation (boolean), state, rto. "
        "Use null for unknown fields. Normalize registration number without spaces."
    )
    user = f"Registration hint: {reg_hint or 'unknown'}\n\nOCR TEXT:\n{text[:6000]}"
    data = extract_json(system, user)
    return data or {}


def _llm_extract_from_search(reg: str, context: str) -> dict[str, Any]:
    system = (
        "You extract Indian vehicle registration details from web search snippets. "
        "Return JSON: registration_number, make, model, variant, fuel_type "
        "(Petrol/Diesel/CNG/EV/Hybrid), registration_date (YYYY-MM-DD or null), "
        "owner_name (may be masked), state, rto, hypothecation (bool), financier. "
        "Only include values clearly supported by the snippets; use null if uncertain."
    )
    user = f"Registration number: {reg}\n\nWEB SNIPPETS:\n{context[:5000]}"
    return extract_json(system, user) or {}


def _merge_fields(*dicts: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for d in dicts:
        for k, v in d.items():
            if v is None or v == "":
                continue
            if k not in out or out[k] in (None, "", "Unknown"):
                out[k] = v
    return out


def _confidence(fields: dict[str, Any], source: str) -> int:
    score = 40
    if source == "registry":
        return 95
    if fields.get("make") and fields.get("model"):
        score += 25
    if fields.get("registration_number"):
        score += 10
    if fields.get("fuel_type"):
        score += 5
    if fields.get("owner_name"):
        score += 5
    if fields.get("registration_date"):
        score += 5
    if source == "ocr+llm":
        score += 10
    if source == "web+llm":
        score += 8
    return min(score, 98)


def lookup_by_registration(registration_number: str) -> dict[str, Any]:
    """Lookup vehicle details from registration number using registry → web → RTO inference."""
    reg = normalize_reg(registration_number)
    if len(reg) < 6:
        raise ValueError("Invalid registration number")

    if reg in KNOWN_REGISTRY:
        fields = dict(KNOWN_REGISTRY[reg])
        return {
            "extracted": fields,
            "confidence": _confidence(fields, "registry"),
            "source": "registry",
        }

    rto_info = parse_rto(reg)
    fields: dict[str, Any] = {
        "registration_number": reg,
        "state": rto_info.get("state"),
        "rto": rto_info.get("rto"),
    }

    query = f"{reg} India vehicle RC registration details make model fuel type VAHAN"
    answer, results = web_search(query, max_results=6)
    context = format_for_prompt(answer, results)

    if context and context != "No live results found.":
        web_fields = _llm_extract_from_search(reg, context)
        if not web_fields:
            # Regex fallback from snippets
            joined = context
            regex = _regex_extract_rc(joined)
            web_fields = regex
        fields = _merge_fields(fields, web_fields)

    if not fields.get("make"):
        fields.setdefault("make", "Unknown")
        fields.setdefault("model", "Unknown")
        fields.setdefault("fuel_type", "Petrol")

    source = "web+llm" if context else "rto-inference"
    return {
        "extracted": fields,
        "confidence": _confidence(fields, source),
        "source": source,
    }


def extract_rc_from_upload(content: bytes, filename: str, content_type: str | None) -> dict[str, Any]:
    """OCR an RC upload and extract vehicle fields."""
    text, engine = ocr_bytes(content, filename, content_type)
    regex_fields = _regex_extract_rc(text)
    reg_hint = regex_fields.get("registration_number") or find_reg_in_text(text) or ""

    llm_fields = _llm_extract_rc(text, reg_hint)
    fields = _merge_fields(regex_fields, llm_fields)

    if not fields.get("registration_number") and reg_hint:
        fields["registration_number"] = reg_hint

    # If we found a reg number, enrich with lookup (registry / web) for missing make/model
    reg = fields.get("registration_number")
    if reg:
        lookup = lookup_by_registration(reg)
        lookup_data = lookup.get("extracted") or {}
        # Prefer OCR values over lookup for owner/engine/chassis; prefer lookup for make/model if OCR weak
        enrich: dict[str, Any] = {}
        for k in ("make", "model", "variant", "fuel_type", "state", "rto", "registration_date"):
            if not fields.get(k) or fields.get(k) == "Unknown":
                if lookup_data.get(k):
                    enrich[k] = lookup_data[k]
        fields = _merge_fields(enrich, fields)

    source = f"{engine}+extract"
    return {
        "extracted": fields,
        "confidence": _confidence(fields, "ocr+llm" if llm_fields else "ocr"),
        "source": source,
        "ocr_engine": engine,
        "ocr_preview": text[:500],
    }


def classify_document(text: str) -> str:
    lower = text.lower()
    scores = {k: sum(1 for w in words if w in lower) for k, words in _DOC_TYPE_KEYWORDS.items()}
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "RC"


def extract_document_fields(text: str, doc_type: str | None = None) -> dict[str, Any]:
    """Extract metadata from insurance / PUC / RC / invoice OCR text."""
    dtype = doc_type or classify_document(text)
    regex = _regex_extract_rc(text)

    system = (
        "Extract fields from an Indian vehicle document OCR. "
        "Return JSON with keys: type (Insurance/PUC/RC/Invoice/Driving Licence), "
        "registration_number, insurer_or_authority, policy_number, "
        "start_date (YYYY-MM-DD), expiry_date (YYYY-MM-DD), "
        "vehicle_make, vehicle_model. Use null when unknown."
    )
    user = f"Expected type hint: {dtype}\n\nOCR:\n{text[:6000]}"
    llm = extract_json(system, user) or {}

    out = _merge_fields({"type": dtype}, regex, llm)
    if not out.get("type"):
        out["type"] = dtype

    # Default expiry heuristics by type
    if not out.get("expiry_date"):
        today = date.today()
        if out["type"] == "Insurance":
            out["expiry_date"] = (today + timedelta(days=365)).isoformat()
            out.setdefault("start_date", today.isoformat())
        elif out["type"] == "PUC":
            out["expiry_date"] = (today + timedelta(days=180)).isoformat()
        elif out["type"] == "RC":
            out["expiry_date"] = (today + timedelta(days=365 * 15)).isoformat()

    if not out.get("insurer_or_authority"):
        if out["type"] == "Insurance":
            out["insurer_or_authority"] = "Detected from document"
        elif out["type"] == "PUC":
            out["insurer_or_authority"] = "PUC Centre"
        elif out["type"] == "RC":
            out["insurer_or_authority"] = out.get("rto") or "RTO"

    if not out.get("policy_number"):
        m = re.search(r"(?:Policy|Certificate|PUC|RC)\s*(?:No\.?|Number)?\s*[:\-]?\s*([A-Z0-9\-/]{6,20})", text, re.I)
        if m:
            out["policy_number"] = m.group(1)

    return out


def process_document_upload(content: bytes, filename: str, content_type: str | None) -> dict[str, Any]:
    text, engine = ocr_bytes(content, filename, content_type)
    extracted = extract_document_fields(text)
    return {
        "extracted": extracted,
        "confidence": _confidence(extracted, "ocr+llm"),
        "source": f"{engine}+document",
        "ocr_engine": engine,
        "ocr_preview": text[:400],
    }
