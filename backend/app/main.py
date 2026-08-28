"""Vaahan Saarthi FastAPI application — Vehicle Ownership Operating System for India."""
from __future__ import annotations
import logging
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .config import get_settings
from .store import store
from . import logic
from .ai import orchestrator
from . import documents_service
from . import vehicle_intel
from .rto_codes import normalize_reg
from .schemas import (
    Vehicle, Compliance, VehicleCreateByNumber, VehicleCreateManual, VehicleUpdate,
    Document, Expense, ChatRequest, ChatResponse, Reminder,
    BuyAdvisorRequest, BuyAdvisorResponse, FuelCalcRequest, FuelCalcResponse,
    OnRoadRequest, OnRoadResponse, EmiRequest, EmiResponse,
    RtoWorkflowRequest, RtoWorkflowResponse,
    AuthLoginRequest, AuthSignupRequest,
)
from .auth_rls import require_user, require_admin, stable_user_id, public_user, verify_login
from .credentials import RESERVED_EMAILS, DEMO_USER_ID

log = logging.getLogger(__name__)
settings = get_settings()
app = FastAPI(title="Vaahan Saarthi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_EMOJI = {"EV": "🚙", "Petrol": "🚗", "Diesel": "🚙", "CNG": "🌱", "Hybrid": "🚗"}
_VALID_FUELS = {"Petrol", "Diesel", "CNG", "EV", "Hybrid"}


def _normalize_fuel(raw: str) -> str:
    f = (raw or "Petrol").strip().title()
    if f.upper() == "EV" or "electric" in f.lower():
        return "EV"
    return f if f in _VALID_FUELS else "Petrol"


def _vehicle_from_extracted(user_id: str, extracted: dict, *, owner_fallback: str) -> Vehicle:
    from .rto_codes import parse_rto
    reg = normalize_reg(extracted.get("registration_number") or "")
    fuel = _normalize_fuel(str(extracted.get("fuel_type") or "Petrol"))
    rto_info = parse_rto(reg)
    return Vehicle(
        id=f"veh_{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        registration_number=reg,
        make=extracted.get("make") or "Unknown",
        model=extracted.get("model") or "Unknown",
        variant=extracted.get("variant") or "",
        fuel_type=fuel,
        registration_date=extracted.get("registration_date") or "2023-01-01",
        owner_name=extracted.get("owner_name") or owner_fallback,
        rto=extracted.get("rto") or rto_info.get("rto") or reg[:4],
        state=extracted.get("state") or rto_info.get("state") or "India",
        hypothecation=bool(extracted.get("hypothecation")),
        financier=extracted.get("financier"),
        emoji=_EMOJI.get(fuel, "🚗"),
        color_hex="#6C5CE7",
        health_score=88,
        compliance_score=82,
        compliance=Compliance(),
        odometer_km=int(extracted.get("odometer_km") or 0),
        purchase_price=int(extracted.get("purchase_price") or 0),
        current_value=int(extracted.get("current_value") or 0),
    )


def _ensure_not_duplicate(user_id: str, reg: str) -> None:
    if store.find_vehicle_by_reg(user_id, reg):
        raise HTTPException(409, f"Vehicle {reg} is already in your garage")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "ai": "azure-openai" if settings.azure_enabled else "fallback",
        "search": "enabled" if settings.search_enabled else "disabled",
        "ocr": "ocr.space",
    }


# ---------- Auth (no RLS header required) ----------
@app.post("/api/auth/signup")
def auth_signup(req: AuthSignupRequest):
    email = req.email.strip().lower()
    if email in RESERVED_EMAILS:
        raise HTTPException(400, "This email is reserved. Use Log in with the demo credentials.")
    uid = stable_user_id(email)
    user = store.ensure_user(
        uid, req.name.strip(), email, req.mobile.strip(),
        password=req.password, role="user",
    )
    return public_user(user)


@app.post("/api/auth/login")
def auth_login(req: AuthLoginRequest):
    return public_user(verify_login(req.email, req.password))


