"""Indian vehicle registration number parsing — RTO code → state/authority."""
from __future__ import annotations
import re

# ISO-style state codes used on Indian number plates
STATE_NAMES: dict[str, str] = {
    "AN": "Andaman and Nicobar Islands",
    "AP": "Andhra Pradesh",
    "AR": "Arunachal Pradesh",
    "AS": "Assam",
    "BR": "Bihar",
    "CG": "Chhattisgarh",
    "CH": "Chandigarh",
    "DD": "Daman and Diu",
    "DL": "Delhi",
    "GA": "Goa",
    "GJ": "Gujarat",
    "HP": "Himachal Pradesh",
    "HR": "Haryana",
    "JH": "Jharkhand",
    "JK": "Jammu and Kashmir",
    "KA": "Karnataka",
    "KL": "Kerala",
    "LA": "Ladakh",
    "LD": "Lakshadweep",
    "MH": "Maharashtra",
    "ML": "Meghalaya",
    "MN": "Manipur",
    "MP": "Madhya Pradesh",
    "MZ": "Mizoram",
    "NL": "Nagaland",
    "OD": "Odisha",
    "OR": "Odisha",
    "PB": "Punjab",
    "PY": "Puducherry",
    "RJ": "Rajasthan",
    "SK": "Sikkim",
    "TN": "Tamil Nadu",
    "TR": "Tripura",
    "TS": "Telangana",
    "UK": "Uttarakhand",
    "UP": "Uttar Pradesh",
    "WB": "West Bengal",
}

# Common RTO district labels (partial — covers major codes)
RTO_LABELS: dict[str, str] = {
    "MH01": "Mumbai (South)",
    "MH02": "Mumbai (West)",
    "MH03": "Mumbai (East)",
    "MH04": "Thane",
    "MH05": "Kalyan",
    "MH12": "Pune",
    "MH14": "Pimpri-Chinchwad",
    "MH15": "Nashik",
    "MH20": "Chhatrapati Sambhajinagar (Aurangabad)",
    "MH31": "Nagpur",
    "MH43": "Satara",
    "DL1": "Delhi (North West)",
    "DL3": "Delhi (South)",
    "DL8": "Delhi (West)",
    "DL9": "Delhi (South West)",
    "KA01": "Bangalore (Central)",
    "KA03": "Bangalore (East)",
    "KA05": "Bangalore (North)",
    "TN01": "Chennai (Central)",
    "TN07": "Chennai (South West)",
    "GJ01": "Ahmedabad",
    "GJ05": "Surat",
    "RJ14": "Jaipur (South)",
    "UP32": "Lucknow",
    "HR26": "Gurgaon",
    "TS09": "Hyderabad (Central)",
    "WB06": "Kolkata (Salt Lake)",
}

_REG_STANDARD = re.compile(r"^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$")
_REG_BHARAT = re.compile(r"^(\d{2})(BH)(\d{4})([A-Z]{2})$")


def normalize_reg(num: str) -> str:
    return "".join(num.upper().split()).replace("-", "")


def parse_rto(reg: str) -> dict[str, str]:
    """Derive state and RTO authority from a normalized registration number."""
    reg = normalize_reg(reg)
    state_code = ""
    rto_code = ""
    state = "India"
    rto_label = ""

    m = _REG_STANDARD.match(reg)
    if m:
        state_code, district, _series, _num = m.groups()
        rto_code = f"{state_code}{district}"
        state = STATE_NAMES.get(state_code, state_code)
        rto_label = RTO_LABELS.get(rto_code, f"RTO {rto_code}")
    else:
        m2 = _REG_BHARAT.match(reg)
        if m2:
            _yy, _bh, _num, state_code = m2.groups()
            state = STATE_NAMES.get(state_code, state_code)
            rto_code = f"BH-{state_code}"
            rto_label = f"Bharat series · {state}"

    return {
        "state_code": state_code,
        "rto_code": rto_code,
        "state": state,
        "rto": rto_label or (f"RTO {rto_code}" if rto_code else ""),
    }


def find_reg_in_text(text: str) -> str | None:
    """Find the first plausible Indian registration number in OCR text."""
    if not text:
        return None
    upper = text.upper()
    # Labelled fields first
    for pat in (
        r"(?:REG(?:ISTRATION)?\.?\s*(?:NO|NUMBER|MARK)?\.?\s*[:\-]?\s*)"
        r"([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{1,4})",
        r"(?:VEHICLE\s*NO\.?\s*[:\-]?\s*)([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{1,4})",
    ):
        m = re.search(pat, upper)
        if m:
            return normalize_reg(m.group(1))
    # Bare token
    for m in re.finditer(r"\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4})\b", upper):
        cand = m.group(1)
        if cand[:2] in STATE_NAMES:
            return cand
    return None
