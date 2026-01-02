# Professional Chart Engine - Complete Guide

## 🎯 Core Philosophy: Trust > Beauty

This chart engine is built on one principle: **Never lie to users about data freshness.**

- ✅ Always show real data
- ✅ Always show delays honestly
- ✅ Never fake smoothness
- ✅ Never hide API limitations

---

## 📊 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ Chart Component│  │ Status Badge │  │ Mode Toggle  ││
│  └────────────────┘  └──────────────┘  └──────────────┘│
└────────────────────────┬─────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │   useLiveChartData Hook         │
        │  • Data fetching               │
        │  • Polling management          │
        │  • Freshness detection         │
        └────────────────┬────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │    Data Source Adapters         │
        │  ┌──────────┐ ┌──────────┐     │
        │  │DexScreenr│ │Alpha Vant│ ... │
        │  └──────────┘ └──────────┘     │
        └────────────────┬────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │      Data Normalization         │
        │  • OHLC standardization        │
        │  • Sliding window              │
        │  • Delay calculation           │
        └─────────────────────────────────┘
```

---

## 🔧 Components

### 1. **Data Source Adapters** (`lib/charts/dataAdapters.ts`)

Normalize data from different APIs into unified `OHLCPoint` format.

**Supported Sources:**
- **DexScreener** - Crypto markets (free, no API key)
- **Alpha Vantage** - Forex + Stocks (API key required)
- **Finnhub** - Stocks (API key required)

**Usage:**
```typescript
import { fetchOHLCData } from '@/lib/charts/dataAdapters';

const data = await fetchOHLCData(
  'dexscreener',           // source
  '0x...address',          // symbol/token address
  '5m',                    // interval
  undefined                // API key (not needed for DexScreener)
);
```

### 2. **Data Freshness Detection** (`lib/charts/dataFreshness.ts`)

Calculates honest delay metrics.

**Status Levels:**
- **Live** (green): Data < 10 seconds old
- **Delayed** (amber): 10s - 5min old (shows exact delay)
- **Paused** (gray): > 5min old or no updates
- **Error** (red): Polling failed

**Never Hidden:**
- API rate limits
- Network failures
- Stale data

### 3. **Sliding Window** (`lib/charts/slidingWindow.ts`)

Keeps charts anchored to NOW:
- Right edge = latest data
- History flows left
- Auto-drops oldest candles
- Configurable window size (default: 100 candles)

### 4. **Professional Chart Component** (`components/charts/ProfessionalChart.tsx`)

Main chart with:
- **NOW Line** - Vertical emerald line at right edge
- **Live Dot** - Pulsing dot on latest data point (only when live)
- **Mode Toggle** - Line vs Candlestick
- **Status Badge** - Honest delay reporting
- **Smooth Animations** - 300-600ms ease-out transitions

### 5. **Live Data Hook** (`hooks/useLiveChartData.ts`)

Orchestrates everything:
```typescript
const { data, freshness, isLoading, error, refetch } = useLiveChartData({
  symbol: 'BTC/USD',
  source: 'dexscreener',
  interval: '5min',
  apiKey: process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY,
  pollingInterval: 30000,  // 30s
  maxCandles: 100,         // Sliding window size
});
```

---

## 🚀 Quick Start

### Example: Crypto Chart (DexScreener)

```typescript
'use client';

import { useState } from 'react';
import ProfessionalChart from '@/components/charts/ProfessionalChart';
import { useLiveChartData } from '@/hooks/useLiveChartData';
import { ChartMode } from '@/lib/charts/types';

