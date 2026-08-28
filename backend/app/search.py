"""Live web search — Tavily (primary) with Google Custom Search fallback.

Used to ground AI answers with real-time information (e.g. current fuel prices,
latest RTO/road-tax rules, on-road prices, new model launches, policy changes).
"""
from __future__ import annotations
import json
import urllib.parse
import urllib.request
from dataclasses import dataclass

from .config import get_settings


@dataclass
class SearchResult:
    title: str
    url: str
    content: str


def _http_json(url: str, data: bytes | None = None, headers: dict | None = None, timeout: int = 12) -> dict:
    req = urllib.request.Request(url, data=data, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def _tavily(query: str, max_results: int = 5) -> tuple[str, list[SearchResult]]:
    s = get_settings()
    payload = json.dumps({
        "api_key": s.tavily_api_key,
        "query": query,
        "search_depth": "basic",
        "include_answer": True,
        "max_results": max_results,
    }).encode()
    data = _http_json(
        "https://api.tavily.com/search",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    answer = data.get("answer") or ""
    results = [
        SearchResult(title=r.get("title", ""), url=r.get("url", ""), content=r.get("content", ""))
        for r in data.get("results", [])
    ]
    return answer, results


def _google(query: str, max_results: int = 5) -> tuple[str, list[SearchResult]]:
    s = get_settings()
    params = urllib.parse.urlencode({
        "key": s.google_api_key,
        "cx": s.google_cse_id,
        "q": query,
        "num": min(max_results, 10),
    })
    data = _http_json(f"https://www.googleapis.com/customsearch/v1?{params}")
    results = [
        SearchResult(title=i.get("title", ""), url=i.get("link", ""), content=i.get("snippet", ""))
        for i in data.get("items", [])
    ]
    return "", results


def web_search(query: str, max_results: int = 5) -> tuple[str, list[SearchResult]]:
    """Returns (answer, results). Tries Tavily first, then Google CSE."""
    s = get_settings()
    if s.tavily_api_key:
        try:
            return _tavily(query, max_results)
        except Exception:
            pass
    if s.google_api_key and s.google_cse_id:
        try:
            return _google(query, max_results)
        except Exception:
            pass
    return "", []


def format_for_prompt(answer: str, results: list[SearchResult], limit: int = 5) -> str:
    lines = []
    if answer:
        lines.append(f"Summary: {answer}")
    for i, r in enumerate(results[:limit], 1):
        snippet = (r.content or "")[:280]
        lines.append(f"[{i}] {r.title}\n{snippet}\n({r.url})")
    return "\n\n".join(lines) if lines else "No live results found."
