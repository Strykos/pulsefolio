# Pulsefolio Brand Guidelines

## Identity

| Element | Value |
|---------|-------|
| App name | Pulsefolio |
| Tagline | *Every beat of your portfolio, decoded.* |
| Sub-tagline | AI-powered paper trading across stocks, ETFs, crypto, and more — balanced for growth. |
| Bundle ID | `com.pulsefolio.app` |

## Logo

The Pulse mark is a heartbeat/EKG line crossing a dark circle. The peak forms a subtle upward chart tick. Use the gradient from teal (`#00D4AA`) to blue (`#4A9EFF`).

### Variants

- `logo-mark.svg` — icon only (app icon, favicon, loading states)
- `logo-wordmark.svg` — icon + "Pulsefolio" wordmark
- `logo-wordmark-tagline.svg` — full lockup with tagline

### Clear space

Minimum padding around the mark: 25% of the icon diameter on all sides.

### Do

- Use on dark backgrounds (`#0D0F14` or theme backgrounds)
- Keep the pulse line intact and unmodified
- Use SVG for web; PNG at 1x/2x/3x for iOS

### Don't

- Stretch or rotate the mark
- Change gradient colors outside approved themes
- Place on busy backgrounds without a dark container

## Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| brand-bg | `#0D0F14` | App background, icon bg |
| brand-surface | `#1A1D26` | Cards, panels |
| brand-accent | `#4A9EFF` | CTAs, logo gradient end |
| brand-gain | `#00D4AA` | Positive P&L, logo gradient start |
| brand-loss | `#FF4757` | Negative P&L |
| brand-muted | `#8B95A8` | Tagline, secondary text |

## Typography

- **iOS:** SF Pro Display (headings), SF Pro Text (body), tabular nums for prices
- **Web:** Inter (fallback to system-ui), tabular-nums for financial data
- **Wordmark:** Semibold, -0.02em letter-spacing

## Voice

Confident, precise, risk-aware. Never hype speculative trading. Always reinforce paper trading.

## Required UI elements

- `PAPER TRADING` badge visible on all trading views
- Pulse loading animation on app open (line draws left-to-right)
- Tagline on login/splash screens
