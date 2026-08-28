"""Built-in demo and admin account credentials (in-memory demo only)."""
from __future__ import annotations

ADMIN_USER_ID = "user_admin"
ADMIN_EMAIL = "admin@vaahansaarthi.com"
ADMIN_PASSWORD = "Admin@123"

DEMO_USER_ID = "user_himanshu"
DEMO_EMAIL = "himanshu@example.com"
DEMO_PASSWORD = "demo123"

PRIYA_USER_ID = "user_priya"
PRIYA_EMAIL = "priya@example.com"
PRIYA_PASSWORD = "demo123"

# Reserved emails — cannot self-signup; must use defined password.
ACCOUNTS: dict[str, dict] = {
    ADMIN_EMAIL: {
        "user_id": ADMIN_USER_ID,
        "name": "Platform Admin",
        "mobile": "+91 90000 00001",
        "password": ADMIN_PASSWORD,
        "role": "admin",
    },
    DEMO_EMAIL: {
        "user_id": DEMO_USER_ID,
        "name": "Himanshu",
        "mobile": "+91 90000 00000",
        "password": DEMO_PASSWORD,
        "role": "user",
    },
    PRIYA_EMAIL: {
        "user_id": PRIYA_USER_ID,
        "name": "Priya",
        "mobile": "+91 90000 00002",
        "password": PRIYA_PASSWORD,
        "role": "user",
    },
}

RESERVED_EMAILS = set(ACCOUNTS.keys())
