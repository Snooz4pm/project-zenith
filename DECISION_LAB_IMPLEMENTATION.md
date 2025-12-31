# Decision Lab - Correct Execution Model Implementation

## ✅ Implementation Complete

All changes have been successfully implemented following the **5-Phase Deterministic Execution Model** for proper risk-based trading simulation.

---

## 📊 System Architecture

### Database Status
- ✅ **Clean Database**: No invalid scenarios found
- ✅ All scenarios have valid `basePrice` or `chartData`
- ✅ Cleanup script available for future use

### Core Components Modified

#### 1. **API Routes**
- `app/api/decision-lab/[id]/route.ts` - Scenario detail endpoint (never returns 404)
- `app/api/decision-lab/route.ts` - Scenario listing endpoint
- `app/api/decision-lab/attempt/route.ts` - Trade execution with proper position sizing

#### 2. **Frontend Pages**
- `app/decision-lab/[id]/page.tsx` - Scenario runner with error handling
- `components/learning/DecisionEngine.tsx` - Risk management UI

#### 3. **Utilities**
- `scripts/cleanup-invalid-scenarios.ts` - Database cleanup script

---

## 🎯 The 5-Phase Execution Model

### **PHASE 1 — Capital & Risk Definition**

**User Inputs (Required):**
```typescript
accountBalance: number    // Current portfolio balance (e.g., $50,000)
riskPercent: number       // % of account to risk (0.5% - 5%)
stopLossPercent: number   // SL distance from entry (0.5% - 10%)
takeProfitPercent: number // TP distance from entry (1% - 20%)
```

**System Calculates:**
```typescript
riskAmount = accountBalance * (riskPercent / 100)
```

**Example:**
- Account: $50,000
- Risk: 1% → **$500 risk amount**

### **PHASE 2 — Entry Lock**

**Entry Point:**
```typescript
entryIndex = Math.floor(candles.length * 0.8)  // 80% through chart
entryCandle = candles[entryIndex]
entryPrice = entryCandle.close
entryTime = entryCandle.time
```

**🚫 Irreversible:**
- No changing inputs after entry
- No recalculations
- Mirrors real trading

### **PHASE 3 — Position Sizing** ⭐ **CRITICAL**

**The Core Formula:**
```typescript
stopLossDistance = entryPrice * (stopLossPercent / 100)
positionSize = riskAmount / stopLossDistance
```

**Why This Matters:**
- ✅ If SL hit → loss = **exactly** `riskAmount`
- ✅ If TP hit → profit scales based on R:R ratio
- ✅ Professional risk management
- ✅ Prevents over-sizing or under-sizing

**Example:**
- Entry Price: $45,000 (BTC)
- Risk Amount: $500
- SL%: 2% → SL Distance = $900
- **Position Size** = $500 / $900 = **0.556 BTC**

### **PHASE 4 — Exit Levels**

**Stop Loss:**
```typescript
stopLoss = direction === 'LONG'
    ? entryPrice - stopLossDistance      // $44,100
    : entryPrice + stopLossDistance
```

**Take Profit:**
```typescript
takeProfit = direction === 'LONG'
    ? entryPrice + (entryPrice * (takeProfitPercent / 100))  // $46,800 (4%)
    : entryPrice - (entryPrice * (takeProfitPercent / 100))
```

### **PHASE 5 — Forward Simulation** ⭐ **CREATES PROFIT**

**Candle-by-Candle Exit Detection:**
```typescript
for (let i = entryIndex + 1; i < candles.length; i++) {
    const candle = candles[i];

    if (direction === 'LONG') {
        // Check SL first (conservative)
        if (candle.low <= stopLoss) {
            exitPrice = stopLoss;
            outcome = 'LOSS';
            break;
        }
        // Check TP
        if (candle.high >= takeProfit) {
            exitPrice = takeProfit;
            outcome = 'WIN';
            break;
        }
    }

    // Similar logic for SHORT
}
```

**PnL Calculation:**
```typescript
priceChange = exitPrice - entryPrice
directionMultiplier = direction === 'LONG' ? 1 : -1
pnl = priceChange * directionMultiplier * positionSize
```

---

## 💰 Complete Trade Example

### User Setup:
- **Account Balance**: $50,000
- **Risk**: 1% → $500
- **Stop Loss**: 2%
- **Take Profit**: 4%
- **Direction**: LONG

### System Calculation:
1. **Entry** (at 80% mark):
   - Entry Price: $45,000
   - Entry Time: Candle 80

2. **Position Sizing**:
   - SL Distance: $45,000 × 2% = $900
   - Position Size: $500 ÷ $900 = **0.556 BTC**

3. **Exit Levels**:
   - Stop Loss: $45,000 - $900 = **$44,100**
   - Take Profit: $45,000 + ($45,000 × 4%) = **$46,800**

4. **Forward Simulation**:
   - Candle 81: High $45,500, Low $44,800 → Continue
   - Candle 82: High $46,200, Low $45,100 → Continue
   - Candle 83: High $47,000, Low $46,500 → **TP HIT at $46,800**

5. **PnL Calculation**:
   - Price Change: $46,800 - $45,000 = $1,800
   - Direction: LONG (×1)
   - **PnL**: $1,800 × 1 × 0.556 = **+$1,000.80**

6. **Portfolio Update**:
   - New Balance: $50,000 + $1,000.80 = **$51,000.80**

### Risk:Reward Achieved:
- Risk: $500
- Reward: $1,000.80
- **R:R = 1:2** ✅

---

## 🛡️ Error Prevention

