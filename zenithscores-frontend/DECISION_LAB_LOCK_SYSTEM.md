# Decision Lab Lock System - Implementation Summary

## Overview
Implemented a complete one-time-use lock system for Decision Lab scenarios to prevent users from replaying scenarios after completion.

## Problem Solved
- Users were able to retry completed scenarios multiple times
- This allowed them to "game" the system by knowing the outcome
- Portfolio balances appeared frozen when retrying (due to idempotency)
- Users experienced confusion about why their balance didn't update on retries

## Solution Implemented

### 1. API-Level Lock Check
**File**: `app/api/decision-lab/[id]/route.ts:43-58`

```typescript
// Check if user already completed this scenario (LOCK CHECK)
const existingAttempt = await prisma.decisionAttempt.findUnique({
    where: {
        userId_scenarioId: {
            userId: session.user.id,
            scenarioId: id
        }
    }
});

if (existingAttempt) {
    return NextResponse.json({
        playable: false,
        reason: 'You have already completed this scenario. Each scenario can only be attempted once.'
    });
}
```

**Impact**:
- Prevents users from accessing completed scenarios entirely
- Returns clear error message explaining the lock
- Check happens BEFORE loading any scenario data (efficient)

### 2. Visual Lock Indicators
**File**: `app/decision-lab/page.tsx:125-181`

Completed scenarios now display:
- Lock icon overlay with blurred background
- "LOCKED" badge
- Result badge showing choice and P&L (e.g., "✓ SELL +$156")
- Non-clickable card with reduced opacity
- Clear "Already completed" message

**Before**: Clickable card with subtle "✓ COMPLETED" badge
**After**: Locked card with prominent lock icon and result display

### 3. Enhanced Error Page
**File**: `app/decision-lab/[id]/page.tsx:90-120`

Added special handling for locked scenarios:
- Blue-themed lock icon (vs amber for unavailable, red for errors)
- Clear "Scenario Locked" heading
- Explanation message from API
- "Return to Lab" button

### 4. Database Cleanup

#### Issue: Invalid Scenario IDs
Two scenarios had forward slashes in their IDs which caused 404 routing errors:
- `eur/usd-parity-test` → `eurusd-parity-test`
- `usd/jpy-intervention` → `usdjpy-intervention`

**Files Created**:
- `scripts/check-slash-ids.ts` - Detects scenarios with slashes
- `scripts/fix-slash-ids.ts` - Fixes IDs and updates references
- `scripts/remove-invalid-scenarios.ts` - Removes scenarios without data

**Result**: All 204 scenarios are now valid and accessible

## System Behavior

### First Attempt
1. User selects scenario from list
2. API loads scenario data
3. User makes decision
4. Result saved to `DecisionAttempt` table
5. Portfolio updated atomically
6. Scenario marked as completed

### Retry Attempt
1. User clicks locked scenario
2. Lock overlay prevents navigation (frontend)
3. If user manually navigates to URL:
   - API check detects existing attempt
   - Returns `{playable: false, reason: "..."}`
   - Frontend shows lock error page
4. User sees clear message: "Already completed"

## Technical Details

### Database Constraint
The `DecisionAttempt` table has a unique constraint:
```prisma
@@unique([userId, scenarioId])
```

This ensures:
- One attempt per user per scenario (idempotency)
- Database-level enforcement (can't be bypassed)
- Efficient lookup using composite index

### Frontend State Management
Completion tracking handled via:
1. API returns `completed` boolean for each scenario
2. API includes `result: {choice, pnl}` for completed scenarios
3. Frontend conditionally renders locked vs unlocked cards
4. Lock check happens on both list and detail pages

## Files Modified

1. `app/api/decision-lab/[id]/route.ts` - Added lock check
2. `app/decision-lab/page.tsx` - Added lock UI
3. `app/decision-lab/[id]/page.tsx` - Enhanced error handling
4. `scripts/fix-slash-ids.ts` - Fix problematic IDs
5. `scripts/check-slash-ids.ts` - Detect slash issues
6. `scripts/remove-invalid-scenarios.ts` - Cleanup invalid data

## Testing Checklist

- [x] User cannot access completed scenario from list
- [x] User cannot manually navigate to completed scenario URL
- [x] Lock icon and message display correctly
- [x] Result badge shows correct P&L and choice
- [x] Error page shows appropriate message for locked scenarios
- [x] All 204 scenarios are valid and accessible
- [x] No scenarios have forward slashes in IDs
- [x] Portfolio balance persists correctly across sessions

## User Experience Improvements

**Before**:
- Confusing "Why didn't my balance change?" moments
- No clear indication of completion status
- Could retry scenarios infinitely
- 404 errors on some scenarios

**After**:
- Clear visual lock indicators
- Prominent result display (choice + P&L)
- Impossible to retry scenarios
- All scenarios accessible
- Professional locked state UI

## Next Steps (Optional)

Potential future enhancements:
1. Add "Reset Progress" feature for testing/practice
2. Show completion date on locked scenarios
3. Add scenario completion statistics (attempts/completion rate)
4. Implement scenario difficulty progression
5. Add leaderboard showing top performers per scenario

---

**Implementation Date**: December 31, 2025
**Status**: ✅ Complete and Deployed
