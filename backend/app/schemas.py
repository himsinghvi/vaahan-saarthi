"""Pydantic schemas shared across the API."""
from __future__ import annotations
import re
from datetime import date
from typing import Any, Literal, Optional
from pydantic import BaseModel, field_validator


def _parse_int_value(v: Any) -> int:
    """Coerce numbers sent as strings (incl. Indian comma formats) to int."""
    if v is None or v == "":
        return 0
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, int):
        return v
    if isinstance(v, float):
        return int(v)
    s = re.sub(r"[,₹\s]", "", str(v).strip())
    if not s:
        return 0
    try:
        return int(float(s))
    except ValueError:
        return 0


# ---------- Vehicles ----------
class Compliance(BaseModel):
    rc: str = "valid"
    insurance: str = "valid"
    puc: str = "valid"
    tax: str = "paid"
    challan: str = "clear"
    fitness: str = "valid"


class Vehicle(BaseModel):
    id: str
    user_id: str = ""
    registration_number: str
    make: str
    model: str
    variant: str = ""
    fuel_type: Literal["Petrol", "Diesel", "CNG", "EV", "Hybrid"] = "Petrol"
    registration_date: str
    owner_name: str
    rto: str
    state: str
    category: Literal["personal", "commercial"] = "personal"
    hypothecation: bool = False
    financier: Optional[str] = None
    emoji: str = "🚗"
    color_hex: str = "#6C5CE7"
    odometer_km: int = 0
    purchase_price: int = 0
    current_value: int = 0
    health_score: int = 90
    compliance_score: int = 85
    compliance: Compliance = Compliance()


class VehicleCreateByNumber(BaseModel):
    registration_number: str


class VehicleCreateManual(BaseModel):
    registration_number: str
    make: str
    model: str
    variant: str = ""
    fuel_type: str = "Petrol"
    registration_date: str = ""
    owner_name: str = ""
    state: str = ""
    rto: str = ""
    hypothecation: bool = False
    financier: Optional[str] = None
    odometer_km: int = 0
    purchase_price: int = 0
    current_value: int = 0

    @field_validator("odometer_km", "purchase_price", "current_value", mode="before")
    @classmethod
    def coerce_numeric(cls, v: Any) -> int:
        return _parse_int_value(v)


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    fuel_type: Optional[str] = None
    registration_date: Optional[str] = None
    owner_name: Optional[str] = None
    state: Optional[str] = None
    rto: Optional[str] = None
    hypothecation: Optional[bool] = None
    financier: Optional[str] = None
    odometer_km: Optional[int] = None
    purchase_price: Optional[int] = None
    current_value: Optional[int] = None

    @field_validator("odometer_km", "purchase_price", "current_value", mode="before")
    @classmethod
    def coerce_numeric(cls, v: Any) -> int | None:
        if v is None:
            return None
        return _parse_int_value(v)


# ---------- Documents ----------
class Document(BaseModel):
    id: str
    user_id: str = ""
    vehicle_id: Optional[str] = None
    category: str  # Vehicle / Owner / Finance / Selling
    type: str      # RC / Insurance / PUC ...
    title: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    status: Literal["valid", "expiring", "expired"] = "valid"
    verified: bool = True


# ---------- Challans ----------
class Challan(BaseModel):
    id: str
    user_id: str = ""
    vehicle_id: str
    offence: str
    amount: int
    date: str
    location: str
    status: Literal["pending", "paid", "contested", "court"] = "pending"


# ---------- Expenses ----------
class Expense(BaseModel):
    id: str
    user_id: str = ""
    vehicle_id: str
    type: str
    amount: int
    date: str
    note: str = ""


# ---------- Timeline ----------
class TimelineEvent(BaseModel):
    id: str
    user_id: str = ""
    vehicle_id: str
    title: str
    date: str
    icon: str = "●"
    kind: str = "info"


# ---------- Reminders / notifications ----------
class Reminder(BaseModel):
    id: str
    user_id: str = ""
    vehicle_id: Optional[str] = None
    title: str
    due_date: str
    urgency: Literal["critical", "upcoming", "info"] = "upcoming"


# ---------- AI ----------
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    vehicle_id: Optional[str] = None
    history: list[ChatMessage] = []


class ActionCard(BaseModel):
    label: str
    icon: str = "→"
    route: Optional[str] = None
    kind: str = "primary"


class Source(BaseModel):
    title: str
    url: str


class ChatResponse(BaseModel):
    intent: str
    agent: str
    reply: str
    actions: list[ActionCard] = []
    powered_by: str = "fallback"
    used_search: bool = False
    sources: list[Source] = []


# ---------- Buy advisor ----------
class BuyAdvisorRequest(BaseModel):
    budget: str
    usage: str
    monthly_km: int
    priorities: list[str] = []
    passengers: str
    fuel_preference: str = "Any"


class VehicleMatch(BaseModel):
    name: str
    price_range: str
    match_score: int
    fuel_type: str
    reasons: list[str]
    emoji: str = "🚗"


class BuyAdvisorResponse(BaseModel):
    matches: list[VehicleMatch]
    verdict: str


# ---------- Fuel cost calculator ----------
class FuelCalcRequest(BaseModel):
    monthly_km: int
    fuel_price: float = 105.0
    electricity_price: float = 8.0
    years: int = 5
    home_charging: bool = True


class FuelCalcResponse(BaseModel):
    projections: dict[str, float]
    recommended: str
    confidence: int
    explanation: str


# ---------- On-road price ----------
class OnRoadRequest(BaseModel):
    ex_showroom: int
    state: str = "Maharashtra"
    fuel_type: str = "Petrol"
    insurance_type: str = "Comprehensive"


class OnRoadResponse(BaseModel):
    breakdown: dict[str, int]
    total: int


# ---------- EMI ----------
class EmiRequest(BaseModel):
    principal: int
    rate: float = 9.5
    tenure_months: int = 60


class EmiResponse(BaseModel):
    emi: int
    total_interest: int
    total_payable: int


# ---------- RTO workflow ----------
class RtoWorkflowRequest(BaseModel):
    service: str
    answers: dict[str, Any] = {}


class RtoWorkflowResponse(BaseModel):
    title: str
    steps: list[str]
    forms: list[str]
    documents: list[str]
    estimated_time: str
    fee_estimate: str
    note: str = ""


class AuthLoginRequest(BaseModel):
    email: str
    password: str = ""


class AuthSignupRequest(BaseModel):
    name: str
    email: str
    mobile: str
    password: str = ""
