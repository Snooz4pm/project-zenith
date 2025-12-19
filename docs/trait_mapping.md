# Trait Mapping & Paths Logic (Production Spec)

## 1. Core Traits (Computed 0-100)

| Trait | Meaning |
| :--- | :--- |
| **analytical_depth** | Logical accuracy & reasoning depth. |
| **risk_discipline** | Respect for predefined limits (stops, risk%). |
| **adaptability** | Speed & adjustment under change. |
| **consistency** | Stability of behavior over time. |
| **emotional_stability** | Resistance to bias, tilt, & answer changing. |

---

## 2. Quiz Signal Mapping

**Signals Collected:**
- `accuracy` (% correct)
- `avg_time_per_question` (ms)
- `answer_changes_count` (int)
- `repeated_mistakes` (int)
- `question_difficulty` (1-5)

**Mapping Rules:**

| Signal | Trait Impact |
| :--- | :--- |
| High Accuracy (>80%) | `+ analytical_depth` |
| High Difficulty + Correct | `++ analytical_depth` |
| Slow (>30s) + Correct | `+ consistency` |
| Fast (<5s) + Wrong | `+ adaptability`, `- analytical_depth` |
| Changed Answers (>1/quiz) | `- emotional_stability` |
| Repeated Mistakes | `- consistency` |

**Normalization Formula:**
```ts
analytical_depth = (accuracy * 0.6) + (difficulty_score * 0.4)
analytical_depth = clamp(analytical_depth, 0, 100)

// Time penalty
if (time_per_question < 5000 && accuracy < 60) {
  analytical_depth -= 10
}
```

---

## 3. Trading Simulator Mapping

**Signals Collected:**
- `stop_loss_used` (bool)
- `stop_loss_respected` (bool)
- `risk_per_trade` (%)
- `overtrades_count` (int)
- `drawdown_events` (int)
- `rule_violations` (int)

**Mapping Rules:**

| Behavior | Trait Impact |
| :--- | :--- |
| Respecting Stops | `+ risk_discipline` |
| No Stop Loss | `- risk_discipline` |
| Overtrading (>10/day) | `- emotional_stability` |
| Rule Violation | `- consistency` |
| Stable PnL | `+ consistency` |

**Normalization Formula:**
```ts
risk_discipline = (stop_respected_rate * 70) + (risk_limit_respect * 30)

// Penalty
if (no_stop_loss_rate > 30) {
  risk_discipline -= 20
}
```

---

## 4. Path Scoring Formulas (Deterministic)

**1. Market Analyst**
- Profile: Deep thinker, patient, structured.
- Formula:
  ```ts
  score = (analytical_depth * 0.4) + (consistency * 0.3) + (emotional_stability * 0.3)
  ```

**2. Data / Research**
- Profile: Detail-oriented, systematic.
- Formula:
  ```ts
  score = (analytical_depth * 0.5) + (consistency * 0.5)
  ```

**3. Systematic Trading**
- Profile: Rule-based, low discretion.
- Formula:
  ```ts
  score = (consistency * 0.4) + (risk_discipline * 0.4) + (analytical_depth * 0.2)
  ```

**4. Execution Trader**
- Profile: Fast, adaptable, pressure-resilient.
- Formula:
  ```ts
  score = (adaptability * 0.4) + (risk_discipline * 0.4) + (emotional_stability * 0.2)
  ```

**5. Macro Observer**
- Profile: Big picture, narrative synthesis.
- Formula:
  ```ts
  score = (analytical_depth * 0.4) + (emotional_stability * 0.6)
  ```

---

## 5. Aggregation Strategy

**Rolling Weighted Average:**
- Recent (Last 30 days): 50%
- Historical: 50%

```ts
final_trait = (recent_score * 0.5) + (historical_score * 0.5)
```

**Confidence Gating:**
- `confidence = min(1, data_points / REQUIRED_DATA_POINTS)`
- Required: ~10 quizzes or ~50 trades.
- **Display Threshold:** Only show paths if `confidence >= 60%`.
