# ZenithScores: Production Trading Engine Specification
> "Trust is the currency."

## 1. Mental Model (The Golden Ledger)

To fix the double-counting bugs, we must adopt Standard Accounting Principles. 

*   **Cash (Principal)**: The raw liquid capital in the account (e.g., $10,000 USDT).
*   **Position Value (Asset)**: The current market value of assets held (`qty * currentPrice`). This is *not* money yet.
*   **Equity (Net Worth)**: The true value of the user. `Entity = Cash + Sum(Positions)`.
*   **Realized PnL**: Profit backed by cash. Created ONLY when a position is closed.
*   **Unrealized PnL**: Floating profit. `(currentPrice - avgEntryPrice) * qty`.

**The Bug Source:** Many engines mistakenly treat `Realized PnL` as `Cash + PnL` during the addition phase, effectively adding the principal twice.

### The Rule of Conservation
> Cash cannot be created or destroyed, only transformed.

*   Buying transforms **Cash** into **Position**. (Cash decreases, Equity stays same).
*   Selling transforms **Position** into **Cash**. (Cash increases, Equity changes by PnL).

---

## 2. Data Model (Prisma Schema)

We separate immutable execution logs from mutable state.

```prisma
// 2.1 The Portfolio (Cash & Account State)
model Portfolio {
  id              String   @id @default(cuid())
  userId          String   @unique
  
  balance         Float    @default(10000) // Available Cash (USDT)
  totalRealizedPnL Float   @default(0)     // Lifetime PnL (for stats)
  
  positions       Position[]
  trades          Trade[]
  
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
}

// 2.2 The Positions (Current Holdings)
model Position {
  id              String   @id @default(cuid())
  portfolioId     String
  
  symbol          String   @db.VarChar(20) // BTCUSD, AAPL
  quantity        Float    // Amount held
  avgEntryPrice   Float    // Weighted Average Price
  
  portfolio       Portfolio @relation(fields: [portfolioId], references: [id])
  
  @@unique([portfolioId, symbol]) // One position per asset per user
}

// 2.3 The Trades (Immutable Ledger of Truth)
model Trade {
  id              String   @id @default(cuid())
  portfolioId     String
  
  symbol          String   @db.VarChar(20)
  side            String   // 'BUY' or 'SELL'
  quantity        Float
  price           Float    // Execution Price
  
  // For Sells Only:
  realizedPnL     Float?   
  
  timestamp       DateTime @default(now())
  
  portfolio       Portfolio @relation(fields: [portfolioId], references: [id])
}
```

---

## 3. Execution Logic (The Black Box)

### SCENARIO A: BUY (LONG)
1.  **Validation**: Check `Portfolio.balance >= (qty * price)`.
2.  **Cash Update**: `Portfolio.balance -= (qty * price)`.
3.  **Position Update**: 
    *   If existing: Update `avgEntryPrice` (Weighted Average) and increase `quantity`.
    *   If new: Create record.
4.  **Trade Log**: Insert immutable record (no PnL).

### SCENARIO B: SELL (CLOSE LONG)
1.  **Validation**: Check `Position.quantity >= sellQty`.
2.  **PnL Calculation**: 
    *   `profit = (sellPrice - Position.avgEntryPrice) * sellQty`
    *   *Note: This profit can be negative.*
3.  **Principal Recovery**:
    *   `principal = Position.avgEntryPrice * sellQty`
4.  **Cash Update**:
    *   `Portfolio.balance += (principal + profit)`
    *   *Simplification:* `Portfolio.balance += (sellPrice * sellQty)`
    *   *Why?* Because `principal + profit` mathematically equals `(entry * qty) + (exit - entry)*qty` = `exit*qty`.
5.  **Position Update**: Decrease `quantity`. If `approx(0)`, delete record.
6.  **Trade Log**: Insert immutable record with `realizedPnL`.

---

## 4. Derived Calculations (Frontend)

Never trust the frontend to store history. Frontend simply renders:

*   **Cash**: `data.portfolio.balance`
*   **Invested**: `data.positions.reduce((acc, p) => acc + (p.qty * p.avgEntry), 0)`
*   **Current Value**: `data.positions.reduce((acc, p) => acc + (p.qty * livePrice), 0)`
*   **Total Equity**: `Cash + Current Value`

---

## 5. Deployment Checklist (The Fix)

1.  **[DB]**: Migration to create `Portfolio`, `Position`, `Trade` tables.
2.  **[BACKEND]**: `tradeAction` server action that implements the ACID transaction logic above.
3.  **[FRONTEND]**:
    *   Remove all `useState` logic for balance.
    *   Replace with `useOptimistic` tied to the Server Action.
    *   Fetch `getPortfolio()` on load.

This solves the "Balance Doubling" because we rigorously separate Principal Return from Profit.
