# Motion Specification

Shared animation timing across iOS (SwiftUI) and web (Framer Motion).

## Tokens

| Token | Value | Usage |
|-------|-------|-------|
| ease-spring | spring(0.34, 1.2, 0.64, 1) | Button press, card expand |
| ease-smooth | cubic-bezier(0.4, 0, 0.2, 1) | Page transitions |
| duration-fast | 150ms | Micro-interactions |
| duration-normal | 300ms | Card reveals, chart draw |
| duration-slow | 600ms | Portfolio value roll-up |

## Signature animations

1. **Pulse heartbeat** — EKG line, 1 beat / 2s; intensifies in auto-mode
2. **Live portfolio value** — Odometer roll-up on price tick
3. **Allocation donut** — Staggered sweep 600ms; segment pulse on drift
4. **Trade celebration** — Particle burst + row slide-in with glow
5. **AI thinking** — Shimmer + pulsing icon; rationale types out (skippable)
6. **Risk gauge** — Needle tremble on volatility spike
7. **Auto-mode toggle** — Switch animation + cloud pulse banner
8. **Pull-to-refresh** — Pulse wave ripple (not spinner)
9. **Tab indicator** — Active icon scale 1.1x + sliding dot
10. **Page transitions** — Matched geometry / Framer layoutId on key stats

## Accessibility

- Respect `prefers-reduced-motion` on web
- iOS: check `accessibilityReduceMotion`
- Settings: motion intensity Full / Reduced / Off

## Platform mapping

| Web | iOS |
|-----|-----|
| Framer Motion | SwiftUI `.spring()` |
| `useSpring` number tween | `.contentTransition(.numericText())` |
| CSS `@media (prefers-reduced-motion)` | `@Environment(\.accessibilityReduceMotion)` |
