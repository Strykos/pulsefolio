#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"

echo "=== Pulsefolio dev setup ==="
echo "Project: $ROOT"

# --- Xcode CLI tools (optional; uv/node used if missing) ---
if ! xcode-select -p &>/dev/null; then
  echo "[!] Xcode CLI tools not installed. Requesting install dialog..."
  xcode-select --install 2>/dev/null || true
  echo "    Approve the macOS dialog, then re-run this script."
else
  echo "[ok] Xcode CLI tools: $(xcode-select -p)"
fi

# --- Node (standalone if missing) ---
if ! command -v node &>/dev/null; then
  echo "[*] Installing Node.js v20..."
  NODE_VERSION="v20.18.1"
  mkdir -p "$HOME/.local/node"
  curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-darwin-arm64.tar.gz" \
    | tar -xz -C "$HOME/.local/node" --strip-components=1
  export PATH="$HOME/.local/node/bin:$PATH"
fi
echo "[ok] Node $(node --version) | npm $(npm --version)"

# --- uv + Python API ---
if ! command -v uv &>/dev/null; then
  echo "[*] Installing uv..."
  curl -fsSL https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
echo "[ok] uv $(uv --version)"

echo "[*] API: creating venv + installing deps..."
cd "$ROOT/services/api"
uv venv .venv --quiet 2>/dev/null || true
source .venv/bin/activate
uv pip install -r requirements.txt pytest httpx -q
echo "[ok] API dependencies installed"

echo "[*] Web: npm install..."
cd "$ROOT/apps/web"
npm install --silent
echo "[ok] Web dependencies installed"

echo "[*] Running API tests..."
cd "$ROOT/services/api"
source .venv/bin/activate
DATABASE_URL=sqlite:///./test.db JWT_SECRET=test-secret pytest tests -q
echo "[ok] Tests passed"

echo ""
echo "=== Setup complete ==="
echo "Start API:  cd services/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "Start Web:  cd apps/web && npm run dev"
echo "Dashboard:  http://localhost:3000"
echo "API docs:   http://localhost:8000/api/v1/docs"
