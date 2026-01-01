# MOBILE VISUAL ARCHITECTURE

## NAVIGATION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE NAVIGATION                       │
└─────────────────────────────────────────────────────────────┘

                    Bottom Nav (Primary)
    ┌───────┬───────┬───────┬───────┬────────┐
    │ Home  │Markets│Signals│ Inbox │Profile │
    └───┬───┴───┬───┴───┬───┴───┬───┴───┬────┘
        │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼
    ┌───────┬───────┬───────┬───────┬────────┐
    │Mobile │Mobile │Mobile │Mobile │Mobile  │
    │ Home  │Markets│Signals│ Inbox │Profile │
    └───────┴───────┴───────┴───────┴────────┘
```

---

## SCREEN HIERARCHY

### HOME (Command Center)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Welcome back, [Name]              ┃
┃ Monday, Jan 1                     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Portfolio Value                   ┃
┃ $50,000.00                        ┃
┃ +$2,450.00 (+5.14%) Today        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ┏━━━━━━━━━━┓  ┏━━━━━━━━━━━┓     ┃
┃ ┃  Trade   ┃  ┃  Markets  ┃     ┃
┃ ┗━━━━━━━━━━┛  ┗━━━━━━━━━━━┛     ┃
┃ ┏━━━━━━━━━━┓  ┏━━━━━━━━━━━┓     ┃
┃ ┃ Signals  ┃  ┃   Notes   ┃     ┃
┃ ┗━━━━━━━━━━┛  ┗━━━━━━━━━━━┛     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃ ┃ Crypto Finds               ┃  ┃
┃ ┃ New Opportunities          ┃  ┃
┃ ┃ Discover emerging tokens   ┃  ┃
┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### MARKETS
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Markets                           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ┏━━━━━━┳━━━━━━┳━━━━━━┓          ┃
┃ ┃Crypto┃Stocks┃Forex ┃ ← Tabs   ┃
┃ ┗━━━━━━┻━━━━━━┻━━━━━━┛          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ┌──────────────────────────────┐ ┃
┃ │ BTC  $45,230.50    +3.45%  →│ ┃
┃ └──────────────────────────────┘ ┃
┃ ┌──────────────────────────────┐ ┃
┃ │ ETH  $2,340.80     +5.12%  →│ ┃
┃ └──────────────────────────────┘ ┃
┃ ┌──────────────────────────────┐ ┃
┃ │ SOL  $98.45        -2.34%  →│ ┃
┃ └──────────────────────────────┘ ┃
┃ ... (scrollable)                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### MARKET DETAIL
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ← BTC                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ $45,230.50                        ┃
┃ +$1,567.20 (+3.45%)               ┃
┃ [BULLISH 75]                      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃ ┃                             ┃  ┃
┃ ┃     [Mini Chart]            ┃  ┃
┃ ┃     Tap to Zoom             ┃  ┃
┃ ┃                             ┃  ┃
┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Market Regime                     ┃
┃ BULLISH - Score 75/100            ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ▸ Market Log            [24h]     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ▸ Liquidity & Volume              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ▸ Transaction Flow                ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ▸ Advanced Analysis               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### PROFILE
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [Avatar]  John Doe                ┃
┃           @johndoe                ┃
┃           [Level 5]               ┃
┃           Professional trader...  ┃
┃                                   ┃
┃ ┏━━━━━━━━━━━━━┓ ┏━━━┓            ┃
┃ ┃   Message   ┃ ┃ ⚙ ┃            ┃
┃ ┗━━━━━━━━━━━━━┛ ┗━━━┛            ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ┌────────────┐ ┌────────────┐    ┃
┃ │Trades: 124 │ │Win Rate:67%│    ┃
┃ └────────────┘ └────────────┘    ┃
┃ ┌────────────┐ ┌────────────┐    ┃
┃ │P&L: $12.5K │ │Courses: 8  │    ┃
┃ └────────────┘ └────────────┘    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ▸ Trading History       [124]     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ▸ Learning Progress               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ▸ Achievements          [12]      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## COMPONENT TREE

```
app/
├── layout.tsx
│   └── MobileBottomNavNew ──────┐
│                                 │
├── command-center/               │
│   └── page.tsx                  │
│       ├── useIsMobile()         │
│       ├── MobileHome ────────┐  │
│       └── DesktopDashboard   │  │
│                               │  │
├── markets/                    │  │
│   └── page.tsx                │  │
│       └── MobileMarkets ───┐ │  │
│                             │ │  │
├── crypto/[symbol]/           │ │  │
│   └── page.tsx               │ │  │
│       ├── useIsMobile()      │ │  │
│       ├── MobileMarketDetail│ │  │
│       └── DesktopDetail      │ │  │
│                               │ │  │
└── profile/                    │ │  │
    └── page.tsx                │ │  │
        ├── useIsMobile()       │ │  │
        ├── MobileProfile ────┐ │ │  │
        └── DesktopProfile    │ │ │  │
                               │ │ │  │
