# Wireframes — Pulsefolio v1

## 1. Dashboard (alive screen)

```
┌─────────────────────────────────────┐
│ ● Live    [PAPER TRADING]    ⚙️    │
├─────────────────────────────────────┤
│  ~∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿~  pulse   │
│                                     │
│      $124,582.40  ▲ +1.24%         │
│      (animated odometer)            │
│                                     │
│   ┌─────────┐  ┌────────────────┐  │
│   │ donut   │  │ sparkline      │  │
│   │ chart   │  │ (live extend)  │  │
│   └─────────┘  └────────────────┘  │
│                                     │
│  Risk ●───────○ 4.2 Balanced       │
│                                     │
│  ┌─ AI Recommendation ──────────┐  │
│  │ REBALANCE · VTI · 78% conf  │  │
│  │ Risk: -0.1  Return: +0.3%   │  │
│  │ [Approve]  [Dismiss]        │  │
│  └─────────────────────────────┘  │
├─────────────────────────────────────┤
│ 🏠  📊  📋  🧠  ⚙️   (badge: 1)   │
└─────────────────────────────────────┘
```

## 2. Portfolio (by asset class)

```
┌─────────────────────────────────────┐
│ Portfolio                           │
├─────────────────────────────────────┤
│ Risk gauge (animated needle)        │
│                                     │
│ STOCKS ──────────── 35% / 30% ⚠️   │
│   AAPL  50 sh  $8,420  +2.1%       │
│   MSFT  30 sh  $12,100 +0.8%       │
│                                     │
│ ETFs ────────────── 25% / 25% ✓    │
│   VTI   40 sh  $9,800  +1.2%       │
│                                     │
│ CRYPTO ──────────── 12% / 10% ⚠️   │
│   BTC   0.5    $21,000 -0.5%       │
│                                     │
│ [Rebalance →]                       │
└─────────────────────────────────────┘
```

## 3. Trades

```
┌─────────────────────────────────────┐
│ Trades          [All ▾] [Pending:1] │
├─────────────────────────────────────┤
│ Pending Approvals                   │
│ ┌ BUY VTI x10  Manual  [Approve] ┐ │
│                                     │
│ History                             │
│ ● SELL BTC  auto   Jul 9  -$120    │
│ ● BUY  BND  manual Jul 8  +$45     │
└─────────────────────────────────────┘
```

## 4. AI Insights

```
┌─────────────────────────────────────┐
│ AI Insights                         │
├─────────────────────────────────────┤
│ Jul 9 14:32  REBALANCE  VTI         │
│ Confidence 78%  Risk -0.1           │
│ "Equities drifted to 58%..."        │
│ → Trade #1842 executed              │
│                                     │
│ Jul 9 09:15  HOLD                   │
│ "Within rebalance bands..."         │
│ → No action                         │
└─────────────────────────────────────┘
```

## 5. Settings

```
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│ Mode:  [Manual | ●Auto]             │
│ ☁️ Running in cloud 24/7            │
│                                     │
│ Appearance                          │
│ [Midnight][Aurora][Paper][Terminal] │
│                                     │
│ Risk: Conservative ● Balanced Growth│
│ Motion: Full / Reduced / Off          │
│ Sound: Trade ping [off]             │
│                                     │
│ Portfolio editor →                  │
│ Guardrails →                        │
└─────────────────────────────────────┘
```

## Responsive

- **iPhone:** Bottom tab bar, stacked cards
- **Tablet:** Split list + detail
- **Desktop web:** Left sidebar, 2-column dashboard grid
