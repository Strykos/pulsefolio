"""Simple in-memory rate limiter for AI generate endpoints."""

from collections import defaultdict
from datetime import datetime, timezone
from threading import Lock

from fastapi import HTTPException, Request

GENERATE_LIMIT = 10
GENERATE_WINDOW_SECONDS = 60

_lock = Lock()
_hits: dict[str, list[float]] = defaultdict(list)


def _prune_and_count(key: str, now: float) -> int:
    window_start = now - GENERATE_WINDOW_SECONDS
    hits = [t for t in _hits[key] if t > window_start]
    _hits[key] = hits
    return len(hits)


def check_generate_rate_limit(key: str) -> None:
    now = datetime.now(timezone.utc).timestamp()
    with _lock:
        if _prune_and_count(key, now) >= GENERATE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: {GENERATE_LIMIT} requests per minute",
            )
        _hits[key].append(now)


def rate_limit_key_for_request(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"
    if request.client:
        return f"ip:{request.client.host}"
    return "ip:unknown"