export default function CryptoChartExample() {
  const [mode, setMode] = useState<ChartMode>('line');

  const { data, freshness, isLoading } = useLiveChartData({
    symbol: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    source: 'dexscreener',
    interval: '5m',
    pollingInterval: 30000, // Poll every 30s
  });

  if (isLoading) {
    return <div>Loading chart...</div>;
  }

  return (
    <div className="h-[400px]">
      <ProfessionalChart
        symbol="WETH/USD"
        data={data}
        mode={mode}
        freshness={freshness}
        onModeChange={setMode}
      />
    </div>
  );
}
```

### Example: Stock Chart (Finnhub)

```typescript
const { data, freshness } = useLiveChartData({
  symbol: 'AAPL',
  source: 'finnhub',
  interval: '5',  // 5-minute candles
  apiKey: process.env.NEXT_PUBLIC_FINNHUB_KEY,
  pollingInterval: 60000, // Poll every 60s (stocks less frequent)
});
```

### Example: Forex Chart (Alpha Vantage)

```typescript
const { data, freshness } = useLiveChartData({
  symbol: 'EUR/USD',
  source: 'alphavantage',
  interval: '5min',
  apiKey: process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY,
  pollingInterval: 45000, // Poll every 45s
});
```

---

## ⏱️ Time & Real-Time Rules

### Golden Rule: **NOW is Always Visible**

1. **Right-Anchored Charts**
   - Latest candle/value ALWAYS at right edge
   - History flows left
   - NO horizontal scrolling in live mode

2. **Sliding Window**
   - Keeps last N candles (default: 100)
   - Drops oldest as new data arrives
   - Smooth transitions, no jumps

3. **Live Indicators**
   - **NOW Line**: Thin vertical line with label
   - **Live Dot**: Pulsing emerald dot (only when `status === 'live'`)

---

## ⚠️ Data Delay Transparency (CRITICAL)

### Status Badge Behavior

| Status | Color | Example Label | Meaning |
|--------|-------|---------------|---------|
| Live | Green (pulsing) | "Live" | Data < 10s old |
| Delayed | Amber | "Delayed (45s)" | Data 10s-5min old |
| Paused | Gray | "Paused (8m)" | Data > 5min old |
| Error | Red | "Connection Error" | Polling failed |

### Chart Dimming

When `status === 'delayed' | 'paused' | 'error'`:
- Chart opacity → 50%
- Visual cue that data is not fresh
- Users know something is wrong

**NEVER:**
- Hide delays
- Fake smoothness when data is stale
- Continue animations if data isn't updating

---

## 🎨 Visual Style Rules

### Colors
- **Background**: True black (`#000000`)
- **Primary**: Emerald (`#10b981`)
- **Text**: Zinc grays
- **Grid**: White 3% opacity

### NO:
- ❌ Gradients outside emerald
- ❌ Rainbow candles
- ❌ Neon effects
- ❌ Bouncing animations

### YES:
- ✅ Minimal grid lines
- ✅ Calm, professional motion
- ✅ Monospace fonts for numbers
- ✅ Emerald accents only

---

## 🔁 Update Strategy

### Polling Intervals by Source

| Source | Recommended Interval | Reason |
|--------|---------------------|--------|
| DexScreener | 30s | Free tier, crypto moves fast |
| Alpha Vantage | 45-60s | Rate limited (5 req/min) |
| Finnhub | 60s | Stocks less volatile, rate limits |

### Animation Rules

1. **Smooth Transitions**: 300-600ms ease-out
2. **No Jumps**: Interpolate between values
3. **No Constant Motion**: Only animate on data updates or live pulse
4. **Handle Missing Data**: Show placeholder, don't crash

---

## 📦 File Structure

```
lib/charts/
  ├── types.ts              # TypeScript definitions
  ├── dataAdapters.ts       # API adapters (DexScreener, etc.)
  ├── dataFreshness.ts      # Delay detection logic
  ├── slidingWindow.ts      # Window management
  └── chartPlugins.ts       # Custom Chart.js plugins

components/charts/
  ├── ProfessionalChart.tsx # Main chart component
  └── DataStatusBadge.tsx   # Status indicator

hooks/
  └── useLiveChartData.ts   # Data fetching hook
```

---

## 🚫 Absolute NOs

1. **NO TradingView**
   - No widgets, no libraries, no data
   - Build everything custom

2. **NO Scraping**
   - Only use official APIs
   - Respect rate limits

3. **NO Fake Data**
   - No simulated candles
   - No artificial smoothness
   - Real data only

4. **NO Hidden Delays**
   - Always show status badge
   - Always dim on delays
   - Trust users with truth

---

## 🧠 UX Safeguards for Trust

### 1. Error Handling
```typescript
if (error) {
  return (
    <div className="text-red-500">
      Error: {error}
      <button onClick={refetch}>Retry</button>
    </div>
  );
}
```

### 2. Loading States
```typescript
if (isLoading) {
  return <div className="animate-pulse">Loading...</div>;
}
```

### 3. No Data State
```typescript
if (data.length === 0) {
  return <div>No data available for {symbol}</div>;
}
```

### 4. Rate Limit Warnings
```typescript
// In adapter
if (response.status === 429) {
  console.warn('Rate limit hit, waiting...');
  // Show user-friendly message
}
```

---

## 📝 Example Integration

See `/examples/ChartExample.tsx` for a complete working example.

**Key Points:**
1. Use environment variables for API keys
2. Handle loading/error states
3. Allow users to switch modes (Line/Candles)
4. Show status badge prominently
5. Let users see delays honestly

---

## ✅ Checklist for Production

- [ ] API keys stored in `.env.local`
- [ ] Error boundaries around charts
- [ ] Loading states implemented
- [ ] Status badges visible
- [ ] Polling intervals appropriate for source
- [ ] Rate limits respected
- [ ] No console errors on missing data
- [ ] Chart dims when data is stale
- [ ] NOW line and Live dot working
- [ ] Smooth transitions (no jumps)

---

**Remember: A serious trader values honesty over beauty. This chart engine never lies.**