@app.post("/api/auth/demo")
def auth_demo():
    """Shortcut — same as Himanshu demo login."""
    return public_user(store.users[DEMO_USER_ID])


# ---------- User / dashboard (RLS) ----------
@app.get("/api/me")
def me(user_id: str = Depends(require_user)):
    return public_user(store.users[user_id])


@app.get("/api/dashboard")
def dashboard(user_id: str = Depends(require_user)):
    vehicles = store.vehicles_for(user_id)
    reminders = store.reminders_for(user_id)
    timeline = store.timeline_for(user_id)
    challans = store.challans_for(user_id)
    documents = store.documents_for(user_id)
    expenses = store.expenses_for(user_id)
    total_expense_month = sum(e.amount for e in expenses)
    return {
        "user": public_user(store.users[user_id]),
        "vehicles": vehicles,
        "reminders": reminders,
        "timeline": timeline[:6],
        "stats": {
            "vehicles": len(vehicles),
            "actions": len([r for r in reminders if r.urgency in ("critical", "upcoming")]),
            "pending_challans": len([c for c in challans if c.status == "pending"]),
            "documents": len(documents),
            "month_spend": total_expense_month,
        },
    }


# ---------- Vehicles ----------
@app.get("/api/vehicles", response_model=list[Vehicle])
def list_vehicles(user_id: str = Depends(require_user)):
    return store.vehicles_for(user_id)


@app.get("/api/vehicles/{vid}")
def get_vehicle(vid: str, user_id: str = Depends(require_user)):
    v = store.get_vehicle(user_id, vid)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    return {
        "vehicle": v,
        "documents": [d for d in store.documents_for(user_id) if d.vehicle_id == vid],
        "challans": store.challans_for(user_id, vid),
        "expenses": store.expenses_for(user_id, vid),
        "timeline": store.timeline_for(user_id, vid),
    }


def _normalize_reg(num: str) -> str:
    return normalize_reg(num)


@app.post("/api/vehicles/lookup")
def lookup_vehicle(req: VehicleCreateByNumber, user_id: str = Depends(require_user)):
    """Preview vehicle details from registration number (no save)."""
    reg = normalize_reg(req.registration_number)
    if len(reg) < 6:
        raise HTTPException(400, "Please enter a valid registration number")
    try:
        result = vehicle_intel.lookup_by_registration(reg)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    return result


@app.post("/api/vehicles/by-number", response_model=Vehicle)
def add_by_number(req: VehicleCreateByNumber, user_id: str = Depends(require_user)):
    reg = normalize_reg(req.registration_number)
    if len(reg) < 6:
        raise HTTPException(400, "Please enter a valid registration number")
    _ensure_not_duplicate(user_id, reg)
    user = store.users[user_id]
    try:
        lookup = vehicle_intel.lookup_by_registration(reg)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    extracted = lookup.get("extracted") or {}
    extracted["registration_number"] = reg
    v = _vehicle_from_extracted(user_id, extracted, owner_fallback=user["name"])
    return store.add_vehicle(user_id, v)


@app.post("/api/vehicles/manual", response_model=Vehicle)
def add_manual(req: VehicleCreateManual, user_id: str = Depends(require_user)):
    user = store.users[user_id]
    reg = normalize_reg(req.registration_number)
    _ensure_not_duplicate(user_id, reg)
    fuel = _normalize_fuel(req.fuel_type)
    v = Vehicle(
        id=f"veh_{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        registration_number=reg,
        make=req.make or "Unknown", model=req.model or "Unknown",
        variant=req.variant, fuel_type=fuel,
        registration_date=req.registration_date or "2023-01-01",
        owner_name=req.owner_name or user["name"],
        rto=req.rto or reg[:4], state=req.state or "India",
        hypothecation=req.hypothecation,
        financier=req.financier,
        emoji=_EMOJI.get(fuel, "🚗"),
        color_hex="#6C5CE7", health_score=90, compliance_score=85,
        odometer_km=req.odometer_km,
        purchase_price=req.purchase_price,
        current_value=req.current_value,
    )
    return store.add_vehicle(user_id, v)


