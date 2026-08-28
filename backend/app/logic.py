"""Deterministic domain logic: calculators, RTO workflows, buy advisor."""
from __future__ import annotations
from .schemas import (
    BuyAdvisorRequest, BuyAdvisorResponse, VehicleMatch,
    FuelCalcRequest, FuelCalcResponse, OnRoadRequest, OnRoadResponse,
    EmiRequest, EmiResponse, RtoWorkflowRequest, RtoWorkflowResponse,
)

# State road-tax percentages (illustrative, editable per policy).
STATE_TAX = {
    "Maharashtra": 0.11, "Delhi": 0.10, "Karnataka": 0.13, "Tamil Nadu": 0.10,
    "Gujarat": 0.06, "Uttar Pradesh": 0.08, "Telangana": 0.12,
}


def emi(req: EmiRequest) -> EmiResponse:
    p, n = req.principal, req.tenure_months
    r = req.rate / 12 / 100
    if r == 0:
        m = p / n
    else:
        m = p * r * (1 + r) ** n / ((1 + r) ** n - 1)
    m = round(m)
    total = m * n
    return EmiResponse(emi=m, total_interest=total - p, total_payable=total)


def on_road(req: OnRoadRequest) -> OnRoadResponse:
    ex = req.ex_showroom
    tax_rate = STATE_TAX.get(req.state, 0.10)
    if req.fuel_type == "EV":
        tax_rate = 0.0  # many states waive road tax for EVs
    road_tax = round(ex * tax_rate)
    registration = 600 if ex < 1000000 else 5000
    hsrp = 800
    insurance = round(ex * (0.035 if req.insurance_type == "Comprehensive" else 0.018))
    fastag = 500
    total = ex + road_tax + registration + hsrp + insurance + fastag
    return OnRoadResponse(
        breakdown={
            "Ex-showroom": ex, "Road tax": road_tax, "Registration": registration,
            "HSRP plate": hsrp, "Insurance": insurance, "FASTag": fastag,
        },
        total=total,
    )


def fuel_calc(req: FuelCalcRequest) -> FuelCalcResponse:
    km_total = req.monthly_km * 12 * req.years
    # Efficiency assumptions
    petrol = km_total / 15 * req.fuel_price
    diesel = km_total / 20 * (req.fuel_price - 5)
    cng = km_total / 25 * 80
    ev_rate = req.electricity_price if req.home_charging else req.electricity_price * 2.5
    ev = km_total / 7 * ev_rate  # ~7 km per kWh
    # Add rough maintenance deltas
    petrol += 60000 * req.years / 5
    diesel += 80000 * req.years / 5
    cng += 55000 * req.years / 5
    ev += 25000 * req.years / 5
    proj = {
        "Petrol": round(petrol), "Diesel": round(diesel),
        "CNG": round(cng), "EV": round(ev),
    }
    recommended = min(proj, key=proj.get)
    ranked = sorted(proj.values())
    gap = (ranked[1] - ranked[0]) / max(ranked[1], 1)
    confidence = min(95, 70 + int(gap * 100))
    save = proj["Petrol"] - proj[recommended]
    explanation = (
        f"Over {req.years} years at {req.monthly_km} km/month, {recommended} is the "
        f"lowest-cost option, saving about ₹{save:,} vs petrol. "
        + ("EV economics improve further with home charging." if recommended == "EV" else "")
    )
    return FuelCalcResponse(projections=proj, recommended=recommended,
                            confidence=confidence, explanation=explanation)


_CATALOG = [
    {"name": "Tata Nexon EV", "fuel": "EV", "price": "₹14.5–17.2L", "emoji": "🔋",
     "city": 5, "safety": 5, "space": 4, "mileage": 5, "features": 4, "perf": 4, "resale": 4, "budget": 17},
    {"name": "Hyundai Creta", "fuel": "Petrol", "price": "₹11.0–20.2L", "emoji": "🚗",
     "city": 4, "safety": 4, "space": 5, "mileage": 3, "features": 5, "perf": 4, "resale": 5, "budget": 20},
    {"name": "Maruti Grand Vitara CNG", "fuel": "CNG", "price": "₹10.7–19.9L", "emoji": "🌱",
     "city": 5, "safety": 4, "space": 4, "mileage": 5, "features": 4, "perf": 3, "resale": 5, "budget": 20},
    {"name": "Mahindra XUV700", "fuel": "Diesel", "price": "₹14.5–26.5L", "emoji": "🚙",
     "city": 3, "safety": 5, "space": 5, "mileage": 4, "features": 5, "perf": 5, "resale": 4, "budget": 26},
    {"name": "Tata Punch", "fuel": "Petrol", "price": "₹6.1–10.3L", "emoji": "🚗",
     "city": 5, "safety": 5, "space": 3, "mileage": 4, "features": 3, "perf": 3, "resale": 4, "budget": 10},
    {"name": "MG Comet EV", "fuel": "EV", "price": "₹7.0–9.8L", "emoji": "⚡",
     "city": 5, "safety": 3, "space": 2, "mileage": 5, "features": 4, "perf": 2, "resale": 3, "budget": 10},
]

_BUDGET_CAP = {"Under ₹10 lakh": 10, "₹10–20 lakh": 20, "₹20–40 lakh": 40, "₹40 lakh+": 100}
_PRIORITY_KEY = {"Mileage": "mileage", "Safety": "safety", "Performance": "perf",
                 "Low maintenance": "mileage", "Features": "features", "Space": "space",
                 "Resale value": "resale"}


