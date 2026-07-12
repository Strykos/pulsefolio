#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/apps/ios"
TOOLS_DIR="$ROOT/.tools"
XCODEGEN="$TOOLS_DIR/xcodegen/xcodegen/bin/xcodegen"

echo "[iOS] Checking Xcode..."
xcode-select -p >/dev/null
xcodebuild -version

if [[ ! -x "$XCODEGEN" ]]; then
  echo "[iOS] Installing XcodeGen..."
  mkdir -p "$TOOLS_DIR"
  curl -fsSL "https://github.com/yonaskolb/XcodeGen/releases/download/2.44.1/xcodegen.zip" \
    -o "$TOOLS_DIR/xcodegen.zip"
  unzip -o "$TOOLS_DIR/xcodegen.zip" -d "$TOOLS_DIR/xcodegen"
  chmod +x "$XCODEGEN"
fi

echo "[iOS] Generating Pulsefolio.xcodeproj..."
cd "$IOS_DIR"
"$XCODEGEN" generate

if ! xcrun simctl list runtimes 2>/dev/null | grep -q "iOS"; then
  echo "[iOS] No iOS Simulator runtime found. Downloading iOS platform (~8.5 GB)..."
  xcodebuild -downloadPlatform iOS
fi

echo "[iOS] Setup complete."
echo "  Project: $IOS_DIR/Pulsefolio.xcodeproj"
echo "  Run:     $ROOT/scripts/ios-run.sh"
