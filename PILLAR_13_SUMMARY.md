# Pillar 13: Voluntary Attention & Accountability

## Core Principle
**"You may choose where to look — but you don't get to escape reality."**

The Brain is NOT required to predict every token.
But it IS fully accountable for:
- What it chooses to predict (existing Pillars 2-3)
- What it chooses to ignore (NEW accountability)

## How It Works

### 1. Attention Selection (Before Predictions)
- Brain analyzes all available tokens
- Selects an **Attention Set** based on:
  - Top 30% volatile tokens (interesting movers)
  - Random 10% exploratory sample (avoid tunnel vision)
- Rest are **voluntarily ignored**

### 2. Prediction Phase
- Brain ONLY predicts on tokens in Attention Set
- No forced spam predictions on everything
- Intentional focus

### 3. Regret Accountability (After Wait Period)
- System checks what happened to **ignored** tokens
- If ignored token moved meaningfully (>3%):
  - **Regret increases** (emotional feedback)
  - **Teaching event logged**: "You chose not to look at X. Reality moved UP by 5%. This is regret, not failure."
- No penalty, no failure - just awareness

### 4. Anti-Permanent Avoidance
- Tracks if Brain repeatedly ignores same tokens
- Builds **avoidance pressure** (not penalty)
- Forces confrontation with avoided areas
- Prevents tunnel vision

## Integration Points

### With Pillar 10 (Compounding Loop)
- Attention selection happens BEFORE predictions
- Only attention set tokens get predicted
- Funnel narrows based on attention set performance

### With Pillar 14 (Emotional State)
- Regret feeds into emotional calibration
- Higher regret → reduces FLAT bias (FOMO effect)
- Lower regret → allows more selective focus

### With Pillar X (Anti-Stagnation)
- Avoidance pressure can trigger universe pruning
- Forces informational exposure
- Prevents infinite hesitation

## Key Metrics

### Attention Metrics
- `focusRatio`: % of universe in attention set
- `attentionSetSize`: Number of tokens actively predicted
- `ignoredCount`: Number of tokens voluntarily ignored

### Accountability Metrics
- `totalRegret`: Cumulative regret score
- `missedOpportunityCount`: # of meaningful moves ignored
- `avoidancePressure`: Pressure from repeated avoidance

## Implementation Files

### Core Logic
- `lib/learning-validation/pillar13-attention.ts` - All Pillar 13 functions
  - `selectAttentionSet()` - Choose what to look at
  - `evaluateIgnoredTokens()` - Check ignored outcomes
  - `trackAvoidancePattern()` - Anti-permanent avoidance
  - `calculateRegretScore()` - Regret accumulation

### Integration
- `lib/learning-validation/compoundingLoop.ts`
  - Lines 636-678: Attention selection in predictFunnel()
  - Lines 891-930: Ignored token evaluation in scoreFunnel()
  - Lines 327-332: FunnelState fields

## Configuration

```typescript
PILLAR_13_CONFIG = {
    // What counts as meaningful move
    MEANINGFUL_MOVE_THRESHOLD: 0.03, // 3%

    // Regret scoring
    BASE_REGRET_PER_MISSED_MOVE: 0.25,
    REGRET_MULTIPLIER_LARGE_MOVE: 1.5, // >5% moves

    // Anti-avoidance
    REPEATED_IGNORE_THRESHOLD: 3, // 3+ cycles
    AVOIDANCE_PRESSURE_INCREMENT: 0.1,
    MAX_AVOIDANCE_PRESSURE: 2.0,

    // Focus health bounds
    HEALTHY_FOCUS_RATIO_MIN: 0.1, // <10% = too narrow
    HEALTHY_FOCUS_RATIO_MAX: 0.8, // >80% = too broad
}
```

## What This Fixes

### Before Pillar 13
- Forced to predict on ALL tokens (spam)
- Or hide behind FLAT (avoidance)
- No accountability for what you ignore
- Tunnel vision possible

### After Pillar 13
- Voluntary selective focus
- Accountable for ignored reality
- Tension between risk (vote) vs regret (ignore)
- Learns to balance attention

## Next Steps

1. ✅ Core implementation complete
2. 🔄 Dashboard UI updates (in progress)
3. ⏳ Test with live data
4. ⏳ Tune regret multipliers based on behavior

## Teaching Events Example

```
[Pillar 13] Teaching Event:
"You chose not to look at BONK. Reality moved UP by 8.3%.
This is regret, not failure. What pattern did you miss?"

[Pillar 13] Avoidance Pressure:
"You've ignored SOL-ecosystem tokens for 4 cycles.
Avoidance pressure: 0.4 → forcing exposure next cycle."
```

## Philosophy

This pillar completes the behavioral framework:
- **Pillar 10**: Prediction discipline
- **Pillar 11**: Agency accountability
- **Pillar 13**: Attention responsibility
- **Pillar 14**: Emotional calibration

Together they create:
- Selective focus (not spam)
- Reality confrontation (not avoidance)
- Emotional learning (not rigid rules)
- Voluntary agency (not forced behavior)

**The Brain now has choice + consequence.**