components/mobile/             │ │ │  │
├── MobileHome.tsx ◄───────────┘ │ │  │
├── MobileMarkets.tsx ◄──────────┘ │  │
├── MobileMarketDetail.tsx         │  │
├── MobileProfile.tsx ◄────────────┘  │
└── Accordion.tsx                     │
                                      │
components/navigation/                │
└── MobileBottomNavNew.tsx ◄──────────┘
```

---

## DATA FLOW

```
┌─────────────────────────────────────────────────────┐
│                    User Action                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Bottom Nav Click                        │
│         (Home | Markets | Signals...)               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Next.js Router                          │
│           router.push('/markets')                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Page Component                          │
│           app/markets/page.tsx                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              useIsMobile() Check                     │
└──────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┴────────────┐
           │                        │
           ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│  Mobile Layout   │    │ Desktop Layout   │
│  MobileMarkets   │    │ DesktopMarkets   │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Shared Business Logic                   │
│         (API calls, state, calculations)            │
└─────────────────────────────────────────────────────┘
```

---

## RESPONSIVE BREAKPOINTS

```
Mobile                Tablet              Desktop
< 768px              768px - 1023px      ≥ 1024px

┌──────────┐        ┌────────────────┐  ┌─────────────────────┐
│          │        │                │  │                     │
│  Single  │        │  Two Column    │  │   Multi-Column      │
│  Column  │        │  Layout        │  │   Dashboard         │
│          │        │                │  │                     │
│  Bottom  │        │  No Bottom Nav │  │   Top Nav Only      │
│  Nav     │        │  (optional)    │  │                     │
└──────────┘        └────────────────┘  └─────────────────────┘

className=           className=           className=
"md:hidden"         "hidden md:block"   "hidden lg:block"
```

---

## ACCORDION BEHAVIOR

```
COLLAPSED (Default)
┌─────────────────────────────────┐
│ ▸ Market Log           [24h]  ▼ │
└─────────────────────────────────┘

        User Taps ▼
             │
             ▼

EXPANDED
┌─────────────────────────────────┐
│ ▾ Market Log           [24h]  ▲ │
├─────────────────────────────────┤
│ ● 2h ago: Price +5.2%           │
│ ● 4h ago: Volume spike          │
│ ● 6h ago: Support tested        │
└─────────────────────────────────┘

        User Taps ▲
             │
             ▼

COLLAPSED
```

---

## TOUCH TARGET ZONES

```
Minimum 48x48px

┌────────────────────────────────┐
│  ┌──────────────────────────┐ │
│  │                          │ │
│  │      Tap Target          │ │ ← 48px height
│  │      (Button/Link)       │ │
│  │                          │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
         ↑
    48px width minimum
```

---

## STATE MANAGEMENT

```
Global State (Zustand/Context)
├── User Session
│   ├── user
│   ├── isPremium
│   └── settings
│
├── Portfolio Data
│   ├── balance
│   ├── totalPnL
│   └── assets
│
└── UI State
    ├── isMobile
    ├── activeNav
    └── accordionStates

