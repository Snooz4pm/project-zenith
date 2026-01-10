# V1 Hold System - Data Sources

## What Data We ALREADY Have

From Brain v2's existing infrastructure:

### 1. Price Snapshots
- **Source**: `app/api/smart-swap/valuate/route.ts`
- **Field**: `valueInSOL` (SOL-equivalent price)
- **Available**: Every token in the universe gets valued
- **Frequency**: On-demand during valuation phase

### 2. Liquidity Data
- **Source**: Jupiter quote response (implicit in RTL calculation)
- **Field**: `priceImpactPct`, `roundTripLoss`
- **Available**: For every SAFE/RANKABLE token
- **Use**: Pool liquidity indicator

### 3. Volume Indicators
- **Source**: AlphaScan integration (if enabled)
- **Field**: `volume24hUSD`, `volumeChange24h`
- **Available**: For alpha candidates
- **Fallback**: Use RTL as volatility proxy

### 4. Timestamps
- **Source**: Each API call is timestamped
- **Available**: `Date.now()` at simulation time

## What We DON'T Need

❌ New API endpoints
❌ New data sources
❌ Time-series database
❌ Caching layer (v1)

## V1 Implementation Strategy

**Hold signals work with single-point data:**

```typescript
// Instead of 60 historical prices:
priceSeries: [currentPrice]

// Use volatility proxy:
volumeSeries: [estimatedVolume]

// Where estimatedVolume comes from:
- RTL% (high RTL = high volatility)
- AlphaScan volume24h (if available)
- priceImpactPct (liquidity proxy)
```

## Integration Point

```typescript
// After pathfinding completes:
const firstHop = path.hops[0];

const holdInput = {
  token: firstHop.toToken,

  // Single-point "series" (v1 simplification)
  priceSeries: [firstHop.estimatedOutSOL],

  // Derive from existing metrics
  volumeSeries: [deriveVolumeProxy(firstHop)],

  timestamps: [Date.now()],

  // Already available from Jupiter
  poolLiquidityUSD: firstHop.liquidityUSD || 100_000,
};

const checkpoint = computeHoldCheckpoint(holdInput);
```

## V1 Limitations (By Design)

1. **No historical momentum** - Uses single-point volatility proxies
2. **No volume spike detection** - Uses RTL as proxy
3. **Conservative thresholds** - Higher confidence floor
4. **Manual override required** - User always sees suggestion

## V2 Upgrade Path (Future)

When we add time-series:
- Rolling 10-minute price window
- Real volume spike detection
- Adaptive confidence thresholds
- Auto-hold for high-confidence signals

**But V1 works without any of this.**
