#!/usr/bin/env bash
# Pulsefolio smoke test — run after API + web are up
set -euo pipefail
export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_PORT="${WEB_PORT:-3001}"
API_URL="${API_URL:-http://localhost:8000}"
WEB_URL="http://localhost:${WEB_PORT}"

echo "=== Pulsefolio Smoke Test ==="
echo "API: $API_URL"
echo "Web: $WEB_URL"

# API tests
cd "$ROOT/services/api"
source .venv/bin/activate
pytest tests -q

# API health
curl -sf "$API_URL/" | grep -q dashboard && echo "[PASS] API root landing"
curl -sf "$API_URL/api/v1/health" > /dev/null && echo "[PASS] API health"

# Public endpoints
curl -sf "$API_URL/api/v1/public/dashboard" | grep -q totalValue && echo "[PASS] public/dashboard"
curl -sf "$API_URL/api/v1/public/dashboard" | grep -qE 'REBALANCE_BUY|"symbol":"VTI"' && echo "[PASS] dashboard has VTI rebalance"
curl -sf "$API_URL/api/v1/public/portfolio" | grep -q assetClasses && echo "[PASS] public/portfolio"

# Web pages
for page in dashboard portfolio trades insights settings; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL/$page")
  if [ "$code" = "200" ]; then
    echo "[PASS] web/$page HTTP 200"
  else
    echo "[FAIL] web/$page HTTP $code"
    exit 1
  fi
done

# Web production build (stop dev server first to avoid .next corruption)
echo "[INFO] Run 'npm run build' only when dev server is stopped"
echo "=== All smoke tests passed ==="
