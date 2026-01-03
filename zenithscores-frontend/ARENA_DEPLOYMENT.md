# Trading Arena Deployment Guide

## 🎯 Overview

This is a **PRODUCTION-READY**, **NON-CUSTODIAL**, **MULTI-CHAIN** swap platform that generates revenue through 0x affiliate fees.

**What it does:**
- Discovers early/undiscovered tokens via DexScreener
- Executes real on-chain swaps via 0x Protocol
- Earns 0.4% fee on EVERY swap automatically
- Supports ALL 0x-compatible EVM chains

**What it's NOT:**
- ❌ Not a simulation
- ❌ Not custodial
- ❌ Not leveraged trading
- ❌ Not paper trading

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables

Create/update `.env` file with the following:

```bash
# Database (Already configured)
DATABASE_URL="your-neon-postgres-url"

# 0x API Key (REQUIRED for swaps)
ZEROX_API_KEY="your-0x-api-key"

# Affiliate Wallet (CRITICAL - This is where fees go!)
NEXT_PUBLIC_AFFILIATE_WALLET="0xYourWalletAddress"

# WalletConnect Project ID (Already configured)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
```

**Get your 0x API key:**
1. Go to https://0x.org/docs/0x-swap-api/introduction
2. Sign up for an API key
3. Add to `.env` as `ZEROX_API_KEY`

**Set your affiliate wallet:**
1. Use a wallet YOU control (MetaMask, hardware wallet, etc.)
2. This wallet will receive 0.4% of ALL swap volume
3. Add to `.env` as `NEXT_PUBLIC_AFFILIATE_WALLET`
4. ⚠️ NEVER share the private key for this wallet

### 2. Database Migration

Run Prisma migration to update schema:

```bash
cd zenithscores-frontend
npx prisma migrate dev --name arena_swap_model
npx prisma generate
```

This will:
- Remove old `ArenaPosition` model (simulated trading)
- Add new `ArenaSwap` model (real swap analytics)
- Create indexes for performance

### 3. Replace Old Arena Page

**Option A: Direct Replacement (Recommended)**
```bash
mv app/arena/page.tsx app/arena/page-old.tsx.backup
mv app/arena/page-new.tsx app/arena/page.tsx
```

**Option B: Keep Both (Testing)**
```bash
# New arena at /arena-v2
mv app/arena/page-new.tsx app/arena-v2/page.tsx
```

### 4. Remove Obsolete Components

These components are from the simulated trading system and should be removed or archived:

```bash
# Archive old components
mkdir -p components/arena/archive
mv components/arena/OrderPanel.tsx components/arena/archive/
mv components/arena/PositionsTable.tsx components/arena/archive/
mv components/arena/PriceChart.tsx components/arena/archive/
```

New components handle everything:
- `SwapPanel.tsx` - Real swap execution
- `TokenDiscoveryFeed.tsx` - Token discovery

### 5. Update Types

Remove old arena types:

```bash
# Archive or delete
mv lib/arena/types.ts lib/arena/types-old.ts.backup
```

The new system uses types from:
- `lib/arena/discovery.ts` - `DiscoveredToken`
- `lib/arena/swap.ts` - `SwapQuote`, `SwapQuoteRequest`

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Install Dependencies (if needed)

All required packages should already be installed:
- ✅ `wagmi` - Wallet connection
- ✅ `viem` - Ethereum library
- ✅ `@web3modal/wagmi` - Wallet modal
- ✅ `@prisma/client` - Database

If any are missing:
```bash
npm install wagmi viem @web3modal/wagmi @prisma/client
```

### Step 2: Build & Test Locally

```bash
# Generate Prisma client
npx prisma generate

# Run dev server
npm run dev
```

Open `http://localhost:3000/arena` and test:
1. ✅ Token discovery loads
2. ✅ Wallet connects
3. ✅ Chain switching works
4. ✅ Quote fetching works
5. ✅ Swap execution works (test on testnet first!)

### Step 3: Testnet Testing (RECOMMENDED)

Before deploying to mainnet, test on testnets:

**Supported Testnets:**
- Sepolia (Ethereum testnet, chainId: 11155111)
- Base Sepolia (chainId: 84532)
- Arbitrum Sepolia (chainId: 421614)

**How to add testnet:**
1. Add testnet config to `lib/arena/chains.ts`
2. Get testnet ETH from faucets
3. Execute test swaps
4. Verify affiliate fee routing

