# ADR-001: Technology Stack

## Status
Accepted

## Context
Pulsefolio needs native iOS feel, responsive web dashboard, always-on auto-trading, and AI/risk engine.

## Decision
- **iOS:** SwiftUI + Swift 6
- **Web:** Next.js 15 + Tailwind + Framer Motion
- **API:** Python FastAPI + SQLAlchemy
- **Worker:** Python asyncio + APScheduler (same codebase as API)
- **DB:** PostgreSQL (Neon prod); SQLite local dev
- **Queue:** Redis/Upstash + job scheduler
- **Contract:** OpenAPI 3.1

## Consequences
- Two UI codebases (Swift + React) sharing design tokens JSON
- FastAPI suits AI/risk logic; worker reuses services layer
