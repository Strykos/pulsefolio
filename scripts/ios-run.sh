#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/apps/ios"
PROJECT="$IOS_DIR/Pulsefolio.xcodeproj"
SCHEME="Pulsefolio"
BUNDLE_ID="com.pulsefolio.app"
DERIVED="$IOS_DIR/build/DerivedData"
DEVICE_NAME="${IOS_SIMULATOR:-iPhone 17}"

if [[ ! -d "$PROJECT" ]]; then
  echo "Xcode project missing. Run: $ROOT/scripts/ios-setup.sh"
  exit 1
fi

if ! xcrun simctl list runtimes 2>/dev/null | grep -q "iOS"; then
  echo "iOS Simulator runtime not installed. Run: $ROOT/scripts/ios-setup.sh"
  exit 1
fi

echo "[iOS] Building for Simulator ($DEVICE_NAME)..."
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "platform=iOS Simulator,name=$DEVICE_NAME" \
  -derivedDataPath "$DERIVED" \
  API_URL="${API_URL:-http://localhost:8000}" \
  build

APP="$DERIVED/Build/Products/Debug-iphonesimulator/Pulsefolio.app"

echo "[iOS] Booting Simulator..."
open -a Simulator >/dev/null 2>&1 || true
xcrun simctl boot "$DEVICE_NAME" 2>/dev/null || true
xcrun simctl bootstatus booted -b

echo "[iOS] Installing and launching Pulsefolio..."
xcrun simctl install booted "$APP"
xcrun simctl launch booted "$BUNDLE_ID"

echo "[iOS] Pulsefolio is running in the Simulator."
echo "Start API for live data: $ROOT/scripts/dev-start.sh api"
