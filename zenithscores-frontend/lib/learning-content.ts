/**
 * Learning Module Course Content
 * Comprehensive trading education courses
 */

export interface ModuleContent {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    estimatedTime: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    parts: Part[];
}

export interface Part {
    id: string;
    title: string;
    estimatedTime: string;
    chapters: Chapter[];
}

export interface Chapter {
    id: string;
    title: string;
    content: string; // Markdown content
}

export const COURSES: ModuleContent[] = [
    {
        id: 'trading-fundamentals',
        title: 'Trading Fundamentals',
        subtitle: 'The Complete Foundation',
        icon: '📚',
        estimatedTime: '2h 15min',
        difficulty: 'beginner',
        parts: [
            {
                id: 'part-1',
                title: 'Market Analysis Demystified',
                estimatedTime: '45 min',
                chapters: [
                    {
                        id: 'ch-1-1',
                        title: 'The Two Philosophies of Analysis',
                        content: `Trading begins with a question: **"Should I buy or sell this asset?"** To answer, you must become a detective, and you have two primary investigative methods.

### Fundamental Analysis (The "Why")

This approach evaluates an asset's *intrinsic value*. It asks: "What is this thing truly worth, based on its underlying characteristics?"

**For Stocks:** You become a business analyst. You study the company's financial statements (income statement, balance sheet, cash flow statement), its management team, competitive advantages (moat), industry position, and growth prospects.

**For Currencies (Forex):** You analyze interest rates, inflation data (CPI), employment reports, GDP growth, and political stability.

**For Crypto Assets:** Assess tokenomics (supply, distribution, utility), blockchain technical strength, developer team, and real-world adoption.

### Technical Analysis (The "When" and "Where")

This approach focuses purely on **price action, volume, and time**.

Core premises:
1. **Market Action Discounts Everything** - All fundamentals are reflected in price
2. **Prices Move in Trends** - Identify and trade with the trend
3. **History Repeats** - Chart patterns are predictive

> 💡 **Pro Tip:** Many successful traders use fundamentals to decide *what* to trade and technicals to decide *when* to trade it.`
                    },
                    {
                        id: 'ch-1-2',
                        title: 'Who Moves the Markets?',
                        content: `Understanding who you are trading against is crucial.

### The Market Participants

1. **Retail Traders (You)** 
   - Individual traders with personal capital
   - Typically *price takers*
   
2. **Institutional Investors**
   - Pension funds, mutual funds, hedge funds
   - Move markets with massive orders
   - Extensive research teams
   
3. **Market Makers**
   - Facilitate trading by providing liquidity
   - Profit from bid-ask spread
   
4. **Central Banks**
   - Ultimate game-changers
   - Interest rate decisions create long-term trends
   
5. **High-Frequency Trading (HFT)**
   - Ultra-fast algorithmic trading
   - Thousands of trades per second

> ⚠️ **Key Insight:** As a retail trader, your edge is not size or speed, but **strategy, discipline, and risk management.**`
                    },
                    {
                        id: 'ch-1-3',
                        title: 'How Orders Create a Market',
                        content: `At its core, a market is a continuous auction.

### The Order Book

The order book is a real-time list of all buy and sell limit orders:

- **Bid** - Highest price someone will pay
- **Ask (Offer)** - Lowest price someone will sell
- **Spread** - The difference (your transaction cost)

### Order Matching

| Your Order | What Happens |
|------------|--------------|
| Market Buy | "Lifts the ask" - matches with lowest sell |
| Market Sell | "Hits the bid" - matches with highest buy |

> 📊 **Tight spreads = High liquidity = Lower costs**`
                    }
                ]
            },
            {
                id: 'part-2',
                title: 'Order Types – Your Command Toolkit',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'ch-2-1',
                        title: 'Market vs. Limit Orders',
                        content: `### Market Order

An instruction to buy or sell **immediately at the best available price.**

| Pros | Cons |
|------|------|
| Guaranteed execution | You pay the spread |
| Speed is paramount | Slippage in fast markets |

**Use when:** Exiting a losing trade quickly.

---

### Limit Order

An instruction to buy or sell **only at a specified price or better.**

- **Buy Limit:** Below current price - "Buy if it gets cheaper"
- **Sell Limit:** Above current price - "Sell if it rises to my target"

| Pros | Cons |
|------|------|
| Total price control | Execution not guaranteed |
| Enter on pullbacks | Price may never reach |

**Use when:** You have a specific, pre-defined entry or exit price.`
                    },
                    {
                        id: 'ch-2-2',
                        title: 'Protective & Advanced Orders',
                        content: `### Stop-Loss Order

Your primary risk management tool. Triggers when price reaches your stop, then becomes a market order.

- **Sell Stop:** Below current price (for longs) - Limits your loss
- **Buy Stop:** Above current price (for shorts) - Limits your loss

> ⚠️ Due to gaps, execution price can be worse than stop price.

---

### Stop-Limit Order

After stop is hit, becomes a **limit order** (not market).

**Example:** Stop: $95, Limit: $94.50
- If price hits $95 → Sell limit at $94.50 placed
- Won't sell below $94.50, but might not fill at all

---

### Take-Profit Order

A limit order to lock in profits at your target.

---

### OCO (One-Cancels-Other)

The ultimate bracket order! Links stop-loss and take-profit:

\`\`\`
Long at $100
├── Take-Profit at $120 (Sell Limit)
└── Stop-Loss at $90 (Sell Stop)

If one triggers → other cancels automatically
\`\`\``
                    }
                ]
            },
            {
                id: 'part-3',
                title: 'Risk Management – The Bedrock',
                estimatedTime: '40 min',
                chapters: [
                    {
                        id: 'ch-3-1',
                        title: 'The Golden Rules',
                        content: `### Define Risk Before Reward

Every trade plan must answer: **"How much am I willing to lose?"**

If you can't answer this, you're not ready to trade.

---

### Risk-Reward Ratio (R:R)

\`\`\`
R:R = Potential Profit : Potential Loss
\`\`\`

**Example:**
- Buy at $100
- Take-Profit: $110 (+$10)
- Stop-Loss: $97 (-$3)
- **R:R = 3.33:1** ✅

> 🎯 A trader with 40% win rate but 2:1 R:R is profitable!`
                    },
                    {
                        id: 'ch-3-2',
                        title: 'The 1% Rule & Position Sizing',
                        content: `### The 1% (or 2%) Rule

Never risk more than a fixed percentage of your **total capital** on any single trade.

### Position Sizing Calculation

\`\`\`
Position Size = Account Risk ($) ÷ Trade Risk per Share ($)
\`\`\`

**Example:**
| Variable | Value |
|----------|-------|
| Account | $10,000 |
| Risk % | 1% |
| Account Risk | $100 |
| Entry Price | $100 |
| Stop-Loss | $97 |
| Trade Risk/Share | $3 |
| **Position Size** | **33 shares** |

**Result:** If stop at $97 hits → Lose 33 × $3 = $99 ≈ 1%

> 💎 This ensures a losing streak cannot wipe you out.`
                    }
                ]
            }
        ]
    },
    {
        id: 'zenith-score-mastery',
        title: 'Zenith Score Mastery',
        subtitle: 'The Quantifiable Edge',
        icon: '⚡',
        estimatedTime: '1h 45min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Decoding the Algorithm',
                estimatedTime: '40 min',
                chapters: [
                    {
                        id: 'ch-1-1',
                        title: 'What is the Zenith Score?',
                        content: `### The Philosophy

The Zenith Score is a **noise-filtering and signal-amplification tool.**

Core purposes:
1. **Synthesize** complex data into one actionable number
2. **Standardize** assessment across different assets
3. **Objectify** the subjective ("looks strong" → "Score: 84")

> 🎯 Think of it as a continuous report card for an asset's technical health.`
                    },
                    {
                        id: 'ch-1-2',
                        title: 'The Four Pillars',
                        content: `### Pillar 1: Momentum Strength (High Weight)

**Measures:** Rate and conviction of price move
**Inputs:** Rate of Change, ADX, Volume
**Answers:** "Is this move powerful and sustainable?"

---

### Pillar 2: Trend Consistency (High Weight)

**Measures:** How orderly price respects the trend
**Inputs:** EMA alignment, trendlines, HH/HL structure
**Answers:** "Is there a clear trend being respected?"

---

### Pillar 3: Volatility-Adjusted Signal (Medium Weight)

**Measures:** Quality of momentum vs. normal noise
**Inputs:** Bollinger Bands, ATR
**Answers:** "Is this statistically significant?"

---

### Pillar 4: Market Regime Alignment (Medium Weight)

**Measures:** Fit with broader market environment
**Inputs:** Index ADX, correlation, regime detection
**Answers:** "Is this likely to persist in current conditions?"`
                    },
                    {
                        id: 'ch-1-3',
                        title: 'The Score Scale',
                        content: `### 🔴 0-30: Red Zone (Weak/Cautionary)

- Pronounced weakness or breakdown
- **For Longs:** Warning/exit signal
- **For Shorts:** Potential setup (with confirmation)

---

### 🟡 31-69: Amber Zone (Neutral)

- Mixed or conflicting signals
- Asset consolidating or transitioning
- **Action:** PATIENCE. Avoid new entries.

---

### 🟢 70-100: Green Zone (Strong)

- Pillars aligned positively
- Strong, volume-backed momentum
- **For Longs:** Primary hunting ground
- **Scores 85+:** Exceptional strength

> ⚡ Never go long in Red, never go short in Green!`
                    },
                ]
            },
            {
                id: 'part-2',
                title: 'Platform Integration',
                estimatedTime: '35 min',
                chapters: [
                    {
                        id: 'ch-2-1',
                        title: 'Using the Scanner',
                        content: `### The Asset Scanner

Your primary research tool:

1. Set filter: **Zenith Score > 75** (for longs)
2. Set filter: **Zenith Score < 25** (for shorts)
3. Scan your watchlist or entire market
4. Surface strongest/weakest instantly

> 💡 This saves hours of manual chart review.`
                    },
                    {
                        id: 'ch-2-2',
                        title: 'The Art of Confluence',
                        content: `### High Zenith Score + Technical Confirmation = Edge

**The Ideal Long Setup:**
- ✅ Zenith Score: 82 (Green Zone)
- ✅ Breakout above key resistance
- ✅ Volume 150% above average
- ✅ Price above rising 50 & 200 EMA
- ✅ Triangle pattern breakout

**The Golden Rule:**

> 🎯 The Zenith Score provides the **fuel**; the chart provides the **map and trigger**.`
                    }
                ]
            },
            {
                id: 'part-3',
                title: 'Advanced Interpretation',
                estimatedTime: '30 min',
                chapters: [
                    {
                        id: 'ch-3-1',
                        title: 'Divergences – The Ultimate Warning',
                        content: `### Bearish Divergence

**Price makes NEW HIGH** but **Score makes LOWER HIGH**

\`\`\`
Price High #1: Score 88
Price High #2: Score 78  ← DIVERGENCE!
\`\`\`

⚠️ Weakening momentum despite higher prices = Potential reversal

**Action:** Take profits, tighten stops, prepare for shorts

---

### Bullish Divergence

**Price makes NEW LOW** but **Score makes HIGHER LOW**

\`\`\`
Price Low #1: Score 22
Price Low #2: Score 35  ← DIVERGENCE!
\`\`\`

✅ Selling pressure waning = Potential bottom

**Action:** Watch for bullish patterns to confirm longs`
                    }
                ]
            }
        ]
    },
    {
        id: 'technical-analysis',
        title: 'Technical Analysis',
        subtitle: 'The Language of the Market',
        icon: '📈',
        estimatedTime: '3h 50min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Reading Price Action',
                estimatedTime: '60 min',
                chapters: [
                    {
                        id: 'ch-1-1',
                        title: 'Candlestick Anatomy',
                        content: `### The Building Block

Each candle tells a story of bulls vs. bears.

**Body:**
- 🟢 Green: Close > Open (Bullish)
- 🔴 Red: Close < Open (Bearish)

**Wicks:**
- Upper: Price rejected downward
- Lower: Price found support

---

### Key Single-Candle Patterns

**Doji** (Indecision)
\`\`\`
    |
   ===
    |
Open ≈ Close = Equilibrium
\`\`\`

**Hammer** (Bullish Reversal)
\`\`\`
   ===
    |
    |
Long lower wick in downtrend
\`\`\`

**Shooting Star** (Bearish Reversal)
\`\`\`
    |
    |
   ===
Long upper wick in uptrend
\`\`\``
                    },
                    {
                        id: 'ch-1-2',
                        title: 'Support, Resistance & Trend',
                        content: `### Support

Price level where **buying** overcomes selling.
- Acts as a "floor"
- Area of demand

### Resistance

Price level where **selling** overcomes buying.
- Acts as a "ceiling"
- Area of supply

> 🔄 **Role Reversal:** Broken support → New resistance (and vice versa)

---

### Trend Structure

| Uptrend | Downtrend |
|---------|-----------|
| Higher Highs (HH) | Lower Highs (LH) |
| Higher Lows (HL) | Lower Lows (LL) |

> 🎯 **"The trend is your friend until the bend at the end."**`
                    },
                    {
                        id: 'ch-1-3',
                        title: 'Volume – The Truth-Teller',
                        content: `### Volume Confirms Price

| Scenario | Meaning |
|----------|---------|
| Breakout + High Volume | ✅ Genuine, likely sustained |
| Breakout + Low Volume | ⚠️ Suspect, prone to failure |
| Volume Climax | Potential exhaustion/reversal |

> 📊 **Price = What happened; Volume = Why and how much force**`
                    }
                ]
            },
            {
                id: 'part-2',
                title: 'Chart Patterns',
                estimatedTime: '70 min',
                chapters: [
                    {
                        id: 'ch-2-1',
                        title: 'Reversal Patterns',
                        content: `### Head and Shoulders (Bearish)

\`\`\`
      Head
       /\\
      /  \\
     /    \\
LS /      \\ RS
  /        \\
 ~~~~~~~~~~~~~ Neckline
\`\`\`

- Left Shoulder → Head → Right Shoulder
- Break below neckline = Reversal confirmed
- Target = Head-to-neckline distance projected down

---

### Double Top ('M' - Bearish)

\`\`\`
  /\\    /\\
 /  \\  /  \\
/    \\/    \\
       ↓
    Breakdown
\`\`\`

Two failed attempts at resistance.

---

### Inverse patterns = Bullish equivalents`
                    },
                    {
                        id: 'ch-2-2',
                        title: 'Continuation Patterns',
                        content: `### Triangles

| Type | Structure | Bias |
|------|-----------|------|
| Symmetrical | Converging | Neutral |
| Ascending | Flat top, rising bottom | Bullish |
| Descending | Flat bottom, falling top | Bearish |

---

### Flags & Pennants

Sharp move → Brief pause → Continuation

\`\`\`
    |
    |  ═══╗
    | ═══╝
    | ↑ Flagpole
\`\`\`

**Target:** Flagpole length projected from breakout`
                    }
                ]
            },
            {
                id: 'part-3',
                title: 'Technical Indicators',
                estimatedTime: '70 min',
                chapters: [
                    {
                        id: 'ch-3-1',
                        title: 'Moving Averages',
                        content: `### Types

- **SMA:** Simple average
- **EMA:** Weighted toward recent prices

### Key Signals

**Trend Direction:**
- Price above rising MA = Uptrend
- Price below falling MA = Downtrend

**Dynamic S/R:** Price reacts at 50, 100, 200 MAs

**Crossovers:**
- 🟢 **Golden Cross:** 50 crosses ABOVE 200 = Bullish
- 🔴 **Death Cross:** 50 crosses BELOW 200 = Bearish`
                    },
                    {
                        id: 'ch-3-2',
                        title: 'RSI & MACD',
                        content: `### RSI (Relative Strength Index)

Scale: 0-100

| Zone | Level | Meaning |
|------|-------|---------|
| Overbought | >70 | May pullback |
| Oversold | <30 | May bounce |

⚠️ Can stay extreme in strong trends!

---

### MACD

Components:
- **MACD Line:** 12 EMA - 26 EMA
- **Signal Line:** 9 EMA of MACD
- **Histogram:** Difference

**Signals:**
- MACD crosses ABOVE signal = Bullish
- MACD crosses BELOW signal = Bearish`
                    },
                    {
                        id: 'ch-3-3',
                        title: 'Confluence & Divergence',
                        content: `### Confluence = Multiple signals aligning

\`\`\`
✅ Breakout from pattern
✅ Above key MAs
✅ High volume
✅ RSI healthy (not overbought)
✅ Zenith Score 80+
─────────────────
= HIGH-PROBABILITY SETUP
\`\`\`

---

### Divergence = Hidden warning

| Type | Price | Indicator | Signal |
|------|-------|-----------|--------|
| Bearish | New High | Lower High | ⚠️ Reversal coming |
| Bullish | New Low | Higher Low | ✅ Bottom forming |`
                    }
                ]
            }
        ]
    },
    {
        id: 'risk-management-pro',
        title: 'Risk Management Pro',
        subtitle: 'The Art of Survival',
        icon: '🛡️',
        estimatedTime: '2h 20min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'Advanced Position Sizing',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'ch-1-1',
                        title: 'Beyond Fixed Percentage',
                        content: `### The Problem with 1% Rule

It's a great start, but simplistic:
- Assumes all setups are equal quality
- Doesn't scale with your edge

> 🎯 Why risk the same on a "B-grade" setup as an "A-grade" one?`
                    },
                    {
                        id: 'ch-1-2',
                        title: 'Volatility-Adjusted Sizing',
                        content: `### Using ATR (Average True Range)

ATR measures normal volatility over 14 periods.

**The Method:**

\`\`\`
Position Size = Account Risk ($) ÷ (ATR Multiplier × ATR Value)
\`\`\`

**Example:**
| Variable | Value |
|----------|-------|
| Account Risk | $100 |
| ATR(14) | $2.50 |
| Multiplier | 1.5 |
| Stop Distance | $3.75 |
| **Position** | **26 shares** |

> This respects the asset's normal noise!`
                    }
                ]
            },
            {
                id: 'part-2',
                title: 'Strategic Stop Placement',
                estimatedTime: '40 min',
                chapters: [
                    {
                        id: 'ch-2-1',
                        title: 'Technical Stop Methods',
                        content: `### 1. Support/Resistance Breach
- Long: Stop just BELOW support
- Short: Stop just ABOVE resistance

### 2. Moving Average Violation
- Close below key EMA = Invalid

### 3. ATR-Based
- Stop at Entry ± (1.5 × ATR)

### 4. Pattern-Based
- H&S Short: Above right shoulder
- Triangle Long: Below recent swing low

### 5. Time Stop
- No movement in 3-5 days = Exit
- Your timing was wrong`
                    },
                    {
                        id: 'ch-2-2',
                        title: 'Trailing Stop Strategies',
                        content: `### Methods to Lock Profits

**Parabolic SAR:** Dynamic dots that accelerate

**Chandelier Exit:** 3 × ATR below highest high

**MA Trail:** Exit when price closes below 21 EMA

**Swing Trail:** Move stop below each Higher Low

> 🎯 Let winners run, but protect gains!`
                    }
                ]
            },
            {
                id: 'part-3',
                title: 'Portfolio-Level Risk',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'ch-3-1',
                        title: 'Correlation & Concentration',
                        content: `### The Mistake

5 long positions, all tech stocks = NOT diversified

If tech crashes, ALL fall together.

### The Solution

1. **Asset Class Diversification**
   - Stocks, Forex, Crypto, Commodities

2. **Strategy Diversification**
   - Trend-following + Mean-reversion

3. **Correlation Analysis**
   - Check that holdings don't move in lockstep`
                    },
                    {
                        id: 'ch-3-2',
                        title: 'Managing Drawdowns',
                        content: `### The Math is Brutal

| Drawdown | Return Needed to Recover |
|----------|-------------------------|
| -10% | +11% |
| -20% | +25% |
| -50% | +100% |

### The Protocol

| Drawdown | Action |
|----------|--------|
| -10% | Reduce size 50%, re-evaluate |
| -15% | STOP. Full review. |
| -20% | Mandatory 2-week break |

> 🚫 NEVER "trade to get back to even"`
                    }
                ]
            }
        ]
    },
    {
        id: 'trading-psychology',
        title: 'Trading Psychology',
        subtitle: 'Mastering the Inner Game',
        icon: '🧠',
        estimatedTime: '2h 30min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'The Enemy Within',
                estimatedTime: '60 min',
                chapters: [
                    {
                        id: 'ch-1-1',
                        title: 'Hope, Fear, and Greed',
                        content: `### The Triad of Destruction

**Greed (The Overreach)**
- Adding beyond your plan
- Refusing to take profits
- Chasing parabolic moves
- ✅ **Antidote:** Pre-defined profit rules

**Fear (The Paralyzer)**
- FOMO: Jumping after the move
- Moving stop wider "just in case"
- ✅ **Antidote:** Trust your process

**Hope (The Fantasy)**
- Holding losers beyond your stop
- "It will come back"
- ✅ **Antidote:** Replace hope with confirmation`
                    },
                    {
                        id: 'ch-1-2',
                        title: 'Cognitive Biases',
                        content: `### Confirmation Bias

You seek info that confirms your belief.

**Defense:** Actively seek DISconfirming evidence.

---

### Loss Aversion

Pain of losing $100 = 2.5× pleasure of gaining $100

Leads to:
- Holding losers too long
- Selling winners too early

**Defense:** Focus on process, not single trade P&L.

---

### Overconfidence

After wins, you believe you're infallible.

**Defense:** Maintain a humility log. Skill vs. luck?

---

### Recency Bias

Overweighting recent events.

**Defense:** Zoom out. Follow your rules.`
                    }
                ]
            },
            {
                id: 'part-2',
                title: 'The Professional Mindset',
                estimatedTime: '60 min',
                chapters: [
                    {
                        id: 'ch-2-1',
                        title: 'Process vs. Outcome',
                        content: `### The Amateur

Obsessed with: "Did I make money?"

Emotional rollercoaster tied to daily P&L.

### The Professional

Obsessed with: "Did I follow my plan?"

A losing trade with perfect process = **Good loss**

---

### How to Cultivate Process Focus

1. Define your edge in writing
2. Daily question: "Did I execute my plan?"
3. Separate trading from screen-watching`
                    },
                    {
                        id: 'ch-2-2',
                        title: 'The Four Pillars of Resilience',
                        content: `### 1. Self-Awareness (The Observer)

Notice your emotional state in real-time.
"I am feeling FOMO right now."

### 2. Detachment (The Scientist)

Each trade = Hypothesis
If invalidated, exit and analyze.

### 3. Patience (The Sniper)

Wait for A+ setups.
"If in doubt, stay out."

### 4. Consistency (The Machine)

Execute the same way, every time.
Your plan is your algorithm.`
                    }
                ]
            },
            {
                id: 'part-3',
                title: 'Practical Tools',
                estimatedTime: '30 min',
                chapters: [
                    {
                        id: 'ch-3-1',
                        title: 'The Pressure Gauge',
                        content: `### Rate yourself 1-10 before trading

| Range | State | Action |
|-------|-------|--------|
| 1-3 | Cold/Bored | Risk of overtrading |
| **4-7** | **Ideal Zone** | **Trade permitted** |
| 8-10 | Hot/Emotional | STOP. Close platform. |

### Cool-Off Rules

| Trigger | Action |
|---------|--------|
| 2 consecutive losses | Done for the day |
| Major news event | Wait 30-60 min |
| Pressure Gauge 8+ | Walk away |`
                    },
                    {
                        id: 'ch-3-2',
                        title: 'Daily Rituals',
                        content: `### Pre-Market (10-15 min)

1. **Mental:** Review principles, meditate 5 min
2. **Strategic:** Check market context, watchlists
3. **Affirmation:** "I will be patient and disciplined"

### Post-Market (Review)

1. Journal every trade with screenshots
2. Did I follow my plan?
3. Was analysis correct?
4. Emotional state impact?

### Weekly/Monthly

Analyze your data:
- Actual win rate
- Actual R:R
- Best performing setups`
                    }
                ]
            }
        ]
    },
    {
        id: 'defi-deep-dive',
        title: 'DeFi Deep Dive',
        subtitle: 'Architecting the Future of Finance',
        icon: '🔮',
        estimatedTime: '3h 20min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'The DeFi Foundation',
                estimatedTime: '70 min',
                chapters: [
                    {
                        id: 'ch-1-1',
                        title: 'Blockchain & Smart Contracts',
                        content: `### Blockchain Properties for DeFi

- **Decentralization:** No single controller
- **Transparency:** Public, verifiable transactions
- **Immutability:** Cannot be altered
- **Settlement Finality:** Confirmed = permanent

### Smart Contracts

Self-executing "if-then" code with real value.

\`\`\`
IF User deposits 1 ETH as collateral
THEN They may borrow 70% value in stablecoin

IF Collateral falls below 110%
THEN Contract auto-liquidates
\`\`\`

> 🔗 Code is law. No intermediaries needed.`
                    },
                    {
                        id: 'ch-1-2',
                        title: 'DEXs & AMMs',
                        content: `### Automated Market Makers

Unlike order books, AMMs use math:

\`\`\`
x × y = k (Constant Product)
\`\`\`

Where:
- x, y = Token quantities in pool
- k = Constant

**Buying Token A:**
- Increases y, decreases x
- Price of A rises per formula

### Liquidity Providers (LPs)

Deposit paired assets (50/50) to enable trading.

**Earn:** Trading fees from pool

**Risk:** Impermanent Loss (IL)
- Loss when deposited assets diverge in price`
                    },
                    {
                        id: 'ch-1-3',
                        title: 'Lending & Borrowing',
                        content: `### The Mechanism (Aave, Compound)

1. **Suppliers** deposit assets → Receive aToken
2. **Borrowers** over-collateralize → Get loan
3. **Health Factor** monitored
4. If collateral drops too low → **Liquidation**

### Interest Rates

Algorithmic based on utilization:

| Utilization | Rate |
|-------------|------|
| Low | Low rates |
| High | High rates (attract suppliers) |`
                    }
                ]
            },
            {
                id: 'part-2',
                title: 'Advanced DeFi Stack',
                estimatedTime: '80 min',
                chapters: [
                    {
                        id: 'ch-2-1',
                        title: 'Composability – Money Legos',
                        content: `### DeFi's Superpower

Open protocols stack like Legos:

\`\`\`
1. Deposit ETH to Aave (collateral)
      ↓
2. Borrow USDC
      ↓
3. Add to Curve USDC/DAI pool
      ↓
4. Stake LP token for CRV rewards
      ↓
5. Lock CRV for veCRV (boost + fees)
\`\`\`

**Result:** Multiple yield layers on same capital

> ⚠️ This is leveraged yield farming = EXTREME RISK`
                    },
                    {
                        id: 'ch-2-2',
                        title: 'Layer 2 & Cross-Chain',
                        content: `### Layer 2 Solutions

Process off-chain, post to Ethereum:

**Optimistic Rollups (Arbitrum, Optimism)**
- Assume valid, challenge period
- Fast, cheap, general purpose

**ZK-Rollups (zkSync, StarkNet)**
- Cryptographic validity proofs
- Superior security & finality

### Cross-Chain Bridges

Move assets between chains.

> ⚠️ **MAJOR RISK:** Bridges are complex, prime hack targets`
                    }
                ]
            },
            {
                id: 'part-3',
                title: 'Risk & Strategy',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'ch-3-1',
                        title: 'The DeFi Risk Matrix',
                        content: `### Unique DeFi Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| Smart Contract | Bugs/exploits | Use audited protocols, insurance |
| Oracle | Bad price data | Robust oracle networks |
| Governance | Malicious proposals | Decentralized control |
| Regulatory | Legal uncertainty | Stay informed |

> 🛡️ Consider insurance: Nexus Mutual, InsurAce`
                    },
                    {
                        id: 'ch-3-2',
                        title: 'DeFi Strategy Tiers',
                        content: `### Tier 1: Passive & Secure

- Supply stablecoins to Aave/Compound
- Curve stablecoin pools
- **Goal:** 4-8% APY, low risk

### Tier 2: Active Optimization

- Volatile pair LPing
- Multi-protocol farming
- **Goal:** 10-30% APY, active management

### Tier 3: Advanced & Speculative

- Leveraged yield farming
- Delta-neutral strategies
- Early protocol launches
- **Goal:** Max returns, HIGH RISK

> ⚠️ Tier 3 = Possible total loss from exploits or liquidation`
                    }
                ]
            }
        ]
    },
    // === NEW COURSES (14 Total) ===

    // -- Market Analyst --
    {
        id: "valuation-basics",
        title: "Valuation 101: DCF & Multiples",
        subtitle: "Master discounted cash flow analysis and valuation multiples",
        icon: "📊",
        estimatedTime: "1h 30min",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "Fundamentals & Concepts",
                estimatedTime: "30min",
                chapters: [
                    { id: "dcf-basics", title: "Discounted Cash Flow Fundamentals", content: "### DCF Basics\n\nDCF value = Sum of discounted future cash flows.\n\nKey inputs: Growth rate, WACC, Terminal Value." },
                    { id: "multiples-analysis", title: "Comparable Company Analysis", content: "### Relative Valuation\n\nCompare P/E, EV/EBITDA against peer group." },
                    { id: "real-world-valuation", title: "Real-World Valuation Cases", content: "### Case Study\n\nValuing AAPL vs. early stage tech." }
                ]
            },
            {
                id: "part-2",
                title: "Practical Applications",
                estimatedTime: "30min",
                chapters: [
                    { id: "dcf-model", title: "Building a DCF Model", content: "### Step-by-Step DCF\n\n1. Forecast FCF\n2. Calculate WACC\n3. Determine Terminal Value\n4. Discount back" },
                    { id: "sensitivity", title: "Sensitivity Analysis", content: "### Stress Testing\n\nWhat if growth is 2% lower? A good model shows ranges, not points." }
                ]
            },
            {
                id: "part-3",
                title: "Advanced Valuation",
                estimatedTime: "30min",
                chapters: [
                    { id: "sotp", title: "Sum of the Parts", content: "### Conglomerates\n\nValuing business units separately often reveals hidden value." }
                ]
            }
        ]
    },
    {
        id: "financial-modeling",
        title: "Excel for Finance Pros",
        subtitle: "Advanced Excel techniques and best practices",
        icon: "📈",
        estimatedTime: "2h",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "Excel Foundations",
                estimatedTime: "40min",
                chapters: [
                    { id: "excel-advanced", title: "Advanced Excel Functions", content: "### Key Functions\n\nXLOOKUP, INDEX-MATCH, SUMIFS, OFFSET." },
                    { id: "shortcuts", title: "Keyboard Shortcuts", content: "### Speed\n\nNever touch the mouse. Ctrl+Arrows, Alt-sequences." }
                ]
            },
            {
                id: "part-2",
                title: "3-Statement Models",
                estimatedTime: "50min",
                chapters: [
                    { id: "financial-model", title: "Building a 3-Statement Model", content: "### Linking Statements\n\nNet Income flows to Retained Earnings. D&A added back on SCF." },
                    { id: "model-auditing", title: "Model Auditing", content: "### Error Checking\n\nBalance checks (Assets = Liab + Equity). Formatting standards." }
                ]
            }
        ]
    },
    {
        id: "macro-economics",
        title: "Central Banks & Interest Rates", // Aligned with paths-content for Market Analyst
        subtitle: "How monetary policy affects markets",
        icon: "🏛️",
        estimatedTime: "1h 30min",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "The Central Bank Toolkit",
                estimatedTime: "30min",
                chapters: [
                    { id: "cb-tools", title: "Rates & QE", content: "### Policy Tools\n\n1. Interest Rates (Price of money)\n2. Balance Sheet (Quantity of money)\n3. Forwards Guidance" },
                    { id: "fomc", title: "Trading FOMC", content: "### The Fed Day Playbook\n\nInterpreting the 'Dot Plot' and press conference tone." }
                ]
            }
        ]
    },
    {
        id: "investment-writing",
        title: "Structuring the Investment Memo",
        subtitle: "Professional research report writing",
        icon: "📝",
        estimatedTime: "1h",
        difficulty: "beginner",
        parts: [
            {
                id: "part-1",
                title: "Memo Architecture",
                estimatedTime: "30min",
                chapters: [
                    { id: "thesis", title: "The Variant View", content: "### What is your edge?\n\nYou must have a view different from the market price." },
                    { id: "risks", title: "Pre-Mortem", content: "### Kill Your Thesis\n\nList the top 3 reasons you could be wrong." }
                ]
            }
        ]
    },

    // -- Data Research --
    {
        id: "stat-arb-basics",
        title: "Mean Reversion & Z-Scores",
        subtitle: "Statistical arbitrage basics",
        icon: "🧮",
        estimatedTime: "2h",
        difficulty: "advanced",
        parts: [
            {
                id: "part-1",
                title: "Statistical Concepts",
                estimatedTime: "40min",
                chapters: [
                    { id: "mean-rev", title: "Mean Reversion Theory", content: "### Rubber Band Effect\n\nPrice extended too far from average snaps back." },
                    { id: "z-score", title: "Calculating Z-Scores", content: "### Standardization\n\n(Price - Mean) / StdDev. >2 is significant." }
                ]
            }
        ]
    },
    {
        id: "algo-python-intro",
        title: "Backtesting Frameworks",
        subtitle: "Python backtesting with backtrader or vectorbt",
        icon: "🐍",
        estimatedTime: "2h 30min",
        difficulty: "advanced",
        parts: [
            {
                id: "part-1",
                title: "Python for Finance",
                estimatedTime: "50min",
                chapters: [
                    { id: "pandas", title: "Pandas for Timeseries", content: "### DataFrames\n\nResampling, rolling windows, shifting data." },
                    { id: "vectorbt", title: "Vectorized Backtesting", content: "### Speed\n\nTesting thousands of parameters in seconds using arrays." }
                ]
            }
        ]
    },
    {
        id: "market-microstructure",
        title: "Order Books & Liquidity",
        subtitle: "Market microstructure and reading Level 2",
        icon: "🔬",
        estimatedTime: "1h 45min",
        difficulty: "advanced",
        parts: [
            {
                id: "part-1",
                title: "Microstructure Basics",
                estimatedTime: "40min",
                chapters: [
                    { id: "order-book", title: "Limit Order Book", content: "### Anatomy of the Book\n\nBids, Asks, Depth. The spread is the cost of immediacy." },
                    { id: "market-impact", title: "Market Impact", content: "### Slippage\n\nHow large orders move the price against you." }
                ]
            }
        ]
    },

    // -- Systematic Trading --
    {
        id: "system-design",
        title: "Building a Trading Plan",
        subtitle: "Systematic strategy development",
        icon: "⚙️",
        estimatedTime: "1h 15min",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "System Components",
                estimatedTime: "30min",
                chapters: [
                    { id: "rules", title: "Definitive Rules", content: "### No Discretion\n\nEntry, Exit, Size must be mathematically defined." },
                    { id: "expectancy", title: "Positive Expectancy", content: "### The Math\n\n(Win% * AvgWin) - (Loss% * AvgLoss) > 0." }
                ]
            }
        ]
    },
    {
        id: "backtest-rigor",
        title: "Avoiding Overfitting",
        subtitle: "Walk-forward analysis",
        icon: "🧪",
        estimatedTime: "1h 30min",
        difficulty: "advanced",
        parts: [
            {
                id: "part-1",
                title: "Robustness Testing",
                estimatedTime: "40min",
                chapters: [
                    { id: "overfitting", title: "The Curve Fitting Trap", content: "### Memorizing Noise\n\nA strategy that fits past data perfectly usually fails live." },
                    { id: "walk-forward", title: "Walk-Forward Analysis", content: "### Optimize -> Test -> Roll\n\nTrain on 2020, Test on 2021. Train on 2021, Test on 2022." }
                ]
            }
        ]
    },
    {
        id: "modern-portfolio-theory",
        title: "Correlation & Diversification",
        subtitle: "MPT applications and portfolio optimization",
        icon: "📊",
        estimatedTime: "1h 45min",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "MPT Basics",
                estimatedTime: "40min",
                chapters: [
                    { id: "diversification", title: "The Free Lunch", content: "### Reducing Variance\n\nCombining uncorrelated assets reduces risk without reducing return." },
                    { id: "efficient-frontier", title: "Efficient Frontier", content: "### Optimization\n\nFinding the max return for a given level of risk." }
                ]
            }
        ]
    },
    {
        id: "execution-algos",
        title: "TWAP/VWAP Strategies",
        subtitle: "Algorithmic execution strategies",
        icon: "🤖",
        estimatedTime: "1h",
        difficulty: "advanced",
        parts: [
            {
                id: "part-1",
                title: "Execution Algos",
                estimatedTime: "30min",
                chapters: [
                    { id: "vwap-algo", title: "Trading VWAP", content: "### Benchmark\n\nBuying when price is below VWAP. Institutional standard." },
                    { id: "twap", title: "TWAP Execution", content: "### Time Slicing\n\nBuying 100 shares every 5 minutes to hide size." }
                ]
            }
        ]
    },

    // -- Execution Trader --
    {
        id: "order-flow-dynamics",
        title: "Level 2 & Order Flow",
        subtitle: "Spotting institutional activity",
        icon: "🌊",
        estimatedTime: "1h 45min",
        difficulty: "advanced",
        parts: [
            {
                id: "part-1",
                title: "Reading the Tape",
                estimatedTime: "40min",
                chapters: [
                    { id: "time-sales", title: "Time & Sales", content: "### Analyzing Trades\n\nSpeed, Size, and Aggression. Green prints at Ask vs Red prints at Bid." },
                    { id: "absorption", title: "Absorption", content: "### Hidden Walls\n\nPrice hits a level, high volume trades, but price doesn't move. Ideally a limit seller absorbing buys." }
                ]
            }
        ]
    },
    {
        id: "intraday-risk-mgmt",
        title: "Position Sizing Under Fire",
        subtitle: "Intraday risk management",
        icon: "🔥",
        estimatedTime: "1h 15min",
        difficulty: "advanced",
        parts: [
            {
                id: "part-1",
                title: "Dynamic Risk",
                estimatedTime: "30min",
                chapters: [
                    { id: "daily-stop", title: "Daily Stop Limits", content: "### Circuit Breakers\n\nStop trading if down X% on the day. Preserve mental capital." },
                    { id: "sizing-vol", title: "Volatility Sizing", content: "### Adjusting Size\n\nTrade smaller in higher volatility. Risk $ amount should be constant." }
                ]
            }
        ]
    },

    // -- Macro Observer --
    {
        id: "monetary-policy",
        title: "The Fed & Global Central Banking",
        subtitle: "Central bank policy analysis",
        icon: "🏦",
        estimatedTime: "1h 45min",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "Global Central Banks",
                estimatedTime: "40min",
                chapters: [
                    { id: "fed-ecb-boj", title: " The Big Three", content: "### Fed, ECB, BOJ\n\nUnderstanding their different mandates and impact on FX markets." },
                    { id: "hawkish-dovish", title: "Hawk vs Dove", content: "### Sentiment Analysis\n\nHawks want higher rates (fear inflation). Doves want lower rates (fear unemployment)." }
                ]
            }
        ]
    },
    {
        id: "cross-asset-correlations",
        title: "How Bonds Impact Tech Stocks",
        subtitle: "Cross-asset correlations and duration",
        icon: "🔗",
        estimatedTime: "1h",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "Inter-market Analysis",
                estimatedTime: "30min",
                chapters: [
                    { id: "rates-equity", title: "Rates vs Equities", content: "### Discount Mechanism\n\nHigher rates = Lower present value of future cash flows (hits Tech hardest)." },
                    { id: "usd-commodities", title: "USD vs Commodities", content: "### Inverse Relationship\n\nStrong Dollar usually means weaker Oil/Gold." }
                ]
            }
        ]
    },
    {
        id: "geopolitics-markets",
        title: "Energy Markets & Conflict",
        subtitle: "Geopolitical risk analysis",
        icon: "🌍",
        estimatedTime: "1h 30min",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "Geopolitics",
                estimatedTime: "30min",
                chapters: [
                    { id: "supply-shock", title: "Supply Shocks", content: "### Energy Security\n\nConflicts in producer regions spike prices." },
                    { id: "safe-havens", title: "Flight to Safety", content: "### Risk Off\n\nCapital flows to US Treasuries, Gold, CHF, JPY during crises." }
                ]
            }
        ]
    },
    {
        id: "market-cycles",
        title: "The Debt Cycle",
        subtitle: "Market cycle analysis",
        icon: "🔄",
        estimatedTime: "1h 15min",
        difficulty: "intermediate",
        parts: [
            {
                id: "part-1",
                title: "Long Term Debt Cycle",
                estimatedTime: "30min",
                chapters: [
                    { id: "deleveraging", title: "Deleveraging", content: "### Ray Dalio's Framework\n\nWhen debt servicing exceeds income, a crisis occurs." },
                    { id: "late-cycle", title: "Late Cycle Signs", content: "### The Top\n\nTight labor, rising inflation, inverted yield curve." }
                ]
            }
        ]
    },
    // ========== MARKET ANALYST PATH ==========
    {
        id: 'valuation-basics',
        title: 'Valuation 101: DCF & Multiples',
        subtitle: 'Master Wall Street Valuation',
        icon: '💰',
        estimatedTime: '2h 30min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Time Value of Money',
                estimatedTime: '55 min',
                chapters: [
                    {
                        id: 'ch-1-1',
                        title: 'Why $100 Today ≠ $100 Next Year',
                        content: `# The Foundation of All Valuation

## The $10,000 Decision

Imagine you are offered two choices:
1. **$10,000 today**
2. **$10,000 one year from now**

Any rational investor chooses the money today. Here is why:

- **Opportunity Cost**: You could invest $10,000 at 5% and have $10,500 in a year
- **Inflation**: At 3% inflation, $10,000 next year buys only ~$9,700 worth of goods today
- **Risk Premium**: There is always a chance you will not receive the future payment

This is the **Time Value of Money (TVM)** principle—the foundation of all Wall Street valuation.

---

## The Discount Rate: Your Required Return

The discount rate answers: "What return do I need to justify holding this asset?"

For stocks, we use **WACC (Weighted Average Cost of Capital)**:

| Component | Formula |
|-----------|---------|
| Cost of Equity | Risk-free rate + Beta × Equity Risk Premium |
| Cost of Debt | Yield on company bonds × (1 - Tax Rate) |
| WACC | (E/V × Re) + (D/V × Rd × (1-T)) |

### 2024 Example: Apple Inc. (AAPL)

| Variable | Value | Source |
|----------|-------|--------|
| Equity (E) | $2.85 trillion | Market cap |
| Debt (D) | $111 billion | 10-K filing |
| Risk-free rate | 4.2% | 10-year Treasury |
| Beta | 1.28 | Yahoo Finance |

**Apple WACC ≈ 10.3%** — This is our discount rate for DCF.

---

## Present Value Calculation

The formula every analyst must know:

**PV = FV / (1 + r)^n**

**Practical Example**: NVIDIA expects $50 billion FCF in 2027 (3 years away). What is that worth today at 12% discount?

PV = $50B / (1.12)^3 = $50B / 1.405 = **$35.6 billion**

**Key Insight**: $50B three years away is only worth $35.6B today. The higher the discount rate, the lower the present value.

---

## Trader Insight

> "At hedge funds, we build bull, base, and bear cases with 9%, 12%, and 15% WACC respectively. The truth is usually somewhere in the range."

## Exercise

Calculate PV of $500M royalty payment in 5 years at 16% discount rate.
**Answer**: $500M / (1.16)^5 = $500M / 2.10 = **$238M**

## Common Mistake

Using the same discount rate for Tesla (Beta=1.9) as Coca-Cola (Beta=0.6). Tesla WACC should be 14-16% while KO is 7-8%.`
                    },
                    {
                        id: 'ch-1-2',
                        title: 'Building a DCF Model in Excel',
                        content: `# Step-by-Step DCF Walkthrough

## Why DCF Matters at Goldman, Morgan Stanley, and Hedge Funds

The Discounted Cash Flow model is **the centerpiece of equity research**. Every IB analyst spends their first year building DCFs for M&A deals, IPOs, and pitch books.

If you cannot build a DCF, you cannot work in finance.

---

## The Five-Step DCF Framework

### Step 1: Download Financial Statements

Go to **SEC.gov** → Enter ticker → Find **10-K** (annual) or **10-Q** (quarterly)

For Tesla (TSLA) Q4 2023:

| Metric | 2023 Actual |
|--------|-------------|
| Revenue | $96.8B |
| Operating Margin | 9.2% |
| Depreciation | $4.2B |
| CapEx | $8.9B |

### Step 2: Project Future Revenues

| Year | Revenue | Growth |
|------|---------|--------|
| 2023A | $96.8B | -- |
| 2024E | $112.3B | 16% |
| 2025E | $134.7B | 20% |
| 2026E | $155.0B | 15% |
| 2027E | $174.1B | 12% |
| 2028E | $191.5B | 10% |

### Step 3: Calculate Free Cash Flow

**FCF = EBIT × (1 - Tax Rate) + Depreciation - CapEx**

| Year | EBIT | After-Tax | +D&A | -CapEx | FCF |
|------|------|-----------|------|--------|-----|
| 2024E | $11.2B | $8.8B | $5B | $10B | $3.8B |
| 2025E | $14.8B | $11.7B | $5.5B | $11B | $6.2B |
| 2028E | $26.8B | $21.2B | $7B | $9B | $19.2B |

### Step 4: Calculate Terminal Value

**Terminal Value = FCF_Year5 × (1 + g) / (WACC - g)**

Using TSLA WACC = 11.5% and terminal growth = 3.5%:

TV = $19.2B × 1.035 / 0.08 = **$248.4 billion**

### Step 5: Discount Everything Back

| Year | FCF | Discount Factor | Present Value |
|------|-----|-----------------|---------------|
| 2024 | $3.8B | 1/1.115 | $3.4B |
| 2028 | $19.2B | 1/1.115^5 | $11.2B |
| Terminal | $248.4B | 1/1.115^5 | $145.1B |
| **Total EV** | | | **$182.4B** |

Tesla actual EV is ~$600B! This means market expects higher margins or faster growth.

---

## Excel Template

\`\`\`
Enterprise_Value = NPV(WACC, FCF_Array) + Terminal_Value / (1+WACC)^n
Share_Price = (EV - Net_Debt + Cash) / Shares_Outstanding
\`\`\`

## Common Mistake

Not stress-testing WACC sensitivity. A 2% change in WACC swings valuation 30-50%.`
                    }
                ]
            },
            {
                id: 'part-2',
                title: 'Valuation Multiples',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'ch-2-1',
                        title: 'P/E, EV/EBITDA, and P/S Explained',
                        content: `# The Three Kings of Relative Valuation

## Why Use Multiples?

While DCF gives you **intrinsic value**, multiples tell you **how the market values similar companies**.

Benefits:
- **Speed**: Calculate in seconds vs hours for DCF
- **Comparability**: Easy to compare across companies
- **Market Sentiment**: Captures what investors are willing to pay

---

## The Holy Trinity of Multiples

### 1. Price-to-Earnings (P/E)

**P/E = Stock Price / Earnings Per Share**

| Company | Price | EPS | P/E | Why |
|---------|-------|-----|-----|-----|
| NVDA | $875 | $12.96 | 67x | AI growth premium |
| AAPL | $192 | $6.43 | 30x | Mature but innovative |
| F (Ford) | $12 | $1.76 | 7x | Cyclical, low growth |

**When to Use**: Profitable companies with stable earnings.
**When NOT to Use**: Unprofitable companies (negative P/E meaningless).

---

### 2. EV/EBITDA (The Banker Favorite)

**EV/EBITDA = Enterprise Value / EBITDA**

| Company | EV ($B) | EBITDA ($B) | EV/EBITDA |
|---------|---------|-------------|-----------|
| NVDA | $2,200 | $56 | 39x |
| GOOG | $1,850 | $88 | 21x |
| META | $1,280 | $60 | 21x |

**Why Better Than P/E?**
- Ignores capital structure (debt vs equity)
- Ignores D&A (non-cash)
- Ignores tax differences across countries

---

### 3. Price-to-Sales (P/S)

**P/S = Market Cap / Total Revenue**

| Company | Market Cap | Revenue | P/S |
|---------|------------|---------|-----|
| SNOW | $60B | $3.4B | 18x |
| CRM | $270B | $34B | 8x |
| PLTR | $45B | $2.4B | 19x |

**When to Use**: High-growth, unprofitable companies (early SaaS).

---

## Sector-Specific Multiples

| Sector | Preferred Multiple | Why |
|--------|-------------------|-----|
| Tech | EV/Sales, P/E | Growth focus |
| Banks | Price/Book | Asset-based |
| REITs | Price/FFO | Cash flow focus |
| Oil & Gas | EV/EBITDAX | Exploration costs |

## Trader Insight

> "Never look at a multiple in isolation. A P/E of 50 is cheap for a company growing 100% YoY, but expensive for one growing 10%."

**Rule of Thumb**: P/E should roughly equal growth rate (PEG ratio of 1).`
                    }
                ]
            }
        ]
    },
    {
        id: 'financial-modeling',
        title: 'Excel for Finance Pros',
        subtitle: 'Financial Modeling Mastery',
        icon: '📊',
        estimatedTime: '2h 45min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Advanced Excel Functions',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'ch-1-1',
                        title: 'XLOOKUP, INDEX/MATCH & Arrays',
                        content: `# The Functions That Get You Hired

## Beyond VLOOKUP: Modern Excel for Finance

Investment banks and hedge funds expect **XLOOKUP**, **INDEX/MATCH**, and **dynamic arrays**.

---

## XLOOKUP: The VLOOKUP Killer

\`\`\`
=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])
\`\`\`

### Why It Is Superior:
1. **Looks left**: VLOOKUP only looks right
2. **Cleaner syntax**: No column index number
3. **Error handling built-in**: No need for IFERROR wrapper

### Example: Stock Data Lookup

| Ticker | Price | P/E | Mkt Cap |
|--------|-------|-----|---------|
| AAPL | $192 | 30 | $2.95T |
| NVDA | $875 | 67 | $2.15T |
| TSLA | $175 | 60 | $556B |

\`\`\`
=XLOOKUP("NVDA", A:A, C:C, "Not Found")
Returns: 67
\`\`\`

---

## INDEX/MATCH: The Analyst Classic

\`\`\`
=INDEX(return_range, MATCH(lookup_value, lookup_range, 0))
\`\`\`

### Two-Way Lookup (The Magic)

DCF sensitivity table:

|  | 8% WACC | 10% WACC | 12% WACC |
|---|---------|----------|----------|
| 2% Growth | $150 | $120 | $100 |
| 3% Growth | $180 | $145 | $118 |
| 4% Growth | $220 | $175 | $140 |

To find value at 10% WACC and 3% growth:

\`\`\`
=INDEX(B2:D4, MATCH("3% Growth", A2:A4, 0), MATCH("10% WACC", B1:D1, 0))
Returns: $145
\`\`\`

This is **the most important formula in financial modeling** for sensitivity analysis.

---

## Dynamic Arrays

### FILTER: Extract Matching Rows
\`\`\`
=FILTER(A2:D10, C2:C10>50, "None found")
\`\`\`

### SORT: Dynamic Sorting
\`\`\`
=SORT(A2:D10, 3, -1)  // Column 3, descending
\`\`\`

## Trader Insight

> "I interview 50 analyst candidates per year. If they cannot do a two-way INDEX/MATCH in under 30 seconds, the interview is over."
> — Managing Director, Citadel`
                    }
                ]
            }
        ]
    },
    {
        id: 'macro-economics',
        title: 'Central Banks & Interest Rates',
        subtitle: 'Understanding Monetary Policy',
        icon: '🏦',
        estimatedTime: '2h',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'The Federal Reserve',
                estimatedTime: '45 min',
                chapters: [
                    {
                        id: 'fed-mandate',
                        title: 'The Dual Mandate',
                        content: `# The Federal Reserve Mission

## Price Stability & Maximum Employment

The Fed has two goals:
1. **Inflation Target**: 2% annual inflation
2. **Full Employment**: ~4% unemployment

### Key Tools:
- **Federal Funds Rate**: Overnight lending rate between banks
- **Open Market Operations**: Buying/selling Treasury securities
- **Quantitative Easing/Tightening**: Large-scale asset purchases

### 2024 Context:
Fed held rates at 5.25-5.50% through most of 2024, fighting persistent inflation above 3%.

---

## Trading the Fed

| Fed Action | Stock Impact | Bond Impact |
|------------|--------------|-------------|
| Rate Hike | Typically negative | Prices fall, yields rise |
| Rate Cut | Typically positive | Prices rise, yields fall |
| Hawkish Talk | Risk-off | Yields rise |
| Dovish Talk | Risk-on | Yields fall |

### FOMC Calendar

The Fed meets 8 times per year. Mark these dates—they move markets.

**Exercise**: If CPI comes in at 4.2% vs 3.8% expected, predict:
1. Fed response (more hawkish)
2. Stock market reaction (likely down)
3. Bond yields (likely up)

## Trader Insight

> "Never fight the Fed. When Powell speaks, listen."`
                    },
                    {
                        id: 'yield-curve',
                        title: 'Yield Curve Dynamics',
                        content: `# The Yield Curve

## Normal vs Inverted

**Normal Curve**: Long rates > Short rates (healthy economy)
**Inverted Curve**: Short rates > Long rates (recession signal)

### 2023-2024 Inversion:
The 2s10s spread (10Y - 2Y Treasury) inverted in July 2022 and stayed inverted through 2024—longest inversion in history.

---

## Reading the Curve

| Shape | Meaning | Implication |
|-------|---------|-------------|
| Steep Positive | Growth expected | Risk-on |
| Flat | Uncertainty | Caution |
| Inverted | Recession coming | Risk-off |

### Historical Accuracy

Yield curve inversion has predicted every recession since 1955 with 6-18 month lead time.

---

## Trading the Yield Curve

### When Curve Inverts:
1. Reduce equity exposure gradually
2. Increase defensive sectors (utilities, staples)
3. Build cash position for opportunities

### When Curve Steepens:
1. Add cyclical exposure
2. Favor financials (banks profit from steep curves)
3. Reduce bond duration

## Trader Insight

> "Do not short immediately on inversion—recession typically follows 12-18 months later. Use the time to position."`
                    }
                ]
            }
        ]
    },
    {
        id: 'investment-writing',
        title: 'Structuring the Investment Memo',
        subtitle: 'Write Like a Hedge Fund Analyst',
        icon: '📝',
        estimatedTime: '1h 45min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'The Investment Thesis',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'exec-summary',
                        title: 'Executive Summary Framework',
                        content: `# The One-Page Investment Thesis

## Structure That Gets Read

Most decision-makers only read the first page. Make it count.

### Template:

**RECOMMENDATION**: [BUY/SELL/HOLD] [TICKER] at $[PRICE]
**TARGET PRICE**: $[TARGET] ([X]% upside/downside)
**TIME HORIZON**: [3-12 months]

**THE THESIS** (2-3 sentences):
[Company] is [mispriced/undervalued/overvalued] because [reason].
The market is missing [specific insight].
Catalyst: [what will unlock value].

**KEY METRICS**:
- Current P/E: Xx vs Industry Yy
- Revenue Growth: X% CAGR
- Free Cash Flow Yield: X%

**RISKS**: [Top 3 risks in bullet form]

---

## Real Example

**RECOMMENDATION**: BUY GOOGL at $140
**TARGET PRICE**: $180 (29% upside)
**TIME HORIZON**: 12 months

**THE THESIS**:
Google is undervalued because the market underestimates YouTube advertising recovery and Gemini AI monetization. Q1 2024 earnings will be the catalyst as ad spending rebounds and AI products launch.

**KEY METRICS**:
- P/E: 23x vs Meta 26x
- Revenue Growth: 12% vs 5% consensus
- FCF Yield: 5.2%

**RISKS**: AI competition, regulatory antitrust, ad market slowdown

## Common Mistake

Burying the recommendation. Lead with your conclusion.`
                    },
                    {
                        id: 'variant-view',
                        title: 'The Variant Perception',
                        content: `# Why You Are Right & the Market Is Wrong

## Variant View Framework

A strong thesis explains the GAP between your view and consensus:

| Element | Description |
|---------|-------------|
| Consensus View | What does the market believe? |
| Your View | What do YOU believe? |
| The Gap | Why is the market wrong? |
| Evidence | Data supporting your view |
| Catalyst | What will prove you right? |

---

## Example: Tesla in 2024

**Consensus**: "Tesla is losing EV market share, margins compressing"

**Variant View**: "FSD licensing revenue is underestimated; robotaxi announcement Q4 will re-rate the stock"

**Evidence**:
- FSD v12 adoption rates up 40% QoQ
- Regulatory progress in California
- Recent hires from Waymo

**Catalyst**: Robotaxi unveil event in August 2024

---

## Building Your Edge

### Information Advantage
- Primary research (surveys, channel checks)
- Expert network calls
- Satellite data, web scraping

### Analytical Advantage
- Better financial models
- Industry expertise
- Historical pattern recognition

### Behavioral Advantage
- Patience when others panic
- Contrarian positioning
- Disciplined process

## Trader Insight

> "If you cannot articulate why the market is wrong, you do not have an edge—you are just betting."`
                    }
                ]
            }
        ]
    },
    // ========== DATA/RESEARCH PATH ==========
    {
        id: 'stat-arb-basics',
        title: 'Mean Reversion & Z-Scores',
        subtitle: 'Statistical Trading Foundations',
        icon: '📊',
        estimatedTime: '2h',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'Mean Reversion Theory',
                estimatedTime: '60 min',
                chapters: [
                    {
                        id: 'z-score-calc',
                        title: 'Z-Score Trading',
                        content: `# Statistical Arbitrage Basics

## The Z-Score Formula

Z = (Price - Mean) / Standard_Deviation

**Trading Rules**:
- Z > +2.0 → Overbought (Short signal)
- Z < -2.0 → Oversold (Long signal)
- Z between -1 and +1 → Neutral zone

---

## Python Implementation

\`\`\`python
import pandas as pd
import numpy as np

def calculate_z_score(prices, window=20):
    mean = prices.rolling(window).mean()
    std = prices.rolling(window).std()
    z_score = (prices - mean) / std
    return z_score

# Trading signal
signal = np.where(z_score > 2, -1,  # Short
         np.where(z_score < -2, 1,   # Long
                  0))                 # Neutral
\`\`\`

---

## Practical Example

**Calculate Z-score for AAPL**:
- Current Price: $192
- 20-day Mean: $185
- 20-day Std Dev: $8

Z = (192 - 185) / 8 = **0.875**

**Interpretation**: Z = 0.875 is in neutral zone. No trade signal.

---

## Entry/Exit Rules

| Z-Score | Action | Position |
|---------|--------|----------|
| Z < -2.5 | Strong Buy | Max Long |
| Z < -2.0 | Buy | Long |
| -1 < Z < 1 | No Action | Neutral |
| Z > 2.0 | Sell | Short |
| Z > 2.5 | Strong Sell | Max Short |
| Z crosses 0 | Exit | Close |

## Exercise

Stock XYZ: Price=$50, Mean=$55, Std=$4. Calculate Z and action.
**Answer**: Z = (50-55)/4 = -1.25. Near buy zone but not yet triggered.`
                    },
                    {
                        id: 'pairs-trading',
                        title: 'Pairs Trading Strategy',
                        content: `# Pairs Trading

## Finding Cointegrated Pairs

Pairs trading exploits mean reversion between related assets:

1. **Find correlated stocks** (AAPL/MSFT, XOM/CVX, KO/PEP)
2. **Test for cointegration** (Engle-Granger or Johansen test)
3. **Trade the spread** when it diverges

---

## Spread Calculation

\`\`\`python
# Calculate hedge ratio using OLS regression
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(price_B.values.reshape(-1,1), price_A.values)
hedge_ratio = model.coef_[0]

# Calculate spread
spread = price_A - (hedge_ratio * price_B)
z_spread = (spread - spread.mean()) / spread.std()
\`\`\`

---

## Entry/Exit Rules

| Signal | Action |
|--------|--------|
| Z < -2 | Long spread (buy A, short B) |
| Z > +2 | Short spread (short A, buy B) |
| Z crosses 0 | Exit all |
| Z > 3 or < -3 | Stop loss |

### 2024 Example: KO/PEP

The Coca-Cola/Pepsi spread historically mean-reverts within 2-3 weeks when Z exceeds plus or minus 2.

---

## Risk Management

**Stop Loss**: Exit if spread moves to Z = 3 (or -3)
**Position Sizing**: Max 5% portfolio per pair
**Holding Period**: Typical reversion in 5-15 days

## Common Mistake

Assuming correlation equals cointegration. Two assets can be highly correlated but NOT cointegrated.`
                    }
                ]
            }
        ]
    },
    {
        id: 'risk-management-pro',
        title: 'VaR & Expected Shortfall',
        subtitle: 'Quantitative Risk Metrics',
        icon: '🛡️',
        estimatedTime: '2h 20min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'Value at Risk',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'var-methods',
                        title: 'VaR Calculation Methods',
                        content: `# Value at Risk (VaR)

## Three Calculation Methods

### 1. Parametric VaR (Variance-Covariance)

Assumes normal distribution of returns.

**Formula**: VaR = Portfolio_Value × Z_score × σ × sqrt(t)

| Confidence | Z-Score |
|------------|---------|
| 95% | 1.645 |
| 99% | 2.326 |
| 99.9% | 3.090 |

**Example**: $1M portfolio, daily σ = 2%, 95% 1-day VaR:
VaR = $1,000,000 × 1.645 × 0.02 = **$32,900**

---

### 2. Historical VaR

Use actual historical returns, no distribution assumption.

**Process**:
1. Collect last 100 daily returns
2. Sort from worst to best
3. 95% VaR = 5th worst loss

**Example**: Worst 5 losses: -5.2%, -4.8%, -4.5%, -4.2%, -4.0%
95% VaR = **4.0%** of portfolio

---

### 3. Monte Carlo VaR

Simulate thousands of scenarios.

**Process**:
1. Generate 10,000 random return scenarios
2. Calculate portfolio value for each
3. Take 5th percentile as 95% VaR

---

## Expected Shortfall (CVaR)

**Definition**: Average of losses BEYOND VaR. Better captures tail risk.

**Formula**: ES = Average(Losses | Loss > VaR)

**Example**: If losses beyond VaR are -5.2%, -4.8%, -4.5%, -4.2%:
ES = (5.2 + 4.8 + 4.5 + 4.2) / 4 = **4.68%**

## Why ES Matters

VaR tells you the minimum loss in the worst 5%. ES tells you the AVERAGE loss in that tail.

## Trader Insight

> "VaR is for regulators. ES is for actual risk management."`
                    }
                ]
            }
        ]
    },
    {
        id: 'algo-python-intro',
        title: 'Backtesting Frameworks',
        subtitle: 'Build & Test Trading Systems',
        icon: '🐍',
        estimatedTime: '2h 30min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'Backtesting Fundamentals',
                estimatedTime: '70 min',
                chapters: [
                    {
                        id: 'backtest-pitfalls',
                        title: 'Avoiding Common Biases',
                        content: `# Backtesting Done Right

## The 5 Cardinal Sins

### 1. Look-Ahead Bias
Using future data to make past decisions.

**Wrong**: signal = ma_fast > ma_slow (uses current bar)
**Right**: signal = ma_fast.shift(1) > ma_slow.shift(1)

### 2. Survivorship Bias
Only testing on stocks that still exist.

**Fix**: Use point-in-time datasets that include delisted companies.

### 3. Overfitting
Optimizing until it works on history but fails live.

**Signs**:
- Too many parameters (>5)
- Perfect equity curve
- Fails out-of-sample

### 4. Ignoring Transaction Costs

**Fix**: Include minimum 0.1% per trade (0.05% each way)

### 5. Ignoring Slippage

**Fix**: Assume 1-2 ticks slippage per trade

---

## Proper Signal Generation

\`\`\`python
# WRONG - look-ahead bias
df['signal'] = df['ma_fast'] > df['ma_slow']

# CORRECT - no look-ahead
df['signal'] = df['ma_fast'].shift(1) > df['ma_slow'].shift(1)

# Apply returns
df['strategy_returns'] = df['signal'] * df['price'].pct_change()

# Deduct costs
df['strategy_returns'] = df['strategy_returns'] - 0.001  # 10 bps cost
\`\`\`

## Key Metric

Sharpe Ratio > 1.5 in-sample often degrades to < 1.0 live. Expect 50% degradation.`
                    },
                    {
                        id: 'walk-forward',
                        title: 'Walk-Forward Analysis',
                        content: `# Walk-Forward Optimization

## The Process

Walk-forward mimics real trading by periodically re-optimizing:

1. **Split data**: 70% train, 30% test (rolling windows)
2. **Optimize on train window**
3. **Test on unseen data**
4. **Roll forward and repeat**

---

## Python Implementation

\`\`\`python
results = []
train_size = 252  # 1 year
test_size = 63    # 3 months
step = 21         # Roll monthly

for i in range(0, len(data) - train_size - test_size, step):
    train = data[i:i + train_size]
    test = data[i + train_size:i + train_size + test_size]
    
    # Optimize on training data
    best_params = optimize(train)  # Find best MA lengths
    
    # Test on out-of-sample
    performance = backtest(test, best_params)
    results.append(performance)

# Aggregate results
avg_sharpe = np.mean([r['sharpe'] for r in results])
avg_return = np.mean([r['return'] for r in results])
\`\`\`

---

## Interpreting Results

| Walk-Forward Sharpe | Interpretation |
|---------------------|----------------|
| > 1.0 | Likely robust |
| 0.5 - 1.0 | Promising but needs work |
| < 0.5 | Likely curve-fitted |

## Rule

If walk-forward Sharpe is less than 50% of in-sample Sharpe, strategy is overfit.`
                    }
                ]
            }
        ]
    },
    {
        id: 'market-microstructure',
        title: 'Order Books & Liquidity',
        subtitle: 'Market Microstructure',
        icon: '📈',
        estimatedTime: '1h 45min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'Order Book Dynamics',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'order-book-reading',
                        title: 'Reading the Order Book',
                        content: `# Order Book Analysis

## Level 2 Data Structure

| BIDS | | ASKS |
|------|---|------|
| $99.95 × 5,000 | | $100.05 × 3,000 |
| $99.90 × 8,000 | | $100.10 × 12,000 |
| $99.85 × 2,000 | | $100.15 × 4,000 |

---

## Key Concepts

**Bid-Ask Spread**: $100.05 - $99.95 = $0.10 (10 cents)

**Depth**: Total size at each price level

**Imbalance**: (Bid_Volume - Ask_Volume) / Total_Volume

---

## Trading Signals from Order Book

| Imbalance | Meaning | Action |
|-----------|---------|--------|
| > +60% | Heavy buying pressure | Bullish |
| < -60% | Heavy selling pressure | Bearish |
| ±20% | Balanced | Wait |

### Imbalance Calculation Example

Bid Volume: 5,000 + 8,000 + 2,000 = 15,000
Ask Volume: 3,000 + 12,000 + 4,000 = 19,000
Imbalance = (15,000 - 19,000) / 34,000 = **-11.8%**

Slight sell pressure, but not significant.

---

## Iceberg Detection

**Pattern**: Same size keeps refilling at same price

If you see 1,000 shares at $100.05 execute, then immediately 1,000 appears again at same price, there is a hidden large order (iceberg).

## Trader Insight

> "The Level 2 shows you intentions. Watch for size that keeps refreshing—that is institutional."`
                    },
                    {
                        id: 'liquidity-measures',
                        title: 'Measuring Liquidity',
                        content: `# Liquidity Metrics

## Key Measures

### 1. Bid-Ask Spread

**Formula**: Spread % = (Ask - Bid) / Midpoint × 100

| Asset | Typical Spread |
|-------|----------------|
| AAPL | 0.01% |
| Mid-cap stock | 0.10% |
| Small-cap | 0.50%+ |
| Penny stock | 5%+ |

Lower spread = more liquid.

---

### 2. Market Impact

Price move caused by your order.

**Formula**: Impact = (Execution_Price - Arrival_Price) / Arrival_Price

**Example**: 
- You want to buy at $100.00 (arrival)
- Average execution: $100.15
- Impact = 0.15 / 100 = **0.15%** (15 bps)

---

### 3. Kyle Lambda

Price impact per dollar traded. Higher λ = less liquid.

### 4. Amihud Illiquidity

**Formula**: ILLIQ = |Return| / Dollar_Volume

Higher ILLIQ = less liquid.

---

## Practical Rules

1. **Never trade more than 2-5% of average daily volume**
2. **Use VWAP/TWAP for large orders**
3. **Avoid trading at open/close for illiquid stocks**

### 2024 Example

NVDA averages $25B daily volume. Safe to trade up to $500M without major impact.

Small-cap averaging $5M daily? Trading $500K will move the price.`
                    }
                ]
            }
        ]
    },
    // ========== SYSTEMATIC TRADING PATH ==========
    {
        id: 'system-design',
        title: 'Building a Trading Plan',
        subtitle: 'Systematic Strategy Design',
        icon: '🔧',
        estimatedTime: '2h',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'System Components',
                estimatedTime: '60 min',
                chapters: [
                    {
                        id: 'complete-system',
                        title: 'The Complete Trading System',
                        content: `# Trading System Architecture

## The 5 Essential Components

Every complete system must define:

### 1. Universe Definition
What do you trade?
- S&P 500 stocks
- Crypto top 20
- Forex majors
- Futures (ES, NQ, CL)

### 2. Entry Rules

Example:
IF Zenith_Score > 80 AND Price > 200_EMA AND Volume > 1.5x_Avg
THEN BUY

### 3. Exit Rules
- **Stop-Loss**: Fixed % or ATR-based
- **Take-Profit**: R-multiple target
- **Time Stop**: Exit after X days if no movement

### 4. Position Sizing

Position_Size = (Account × Risk_Percent) / (Entry - Stop)

Example: $100K account, 1% risk, $5 stop distance
Position = ($100K × 0.01) / $5 = 200 shares

### 5. Risk Management
- Max 2% per trade
- Max 6% total exposure
- Max 3 correlated positions

---

## Exercise

Design rules for a momentum system on SPY.

**Example Answer**:
- Entry: RSI(14) crosses above 50 AND Price > 20 EMA
- Exit: RSI < 40 OR 3% trailing stop
- Size: 1% risk per trade
- Universe: SPY only
- Max trades: 1 at a time`
                    }
                ]
            }
        ]
    },
    {
        id: 'backtest-rigor',
        title: 'Avoiding Overfitting',
        subtitle: 'Robust Strategy Development',
        icon: '⚠️',
        estimatedTime: '1h 45min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'Overfitting Detection',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'overfit-signs',
                        title: 'Signs Your Strategy Is Overfit',
                        content: `# Detecting Overfitted Strategies

## Red Flags

### 1. Too Many Parameters
More than 5 optimizable parameters = likely overfit.

Ask: Does each parameter have theoretical justification?

### 2. Perfect Equity Curve
Real trading has drawdowns. Smooth curves are fake.

If in-sample max drawdown is 5% but benchmark is 20%, be suspicious.

### 3. In-Sample vs Out-of-Sample Gap

Example:
- In-Sample Sharpe: 2.5
- Out-of-Sample Sharpe: 0.8
- Gap = 68% degradation → OVERFIT!

### 4. Parameter Sensitivity
If changing MA from 20 to 21 days destroys performance, you found noise, not signal.

---

## Solutions

1. **Reduce parameters**: Simpler is better
2. **Use walk-forward testing**: Rolling optimization
3. **Cross-validate across assets**: Does it work on AAPL AND MSFT?
4. **Monte Carlo analysis**: Shuffle trade order 1000x

---

## Rule of Thumb

Expect live performance to be 50% of backtest.

If backtest shows 40% annual return, plan for 20%.

## Trader Insight

> "The strategy that looks best in backtest is usually the most overfit."`
                    }
                ]
            }
        ]
    },
    {
        id: 'modern-portfolio-theory',
        title: 'Correlation & Diversification',
        subtitle: 'Portfolio Construction',
        icon: '📊',
        estimatedTime: '1h 30min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Diversification Math',
                estimatedTime: '45 min',
                chapters: [
                    {
                        id: 'correlation-impact',
                        title: 'Correlation & Portfolio Risk',
                        content: `# The Math of Diversification

## Portfolio Volatility Formula

For two assets:
σ_portfolio = sqrt(w1²×σ1² + w2²×σ2² + 2×w1×w2×ρ×σ1×σ2)

Where ρ = correlation between assets.

---

## Key Insight

Lower correlation = Lower portfolio risk

### Example: 50/50 Portfolio

| Scenario | Stock A σ | Stock B σ | Correlation | Portfolio σ |
|----------|-----------|-----------|-------------|-------------|
| Same stock | 20% | 20% | 1.0 | 20% |
| Uncorrelated | 20% | 20% | 0.0 | 14.1% |
| Neg correlated | 20% | 20% | -0.5 | 10% |

**Free Lunch**: Combining uncorrelated assets reduces risk by ~30% without reducing expected return!

---

## 2024 Real Correlations

| Pair | Correlation | Diversification |
|------|-------------|-----------------|
| SPY/QQQ | 0.92 | Poor |
| SPY/GLD | 0.15 | Good |
| SPY/TLT | -0.30 | Excellent |
| BTC/ETH | 0.85 | Poor |
| AAPL/XOM | 0.25 | Good |

---

## Practical Application

**Bad Portfolio**: 100% tech stocks (all correlated)
**Better Portfolio**: 60% stocks, 30% bonds, 10% gold

The "boring" diversified portfolio beats the concentrated one over time.

## Exercise

You hold 100% NVDA (σ=50%). Adding 20% TLT (σ=15%, ρ=-0.3) reduces portfolio risk. Calculate new σ.`
                    }
                ]
            }
        ]
    },
    {
        id: 'execution-algos',
        title: 'TWAP/VWAP Strategies',
        subtitle: 'Execution Algorithms',
        icon: '🤖',
        estimatedTime: '1h 30min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'Execution Benchmarks',
                estimatedTime: '45 min',
                chapters: [
                    {
                        id: 'twap-vwap',
                        title: 'TWAP vs VWAP Explained',
                        content: `# Execution Algorithms

## TWAP (Time-Weighted Average Price)

Slice order equally over time.

**Example**:
- Total Order: 100,000 shares
- Time: 1 hour (60 minutes)
- Slice Size: 100,000 / 60 = 1,667 shares/minute

**Use When**: Even execution matters more than price, overnight orders.

---

## VWAP (Volume-Weighted Average Price)

Slice order proportional to historical volume.

**Example**:
- Historical Volume Profile:
- 9:30-10:00: 25% of daily volume → 25,000 shares
- 10:00-12:00: 30% → 30,000 shares
- 12:00-15:00: 25% → 25,000 shares
- 15:00-16:00: 20% → 20,000 shares

**Use When**: Minimizing market impact, institutional orders.

---

## TWAP vs VWAP Comparison

| Feature | TWAP | VWAP |
|---------|------|------|
| Execution speed | Constant | Varies with volume |
| Market impact | Higher at low volume | Lower |
| Complexity | Simple | Requires volume modeling |
| Best for | After hours, thin markets | Liquid stocks, large orders |

---

## Implementation Shortfall

**Formula**: IS = (Execution_Price - Decision_Price) / Decision_Price

Captures total cost: delay + impact + spread.

**Example**:
- Decision price: $100.00
- Execution price: $100.25
- IS = 0.25% = 25 bps

## Trader Insight

> "If your IS consistently exceeds 20 bps, your execution is costing you alpha."`
                    }
                ]
            }
        ]
    },
    // ========== EXECUTION TRADER PATH ==========
    {
        id: 'order-flow-dynamics',
        title: 'Level 2 & Order Flow',
        subtitle: 'Reading Market Depth',
        icon: '📊',
        estimatedTime: '2h',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Order Flow Concepts',
                estimatedTime: '60 min',
                chapters: [
                    {
                        id: 'delta-analysis',
                        title: 'Delta & Cumulative Delta',
                        content: `# Order Flow Trading

## Delta Explained

Delta = (Volume at Ask) - (Volume at Bid)

- Positive Delta → Aggressive Buying
- Negative Delta → Aggressive Selling

---

## Cumulative Delta

Running sum of delta showing who controls the market:

| Time | Price | Vol@Ask | Vol@Bid | Delta | Cum.Delta |
|------|-------|---------|---------|-------|-----------|
| 9:30 | $100.00 | 5,000 | 2,000 | +3,000 | +3,000 |
| 9:31 | $100.05 | 3,000 | 4,000 | -1,000 | +2,000 |
| 9:32 | $100.10 | 8,000 | 2,000 | +6,000 | +8,000 |

Rising cumulative delta = Buyers winning.

---

## Trading Signals

| Pattern | Meaning | Action |
|---------|---------|--------|
| Price up + Delta up | Healthy buying | Hold longs |
| Price up + Delta down | Weak rally | Caution |
| Price down + Delta up | Absorption | Look for reversal |
| Price down + Delta down | Healthy selling | Hold shorts |

---

## Absorption

Large limit orders "soaking up" aggressive orders = potential reversal.

**Example**: Price keeps hitting $100 but cannot break. Heavy bid volume at $100 is absorbing all sells. Eventually, sellers exhaust and price reverses up.

## Trader Insight

> "Price shows what happened. Order flow shows why."`
                    },
                    {
                        id: 'footprint-charts',
                        title: 'Footprint Chart Analysis',
                        content: `# Footprint Charts

## Reading the Footprint

Each bar shows bid/ask volume at every price level:

| Price | Bid × Ask |
|-------|-----------|
| $100.10 | 200 × 850 ← Heavy buying |
| $100.05 | 500 × 500 ← Balanced |
| $100.00 | 900 × 150 ← Heavy selling |

---

## Key Patterns

### 1. Stacked Imbalances
3+ consecutive levels of 3:1 imbalance = strong directional move coming.

### 2. Exhaustion
High volume + no price progress = trapped traders.

If price cannot move despite huge volume, the move is ending.

### 3. Unfinished Auction
Single prints (low volume levels) often get revisited.

Market tends to fill in "thin" areas.

---

## Practical Setup

1. See absorption at support (heavy bid volume)
2. Wait for delta to flip positive
3. Enter long with stop below absorption zone
4. Target next resistance

---

## Tools

- Sierra Chart (free footprint)
- Bookmap
- Jigsaw
- Quantower

## Trader Insight

> "Footprint reveals what candlesticks hide—the battle between buyers and sellers."`
                    }
                ]
            }
        ]
    },
    {
        id: 'intraday-risk-mgmt',
        title: 'Position Sizing Under Fire',
        subtitle: 'Intraday Risk Management',
        icon: '🎯',
        estimatedTime: '1h 45min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Real-Time Risk Control',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'daily-limits',
                        title: 'Daily Loss Limits',
                        content: `# Intraday Risk Rules

## The Hard Stop Framework

### Daily Loss Limit

Max Daily Loss = 2-3% of Account

Example: $50,000 account × 2% = $1,000 max daily loss

**Rule**: Hit the limit → STOP TRADING. No exceptions.

---

### Per-Trade Sizing

Position = (Daily_Limit / 3) / Stop_Distance

Example:
- $1,000 limit / 3 trades = $333 risk per trade
- Stop distance = $2 per share
- Position = $333 / $2 = 166 shares max

---

### Scaling Rules

| P&L Status | Action |
|------------|--------|
| Up $500+ | Can increase size 25% |
| Down $300 | Reduce size by 50% |
| Down $500 | Half-size only |
| Down $750 | Stop trading |

---

## The Psychology

When losing, we want to size UP to "get it back."
This is exactly wrong.

**Correct**: Size DOWN when losing, UP when winning.

---

## Weekly/Monthly Limits

- Weekly max loss: 5%
- Monthly max loss: 10%

Hit these? Take a break. Review your process.

## Trader Insight

> "The goal is not to make money every day—it is to survive every day. Live to trade tomorrow."`
                    },
                    {
                        id: 'scaling-positions',
                        title: 'Scaling In and Out',
                        content: `# Position Scaling Strategies

## Scaling In (Pyramiding)

Add to winners, never to losers.

**Example**:
- Entry 1: 50% size at breakout
- Entry 2: 30% size after confirmation (new high)
- Entry 3: 20% size at momentum acceleration

**Risk Rule**: Move stop to breakeven before adding.

---

## Scaling Out

Lock profits progressively:

- Exit 1: 33% at 1R (1:1 risk/reward)
- Exit 2: 33% at 2R
- Exit 3: 34% with trailing stop

---

## The Math

| Strategy | Win Rate Needed to Break Even |
|----------|-------------------------------|
| All-in/All-out 2R | 33% |
| Scale out (1R, 2R, 3R) | 40% |

**Trade-off**: Scaling out has lower variance but also lower max profit.

---

## Exercise

You enter 1000 shares at $50, stop at $48.
Scale out at $52, $54, $56 (equal thirds).

Calculate total profit vs all-out at $54.

**Answer**:
- Scale out: (333×$2) + (333×$4) + (334×$6) = $666 + $1332 + $2004 = **$4,002**
- All-out at $54: 1000 × $4 = **$4,000**

Almost identical, but scaling out captures the $56 move if it happens.`
                    }
                ]
            }
        ]
    },
    // ========== MACRO OBSERVER PATH ==========
    {
        id: 'monetary-policy',
        title: 'The Fed & Global Central Banking',
        subtitle: 'Monetary Policy Trading',
        icon: '🏛️',
        estimatedTime: '2h',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Central Bank Mechanics',
                estimatedTime: '60 min',
                chapters: [
                    {
                        id: 'fed-tools',
                        title: 'Fed Policy Tools',
                        content: `# Federal Reserve Toolkit

## The Three Main Tools

### 1. Federal Funds Rate
Target rate for overnight interbank lending.

Current (2024): 5.25-5.50%
Neutral Rate: ~2.5%
Restrictive (> Neutral): Slows economy

### 2. Open Market Operations
Buying/selling Treasuries to adjust money supply.

- **Buy bonds** → Inject liquidity → Rates fall
- **Sell bonds** → Drain liquidity → Rates rise

### 3. Quantitative Easing/Tightening
- **QE (2020-2022)**: Fed bought $4.5T in bonds
- **QT (2022-present)**: Fed reducing balance sheet by $95B/month

---

## Trading FOMC Meetings

| Outcome vs Expectations | Market Reaction |
|-------------------------|-----------------|
| More hawkish than expected | Stocks down, USD up, Bonds down |
| More dovish than expected | Stocks up, USD down, Bonds up |
| As expected | Often "sell the news" |

### Key Dates
FOMC meets 8 times per year. Mark your calendar.

## Trader Insight

> "Never fight the Fed. When Powell speaks, listen."`
                    },
                    {
                        id: 'global-cbs',
                        title: 'ECB, BOJ, and PBOC',
                        content: `# Global Central Banks

## The Big Four

### 1. ECB (European Central Bank)
- Manages Euro (EUR) across 20 countries
- More hawkish than Fed in 2024
- Watch: German Bund yields

### 2. BOJ (Bank of Japan)
- Historically ultra-dovish (negative rates until 2024)
- Yield Curve Control policy
- JPY weakness when BOJ dovish

### 3. PBOC (People's Bank of China)
- Less transparent than Western CBs
- Watch: Loan Prime Rate (LPR)
- Policy easing = bullish commodities

### 4. BOE (Bank of England)
- Follows Fed but with UK-specific factors
- GBP volatile around BOE meetings

---

## Interest Rate Differential Trading

| Rate Differential | Capital Flow |
|-------------------|--------------|
| US rates > EU rates | USD strengthens |
| Japan raises rates | JPY strengthens |
| China cuts rates | CNY weakens, commodities bid |

### Carry Trade

Borrow in low-rate currency (JPY), invest in high-rate (USD).

**Risk**: Carry trade unwinds cause massive volatility (August 2024 example).

## Exercise

If ECB unexpectedly raises rates 50bps while Fed holds, predict EUR/USD reaction.
**Answer**: EUR/USD rallies as money flows to higher-yielding EUR.`
                    }
                ]
            }
        ]
    },
    {
        id: 'cross-asset-correlations',
        title: 'How Bonds Impact Tech Stocks',
        subtitle: 'Cross-Asset Relationships',
        icon: '🔗',
        estimatedTime: '1h 30min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'The Rate-Equity Link',
                estimatedTime: '45 min',
                chapters: [
                    {
                        id: 'duration-equity',
                        title: 'Duration & Growth Stock Valuation',
                        content: `# Why Rising Rates Crush Tech

## The Duration Effect

Growth stocks are "long duration" assets—their value comes from distant future cash flows.

### DCF Math Example

NVDA FCF in 2030 = $100B

At 8% discount: PV = $100B / 1.08^6 = **$63B**
At 12% discount: PV = $100B / 1.12^6 = **$51B**

Value DROPS 19% from 4% rate increase!

---

## The 10-Year Treasury Connection

| 10Y Yield Change | NASDAQ Reaction |
|------------------|-----------------|
| +50bps quickly | Usually -5% to -10% |
| -50bps quickly | Usually +5% to +8% |

### 2022 Case Study

- 10Y rose from 1.5% to 4.2%
- NASDAQ fell 33%
- QQQ P/E compressed from 32x to 22x

---

## Trading Rule

When 10Y breaks above key resistance, reduce growth exposure.

**Exception**: If rates rise because of STRONG growth, stocks can still rally (2023-2024 scenario).

## Trader Insight

> "Rates are gravity for valuations. When gravity increases, the highest flyers fall fastest."`
                    },
                    {
                        id: 'risk-on-off',
                        title: 'Risk-On vs Risk-Off Flows',
                        content: `# The Risk-On/Risk-Off Framework

## Capital Flow Patterns

### Risk-On Environment

Money flows TO:
- Stocks (especially growth)
- High-yield bonds
- Emerging markets
- Commodities
- AUD, CAD (commodity currencies)

### Risk-Off Environment

Money flows TO:
- US Treasuries
- Gold
- USD, JPY, CHF (safe havens)
- Defensive sectors (utilities, staples)

---

## Reading the Signals

| Indicator | Risk-On | Risk-Off |
|-----------|---------|----------|
| VIX | < 15 | > 25 |
| HYG/TLT ratio | Rising | Falling |
| USD/JPY | Rising | Falling |
| Copper/Gold | Rising | Falling |

---

## Trading the Regime

**Risk-On Setup**:
- VIX declining from spike
- Credit spreads tightening
- Action: Add beta, reduce hedges

**Risk-Off Setup**:
- VIX rising, breaking above 20
- Credit spreads widening
- Action: Reduce exposure, add hedges

### 2024 Example

VIX spike to 40 in August → Dollar rallied, Gold rallied, EM sold off. Classic risk-off.`
                    }
                ]
            }
        ]
    },
    {
        id: 'geopolitics-markets',
        title: 'Energy Markets & Conflict',
        subtitle: 'Geopolitical Risk Analysis',
        icon: '🌍',
        estimatedTime: '1h 30min',
        difficulty: 'intermediate',
        parts: [
            {
                id: 'part-1',
                title: 'Energy & Geopolitics',
                estimatedTime: '45 min',
                chapters: [
                    {
                        id: 'oil-conflict',
                        title: 'Oil Shocks & Market Response',
                        content: `# Energy & Geopolitical Risk

## Key Chokepoints

- **Strait of Hormuz**: 20% of global oil
- **Suez Canal**: 10% of global trade
- **Strait of Malacca**: 25% of maritime trade

Disruption at any chokepoint = oil spike.

---

## Historical Responses

| Event | Oil Price Move | Market Impact |
|-------|----------------|---------------|
| Gulf War (1990) | +100% spike | S&P -15% |
| Iraq War (2003) | +30% | Stocks resilient |
| Russia/Ukraine (2022) | +30% | Energy stocks +50% |

---

## Trading the Headlines

### Initial Reaction (first 24-48 hours)

- Oil spikes
- Defense stocks rally (LMT, RTX, NOC)
- Airlines, cruises sell off
- Safe havens bid (gold, treasuries)

### Second Order (1-4 weeks)

- Assess actual supply disruption
- Often overshoot reverses
- Fade the panic if supply remains stable

---

## Playbook

| Scenario | Action |
|----------|--------|
| Middle East tension rises | Long oil, defense |
| Russia energy disruption | Long natural gas, fertilizers |
| Suez blocked | Long shipping stocks |
| China-Taiwan tension | Hedge semis, long defense |

## Trader Insight

> "First reaction usually overdone. Fade the panic if supply remains stable."`
                    },
                    {
                        id: 'safe-haven',
                        title: 'Flight to Safety Trades',
                        content: `# Safe Haven Trading

## The Safe Haven Hierarchy

### Tier 1 (Most Reliable)
- **US Treasuries**: Ultimate safety
- **Gold**: Crisis hedge, inflation hedge
- **USD**: World reserve currency

### Tier 2
- **Swiss Franc (CHF)**: Neutral, stable
- **Japanese Yen (JPY)**: Carry trade unwind

### Tier 3 (Depends on Crisis)
- **Bitcoin**: Sometimes safe haven, sometimes risk asset

---

## Crisis Trade Setup

IF VIX > 30 AND Headlines_Negative:
    BUY: TLT, GLD, UUP
    SELL: EEM, HYG, JNK
    
Take Profits: When VIX falls 30% from peak

---

## 2024 Examples

**Middle East escalation** → Oil +15%, Gold +8%
**Japan carry trade unwind** → JPY +12% in 3 days
**August VIX spike** → Treasuries rallied, EM sold off

---

## Execution Tips

1. Have watchlist ready BEFORE crisis
2. Use limit orders - spreads widen in panic
3. Size small initially - can add
4. Take profits quickly - reversals are violent

## Trader Insight

> "In crisis, liquidity disappears. Those with cash and a plan make the money."`
                    }
                ]
            }
        ]
    },
    {
        id: 'market-cycles',
        title: 'The Debt Cycle',
        subtitle: 'Long-Term Economic Cycles',
        icon: '🔄',
        estimatedTime: '1h 45min',
        difficulty: 'advanced',
        parts: [
            {
                id: 'part-1',
                title: 'Understanding Cycles',
                estimatedTime: '50 min',
                chapters: [
                    {
                        id: 'dalio-framework',
                        title: 'Ray Dalio Debt Cycle',
                        content: `# The Long-Term Debt Cycle

## Ray Dalio Framework

### The 75-Year Debt Supercycle

**Phase 1: Early Cycle (Productivity-Driven)**
- Debt is low, used productively
- Economic growth exceeds debt growth
- Example: 1950s-1960s America

**Phase 2: Bubble (Debt-Driven)**
- Debt grows faster than income
- Asset prices inflate
- Example: 2004-2007, Roaring 20s

**Phase 3: Deleveraging**
- Debt servicing exceeds income growth
- Asset prices collapse
- Example: 2008, 1930s

**Phase 4: Beautiful Deleveraging (or Depression)**
- Central banks print money, buy debt
- Inflation erodes debt value
- Example: 2020-2022 (printing), 1930s (depression)

---

## Where Are We Now? (2024)

| Indicator | Reading | Signal |
|-----------|---------|--------|
| US Debt/GDP | 122% | Elevated |
| Interest Cost/Revenue | 15% | Rising |
| Yield Curve | Inverted 2y | Late cycle |

**Implication**: We are likely in late Phase 2 or early Phase 3. Positioning matters.

## Trader Insight

> "Debt cycles take decades. Most traders ignore them. Those who understand them have massive edge."`
                    },
                    {
                        id: 'cycle-positioning',
                        title: 'Positioning for the Cycle',
                        content: `# Cycle-Based Asset Allocation

## What Works When

### Early Cycle (Recovery)
Winners:
- Cyclicals (industrials, materials)
- Small caps
- High yield bonds
- Emerging markets

### Mid Cycle (Expansion)
Winners:
- Growth stocks
- Tech sector
- Investment grade bonds
- REITs

### Late Cycle (Overheating)
Winners:
- Commodities
- Energy stocks
- Short duration bonds
- Reduce equity exposure

### Recession
Winners:
- Long-term Treasuries
- Defensive sectors (utilities, staples, healthcare)
- Gold
- Cash

---

## 2024 Positioning Assessment

Indicators suggest late cycle:
- Low unemployment (overheating)
- High inflation (Fed stays restrictive)
- Inverted yield curve (recession signal)

**Recommended Action**:
Barbell approach—defensive core + tactical growth exposure in AI/momentum leaders.

---

## Cycle Timing Tools

1. **Conference Board Leading Indicators**
2. **Yield curve shape**
3. **Credit spreads**
4. **ISM Manufacturing**
5. **Unemployment Claims**

Monitor monthly. Cycle turns take time.

## Trader Insight

> "Don't predict the cycle. Detect it. Then position accordingly."`
                    }
                ]
            }
        ]
    }
];

export function getCourseById(id: string): ModuleContent | undefined {
    return COURSES.find(c => c.id === id);
}

export function getChapterContent(courseId: string, partId: string, chapterId: string): Chapter | undefined {
    const course = getCourseById(courseId);
    if (!course) return undefined;

    const part = course.parts.find(p => p.id === partId);
    if (!part) return undefined;

    return part.chapters.find(c => c.id === chapterId);
}