### Step 4: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "feat: launch production trading arena with real swaps"

# Push to GitHub
git push origin main

# Deploy (auto-deploys if connected to Vercel)
```

**Set environment variables in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add:
   - `ZEROX_API_KEY`
   - `NEXT_PUBLIC_AFFILIATE_WALLET`
   - `DATABASE_URL` (if not already set)

### Step 5: Post-Deployment Verification

After deployment, verify:

1. **Discovery works:**
   - Visit `/arena`
   - Check that tokens load
   - Verify DexScreener data is fresh

2. **Swaps work:**
   - Connect wallet
   - Select a token
   - Get quote
   - Execute swap
   - ✅ Verify transaction on block explorer
   - ✅ Verify swap recorded in database

3. **Fees work:**
   - After first swap, check your affiliate wallet
   - Fees appear as tokens (not always immediately)
   - Track fees in database: `ArenaSwap.affiliateFee`

---

## 💰 REVENUE TRACKING

### Monitor Revenue

**Via Database:**
```sql
-- Total swap volume (USD)
SELECT SUM(sellAmountUSD) as total_volume_usd
FROM "ArenaSwap"
WHERE txStatus = 'confirmed';

-- Total affiliate fees earned
SELECT SUM(affiliateFee) as total_fees_earned
FROM "ArenaSwap"
WHERE txStatus = 'confirmed';

-- Fees by chain
SELECT chainName, SUM(affiliateFee) as fees
FROM "ArenaSwap"
WHERE txStatus = 'confirmed'
GROUP BY chainName
ORDER BY fees DESC;

-- Swaps in last 24h
SELECT COUNT(*) as swaps_24h, SUM(affiliateFee) as fees_24h
FROM "ArenaSwap"
WHERE createdAt > NOW() - INTERVAL '24 hours'
  AND txStatus = 'confirmed';
```

**Via Wallet:**
- Check your affiliate wallet balance
- Fees accumulate as various tokens
- Use portfolio trackers (Zapper, DeBank) to see total USD value

### Expected Revenue

Example calculations:
- 100 swaps/day @ $100 avg = $10,000 daily volume
- 0.4% fee = $40/day = $1,200/month
- 1,000 swaps/day @ $200 avg = $200,000 daily volume
- 0.4% fee = $800/day = $24,000/month

**Revenue scales with:**
1. Number of active users
2. Average swap size
3. Discovery quality (good tokens = more swaps)
4. Number of supported chains

---

## 🔧 CONFIGURATION

### Adjust Affiliate Fee

Edit `lib/arena/chains.ts`:

```typescript
export const AFFILIATE_FEE_BPS = 40; // 0.4%

