#!/usr/bin/env bash
# Build Pulsefolio for a physical iPhone and install via Xcode tooling.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/apps/ios"
PROJECT="$IOS_DIR/Pulsefolio.xcodeproj"
SCHEME="Pulsefolio"
BUNDLE_ID="com.pulsefolio.app"
DERIVED="$IOS_DIR/build/DerivedData"

# Detect Mac LAN IP for phone → API connectivity (phone cannot use localhost).
LAN_IP="${PULSEFOLIO_API_HOST:-}"
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
fi
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [[ -z "$LAN_IP" ]]; then
  echo "Could not detect LAN IP. Set PULSEFOLIO_API_HOST=192.168.x.x and retry."
  exit 1
fi

API_URL="${API_URL:-http://${LAN_IP}:8000}"
export API_URL

echo "[iOS] API_URL for device build: $API_URL"
echo "[iOS] Ensure API is running: $ROOT/scripts/dev-start.sh api"
echo "[iOS] Phone must be on the same Wi‑Fi as this Mac."

# Find connected physical device (first iPhone/iPad under == Devices ==, not Simulators).
DEVICE_ID=""
while IFS= read -r line; do
  if [[ "$line" == "== Simulators ==" ]]; then break; fi
  if [[ "$line" == "== Devices ==" ]]; then continue; fi
  if [[ "$line" =~ (iPhone|iPad) ]] && [[ ! "$line" =~ Simulator|MacBook ]]; then
    DEVICE_ID="$(echo "$line" | rg -o '[0-9A-F-]{36}' | head -1 || true)"
    [[ -n "$DEVICE_ID" ]] && break
  fi
done < <(xcrun xctrace list devices 2>/dev/null)

if [[ -z "$DEVICE_ID" ]] && command -v devicectl >/dev/null 2>&1; then
  DEVICE_ID="$(xcrun devicectl list devices 2>/dev/null | rg -m1 'iPhone|iPad' | rg -o '[0-9A-F-]{36}' || true)"
fi
if [[ -z "$DEVICE_ID" ]]; then
  echo "No physical iOS device detected. Connect iPhone via USB and trust this Mac."
  echo "Then open Xcode → Pulsefolio target → Signing & Capabilities → select your Team."
  open "$PROJECT"
  exit 1
fi

echo "[iOS] Building for device $DEVICE_ID ..."
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "id=$DEVICE_ID" \
  -derivedDataPath "$DERIVED" \
  API_URL="$API_URL" \
  build

APP="$DERIVED/Build/Products/Debug-iphoneos/Pulsefolio.app"
if [[ ! -d "$APP" ]]; then
  echo "Build succeeded but app bundle not found at $APP"
  exit 1
fi

echo "[iOS] Installing on device..."
if command -v devicectl >/dev/null 2>&1; then
  xcrun devicectl device install app --device "$DEVICE_ID" "$APP"
else
  echo "Install via Xcode: Product → Run (⌘R) with your iPhone selected."
  echo "Set scheme environment API_URL=$API_URL"
  open "$PROJECT"
fi

echo ""
echo "Done. Open Pulsefolio on your phone."
echo "Login: demo@pulsefolio.app / demo12345"
echo "API must be reachable at $API_URL"