@app.patch("/api/vehicles/{vid}", response_model=Vehicle)
def update_vehicle(vid: str, req: VehicleUpdate, user_id: str = Depends(require_user)):
    existing = store.get_vehicle(user_id, vid)
    if not existing:
        raise HTTPException(404, "Vehicle not found")
    updates = req.model_dump(exclude_unset=True)
    if "registration_number" in updates:
        reg = normalize_reg(updates["registration_number"])
        other = store.find_vehicle_by_reg(user_id, reg)
        if other and other.id != vid:
            raise HTTPException(409, f"Vehicle {reg} is already in your garage")
        updates["registration_number"] = reg
    if "fuel_type" in updates and updates["fuel_type"]:
        fuel = _normalize_fuel(updates["fuel_type"])
        updates["fuel_type"] = fuel
        updates["emoji"] = _EMOJI.get(fuel, "🚗")
    if "financier" in updates and updates["financier"] == "":
        updates["financier"] = None
    if "owner_name" in updates and not (updates["owner_name"] or "").strip():
        updates.pop("owner_name", None)
    if "rto" in updates and not (updates["rto"] or "").strip():
        updates["rto"] = existing.rto or updates.get("registration_number", existing.registration_number)[:4]
    if "state" in updates and not (updates["state"] or "").strip():
        updates["state"] = existing.state
    updated = store.update_vehicle(user_id, vid, **updates)
    if not updated:
        raise HTTPException(404, "Vehicle not found")
    return updated


@app.delete("/api/vehicles/{vid}")
def delete_vehicle(vid: str, user_id: str = Depends(require_user)):
    if not store.delete_vehicle(user_id, vid):
        raise HTTPException(404, "Vehicle not found")
    return {"ok": True, "deleted": vid}


@app.post("/api/vehicles/upload-rc")
async def upload_rc(file: UploadFile = File(...), user_id: str = Depends(require_user)):
    """OCR + AI extraction from an uploaded RC (image/PDF)."""
    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file")
    try:
        result = vehicle_intel.extract_rc_from_upload(
            content, file.filename or "rc_upload", file.content_type,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except RuntimeError as e:
        raise HTTPException(422, str(e)) from e
    except Exception as e:
        log.exception("RC upload failed")
        raise HTTPException(500, f"Could not process RC: {e}") from e
    result["filename"] = file.filename
    return result


# ---------- Documents ----------
@app.get("/api/documents", response_model=list[Document])
def list_documents(user_id: str = Depends(require_user)):
    return store.documents_for(user_id)


@app.get("/api/documents/{doc_id}")
def get_document(doc_id: str, user_id: str = Depends(require_user)):
    return documents_service.document_detail(user_id, doc_id)


@app.get("/api/documents/{doc_id}/download")
def download_document(doc_id: str, user_id: str = Depends(require_user)):
    content, filename = documents_service.download_bytes(user_id, doc_id)
    return Response(
        content=content,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...), user_id: str = Depends(require_user)):
    """Document pipeline: OCR → classify → extract → link vehicle → save."""
    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file")
    try:
        pipeline = vehicle_intel.process_document_upload(
            content, file.filename or "document", file.content_type,
        )
    except RuntimeError as e:
        raise HTTPException(422, str(e)) from e
    except Exception as e:
        log.exception("Document upload failed")
        raise HTTPException(500, f"Could not process document: {e}") from e

    extracted = pipeline.get("extracted") or {}
    dtype = extracted.get("type") or "RC"
    reg = extracted.get("registration_number")
    user_vehicles = store.vehicles_for(user_id)
    vehicle_id = None
    if reg:
        existing = store.find_vehicle_by_reg(user_id, reg)
        if existing:
            vehicle_id = existing.id
    if not vehicle_id and user_vehicles:
        vehicle_id = user_vehicles[0].id

    category = "Owner" if dtype == "Driving Licence" else "Vehicle"

    issue = extracted.get("start_date")
    expiry = extracted.get("expiry_date")
    status = "valid"
    if expiry:
        from datetime import date
        try:
            exp_d = date.fromisoformat(expiry[:10])
            days = (exp_d - date.today()).days
            if days < 0:
                status = "expired"
            elif days <= 30:
                status = "expiring"
        except ValueError:
            pass

    title_parts = [dtype]
    if extracted.get("insurer_or_authority"):
        title_parts.append(str(extracted["insurer_or_authority"])[:30])
    if reg:
        title_parts.append(reg)

    doc = Document(
        id=f"doc_{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        vehicle_id=vehicle_id,
        category=category,
        type=dtype,
        title=" — ".join(title_parts),
        issue_date=issue,
        expiry_date=expiry,
        status=status,
        verified=True,
    )
    store.add_document(user_id, doc)

    if expiry and vehicle_id and status in ("expiring", "valid"):
        store.add_reminder(user_id, Reminder(
            id=f"rem_{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            vehicle_id=vehicle_id,
            title=f"Renew {dtype} — expires {expiry}",
            due_date=expiry,
            urgency="critical" if status == "expiring" else "upcoming",
        ))

    return {
        "document": doc,
        "extracted": extracted,
        "confidence": pipeline.get("confidence", 85),
        "source": pipeline.get("source"),
        "ocr_engine": pipeline.get("ocr_engine"),
    }


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str, user_id: str = Depends(require_user)):
    if not store.delete_document(user_id, doc_id):
        raise HTTPException(404, "Document not found")
    return {"ok": True, "deleted": doc_id}


