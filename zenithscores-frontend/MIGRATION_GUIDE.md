# Migration Guide: Simulated Arena → Real Swap Platform

## Overview

You're migrating from:
- ❌ Simulated "long/short" positions
- ❌ Fake PnL tracking
- ❌ Paper trading with no revenue

To:
- ✅ Real on-chain swaps
- ✅ 0x affiliate fee revenue (0.4% per swap)
- ✅ Multi-chain support
- ✅ DexScreener token discovery

---

## Quick Start (5 Minutes)

```bash
# 1. Add environment variables
echo 'ZEROX_API_KEY="your-key"' >> .env
echo 'NEXT_PUBLIC_AFFILIATE_WALLET="0xYourWallet"' >> .env

# 2. Run database migration
cd zenithscores-frontend
npx prisma migrate dev --name arena_real_swaps
npx prisma generate

# 3. Replace arena page
mv app/arena/page.tsx app/arena/page-old.tsx
mv app/arena/page-new.tsx app/arena/page.tsx

# 4. Test locally
npm run dev
# Visit http://localhost:3000/arena

# 5. Deploy
git add .
git commit -m "feat: launch real swap platform with revenue"
git push
```

---

## Detailed Migration Steps

### Step 1: Database Migration

The new system uses a different database model:

**OLD MODEL (`ArenaPosition`):**
- Tracks simulated positions
- Stores entry/exit prices
- Calculates fake PnL
- Side: long/short

**NEW MODEL (`ArenaSwap`):**
- Tracks REAL on-chain transactions
- Records swap details for analytics
- Tracks affiliate fee revenue
- No "positions" - just swap history

**Run migration:**
```bash
npx prisma migrate dev --name arena_real_swaps
```

This will:
- ✅ Create new `ArenaSwap` table
- ✅ Keep old `ArenaPosition` table (for historical data)
- ✅ Update User relation
- ✅ Create indexes

### Step 2: Replace Components

**OLD COMPONENTS (Delete or Archive):**
```
components/arena/
├── OrderPanel.tsx         → REPLACED by SwapPanel.tsx
├── PositionsTable.tsx     → REMOVED (no positions)
├── PriceChart.tsx         → REMOVED (focus on discovery)
└── TokenSelector.tsx      → REPLACED by TokenDiscoveryFeed.tsx
```

**NEW COMPONENTS:**
```
components/arena/
├── SwapPanel.tsx          ✅ Real swap execution
└── TokenDiscoveryFeed.tsx ✅ DexScreener discovery
```

**To archive old components:**
```bash
mkdir -p components/arena/archive
mv components/arena/OrderPanel.tsx components/arena/archive/
mv components/arena/PositionsTable.tsx components/arena/archive/
mv components/arena/PriceChart.tsx components/arena/archive/
mv components/arena/TokenSelector.tsx components/arena/archive/
```

### Step 3: Update API Routes

**OLD ROUTES (Delete or Archive):**
- `/api/arena/open-position` → REMOVED
- `/api/arena/close-position` → REMOVED
- `/api/arena/positions` → REMOVED
- `/api/arena/quote` → REPLACED

**NEW ROUTES:**
- `/api/arena/swap/quote` ✅ Get 0x swap quote with affiliate fee
- `/api/arena/swap/record` ✅ Record swap to database
- `/api/arena/discovery` ✅ Get discovered tokens from DexScreener

**To archive old routes:**
```bash
mkdir -p app/api/arena/archive
mv app/api/arena/open-position app/api/arena/archive/
mv app/api/arena/close-position app/api/arena/archive/
mv app/api/arena/positions app/api/arena/archive/
mv app/api/arena/quote app/api/arena/archive/
```

### Step 4: Update Library Files

**NEW LIBRARY FILES:**
- `lib/arena/chains.ts` ✅ Multi-chain configuration
- `lib/arena/swap.ts` ✅ 0x swap execution with affiliate fees
- `lib/arena/discovery.ts` ✅ DexScreener token discovery

**OLD FILES TO REMOVE:**
- `lib/arena/execution.ts` → Basic 0x integration (replaced by swap.ts)
- `lib/arena/pnl.ts` → PnL calculations (no longer needed)
- `lib/arena/prices.ts` → Price fetching (DexScreener handles this now)

### Step 5: Environment Variables

Add to your `.env` file:

```bash
# CRITICAL: Get from https://0x.org
ZEROX_API_KEY="your-0x-api-key"

# CRITICAL: Your wallet address (receives fees)
NEXT_PUBLIC_AFFILIATE_WALLET="0xYourWalletAddress"
```

**Security Notes:**
- Never commit `.env` to git
- Use a secure wallet for `AFFILIATE_WALLET`
- 0x API key is server-side only (not exposed to client)

### Step 6: Testing Checklist

Before deploying to production:

**Functional Testing:**
- [ ] Discovery feed loads tokens
- [ ] Token cards show correct data (price, liquidity, age)
- [ ] Clicking token selects it
- [ ] Swap panel shows correct chain
- [ ] Wallet connects successfully
- [ ] Chain switching works
- [ ] Quote fetching works (enter amount, see quote)
- [ ] Swap executes successfully
- [ ] Transaction appears on block explorer
- [ ] Swap recorded in database
- [ ] Success state shows explorer link

**Revenue Testing:**
- [ ] Execute a test swap on mainnet
- [ ] Check `ArenaSwap` table for `affiliateFee` value
- [ ] Verify fee is ~0.4% of swap amount
- [ ] Check your affiliate wallet for received tokens
  (May take a few minutes to appear)

