# Pulsefolio iOS

SwiftUI native app — **live API only**, no mock data.

## Bundle ID
`com.pulsefolio.app`

## Quick start (Simulator)

```bash
# Start API (binds 0.0.0.0:8000)
./scripts/dev-start.sh api

# Build + launch Simulator
./scripts/ios-run.sh
```

## Physical iPhone (next step)

Your phone cannot reach `localhost` — it needs your Mac's LAN IP.

1. **Same Wi‑Fi** — iPhone and Mac on the same network
2. **Start API** on your Mac:
   ```bash
   ./scripts/dev-start.sh api
   ```
3. **Connect iPhone** via USB, trust this Mac
4. **Xcode signing** — open `Pulsefolio.xcodeproj`, select your Team under Signing & Capabilities
5. **Install to device**:
   ```bash
   ./scripts/ios-device-run.sh
   ```
   Or in Xcode: select your iPhone as run destination, set scheme env `API_URL=http://YOUR_MAC_IP:8000`, press **⌘R**

6. **Login** on phone: `demo@pulsefolio.app` / `demo12345`

The login screen shows which API URL the app is using.

## Environment

| Variable | Purpose |
|----------|---------|
| `API_URL` | API base (scheme sets this; device script auto-detects LAN IP) |
| `PULSEFOLIO_API_HOST` | Override LAN IP detection |
| `PULSEFOLIO_TOKEN` | Skip login with a JWT (dev only) |

## Features
- JWT auth → `/api/v1/me/*` (live portfolio data)
- Morning Briefing, Decision Review, Portfolio X-Ray, Activity
- Paper trading badge