# ---------- Challans ----------
@app.get("/api/challans")
def list_challans(vehicle_id: str | None = None, user_id: str = Depends(require_user)):
    return store.challans_for(user_id, vehicle_id)


@app.post("/api/challans/{cid}/pay")
def pay_challan(cid: str, user_id: str = Depends(require_user)):
    c = store.get_challan(user_id, cid)
    if not c:
        raise HTTPException(404, "Challan not found")
    c.status = "paid"
    return {"ok": True, "challan": c}


# ---------- Expenses ----------
@app.get("/api/expenses")
def list_expenses(vehicle_id: str | None = None, user_id: str = Depends(require_user)):
    data = store.expenses_for(user_id, vehicle_id)
    by_type: dict[str, int] = {}
    for e in data:
        by_type[e.type] = by_type.get(e.type, 0) + e.amount
    total = sum(e.amount for e in data)
    return {"expenses": data, "by_type": by_type, "total": total}


@app.post("/api/expenses", response_model=Expense)
def add_expense(exp: Expense, user_id: str = Depends(require_user)):
    if not store.get_vehicle(user_id, exp.vehicle_id):
        raise HTTPException(404, "Vehicle not found")
    exp.id = f"exp_{uuid.uuid4().hex[:8]}"
    return store.add_expense(user_id, exp)


# ---------- Calculators / advisor ----------
@app.post("/api/buy/advisor", response_model=BuyAdvisorResponse)
def buy(req: BuyAdvisorRequest):
    return logic.buy_advisor(req)


@app.post("/api/buy/fuel-calc", response_model=FuelCalcResponse)
def fuel(req: FuelCalcRequest):
    return logic.fuel_calc(req)


@app.post("/api/buy/on-road", response_model=OnRoadResponse)
def onroad(req: OnRoadRequest):
    return logic.on_road(req)


@app.post("/api/buy/emi", response_model=EmiResponse)
def emi(req: EmiRequest):
    return logic.emi(req)


# ---------- RTO ----------
@app.post("/api/rto/workflow", response_model=RtoWorkflowResponse)
def rto(req: RtoWorkflowRequest):
    return logic.rto_workflow(req)


# ---------- AI ----------
@app.post("/api/ai/chat", response_model=ChatResponse)
def chat(req: ChatRequest, user_id: str = Depends(require_user)):
    if req.vehicle_id and not store.get_vehicle(user_id, req.vehicle_id):
        raise HTTPException(403, "You do not have access to this vehicle")
    return orchestrator.handle(req.message, req.vehicle_id, req.history, user_id)


