# Live Pulse Integration Guide

## Overview
Replace the boring static "AI MARKET CONTEXT" with **Live Pulse** - a real-time stream of market micro-events.

## Quick Start

### 1. Import Components
```tsx
import LivePulse from '@/components/pulse/LivePulse';
import { useLivePulse } from '@/hooks/useLivePulse';
```

### 2. Use in Asset Detail Page
```tsx
// In your asset detail component (e.g., TerminalView)
export default function AssetDetailPage({ symbol }: { symbol: string }) {
  // Get OHLCV data (you probably already have this)
  const { data: ohlcvData } = useOHLCV(symbol, '1H', '1D');

  // Generate Live Pulse signals
  const { signals } = useLivePulse({
    candles: ohlcvData || [],
    enabled: true,
    maxSignals: 8,
    refreshInterval: 120000 // 2 minutes
  });

  // Handle signal clicks (jump to chart at that timestamp)
  const handleSignalClick = (signal: PulseSignal) => {
    // Jump chart to signal timestamp
    if (signal.data?.price) {
      // Your chart jump logic here
    }
  };

  return (
    <div>
      {/* Your chart */}
      <Chart data={ohlcvData} />

      {/* REPLACE THIS: */}
      {/* <AIMarketContext /> */}

      {/* WITH THIS: */}
      <LivePulse
        signals={signals}
        maxVisible={8}
        onSignalClick={handleSignalClick}
      />
    </div>
  );
}
```

### 3. That's It!
Live Pulse will automatically:
- ✅ Detect signals from OHLCV data
- ✅ Update every 2 minutes
- ✅ Auto-expire old signals
- ✅ Fade signals as they age
- ✅ Show real-time micro-events

## Signal Types

Live Pulse detects 6 types of signals:

| Signal | Category | Example |
|--------|----------|---------|
| Volume Surge | Strength 🟢 | "Volume surge +240%" |
| Volume Compression | Neutral 🟡 | "Low participation (35% of avg)" |
| Range State | Neutral 🟡 | "Tight range for 14h (1.2%)" |
| Wick Rejection | Weakness 🔴 / Strength 🟢 | "Rejection at $43,500" |
| Volatility Compression | Neutral 🟡 | "Volatility compression (42% decline)" |
| Trend Structure | Strength 🟢 / Weakness 🔴 | "Higher lows forming" |

## Confidence Levels

- **High (●●●)**: Multiple data points confirm
- **Medium (●●○)**: Single strong indicator
- **Low (●○○)**: Early/tentative

## Customization

### Change Refresh Interval
```tsx
const { signals } = useLivePulse({
  candles: data,
  refreshInterval: 60000 // 1 minute
});
```

### Limit Visible Signals
```tsx
<LivePulse
  signals={signals}
  maxVisible={5} // Show only 5 signals
/>
```

### Disable Auto-Expiry
```tsx
const { signals } = useLivePulse({
  candles: data,
  enableAutoExpiry: false
});
```

## Advanced: Custom Signal Detectors

Add your own signal detectors in `/lib/pulse/detectors.ts`:

```ts
export function detectCustomPattern(candles: OHLCV[]): PulseSignal | null {
  // Your detection logic

  return {
    id: generateSignalId('strength', 'custom-pattern'),
    timestamp: Date.now(),
    category: 'strength',
    message: 'Your custom signal message',
    confidence: 'high',
    ttl: 1800,
    data: { /* custom data */ }
  };
}

// Add to generatePulseSignals()
export function generatePulseSignals(candles: OHLCV[]): PulseSignal[] {
  // ...existing detectors
  const signals = [
    detectVolumeAnomaly(sorted),
    // ... other detectors
    detectCustomPattern(sorted), // ADD YOUR DETECTOR
  ];

  return signals.filter((s): s is PulseSignal => s !== null);
}
```

## Future Premium Features

- [ ] AI-generated summaries ("What's happening: ...")
- [ ] Historical pulse replay
- [ ] Push notifications for high-confidence signals
- [ ] Export signal log
- [ ] Custom alert rules
- [ ] Multi-asset pulse dashboard

## Monetization

### Free Tier
- Last 5 signals
- Basic categories
- 15-minute refresh

### Premium ($19/mo)
- Unlimited signals
- Advanced detectors
- 2-minute refresh
- AI summaries
- Push notifications

### Enterprise ($99/mo)
- API access
- Custom signal rules
- Multi-asset dashboard
- Backtesting