// Options:
// 25 BPS = 0.25% (minimum recommended)
// 40 BPS = 0.4% (default)
// 50 BPS = 0.5% (higher revenue, may reduce volume)
```

### Adjust Discovery Filters

Edit `lib/arena/discovery.ts`:

```typescript
const DISCOVERY_FILTERS = {
  MIN_AGE_MINUTES: 20,      // Younger = riskier
  MAX_AGE_MINUTES: 10080,   // 7 days
  MIN_LIQUIDITY_USD: 8000,  // Lower = riskier
  MAX_LIQUIDITY_USD: 250000, // Higher = less early
  MAX_FDV: 50_000_000,      // Market cap ceiling
  // ... etc
};
```

**Tighter filters = Higher quality, fewer tokens**
**Looser filters = More volume, higher risk**

### Add More Chains

To add a new chain (must be supported by 0x):

1. Add to `lib/arena/chains.ts`:
```typescript
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // ... existing chains

  // New chain
  123456: {
    chainId: 123456,
    name: 'New Chain',
    shortName: 'NEW',
    nativeCurrency: { name: 'Token', symbol: 'TKN', decimals: 18 },
    rpcUrls: ['https://rpc.newchain.com'],
    blockExplorerUrls: ['https://explorer.newchain.com'],
    zeroExApiUrl: 'https://newchain.api.0x.org',
    stablecoins: { USDC: '0x...' },
    defaultSellToken: { symbol: 'TKN', address: '0xEee...', decimals: 18 },
    tier: 2,
    dexScreenerSupported: true,
  },
};
```

2. Test on that chain
3. Deploy

---

## 🛡️ SECURITY CHECKLIST

Before going live:

- [ ] Affiliate wallet is secure (hardware wallet preferred)
- [ ] Private keys NEVER in code or .env files
- [ ] 0x API key is in server-side env vars only
- [ ] Database credentials are secure
- [ ] CORS configured properly (Vercel handles this)
- [ ] Rate limiting on API routes (optional but recommended)
- [ ] User disclaimers visible
- [ ] Non-custodial messaging clear

---

## 🐛 TROUBLESHOOTING

### "Failed to get swap quote"

**Causes:**
- Invalid 0x API key
- Token pair has no liquidity
- Sell amount too small
- Chain not supported

**Fix:**
1. Check `.env` has `ZEROX_API_KEY`
2. Try larger amount
3. Check console for specific error

### "Affiliate wallet not set"

**Fix:**
Add to `.env`:
```bash
NEXT_PUBLIC_AFFILIATE_WALLET="0xYourAddress"
```

Restart dev server.

### "No tokens found"

Discovery filters are VERY strict by design. This is normal.

**Options:**
1. Wait (tokens surface every few minutes)
2. Loosen filters in `lib/arena/discovery.ts`
3. Manually search for tokens via search feature

### Swap recorded but not confirmed

**This is normal.** Swaps are recorded as "pending" immediately, then updated to "confirmed" when:
- Transaction is mined
- You implement webhook/polling to update status

**To implement confirmation tracking:**
1. Add cron job to check pending swaps
2. Poll blockchain for transaction status
3. Update `txStatus` to 'confirmed' or 'failed'

---

## 📊 ANALYTICS & MONITORING

### Key Metrics to Track

1. **Swap Volume** - Total USD swapped
2. **Swap Count** - Number of transactions
3. **Revenue** - Total affiliate fees earned
4. **Discovery Quality** - % of discovered tokens that get swapped
5. **Chain Distribution** - Which chains drive most volume
6. **User Retention** - Repeat swappers

### Recommended Tools

- **Database:** Neon console for queries
- **Wallet:** DeBank/Zapper to track affiliate earnings
- **Blockchain:** Etherscan/Basescan to verify transactions
- **Analytics:** Add Mixpanel/Posthog for user tracking

---

## 🚨 IMPORTANT NOTES

### Legal Compliance

- **Not financial advice:** Add disclaimers
- **High risk warnings:** Visible on all token cards
- **Non-custodial:** Make this VERY clear
- **Terms of Service:** Recommended (consult lawyer)

### User Safety

- Always show:
  - Price impact
  - Estimated gas
  - Network fees
  - Platform fee (0.4%)
  - Slippage tolerance

- Never:
  - Hide fees
  - Make price guarantees
  - Recommend specific tokens
  - Promise returns

### Operational

- **0x API limits:** Free tier = 1000 requests/month. Upgrade for production.
- **DexScreener limits:** No official limits, but don't abuse (use caching)
- **Database costs:** Neon free tier = 0.5GB. Monitor usage.
- **Vercel limits:** Free tier = 100GB bandwidth/month. Upgrade as needed.

---

## ✅ FINAL DEPLOYMENT CHECKLIST

Before announcing to users:

- [ ] All environment variables set
- [ ] Database migrated successfully
- [ ] Tested swaps on at least 2 chains
- [ ] Affiliate fees confirmed working
- [ ] Block explorers show correct transactions
- [ ] Discovery feed loading tokens
- [ ] Wallet connection working
- [ ] Chain switching working
- [ ] Error handling works (try invalid inputs)
- [ ] Mobile responsive
- [ ] Disclaimers visible
- [ ] Analytics tracking (optional)

---

## 🎉 YOU'RE LIVE

Once deployed and tested:

1. **Announce:** Share on Twitter, Discord, etc.
2. **Monitor:** Watch swap volume daily
3. **Iterate:** Adjust discovery filters based on user behavior
4. **Scale:** Add more chains, improve UX
5. **Optimize:** A/B test fee amounts, UI changes

**THIS IS A REAL PRODUCT.**
**EVERY SWAP = REVENUE.**
**MAKE IT GREAT.**

---

## 📞 Support

If you encounter issues:
1. Check this guide
2. Review console errors
3. Test on a fresh wallet
4. Check 0x API status: https://status.0x.org

Remember: This is non-custodial. Users hold their own keys. You never touch their funds.

Good luck! 🚀
