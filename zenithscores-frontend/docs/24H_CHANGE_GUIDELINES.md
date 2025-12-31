# 24h Change Calculation Guidelines

## Philosophy: Honest Data > Fake Zeros

**Never fake market movement.** Displaying `0.00%` everywhere signals incompetence. Displaying `—` signals honesty.

## Backend Implementation

### Formula
```typescript
change24h = ((currentPrice - referencePrice) / referencePrice) * 100
```

### Reference Price by Asset Type

| Asset Class | Reference Price | Reason |
|------------|----------------|--------|
| **Crypto** | Price 24h ago | 24/7 trading |
| **Stocks** | Previous market close | Markets closed overnight |
| **Forex** | Yesterday close | Daily sessions |

### Return `null` When:
- Current price unavailable
- Reference price unavailable
- Reference price is zero
- Data is NaN or not finite

### ✅ Correct Implementation
```typescript
import { compute24hChange } from '@/lib/market-data/change-calculator';

const change24h = compute24hChange(currentPrice, price24hAgo);
// Returns: number | null
```

### ❌ Wrong Implementation
```typescript
// NEVER DO THIS
const change24h = pair.priceChange?.h24 || 0;  // Fakes data!
```

## Frontend Rendering

### Use the PriceChangeDisplay Component
```tsx
import PriceChangeDisplay from '@/components/market/PriceChangeDisplay';

<PriceChangeDisplay change24h={token.priceChange24h} />
```

**Output:**
- `+2.45%` (green)
- `-1.23%` (red)
- `—` (gray, when null)

### Variants

#### Compact
```tsx
import { CompactPriceChange } from '@/components/market/PriceChangeDisplay';

<CompactPriceChange change24h={change24h} />
```

#### Badge
```tsx
import { PriceChangeBadge } from '@/components/market/PriceChangeDisplay';

<PriceChangeBadge change24h={change24h} />
```

### Manual Rendering
If you must render manually:

```tsx
{change24h === null ? (
  <span className="text-text-muted">—</span>
) : (
  <span className={change24h >= 0 ? 'text-accent-mint' : 'text-accent-danger'}>
    {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
  </span>
)}
```

## Type Definitions

```typescript
interface TokenData {
  price: number;
  priceChange24h: number | null;  // ✅ Always allow null
}
```

**Never:**
```typescript
priceChange24h: number;  // ❌ Requires fake 0.00%
```

## API Response Shape

### ✅ Correct
```json
{
  "symbol": "BTC",
  "price": 43250.00,
  "change24h": null
}
```

### ❌ Wrong
```json
{
  "symbol": "BTC",
  "price": 43250.00,
  "change24h": 0.00  // Lies about market movement
}
```

## Color Coding

```typescript
import { getChangeColorClass } from '@/lib/market-data/change-calculator';

const colorClass = getChangeColorClass(change24h);
// Returns: 'text-accent-mint' | 'text-accent-danger' | 'text-muted'
```

## Migration Checklist

When adding 24h change to a new component:

- [ ] Backend returns `number | null`
- [ ] Type definition allows `null`
- [ ] Frontend renders `—` for null
- [ ] No `|| 0` fallbacks
- [ ] Color coding handles null
- [ ] Icon logic handles null
- [ ] Tested with missing data

## Examples from Codebase

### ✅ Good: MarketMovers Component
```tsx
{mover.changePercent === null ? '—' :
  `${mover.changePercent >= 0 ? '+' : ''}${mover.changePercent.toFixed(2)}%`
}
```

### ✅ Good: DexScreener Normalization
```typescript
priceChange24h: typeof pair.priceChange?.h24 === 'number'
  ? pair.priceChange.h24
  : null
```

## Why This Matters for Trust

Users subconsciously evaluate platform credibility:

| Display | User Perception |
|---------|----------------|
| `0.00%` everywhere | "They don't have real data" |
| `—` when unavailable | "They're honest about limitations" |
| Fake fluctuations | "This platform is scamming me" |

**Credibility is the product.** Honest data presentation builds trust.

## Performance Optimization (Optional)

Cache reference prices to avoid repeated fetches:

```typescript
// Cache previous close per symbol
const cache = new Map<string, number>();

// Update daily via cron
async function updateReferenceCache() {
  // Fetch and cache reference prices
}
```

---

**Last Updated:** Dec 31, 2025
**Status:** ✅ Production Standard