Local Component State
├── activeTab (Markets)
├── expandedAccordion (MarketDetail)
├── hideBalance (PortfolioHeader)
└── loading states
```

---

## SAFE AREA INSETS

```
iPhone with Notch

┌─────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← safe-area-inset-top
├─────────────────────────────────┤
│                                 │
│        Content Area             │
│                                 │
├─────────────────────────────────┤
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← safe-area-inset-bottom
└─────────────────────────────────┘

Apply with:
paddingBottom: env(safe-area-inset-bottom)
paddingTop: env(safe-area-inset-top)
```

---

## ANIMATION TIMELINE

```
Page Load
├── 0ms    : Skeleton shown
├── 300ms  : Data loads
├── 350ms  : Components fade in (stagger)
│             ├── Item 1 (0ms delay)
│             ├── Item 2 (50ms delay)
│             ├── Item 3 (100ms delay)
│             └── Item 4 (150ms delay)
└── 500ms  : Animation complete

Tab Switch
├── 0ms    : Click detected
├── 50ms   : Active tab slides
├── 200ms  : Content fades out
├── 250ms  : New content fades in
└── 400ms  : Animation complete

Accordion Expand
├── 0ms    : Click detected
├── 50ms   : Chevron rotates
├── 100ms  : Height animates
└── 200ms  : Animation complete
```

---

## FILE ORGANIZATION

```
zenithscores-frontend/
│
├── app/
│   ├── layout.tsx                    (Updated: uses MobileBottomNavNew)
│   ├── command-center/page.tsx       (To update: add useIsMobile)
│   ├── markets/page.tsx              (To create: use MobileMarkets)
│   └── crypto/[symbol]/page.tsx      (To update: add useIsMobile)
│
├── components/
│   ├── mobile/                       (NEW)
│   │   ├── MobileHome.tsx
│   │   ├── MobileMarkets.tsx
│   │   ├── MobileMarketDetail.tsx
│   │   ├── MobileProfile.tsx
│   │   └── Accordion.tsx
│   │
│   └── navigation/
│       ├── MobileBottomNavNew.tsx    (NEW)
│       ├── MobileBottomNav.tsx       (OLD - to deprecate)
│       └── Navbar.tsx                (Existing)
│
├── lib/
│   └── hooks/
│       └── useMediaQuery.ts          (NEW)
│
├── MOBILE_ARCHITECTURE.md            (NEW - Complete guide)
├── MOBILE_REFORMATION_SUMMARY.md     (NEW - Implementation summary)
└── MOBILE_VISUAL_ARCHITECTURE.md     (This file)
```

---

## TESTING MATRIX

```
┌──────────────┬──────────┬──────────┬──────────┐
│ Feature      │ Mobile   │ Tablet   │ Desktop  │
├──────────────┼──────────┼──────────┼──────────┤
│ Bottom Nav   │    ✓     │    ✗     │    ✗     │
│ Top Nav      │  Simple  │  Simple  │   Full   │
│ Markets Tabs │    ✓     │    ✓     │    ✗     │
│ Accordions   │    ✓     │    ✓     │    ✗     │
│ Full Screen  │    ✓     │    ✓     │    ✗     │
│ Side Panels  │    ✗     │  Maybe   │    ✓     │
│ Bento Grid   │    ✗     │  Maybe   │    ✓     │
└──────────────┴──────────┴──────────┴──────────┘
```

---

## PERFORMANCE TARGETS

```
Metric                  Target      Notes
─────────────────────────────────────────────
First Paint             < 1s        Initial render
Time to Interactive     < 2s        Fully interactive
Navigation Speed        < 300ms     Between pages
Animation FPS           60fps       Smooth motion
Bundle Size (Mobile)    < 200KB     Gzipped JS
API Response            < 500ms     Data load
```

---

**VISUAL ARCHITECTURE COMPLETE**

Reference this document for:
- Navigation flow visualization
- Screen layout diagrams
- Component hierarchy
- Data flow patterns
- Responsive behavior
- Animation timing

---
