# Implementation Plan - Trading Engine Refactor
Goal: Replace broken, ephemeral trading state with a rigorous ledger-based system using Prisma (PostgreSQL) transactions.

## User Review Required
> [!IMPORTANT]
> This is a Breaking Change for any existing "fake" trades stored in local storage or temporary tables. This migration will reset trading history to a clean slate using the new schema.

## Proposed Changes

### Database Layer (Prisma)
#### [MODIFY] [schema.prisma](file:///c:/Users/boume/defi-oracle-worker/zenithscores-frontend/prisma/schema.prisma)
- Add `Portfolio` model (One-to-One with User)
- Add `Position` model (One-to-Many from Portfolio)
- Add `Trade` model (One-to-Many from Portfolio, Immutable)

### Backend Logic (Server Actions)
#### [NEW] [trading.ts](file:///c:/Users/boume/defi-oracle-worker/zenithscores-frontend/lib/actions/trading.ts)
- `executeTrade(userId, symbol, side, qty, price)`: The ACID transaction.
- `getPortfolio(userId)`: Fetches balance, positions, and history.
- `resetAccount(userId)`: Emergency tool to restore 10k balance.

### Frontend Integration (Trading Page)
#### [MODIFY] [page.tsx](file:///c:/Users/boume/defi-oracle-worker/zenithscores-frontend/app/trading/page.tsx)
- Connect "Buy/Sell" buttons to Server Action
- Remove all `useEffect` state for balances
- Implement optimistic updates for instant feedback

#### [MODIFY] [PortfolioSummary.tsx](file:///c:/Users/boume/defi-oracle-worker/zenithscores-frontend/components/trading/PortfolioSummary.tsx)
- Display Real Equity calculated from Ledger
- Remove hardcoded values

## Verification Plan

### Automated Tests
- Run `executeTrade` for BUY -> Balance should decrease, Position should appear.
- Run `executeTrade` for SELL -> Balance should increase correctly (Entry + Profit), Position should disappear.
- Test "Overdraft" prevention (Trying to buy with insufficient funds).

### Manual Verification
1. Open Trading Page -> Should see $10,000 start.
2. Buy 1 BTC at $50,000. Balance should be $0, Position 1 BTC.
3. Sell 1 BTC at $60,000. Balance should be $60,000 (Correct logic: $50k Principal + $10k Profit).
   *Verification against "Double Count Bug": Ensure it's not $110,000.*
