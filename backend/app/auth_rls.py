"""Application-level row-level security (RLS) for multi-user demo store."""
from __future__ import annotations

import hashlib
from fastapi import Depends, Header, HTTPException

from .store import store
from .credentials import ACCOUNTS, RESERVED_EMAILS


def stable_user_id(email: str) -> str:
    normalized = email.strip().lower()
    if normalized in ACCOUNTS:
        return ACCOUNTS[normalized]["user_id"]
    digest = hashlib.sha256(normalized.encode()).hexdigest()[:16]
    return f"user_{digest}"


def public_user(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "password"}


def require_user(x_user_id: str | None = Header(None, alias="X-User-Id")) -> str:
    """Every data API must send X-User-Id — enforces per-user isolation."""
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(401, "Authentication required. Please sign in again.")
    uid = x_user_id.strip()
    if uid not in store.users:
        raise HTTPException(401, "Unknown user session. Please sign in again.")
    return uid


def require_admin(user_id: str = Depends(require_user)) -> str:
    """Only platform admin may configure global LLM settings."""
    if store.users[user_id].get("role") != "admin":
        raise HTTPException(403, "Admin access required for LLM configuration.")
    return user_id


def verify_login(email: str, password: str) -> dict:
    normalized = email.strip().lower()
    if normalized in ACCOUNTS:
        acct = ACCOUNTS[normalized]
        if password != acct["password"]:
            raise HTTPException(401, "Invalid email or password.")
        return store.ensure_user(
            acct["user_id"],
            acct["name"],
            normalized,
            acct["mobile"],
            password=acct["password"],
            role=acct["role"],
        )
    uid = stable_user_id(normalized)
    user = store.users.get(uid)
    if not user or user.get("password") != password:
        raise HTTPException(401, "Invalid email or password.")
    return user