### ✅ No More 404 Errors

**API Response (Invalid Scenario):**
```json
{
  "playable": false,
  "reason": "Scenario was deprecated or removed"
}
```

**Frontend Handling:**
```typescript
if (data.playable === false) {
    // Show user-friendly error instead of 404
    return <ScenarioUnavailable reason={data.reason} />;
}
```

### ✅ Data Validation

**Multiple Layers:**
1. API checks if scenario exists
2. API checks if scenario has required data
3. API validates all risk parameters
4. Frontend validates before submission

### ✅ Atomic Database Updates

**Transaction Safety:**
```typescript
await prisma.$transaction(async (tx) => {
    // 1. Check for existing attempt (idempotency)
    // 2. Update portfolio balance
    // 3. Record trade
    // 4. Create attempt
});
```

---

## 🎨 User Interface

### Risk Management Panel

**Three Sliders:**
1. **Account Risk** (0.5% - 5%)
   - Shows dollar amount risked
   - Default: 1%

2. **Stop Loss** (0.5% - 10%)
   - Distance from entry
   - Default: 2%

3. **Take Profit** (1% - 20%)
   - Distance from entry
   - Default: 4%

**Live Display:**
- Risk:Reward Ratio (e.g., "1:2.00")
- Risk Amount in dollars
- Quick presets: Conservative, Balanced, Aggressive

### Decision Buttons

**Three Choices:**
- **LONG** - Bullish position
- **SHORT** - Bearish position
- **FLAT** - Stay out (0 PnL)

**Clear Feedback:**
- Position sized based on risk parameters
- No confusion about leverage or stake
- Professional trading interface

---

## 📂 Files Modified

### Backend
```
zenithscores-frontend/
├── app/api/decision-lab/
│   ├── [id]/route.ts          ✅ Never returns 404
│   ├── attempt/route.ts        ✅ 5-phase execution model
│   └── route.ts                ✅ DB-only scenario list
```

### Frontend
```
zenithscores-frontend/
├── app/decision-lab/
│   └── [id]/page.tsx           ✅ Error handling
├── components/learning/
│   └── DecisionEngine.tsx      ✅ Risk management UI
```

### Scripts
```
zenithscores-frontend/
└── scripts/
    └── cleanup-invalid-scenarios.ts  ✅ Database cleanup
```

---

## 🧪 Testing Checklist

- [x] Cleanup script runs without errors
- [x] Database has no invalid scenarios
- [x] API never returns 404
- [x] Frontend handles unavailable scenarios gracefully
- [x] Position sizing uses proper risk-based formula
- [x] Forward simulation detects SL/TP correctly
- [x] PnL calculations are deterministic
- [x] Portfolio updates atomically
- [x] Trade history is recorded
- [x] Risk:Reward ratio displays correctly

---

## 🚀 Production Readiness

### ✅ Unified Portfolio System

**Single Source of Truth:**
- Portfolio model in Prisma (1:1 with User)
- Created on first access
- All modules read/write same portfolio

**No Hardcoded Balances:**
- Frontend fetches real balance from DB
- Backend updates portfolio atomically
- All PnL immediately reflects in account

**Transaction Safety:**
- Idempotent operations
- Atomic updates
- Proper error handling

### ✅ Scalability

**Database Queries:**
- Efficient filtering
- Pagination support
- Proper indexing

**Performance:**
- Forward simulation is O(n) where n = candles after entry
- Typically 20-30 candles = instant execution
- No heavy computations

### ✅ Maintainability

**Clear Separation:**
- Business logic in API
- Presentation in components
- Data validation at boundaries

**Documentation:**
- Inline comments explain each phase
- Type safety with TypeScript
- Clear function names

---

## 🎓 Key Insights

### Why Position Sizing Matters

**❌ Old Way (Fixed Stake):**
```typescript
stake = $10,000 (arbitrary)
// Risk varies wildly based on SL distance
```

**✅ New Way (Risk-Based):**
```typescript
positionSize = riskAmount / stopLossDistance
// Risk is ALWAYS exactly riskAmount
```

### Why Forward Simulation Matters

**❌ Old Way (Entry to Final Price):**
```typescript
pnl = (finalPrice - entryPrice) * stake
// Ignores SL/TP exits
```

**✅ New Way (Candle-by-Candle):**
```typescript
// Checks each candle for SL/TP
// Exits at exact level
// Realistic trade simulation
```

---

## 📝 Running the Cleanup Script

**Command:**
```bash
cd zenithscores-frontend
npx tsx scripts/cleanup-invalid-scenarios.ts
```

**Output:**
```
🧹 Starting cleanup of invalid Decision Lab scenarios...

✅ No invalid scenarios found. Database is clean!
🎉 Cleanup completed successfully!
```

**Safe to Run:**
- ✅ Multiple times
- ✅ In production
- ✅ Non-destructive (only removes truly invalid data)

---

## 🎯 Summary

The Decision Lab now implements a **professional-grade risk management system** with:

1. ✅ **Deterministic PnL** - Same inputs = same outputs
2. ✅ **Proper Position Sizing** - Risk-based, not arbitrary
3. ✅ **Realistic Simulation** - Candle-by-candle exit detection
4. ✅ **Unified Portfolio** - Single source of truth
5. ✅ **Error Prevention** - No 404s, graceful degradation
6. ✅ **Production Ready** - Atomic transactions, validation

**Users now experience trading that feels real, with proper risk management and deterministic outcomes.**

---

*Implementation Date: December 2024*
*Status: ✅ Complete and Production Ready*