def buy_advisor(req: BuyAdvisorRequest) -> BuyAdvisorResponse:
    cap = _BUDGET_CAP.get(req.budget, 40)
    results = []
    for c in _CATALOG:
        if c["budget"] > cap + 1:
            continue
        if req.fuel_preference not in ("Any", "") and c["fuel"] != req.fuel_preference:
            continue
        score = 50
        if req.usage == "Mostly city":
            score += c["city"] * 4
        elif req.usage == "Highway":
            score += c["perf"] * 4
        else:
            score += (c["city"] + c["perf"]) * 2
        for p in req.priorities:
            key = _PRIORITY_KEY.get(p)
            if key:
                score += c[key] * 3
        if req.passengers == "6+":
            score += c["space"] * 3
        elif req.passengers == "4–5":
            score += c["space"] * 2
        if req.monthly_km > 1500 and c["fuel"] in ("EV", "Diesel", "CNG"):
            score += 8
        score = min(99, score)
        reasons = []
        if c["city"] >= 4 and req.usage == "Mostly city":
            reasons.append("Great for city usage")
        if c["fuel"] in ("EV", "CNG") and req.monthly_km > 1000:
            reasons.append("Low running cost for your mileage")
        if c["safety"] >= 5:
            reasons.append("Top safety rating")
        if c["resale"] >= 5:
            reasons.append("Strong resale value")
        if not reasons:
            reasons.append("Balanced all-rounder in your budget")
        results.append(VehicleMatch(name=c["name"], price_range=c["price"], match_score=score,
                                    fuel_type=c["fuel"], reasons=reasons[:3], emoji=c["emoji"]))
    results.sort(key=lambda m: m.match_score, reverse=True)
    results = results[:3]
    if results:
        top = results[0]
        verdict = (
            f"For your usage, {top.name} is the best match at {top.match_score}%. "
            + (f"It edges out {results[1].name} on running cost and fit." if len(results) > 1 else "")
        )
    else:
        verdict = "No matches in this budget — try widening your budget or fuel preference."
    return BuyAdvisorResponse(matches=results, verdict=verdict)


_WORKFLOWS = {
    "transfer": {
        "title": "Ownership Transfer (Same State)",
        "forms": ["Form 29 (Notice of Transfer)", "Form 30 (Application for Transfer)"],
        "documents": ["RC", "Valid Insurance", "Valid PUC", "Buyer & Seller ID proof",
                       "Address proof", "Passport photos", "Sale agreement"],
        "steps": ["Clear all pending challans & dues", "Close loan / obtain NOC if hypothecated",
                  "Fill Form 29 & 30 (seller signs)", "Submit to RTO with documents & fee",
                  "RTO verification", "RC updated with new owner"],
        "time": "7–30 days", "fee": "₹300–₹1,500 (state-dependent)",
    },
    "noc": {
        "title": "Interstate Transfer / NOC",
        "forms": ["Form 28 (Application for NOC)"],
        "documents": ["RC", "Valid Insurance", "Valid PUC", "Chassis pencil print",
                       "Bank NOC (if financed)", "Address proof of new state"],
        "steps": ["Clear challans & dues", "Apply for NOC (Form 28) at home RTO",
                  "Obtain NOC after police/records verification", "Move vehicle to new state",
                  "Apply for re-registration + pay road tax difference",
                  "Get new registration number"],
        "time": "15–45 days", "fee": "Road tax difference + ₹500–₹2,000",
        "note": "Re-registration is mandatory if you relocate for more than 12 months.",
    },
    "address": {
        "title": "Address Change on RC",
        "forms": ["Form 33 (Change of Address)"],
        "documents": ["RC", "New address proof (Aadhaar/utility bill)", "Insurance", "PUC",
                       "Bank NOC (if financed)"],
        "steps": ["Fill Form 33", "Attach new address proof", "Submit to RTO with fee",
                  "Verification", "Updated RC issued"],
        "time": "7–21 days", "fee": "₹200–₹500",
    },
    "duplicate": {
        "title": "Duplicate RC (Lost / Damaged)",
        "forms": ["Form 26 (Application for Duplicate RC)"],
        "documents": ["Police FIR/complaint (if lost)", "ID proof", "Address proof",
                       "Insurance", "PUC", "Bank NOC (if financed)"],
        "steps": ["File police complaint for lost RC", "Fill Form 26", "Submit to RTO with fee",
                  "Verification", "Duplicate RC issued"],
        "time": "7–30 days", "fee": "₹300–₹800",
    },
    "hypothecation_removal": {
        "title": "Hypothecation Removal (Loan Closure)",
        "forms": ["Form 35 (Termination of Hypothecation)"],
        "documents": ["Bank NOC / loan closure letter", "RC", "Insurance", "PUC", "ID proof"],
        "steps": ["Close the loan & collect bank NOC + Form 35", "Submit Form 35 to RTO",
                  "Verification", "RC updated — hypothecation removed"],
        "time": "7–21 days", "fee": "₹200–₹500",
    },
}


def rto_workflow(req: RtoWorkflowRequest) -> RtoWorkflowResponse:
    wf = _WORKFLOWS.get(req.service, _WORKFLOWS["transfer"])
    return RtoWorkflowResponse(
        title=wf["title"], steps=wf["steps"], forms=wf["forms"],
        documents=wf["documents"], estimated_time=wf["time"],
        fee_estimate=wf["fee"], note=wf.get("note", ""),
    )