**Multi-Chain Testing:**
- [ ] Test swap on Ethereum
- [ ] Test swap on Base
- [ ] Test swap on Arbitrum
- [ ] Verify chain switching works
- [ ] Verify explorer links are correct per chain

---

## Breaking Changes

### 1. No More Positions

**OLD:**
```typescript
// User opens a "long" position
position = {
  side: 'long',
  entryPrice: 100,
  sizeUSD: 50,
  isOpen: true,
  // ... tracks PnL over time
}
```

**NEW:**
```typescript
// User executes a swap
swap = {
  sellToken: 'ETH',
  buyToken: 'PEPE',
  sellAmount: '1000000000000000000', // 1 ETH
  buyAmount: '5000000000000', // 5000 PEPE
  txHash: '0x123...',
  // ... analytics only
}
```

### 2. No More Long/Short

**OLD UI:**
- "Long" button (green)
- "Short" button (red)
- Leverage slider
- Entry price display

**NEW UI:**
- "Buy" button (single action)
- Amount input
- Estimated output
- Network fee display

### 3. No More Fake Balances

**OLD:**
- Simulated $10,000 starting balance
- Margin used / available
- Unrealized PnL

**NEW:**
- REAL wallet balance
- REAL token balances
- REAL transaction history

### 4. Multi-Chain Required

**OLD:**
- Single chain (Ethereum only)
- Static token list

**NEW:**
- Multiple chains (Ethereum, Base, Arbitrum, etc.)
- Dynamic token discovery
- Chain switching required

---

## Data Migration (Optional)

If you want to preserve historical data from the old system:

```sql
-- View old positions
SELECT * FROM "ArenaPosition" WHERE isOpen = true;

-- Count total old positions
SELECT COUNT(*) FROM "ArenaPosition";

-- You can keep this table for historical reference
-- New swaps will go to "ArenaSwap" table
```

**Note:** Old positions and new swaps are separate. They don't interact.

---

## Rollback Plan

If something goes wrong, you can rollback:

```bash
# 1. Restore old page
mv app/arena/page.tsx app/arena/page-new.tsx
mv app/arena/page-old.tsx app/arena/page.tsx

# 2. Restore old components
mv components/arena/archive/* components/arena/

# 3. Restore old API routes
mv app/api/arena/archive/* app/api/arena/

# 4. Rollback database (if needed)
npx prisma migrate reset
# Then re-apply old migrations
```

---

## Post-Migration

### Monitor Revenue

After your first swaps:

```sql
-- Check total revenue
SELECT
  COUNT(*) as total_swaps,
  SUM(sellAmountUSD) as total_volume,
  SUM(affiliateFee) as total_revenue
FROM "ArenaSwap"
WHERE txStatus = 'confirmed';

-- Revenue by chain
SELECT
  chainName,
  COUNT(*) as swaps,
  SUM(affiliateFee) as revenue
FROM "ArenaSwap"
WHERE txStatus = 'confirmed'
GROUP BY chainName;

-- Recent swaps
SELECT
  buyToken,
  sellAmountUSD,
  affiliateFee,
  createdAt
FROM "ArenaSwap"
ORDER BY createdAt DESC
LIMIT 10;
```

### Track Affiliate Wallet

Your affiliate wallet will accumulate tokens over time:

1. Use https://debank.com or https://zapper.fi
2. Enter your `NEXT_PUBLIC_AFFILIATE_WALLET` address
3. See all accumulated fees across chains
4. Total USD value

### Optimize Discovery

After users start swapping, analyze which tokens perform well:

```sql
-- Most swapped tokens
SELECT
  buyToken,
  COUNT(*) as swap_count,
  AVG(volumeAccel) as avg_volume_accel,
  AVG(liquidityUSD) as avg_liquidity
FROM "ArenaSwap"
WHERE txStatus = 'confirmed'
GROUP BY buyToken
ORDER BY swap_count DESC
LIMIT 20;
```

Use this data to tune discovery filters in `lib/arena/discovery.ts`.

---

## Support

**Common Issues:**

1. **"No 0x API key"**
   - Add `ZEROX_API_KEY` to `.env`
   - Get key from https://0x.org

2. **"Affiliate wallet not set"**
   - Add `NEXT_PUBLIC_AFFILIATE_WALLET` to `.env`
   - Restart dev server

3. **"Prisma client error"**
   - Run `npx prisma generate`
   - Restart dev server

4. **"No tokens found"**
   - Discovery filters are strict (this is intentional)
   - Wait a few minutes or loosen filters

---

## Success Metrics

After 1 week, you should see:

- ✅ At least 10 swaps executed
- ✅ Affiliate fees appearing in your wallet
- ✅ Swaps across multiple chains
- ✅ Zero critical errors in logs
- ✅ Users returning for multiple swaps

After 1 month, you should see:

- ✅ Consistent daily swap volume
- ✅ $100+ in affiliate fees
- ✅ Users discovering your platform organically
- ✅ Multiple chains being used

---

## Next Steps

1. **Launch:** Get it live ASAP
2. **Monitor:** Watch revenue and errors
3. **Iterate:** Improve based on user behavior
4. **Market:** Share on Twitter, Reddit, Discord
5. **Scale:** Add more chains, improve discovery

**You're building a real product. Make it count.** 🚀
