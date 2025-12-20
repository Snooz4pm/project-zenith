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
