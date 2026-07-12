#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"

API_DIR="$ROOT/services/api"
WEB_DIR="$ROOT/apps/web"

start_api() {
  cd "$API_DIR"
  source .venv/bin/activate
  export DATABASE_URL="${DATABASE_URL:-sqlite:///./pulsefolio.db}"
  export JWT_SECRET="${JWT_SECRET:-dev-secret}"
  echo "[API] Starting on http://localhost:8000"
  exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

start_web() {
  cd "$WEB_DIR"
  echo "[WEB] Starting on http://localhost:3000"
  exec npm run dev
}

case "${1:-all}" in
  api)  start_api ;;
  web)  start_web ;;
  all)
    echo "Starting API and Web in background..."
    "$0" api &
    API_PID=$!
    sleep 2
    "$0" web &
    WEB_PID=$!
    echo "API PID: $API_PID | Web PID: $WEB_PID"
    wait
    ;;
  *)
    echo "Usage: $0 [api|web|all]"
    exit 1
    ;;
esac
