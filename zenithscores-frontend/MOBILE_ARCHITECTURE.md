# MOBILE-FIRST ARCHITECTURE — ZENITHSCORES

## TABLE OF CONTENTS
1. [Overview](#overview)
2. [Navigation Structure](#navigation-structure)
3. [Component Architecture](#component-architecture)
4. [Routing Strategy](#routing-strategy)
5. [Mobile Layout Patterns](#mobile-layout-patterns)
6. [Component Mapping](#component-mapping)
7. [Tailwind Breakpoints](#tailwind-breakpoints)
8. [Progressive Disclosure Rules](#progressive-disclosure-rules)
9. [Implementation Guidelines](#implementation-guidelines)

---

## OVERVIEW

This architecture transforms ZenithScores into a mobile-first experience while preserving desktop functionality. The approach is **reorganization, not redesign**—all business logic remains intact.

### Core Principles
- One navigation authority on mobile: Bottom Navigation
- One primary action per screen
- Vertical scrolling only
- Progressive disclosure (collapsed by default)
- Thumb-first interactions
- Wallet-grade UX

---

## NAVIGATION STRUCTURE

### Mobile Bottom Navigation (PRIMARY)

```
┌─────────────────────────────────────────────┐
│  Home  │ Markets │ Signals │ Inbox │ Profile │
└─────────────────────────────────────────────┘
```

**Implementation**: `components/navigation/MobileBottomNavNew.tsx`

**Routes**:
- **Home** → `/command-center`
- **Markets** → `/markets` (with tabs: Crypto | Stocks | Forex)
- **Signals** → `/signals`
- **Inbox** → `/messages`
- **Profile** → `/profile` (public by default)

**Rules**:
- Always visible (except fullscreen modes)
- Active state clearly indicated
- Touch targets ≥ 48px
- Labels always shown (no icon-only)

### Mobile Top Navbar (SECONDARY)

```
┌─────────────────────────────────────────────┐
│ [Logo]                      [🔔] [☰] [Avatar]│
└─────────────────────────────────────────────┘
```

**Content**:
- Logo (tap → `/command-center`)
- Notifications icon
- Hamburger menu (settings/meta only)
- Avatar (tap → public profile)

**Hamburger Menu Contains**:
- Settings
- Subscription
- Help
- Sign Out

**Does NOT Contain**:
- Markets
- Intelligence
- Community
- Any product navigation

---

## COMPONENT ARCHITECTURE

### Mobile Detection Hook

```typescript
// lib/hooks/useMediaQuery.ts
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}
```

### Conditional Rendering Pattern

```tsx
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import MobileHome from '@/components/mobile/MobileHome';
import DesktopHome from '@/components/desktop/DesktopHome';

export default function Page() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileHome />;
  }

  return <DesktopHome />;
}
```

**Key Rule**: Do NOT duplicate business logic. Only layout and visibility differ.

---

## ROUTING STRATEGY

| Route | Mobile Behavior | Desktop Behavior |
|-------|----------------|------------------|
| `/command-center` | Launchpad (MobileHome) | Dashboard (bento grid) |
| `/markets` | Feed with tabs | Multi-column layout |
| `/markets/crypto` | Vertical list | Table view |
| `/crypto/[symbol]` | Full screen detail | Side panel |
| `/signals` | Primary signal + feed | Full dashboard |
| `/messages` | List view | Chat interface |
| `/messages/[userId]` | Full screen chat | Split view |
| `/profile` | Public profile (default) | Public profile |
| `/profile/private` | Private dashboard | Private dashboard |

### Avatar Tap Behavior
- **Always** opens public profile (`/profile` or `/user/[userId]`)
- Private dashboard accessed via "View My Dashboard" button

---

## MOBILE LAYOUT PATTERNS

### 1. MobileHome (Launchpad)

**File**: `components/mobile/MobileHome.tsx`

**Structure**:
```
┌───────────────────────────┐
│ Welcome back, [Name]      │
│ [Date]                    │
├───────────────────────────┤
│ Portfolio Value           │
│ $50,000.00                │
│ +$2,450 (+5.14%)          │
├───────────────────────────┤
│ ┌──────┐  ┌──────┐       │
│ │Trade │  │Markets│       │
│ └──────┘  └──────┘       │
│ ┌──────┐  ┌──────┐       │
│ │Signals│ │Notes │       │
│ └──────┘  └──────┘       │
├───────────────────────────┤
│ [Highlight Card]          │
│ Crypto Finds              │
└───────────────────────────┘
```

**Features**:
- Welcome message
- Portfolio summary
- 4 primary actions (2x2 grid)
- ONE highlight card (rotates: Crypto Finds, Signals, etc.)

### 2. MobileMarkets (Feed-First)

**File**: `components/mobile/MobileMarkets.tsx`

**Structure**:
```
┌───────────────────────────┐
│ Markets                   │
├───────────────────────────┤
│ [Crypto│Stocks│Forex]    │
├───────────────────────────┤
│ BTC  $45,230.50  +3.45%  │
│ ETH  $2,340.80   +5.12%  │
│ SOL  $98.45      -2.34%  │
│ ...                       │
└───────────────────────────┘
```

**Features**:
- Segmented control for asset types
- Vertical scrolling list
- Touch-optimized cards
- No horizontal scroll

### 3. MobileMarketDetail (Progressive Disclosure)

**File**: `components/mobile/MobileMarketDetail.tsx`

**Structure**:
```
┌───────────────────────────┐
│ ← BTC                     │
├───────────────────────────┤
│ $45,230.50                │
│ +$1,567.20 (+3.45%)       │
│ [BULLISH 75]              │
├───────────────────────────┤
│ [Mini Chart - Tap to Zoom]│
├───────────────────────────┤
│ Market Regime             │
│ BULLISH - Score 75/100    │
├───────────────────────────┤
│ ▸ Market Log        [24h] │
│ ▸ Liquidity & Volume      │
│ ▸ Transaction Flow        │
│ ▸ Advanced Analysis       │
└───────────────────────────┘
```

**Features**:
- Price + DG badge at top
- Mini chart (tap = fullscreen)
- Regime summary card
- Accordions (all collapsed by default)

### 4. MobileProfile (Public Default)

**File**: `components/mobile/MobileProfile.tsx`

**Structure**:
```
┌───────────────────────────┐
│ [Avatar] Name             │
│          Level 5          │
│          Bio text...      │
│ [Message] [Settings]      │
├───────────────────────────┤
│ Trades   Win Rate         │
│ 124      67%              │
│ P&L      Courses          │
│ $12,500  8                │
├───────────────────────────┤
│ ▸ Trading History    [124]│
│ ▸ Learning Progress       │
│ ▸ Achievements       [12] │
└───────────────────────────┘
```

**Features**:
- Avatar + name + level
- Primary CTA: Message (if not own profile)
- Quick stats grid (2x2)
- Collapsible sections

---

## COMPONENT MAPPING

| Desktop Component | Mobile Component | Notes |
|------------------|------------------|-------|
| CommandCenterPage (bento grid) | MobileHome | Launchpad vs dashboard |
| CryptoPage (table) | MobileMarkets (feed) | Tabs for asset types |
| MarketDetailPanel | MobileMarketDetail | Full screen, accordions |
| PublicProfile | MobileProfile | Same data, different layout |
| InboxPage | MobileInbox | List → full screen chat |
| SignalsPage | MobileSignals | Primary signal + feed |

---

## TAILWIND BREAKPOINTS

```css
/* Mobile First */
.container { /* Default: mobile */ }

/* Tablet */
@media (min-width: 768px) { .md:block }

/* Desktop */
@media (min-width: 1024px) { .lg:block }
@media (min-width: 1280px) { .xl:block }
```

### Standard Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

### Layout Rules
```tsx
// Hide on mobile
className="hidden md:block"

// Show only on mobile
className="md:hidden"

// Full width on mobile, constrained on desktop
className="w-full md:max-w-2xl"

// Stack on mobile, grid on desktop
className="flex flex-col md:grid md:grid-cols-3"
```

---

## PROGRESSIVE DISCLOSURE RULES

### Accordion Component

**File**: `components/mobile/Accordion.tsx`

**Usage**:
```tsx
<Accordion title="Market Log" badge="24h" defaultOpen={false}>
  <LogContent />
</Accordion>
```

**Rules**:
- All accordions **collapsed by default**
- Badge shows count or time range
- Smooth expand/collapse animation
- Only one can be open at a time (optional)

### What to Collapse
1. **Market Detail**:
   - Market log
   - Liquidity & volume
   - Transaction flow
   - Advanced analysis

2. **Profile**:
   - Trading history
   - Learning progress
   - Achievements
   - Stats (beyond quick stats)

3. **Signals**:
   - Scanner settings
   - Historical signals
   - Advanced filters

### What to Show
- Primary metric (price, balance, score)
- One-line summary
- Primary CTA button
- Quick stats (2x2 grid max)

---

## IMPLEMENTATION GUIDELINES

### 1. Adding Mobile Support to Existing Page

```tsx
// app/page.tsx
'use client';

import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import MobileVersion from '@/components/mobile/MobileVersion';
import DesktopVersion from '@/components/desktop/DesktopVersion';

export default function Page() {
  const isMobile = useIsMobile();

  return isMobile ? <MobileVersion /> : <DesktopVersion />;
}
```

### 2. Creating Mobile Component

```tsx
// components/mobile/MobileFeature.tsx
'use client';

export default function MobileFeature({ data }: Props) {
  return (
    <div className="min-h-screen bg-[var(--void)] pb-20">
      {/* Header */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold">Title</h1>
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {/* Mobile-optimized content */}
      </div>
    </div>
  );
}
```

### 3. Touch Target Standards

```tsx
// Minimum 48px touch targets
className="touch-target" // min-h-44px min-w-44px

// Active states
className="active:scale-95 transition-transform"

// Buttons
className="px-4 py-3 rounded-xl touch-target"
```

### 4. Safe Area Support

```tsx
// Bottom padding for iPhone notch
style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}

// Sticky headers
className="sticky top-16" // Account for top nav
```

### 5. Vertical Scroll Only

```tsx
// Container
className="overflow-y-auto overflow-x-hidden"

// Prevent horizontal scroll
className="max-w-full"

// Lists
className="space-y-2" // Vertical spacing
```

---

## EXAMPLE: COMPLETE FLOW

### User Journey: View Bitcoin Market Detail

1. **Tap Markets** (bottom nav)
   → Navigates to `/markets`
   → Shows MobileMarkets with Crypto tab active

2. **Tap BTC** from list
   → Navigates to `/crypto/BTC`
   → Shows MobileMarketDetail (full screen)

3. **View collapsed sections**:
   - Price + DG badge visible
   - Mini chart visible
   - Regime summary visible
   - All accordions collapsed

4. **Tap "Market Log" accordion**
   → Expands to show 24h log entries
   → Other accordions remain collapsed

5. **Tap mini chart**
   → Opens fullscreen chart modal
   → Bottom nav hidden
   → Close button in top-left

6. **Tap back arrow**
   → Returns to `/markets`
   → MobileMarkets still at same scroll position

---

## STYLE TONE GUIDELINES

### Text
- Calm, professional
- No hype, no emojis
- Bloomberg meets Trust Wallet
- Data-first, not marketing-first

### Typography
```tsx
// Headers
className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}

// Body
className="text-sm text-[var(--text-secondary)]"

// Data
className="font-mono text-[var(--accent-mint)]"
```

### Colors
```css
--void: #000000          /* Background */
--accent-mint: #14f195   /* Primary actions, positive */
--accent-cyan: #00d4ff   /* Secondary accent */
--accent-danger: #ef4444 /* Negative, destructive */
--text-primary: #ffffff  /* Main text */
--text-secondary: #a1a1aa /* Labels */
--text-muted: #52525b    /* Subtle text */
```

---

## FILES CREATED

### Core Components
- `lib/hooks/useMediaQuery.ts` - Mobile detection
- `components/navigation/MobileBottomNavNew.tsx` - Bottom nav
- `components/mobile/MobileHome.tsx` - Home launchpad
- `components/mobile/MobileMarkets.tsx` - Markets feed
- `components/mobile/MobileMarketDetail.tsx` - Market detail
- `components/mobile/MobileProfile.tsx` - Profile view
- `components/mobile/Accordion.tsx` - Progressive disclosure

### Updated Files
- `app/layout.tsx` - Uses new bottom nav

---

## NEXT STEPS

1. **Update Command Center page**:
   ```tsx
   // app/command-center/page.tsx
   const isMobile = useIsMobile();
   return isMobile ? <MobileHome {...} /> : <DesktopCommandCenter />;
   ```

2. **Create markets page with tabs**:
   ```tsx
   // app/markets/page.tsx
   return <MobileMarkets {...} />;
   ```

3. **Update crypto/stocks/forex detail pages**:
   ```tsx
   // app/crypto/[symbol]/page.tsx
   const isMobile = useIsMobile();
   return isMobile ? <MobileMarketDetail {...} /> : <DesktopDetail />;
   ```

4. **Test on actual devices**:
   - iPhone (Safari)
   - Android (Chrome)
   - Tablet (both orientations)

---

## TESTING CHECKLIST

- [ ] Bottom nav visible on all mobile pages
- [ ] Touch targets ≥ 48px
- [ ] No horizontal scroll
- [ ] Safe area insets working (iPhone notch)
- [ ] Accordions collapse/expand smoothly
- [ ] Active states on all interactive elements
- [ ] Back button works correctly
- [ ] Deep links work
- [ ] Scroll position preserved on navigation

---

**END OF MOBILE ARCHITECTURE DOCUMENTATION**
