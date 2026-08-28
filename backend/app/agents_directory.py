"""RTO Agents directory — filterable/sortable list of agents who can perform
RTO tasks on the user's behalf. Seeded demo data.
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict


@dataclass
class RtoAgent:
    id: str
    name: str
    photo: str            # emoji avatar
    area: str
    city: str
    services: list[str]
    rating: float
    reviews: int
    tasks_completed: int
    charges_from: int     # ₹ starting fee
    response_time_hours: float   # avg first reply
    turnaround_days: float       # avg completion time
    rto_authorized: bool
    verified: bool
    years_experience: int
    languages: list[str]
    online: bool
    tagline: str = ""


ALL_SERVICES = [
    "Ownership Transfer", "Interstate / NOC", "Address Change", "Duplicate RC",
    "Hypothecation Removal", "New Registration", "RC Renewal", "Fitness Certificate",
    "Permit", "DL Services", "HSRP", "Road Tax", "Vehicle Scrapping",
]

AREAS = ["Pune", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Chennai", "Ahmedabad"]


_AGENTS: list[RtoAgent] = [
    RtoAgent("ag_1", "Rajesh Kulkarni", "👨‍💼", "Shivajinagar", "Pune",
             ["Ownership Transfer", "Interstate / NOC", "Hypothecation Removal", "HSRP"],
             4.9, 412, 1180, 1200, 1.5, 3.0, True, True, 12,
             ["Marathi", "Hindi", "English"], True,
             "RTO-authorized agent, fastest transfers in Pune."),
    RtoAgent("ag_2", "Sana Shaikh", "👩‍💼", "Kothrud", "Pune",
             ["Address Change", "Duplicate RC", "DL Services", "RC Renewal"],
             4.7, 268, 640, 800, 3.0, 2.5, True, True, 7,
             ["Hindi", "English", "Urdu"], True,
             "Document specialist — quick DL & RC work."),
    RtoAgent("ag_3", "Vikram Desai", "🧑‍💼", "Andheri", "Mumbai",
             ["New Registration", "Ownership Transfer", "Road Tax", "Permit"],
             4.8, 531, 1560, 1500, 2.0, 4.0, True, True, 15,
             ["Marathi", "Hindi", "English", "Gujarati"], False,
             "15 yrs experience, handles commercial fleets."),
    RtoAgent("ag_4", "Anil Reddy", "👨‍💼", "Gachibowli", "Hyderabad",
             ["Ownership Transfer", "Interstate / NOC", "Vehicle Scrapping"],
             4.5, 189, 430, 900, 4.5, 5.0, False, True, 6,
             ["Telugu", "Hindi", "English"], True,
             "Scrapping & NOC expert across Telangana."),
    RtoAgent("ag_5", "Priya Nair", "👩‍💼", "Indiranagar", "Bengaluru",
             ["Address Change", "Interstate / NOC", "Road Tax", "DL Services"],
             4.9, 703, 2010, 1100, 1.0, 2.0, True, True, 10,
             ["Kannada", "Hindi", "English", "Tamil"], True,
             "Top-rated in Bengaluru, replies within an hour."),
    RtoAgent("ag_6", "Mohit Sharma", "🧑‍💼", "Rohini", "Delhi",
             ["New Registration", "HSRP", "Duplicate RC", "Hypothecation Removal"],
             4.3, 121, 300, 700, 6.0, 6.0, False, False, 4,
             ["Hindi", "English"], False,
             "Budget-friendly, good for basic RC work."),
    RtoAgent("ag_7", "Lakshmi Iyer", "👩‍💼", "T. Nagar", "Chennai",
             ["Ownership Transfer", "RC Renewal", "Fitness Certificate", "Permit"],
             4.6, 344, 890, 1000, 3.5, 3.5, True, True, 9,
             ["Tamil", "English", "Hindi"], True,
             "Commercial vehicle compliance specialist."),
    RtoAgent("ag_8", "Imran Qureshi", "👨‍💼", "Navrangpura", "Ahmedabad",
             ["Interstate / NOC", "Ownership Transfer", "Road Tax"],
             4.4, 157, 410, 850, 5.0, 4.5, True, True, 8,
             ["Gujarati", "Hindi", "English"], True,
             "Interstate transfer between GJ & MH made easy."),
    RtoAgent("ag_9", "Neha Joshi", "👩‍💼", "Baner", "Pune",
             ["Duplicate RC", "Address Change", "HSRP", "DL Services", "RC Renewal"],
             4.8, 289, 720, 650, 2.0, 2.0, True, True, 5,
             ["Marathi", "Hindi", "English"], True,
             "Fast, affordable & fully digital paperwork."),
    RtoAgent("ag_10", "Suresh Babu", "🧑‍💼", "Whitefield", "Bengaluru",
             ["Vehicle Scrapping", "New Registration", "Fitness Certificate"],
             4.2, 98, 210, 1300, 7.0, 7.0, False, False, 3,
             ["Kannada", "English"], False,
             "Newer agent, competitive on scrapping."),
]


def list_agents(
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
) -> list[dict]:
    items = _AGENTS
    if area:
        items = [a for a in items if a.city.lower() == area.lower()]
    if service:
        items = [a for a in items if service in a.services]
    if min_rating:
        items = [a for a in items if a.rating >= min_rating]
    if min_reviews:
        items = [a for a in items if a.reviews >= min_reviews]
    if max_charges is not None:
        items = [a for a in items if a.charges_from <= max_charges]
    if max_response_hours is not None:
        items = [a for a in items if a.response_time_hours <= max_response_hours]
    if authorized_only:
        items = [a for a in items if a.rto_authorized]
    if online_only:
        items = [a for a in items if a.online]
    if query:
        q = query.lower()
        items = [a for a in items if q in a.name.lower() or q in a.area.lower()
                 or any(q in s.lower() for s in a.services)]

    keys = {
        "rating": lambda a: (-a.rating, -a.reviews),
        "reviews": lambda a: -a.reviews,
        "charges": lambda a: a.charges_from,
        "response": lambda a: a.response_time_hours,
        "turnaround": lambda a: a.turnaround_days,
        "tasks": lambda a: -a.tasks_completed,
        "experience": lambda a: -a.years_experience,
    }
    items = sorted(items, key=keys.get(sort, keys["rating"]))
    return [asdict(a) for a in items]


def get_agent(agent_id: str) -> dict | None:
    a = next((x for x in _AGENTS if x.id == agent_id), None)
    return asdict(a) if a else None
