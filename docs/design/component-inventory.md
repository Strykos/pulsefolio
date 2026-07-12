# Component Inventory

Shared UI components for iOS (SwiftUI) and web (React).

## Brand & chrome

| Component | iOS | Web | Notes |
|-----------|-----|-----|-------|
| BrandLogo | `BrandLogo.swift` | `BrandLogo.tsx` | Mark, wordmark, tagline variants |
| PaperTradingBadge | `PaperTradingBadge.swift` | `PaperTradingBadge.tsx` | Always visible on trading views |
| PulseLine | `PulseLine.swift` | `PulseLine.tsx` | Animated EKG heartbeat |
| LiveIndicator | `LiveIndicator.swift` | `LiveIndicator.tsx` | Green/amber/grey WebSocket status |
| ThemeSwitcher | `ThemeSwitcher.swift` | `ThemeSwitcher.tsx` | 4 theme preview cards |

## Data display

| Component | iOS | Web | Notes |
|-----------|-----|-----|-------|
| Card | `Card.swift` | `Card.tsx` | Surface container |
| StatTile | `StatTile.swift` | `StatTile.tsx` | Label + animated value |
| AnimatedValue | `AnimatedValue.swift` | `AnimatedValue.tsx` | Odometer roll-up |
| PositionRow | `PositionRow.swift` | `PositionRow.tsx` | Holding with live price flash |
| TradeRow | `TradeRow.swift` | `TradeRow.tsx` | Slide-in on new trade |
| AssetClassBadge | `AssetClassBadge.swift` | `AssetClassBadge.tsx` | STOCK, ETF, CRYPTO, etc. |
| RiskScoreGauge | `RiskScoreGauge.swift` | `RiskScoreGauge.tsx` | Semi-circle 1–10 |
| ChartPanel | `ChartPanel.swift` | `ChartPanel.tsx` | Donut + sparkline |

## Trading & AI

| Component | iOS | Web | Notes |
|-----------|-----|-----|-------|
| DecisionCard | `DecisionCard.swift` | `DecisionCard.tsx` | AI recommendation with shimmer |
| ModeToggle | `ModeToggle.swift` | `ModeToggle.tsx` | Manual / Auto with cloud banner |
| TradeCelebration | `TradeCelebration.swift` | `TradeCelebration.tsx` | Particle burst on execute |

## Layout

| Component | iOS | Web | Notes |
|-----------|-----|-----|-------|
| TabBar | `MainTabView.swift` | `Sidebar.tsx` / `MobileNav.tsx` | Sliding active indicator |
| SplashScreen | `SplashView.swift` | `Splash.tsx` | Pulse draw animation |