# ---------- Live web search ----------
@app.get("/api/ai/search")
def ai_search(q: str, max_results: int = 5):
    """Direct live web search (Tavily → Google CSE) for real-time vehicle info."""
    from .search import web_search
    answer, results = web_search(q, max_results=max_results)
    return {
        "query": q,
        "enabled": settings.search_enabled,
        "answer": answer,
        "results": [{"title": r.title, "url": r.url, "content": r.content} for r in results],
    }


# ---------- LLM model selection ----------
from .models_registry import registry, ModelOption
from . import model_providers
from pydantic import BaseModel as _BM


class ModelSelectRequest(_BM):
    model_id: str


class ModelAddRequest(_BM):
    provider: str
    label: str = ""
    family: str = "gpt"
    description: str = ""
    config: dict[str, str] = {}


class ModelRemoveRequest(_BM):
    model_id: str


def _serialize_option(o: ModelOption) -> dict:
    d = {**vars(o), "active": o.id == registry.selected, "builtin": registry.is_builtin(o.id)}
    d["config"] = model_providers.sanitize_config(o.config or {})
    return d


@app.get("/api/ai/models/providers")
def list_model_providers(_admin: str = Depends(require_admin)):
    return {"providers": model_providers.list_providers()}


@app.get("/api/ai/models")
def list_models(_admin: str = Depends(require_admin)):
    return {
        "selected": registry.selected,
        "azure_enabled": settings.azure_enabled,
        "options": [_serialize_option(o) for o in registry.options()],
    }


@app.get("/api/ai/models/active")
def active_model(_user: str = Depends(require_user)):
    """Read-only — which global model all users' AI calls use."""
    opt = registry.selected_option()
    return {
        "selected": registry.selected,
        "label": opt.label,
        "provider": opt.provider,
        "azure_enabled": settings.azure_enabled,
    }


@app.post("/api/ai/models/select")
def select_model(req: ModelSelectRequest, _admin: str = Depends(require_admin)):
    selected = registry.set_selected(req.model_id)
    return {"ok": True, "selected": selected}


@app.post("/api/ai/models/add")
def add_model(req: ModelAddRequest, _admin: str = Depends(require_admin)):
    opt = model_providers.build_model_from_request(
        req.provider, req.label, req.family, req.description, req.config,
    )
    registry.add_model(opt)
    return {"ok": True, "options": [_serialize_option(o) for o in registry.options()]}


def _remove_model_response(model_id: str) -> dict:
    try:
        registry.delete_model(model_id)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    return {
        "ok": True,
        "selected": registry.selected,
        "options": [_serialize_option(o) for o in registry.options()],
    }


@app.post("/api/ai/models/remove")
def remove_model(req: ModelRemoveRequest, _admin: str = Depends(require_admin)):
    """Remove a model from the catalog (JSON body — works with ids like gpt-5.4)."""
    return _remove_model_response(req.model_id)


@app.delete("/api/ai/models/{model_id:path}")
def delete_model(model_id: str, _admin: str = Depends(require_admin)):
    return _remove_model_response(model_id)


# ---------- RTO Agents directory ----------
from . import agents_directory as adir


@app.get("/api/rto-agents")
def rto_agents(
    area: str | None = None,
    service: str | None = None,
    min_rating: float = 0,
    min_reviews: int = 0,
    max_charges: int | None = None,
    max_response_hours: float | None = None,
    authorized_only: bool = False,
    online_only: bool = False,
    query: str | None = None,
    sort: str = "rating",
):
    return {
        "agents": adir.list_agents(
            area=area, service=service, min_rating=min_rating, min_reviews=min_reviews,
            max_charges=max_charges, max_response_hours=max_response_hours,
            authorized_only=authorized_only, online_only=online_only,
            query=query, sort=sort,
        ),
        "areas": adir.AREAS,
        "services": adir.ALL_SERVICES,
    }


@app.get("/api/rto-agents/{agent_id}")
def rto_agent_detail(agent_id: str):
    a = adir.get_agent(agent_id)
    if not a:
        raise HTTPException(404, "Agent not found")
    return a
