# Hallmark: The ZenithScores Trader Notebook Interface
## Design Specification & Mental Model

> "The markets reward those who can observe their own mind with the same detachment they observe price."

### 1. Mental Model: The Black Box Flight Recorder
The Notebook is not a canvas for expression; it is a **Flight Recorder** for decision-making. 

In aviation, the Black Box records inputs and outputs objectively so that crashes can be analyzed and prevented. In ZenithScores, the Notebook records the **Trader's Psychological & Tactical State** before, during, and after a trade.

**It is widely accepted that:**
1. You cannot improve what you do not measure.
2. Memory is flawed and self-serving.
3. Real-time logging is the only antidote to "Hindsight Bias".

**Therefore, the Notebook is:**
*   **Immutable-feeling:** Once a trade is executed, the "Plan" section locks. You cannot lie to yourself later.
*   **Temporal:** It acknowledges that "You" at 09:30 (Planning) are different from "You" at 10:15 (Under Pressure).
*   **Context-Bound:** A note is never floating in void; it is anchored to a specific Market Regime and Asset.

---

### 2. Core Mechanics & Unique Features

#### 2.1. Text as Signal (Semantic Line Typing)
Instead of cosmetic formatting (Bold, Italic), lines are strictly typed by **Epistemological Status**. Traders must declare *what* they are writing.

*   `[hypo] Hypothesis`: "I believe price will seek the 200 SMA." (Render: Dashed left border, faint text).
*   `[fact] Observation`: "Volume is 200% above 20-day average." (Render: Solid logic-gate borders, bright white text).
*   `[int] Intuition`: "Price feels heavy here." (Render: Italic, specific purple accent, lower opacity).
*   `[rule] Protocol`: "If close < 1.05, exit immediately." (Render: Red warning border, monospace font).

**Why?** In review, you can instantly see if a failed trade was based on *Fact* or *Intuition*.

#### 2.2. The Triple-State Workflow (Reasoning Modes)
A single "Note" has three distinct phases. The UI changes physically between them.

*   **Phase 1: BRIEFING (Planning)**
    *   *State:* Open Editor.
    *   *Goal:* Build the thesis.
    *   *Constraint:* Must link to an asset. Must declare a bias (Long/Short/Neutral).
    *   *Action:* "Commit to Action" (Locks the Briefing).

*   **Phase 2: LIVE LOG (Execution)**
    *   *State:* **Append-Only Command Line.**
    *   *Goal:* Capture the fog of war.
    *   *Interaction:* User types quick log entries. Timestamps are auto-injected.
    *   *Example:*
        *   `09:31:05` Entered long at 1.052.
        *   `09:33:12` Feeling nervous. Price stalling.
        *   `09:34:00` Adding to position.
    *   *Why?* Prevents revisionist history. You capture the panic or greed in real-time.

*   **Phase 3: DEBRIEF (Review)**
    *   *State:* Read-Only Annotation.
    *   *Goal:* Grading the decision.
    *   *Action:* User highlights their own text and tags "Error", "Good Call", "Emotion".
    *   *Output:* A "Execution Score" (0-100) based on discipline, not PnL.

#### 2.3. Conviction Weighted Statements
When writing a Hypothesis, the user can drag a "Confidence Slider" (0-100%).
*   *UI:* Providing a faint background heatmap behind the text.
*   *Review Logic:*
    *   High Conviction (90%) + Wrong Outcome = **"The Dangerous Error"** (Highlighted Red in Review).
    *   Low Conviction (20%) + Right Outcome = **"Luck"** (Highlighted Yellow in Review).

#### 2.4. Context-Aware Auto-Tagging
The Notebook silently observes the platform state. When a note is created, it captures:
*   **VIX Level**: Was fear high?
*   **Market Regime**: (e.g., "Trending Strong Bull").
*   **Session**: (London Open).

This data is stamped into the note header like flight telemetry.

---

### 3. Interaction Principles

#### "The Pilot's Check"
*   **Principle:** Interactions should feel mechanical and deliberate, like flipping a switch in a cockpit.
*   **No "Auto-save" Indicators:** Saving is assumed instant and atomic.
*   **Toggle Switches:** For modes (Plan -> Live), use heavy, sliding toggle switches that require a deliberate "Click-Drag" to activate. Prevent accidental mode switching.

#### "Information Radiators"
*   **Principle:** Do not hide data inside menus.
*   **Implementation:** The right rail of the notebook always shows the *live* price of the linked asset, even if the note is 2 years old. This provides instant contrast between "Then" vs "Now".

---

### 4. Notion vs. Zenith Notebook (The Anti-Pattern)

| Feature | Notion / Generic Notes | Zenith Notebook |
| :--- | :--- | :--- |
| **Primary Goal** | Flexibility & Creativity | Rigor & Accountability |
| **Formatting** | "Make it look pretty" | "Make it technically true" |
| **Editing** | Infinite, fluid editing | Gated phases (Plan -> Lock -> Log) |
| **Tone** | Friendly, Emoji-heavy | Cold, Clinical, Numeric |
| **Data Type** | Documents | TImestamped Event Streams |

---

### 5. Why Serious Traders Will Trust It

Serious traders struggle with **Psychological Drift**. They make a plan, the market opens, price moves against them, and they abandon the plan due to emotion.

The Zenith Notebook solves this by:
1.  **Externalizing the Plan:** Making it a static "Contract" on the screen.
2.  **Shaming the Drift:** If you deviate, you must log it in the *Live Log*. The act of typing "I am breaking my rule" is a powerful psychological brake.
3.  **Compounding Wisdom:** The *Review Mode* turns painful losses into structured data points, making the loss feel "useful" (tuition) rather than just expensive.

### 6. Technical Data Architecture (Draft)

**Schema Concept:**
```prisma
model TradeJournal {
  id          String   @id @default(cuid())
  userId      String
  assetSymbol String
  
  // Phase Locks
  status      String   @default("BRIEFING") // BRIEFING, LIVE, DEBRIEF, ARCHIVED
  
  // Content Blocks (JSON)
  thesis      Json     // Array of { type: 'hypothesis'|'fact', content: string, conviction: number }
  
  // The Flight Recorder
  liveLog     Json     // Array of { timestamp: Date, content: string, sentiment: 'fear'|'neutral'|'greed' }
  
  // The Scorecard
  outcome     String?  // WIN / LOSS / BE
  disciplineScore Int? // 0-100
  
  // Telemetry
  marketContext Json   // { vix: 14.2, regime: 'BULL_TREND', session: 'NY' }
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
