"""In-memory store with per-user row-level isolation (RLS)."""
from __future__ import annotations
import uuid
from .schemas import (
    Vehicle, Compliance, Document, Challan, Expense, TimelineEvent, Reminder,
)

DEMO_USER_ID = "user_himanshu"


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


class Store:
    def __init__(self) -> None:
        self.users: dict[str, dict] = {}
        self.vehicles: list[Vehicle] = []
        self.documents: list[Document] = []
        self.challans: list[Challan] = []
        self.expenses: list[Expense] = []
        self.timeline: list[TimelineEvent] = []
        self.reminders: list[Reminder] = []
        self._seed_demo_user()

    def ensure_user(
        self, user_id: str, name: str, email: str, mobile: str,
        password: str = "", role: str = "user",
    ) -> dict:
        if user_id not in self.users:
            self.users[user_id] = {
                "id": user_id,
                "name": name,
                "email": email,
                "mobile": mobile,
                "language": "English",
                "role": role,
                "password": password,
            }
        else:
            u = self.users[user_id]
            u["name"] = name or u["name"]
            u["email"] = email or u["email"]
            u["mobile"] = mobile or u["mobile"]
            if role:
                u["role"] = role
            if password:
                u["password"] = password
        return self.users[user_id]

    def _seed_demo_user(self) -> None:
        from .credentials import (
            ADMIN_USER_ID, ADMIN_EMAIL, ADMIN_PASSWORD,
            DEMO_USER_ID, DEMO_EMAIL, DEMO_PASSWORD,
            PRIYA_USER_ID, PRIYA_EMAIL, PRIYA_PASSWORD,
        )

        # Admin — no vehicle data; configures global LLM only
        self.ensure_user(
            ADMIN_USER_ID, "Platform Admin", ADMIN_EMAIL, "+91 90000 00001",
            password=ADMIN_PASSWORD, role="admin",
        )

        # Priya — empty garage for demo contrast
        self.ensure_user(
            PRIYA_USER_ID, "Priya", PRIYA_EMAIL, "+91 90000 00002",
            password=PRIYA_PASSWORD, role="user",
        )

        uid = DEMO_USER_ID
        self.ensure_user(uid, "Himanshu", DEMO_EMAIL, "+91 90000 00000", password=DEMO_PASSWORD, role="user")

        creta = Vehicle(
            id="veh_creta", user_id=uid,
            registration_number="MH12AB1234",
            make="Hyundai", model="Creta", variant="SX(O) Turbo",
            fuel_type="Petrol", registration_date="2022-06-12",
            owner_name="Himanshu", rto="Pune (MH12)", state="Maharashtra",
            hypothecation=True, financier="HDFC Bank",
            emoji="🚗", color_hex="#6C5CE7", odometer_km=48200,
            purchase_price=1650000, current_value=1210000,
            health_score=92, compliance_score=86,
            compliance=Compliance(puc="expiring"),
        )
        activa = Vehicle(
            id="veh_activa", user_id=uid,
            registration_number="MH12CD5678",
            make="Honda", model="Activa 6G", variant="STD",
            fuel_type="Petrol", registration_date="2020-03-04",
            owner_name="Priya", rto="Pune (MH12)", state="Maharashtra",
            emoji="🛵", color_hex="#00B894", odometer_km=31500,
            purchase_price=78000, current_value=52000,
            health_score=88, compliance_score=94,
            compliance=Compliance(),
        )
        nexon = Vehicle(
            id="veh_nexon", user_id=uid,
            registration_number="MH14EV0099",
            make="Tata", model="Nexon EV", variant="Max XZ+",
            fuel_type="EV", registration_date="2024-01-20",
            owner_name="Himanshu", rto="Pune (MH14)", state="Maharashtra",
            emoji="🚙", color_hex="#0984E3", odometer_km=14300,
            purchase_price=1720000, current_value=1490000,
            health_score=97, compliance_score=78,
            compliance=Compliance(insurance="expiring", tax="paid"),
        )
        self.vehicles = [creta, activa, nexon]

        self.documents = [
            Document(id=_id("doc"), user_id=uid, vehicle_id="veh_creta", category="Vehicle", type="RC",
                     title="Registration Certificate", issue_date="2022-06-12", status="valid"),
            Document(id=_id("doc"), user_id=uid, vehicle_id="veh_creta", category="Vehicle", type="Insurance",
                     title="Motor Insurance — ICICI Lombard", issue_date="2025-08-01",
                     expiry_date="2026-07-31", status="valid"),
            Document(id=_id("doc"), user_id=uid, vehicle_id="veh_creta", category="Vehicle", type="PUC",
                     title="Pollution Under Control", issue_date="2026-02-15",
                     expiry_date="2026-09-14", status="expiring"),
            Document(id=_id("doc"), user_id=uid, vehicle_id="veh_creta", category="Finance", type="Loan",
                     title="Loan Agreement — HDFC Bank", issue_date="2022-06-10", status="valid"),
            Document(id=_id("doc"), user_id=uid, vehicle_id="veh_nexon", category="Vehicle", type="Insurance",
                     title="Motor Insurance — Digit", issue_date="2025-01-20",
                     expiry_date="2026-01-19", status="expiring"),
            Document(id=_id("doc"), user_id=uid, vehicle_id="veh_nexon", category="Vehicle", type="RC",
                     title="Registration Certificate", issue_date="2024-01-20", status="valid"),
            Document(id=_id("doc"), user_id=uid, vehicle_id="veh_activa", category="Vehicle", type="PUC",
                     title="Pollution Under Control", issue_date="2026-05-01",
                     expiry_date="2026-11-01", status="valid"),
            Document(id=_id("doc"), user_id=uid, vehicle_id=None, category="Owner", type="DL",
                     title="Driving Licence — MH", issue_date="2015-08-19",
                     expiry_date="2035-08-18", status="valid"),
        ]

        self.challans = [
            Challan(id=_id("chl"), user_id=uid, vehicle_id="veh_creta", offence="Over-speeding (72 in 60 zone)",
                    amount=1000, date="2026-08-12", location="Mumbai-Pune Expressway", status="pending"),
            Challan(id=_id("chl"), user_id=uid, vehicle_id="veh_creta", offence="No parking zone",
                    amount=500, date="2026-07-28", location="FC Road, Pune", status="pending"),
            Challan(id=_id("chl"), user_id=uid, vehicle_id="veh_nexon", offence="Signal jump",
                    amount=1500, date="2026-06-02", location="Baner, Pune", status="paid"),
        ]

        self.expenses = [
            Expense(id=_id("exp"), user_id=uid, vehicle_id="veh_creta", type="Fuel", amount=6200, date="2026-08-20", note="Full tank"),
            Expense(id=_id("exp"), user_id=uid, vehicle_id="veh_creta", type="Service", amount=8400, date="2026-08-12", note="40k service"),
            Expense(id=_id("exp"), user_id=uid, vehicle_id="veh_creta", type="Insurance", amount=28900, date="2025-08-01", note="Annual renewal"),
            Expense(id=_id("exp"), user_id=uid, vehicle_id="veh_creta", type="Toll", amount=1800, date="2026-08-18", note="Goa trip"),
            Expense(id=_id("exp"), user_id=uid, vehicle_id="veh_nexon", type="Charging", amount=2100, date="2026-08-19", note="Home + public"),
            Expense(id=_id("exp"), user_id=uid, vehicle_id="veh_nexon", type="Service", amount=3200, date="2026-07-10", note="Health check"),
        ]

        self.timeline = [
            TimelineEvent(id=_id("evt"), user_id=uid, vehicle_id="veh_creta", title="Service completed — 40,000 km", date="2026-08-12", icon="🔧", kind="success"),
            TimelineEvent(id=_id("evt"), user_id=uid, vehicle_id="veh_creta", title="Challan checked", date="2026-08-12", icon="🚨", kind="warning"),
            TimelineEvent(id=_id("evt"), user_id=uid, vehicle_id="veh_creta", title="Insurance renewed", date="2025-08-01", icon="🛡", kind="info"),
            TimelineEvent(id=_id("evt"), user_id=uid, vehicle_id="veh_creta", title="Vehicle registered", date="2022-06-12", icon="📄", kind="info"),
            TimelineEvent(id=_id("evt"), user_id=uid, vehicle_id="veh_nexon", title="Purchased & registered", date="2024-01-20", icon="🎉", kind="success"),
        ]

        self.reminders = [
            Reminder(id=_id("rem"), user_id=uid, vehicle_id="veh_creta", title="Renew PUC for MH12AB1234", due_date="2026-09-14", urgency="critical"),
            Reminder(id=_id("rem"), user_id=uid, vehicle_id="veh_nexon", title="Nexon EV insurance renewal", due_date="2026-01-19", urgency="upcoming"),
            Reminder(id=_id("rem"), user_id=uid, vehicle_id="veh_creta", title="Recommended service approaching", due_date="2026-10-05", urgency="info"),
        ]

    # ---- RLS-scoped queries ----
    def vehicles_for(self, user_id: str) -> list[Vehicle]:
        return [v for v in self.vehicles if v.user_id == user_id]

    def get_vehicle(self, user_id: str, vid: str) -> Vehicle | None:
        return next((v for v in self.vehicles if v.id == vid and v.user_id == user_id), None)

    def find_vehicle_by_reg(self, user_id: str, registration_number: str) -> Vehicle | None:
        reg = "".join(registration_number.upper().split()).replace("-", "")
        return next(
            (v for v in self.vehicles
             if v.user_id == user_id
             and "".join(v.registration_number.upper().split()).replace("-", "") == reg),
            None,
        )

    def documents_for(self, user_id: str) -> list[Document]:
        return [d for d in self.documents if d.user_id == user_id]

    def get_document(self, user_id: str, doc_id: str) -> Document | None:
        return next((d for d in self.documents if d.id == doc_id and d.user_id == user_id), None)

    def challans_for(self, user_id: str, vehicle_id: str | None = None) -> list[Challan]:
        data = [c for c in self.challans if c.user_id == user_id]
        if vehicle_id:
            data = [c for c in data if c.vehicle_id == vehicle_id]
        return data

    def get_challan(self, user_id: str, cid: str) -> Challan | None:
        return next((c for c in self.challans if c.id == cid and c.user_id == user_id), None)

    def expenses_for(self, user_id: str, vehicle_id: str | None = None) -> list[Expense]:
        data = [e for e in self.expenses if e.user_id == user_id]
        if vehicle_id:
            data = [e for e in data if e.vehicle_id == vehicle_id]
        return data

    def timeline_for(self, user_id: str, vehicle_id: str | None = None) -> list[TimelineEvent]:
        data = [t for t in self.timeline if t.user_id == user_id]
        if vehicle_id:
            data = [t for t in data if t.vehicle_id == vehicle_id]
        return data

    def reminders_for(self, user_id: str) -> list[Reminder]:
        return [r for r in self.reminders if r.user_id == user_id]

    def add_vehicle(self, user_id: str, v: Vehicle) -> Vehicle:
        v.user_id = user_id
        self.vehicles.append(v)
        self.timeline.insert(0, TimelineEvent(
            id=_id("evt"), user_id=user_id, vehicle_id=v.id,
            title=f"Added {v.make} {v.model} to garage", date="2026-08-28",
            icon="✨", kind="success",
        ))
        return v

    def update_vehicle(self, user_id: str, vid: str, **updates) -> Vehicle | None:
        v = self.get_vehicle(user_id, vid)
        if not v:
            return None
        numeric = {"odometer_km", "purchase_price", "current_value", "health_score", "compliance_score"}
        for key, val in updates.items():
            if val is None or not hasattr(v, key):
                continue
            if key in numeric:
                val = int(val)
            setattr(v, key, val)
        return v

    def delete_vehicle(self, user_id: str, vid: str) -> bool:
        if not self.get_vehicle(user_id, vid):
            return False
        self.vehicles = [v for v in self.vehicles if not (v.id == vid and v.user_id == user_id)]
        self.documents = [d for d in self.documents if not (d.vehicle_id == vid and d.user_id == user_id)]
        self.challans = [c for c in self.challans if not (c.vehicle_id == vid and c.user_id == user_id)]
        self.expenses = [e for e in self.expenses if not (e.vehicle_id == vid and e.user_id == user_id)]
        self.timeline = [t for t in self.timeline if not (t.vehicle_id == vid and t.user_id == user_id)]
        self.reminders = [r for r in self.reminders if not (r.vehicle_id == vid and r.user_id == user_id)]
        return True

    def delete_document(self, user_id: str, doc_id: str) -> bool:
        n = len(self.documents)
        self.documents = [d for d in self.documents if not (d.id == doc_id and d.user_id == user_id)]
        return len(self.documents) < n

    def add_document(self, user_id: str, doc: Document) -> Document:
        doc.user_id = user_id
        self.documents.insert(0, doc)
        return doc

    def add_expense(self, user_id: str, exp: Expense) -> Expense:
        exp.user_id = user_id
        self.expenses.insert(0, exp)
        return exp

    def add_reminder(self, user_id: str, rem: Reminder) -> Reminder:
        rem.user_id = user_id
        self.reminders.insert(0, rem)
        return rem


store = Store()
