import { ModuleContent } from '../learning-types';

export const TECHNICAL_ANALYSIS: ModuleContent = {
    id: 'technical-analysis',
    title: 'Technical Analysis Mastery',
    subtitle: 'Reading Price Action and Market Psychology',
    icon: '📈',
    estimatedTime: '80h 00min',
    difficulty: 'intermediate',
    parts: [
        {
            id: 'ta-part-1',
            title: 'Foundations of Technical Analysis',
            estimatedTime: '10h',
            chapters: [
                {
                    id: 'ta-ch-1-1',
                    title: 'Why Technical Analysis Works',
                    content: `# The Behavioral Reality

Technical Analysis works because humans are predictably irrational. Fear and greed create patterns that repeat across time.

## The EMH vs Reality
Efficient Market Hypothesis assumes perfect rationality. Reality shows that humans anchor to past prices, herd together, and overreact to news.

## Self-Fulfilling Prophecy
When millions of traders watch the same 200-day moving average, it becomes a real support/resistance level.

> 🧠 TA studies **what** is happening. Fundamental analysis studies **why**.`
                },
                {
                    id: 'ta-ch-1-2',
                    title: 'Dow Theory Axioms',
                    content: `# The Three Axioms

### 1. The Market Discounts Everything
All known information is already in the price.

### 2. Price Moves in Trends
An object in motion stays in motion. Trends persist until proven otherwise.

### 3. History Repeats
Human nature is constant, so chart patterns repeat.

> 💎 "The Averages must confirm each other" - Look for confluence across markets.`
                }
            ]
        },
        {
            id: 'ta-part-2',
            title: 'Support, Resistance & Market Structure',
            estimatedTime: '15h',
            chapters: [
                {
                    id: 'ta-ch-2-1',
                    title: 'The Psychology of Levels',
                    content: `# Why Support/Resistance Exists

Support is a ZONE OF DEMAND. Resistance is a ZONE OF SUPPLY.

## The Three Groups
When price hits $100:
1. **Longs** want to add more
2. **Shorts** want to exit at breakeven
3. **Sideliners** want to enter

Result: Massive buying pressure creates support.

## Polarity Flip
Old resistance becomes new support when broken. This is based on regret and anchoring.

> 🧱 The more times a level is tested, the WEAKER it becomes.`
                }
            ]
        },
        {
            id: 'ta-part-3',
            title: 'Indicators & Oscillators',
            estimatedTime: '20h',
            chapters: [
                {
                    id: 'ta-ch-3-1',
                    title: 'RSI Divergence Mastery',
                    content: `# Beyond Overbought/Oversold

RSI above 70 in a strong trend can last for months. The real power is in DIVERGENCE.

## Bearish Divergence
- Price: Higher High
- RSI: Lower High
- Meaning: Engine is dying, crash coming

## Bullish Divergence
- Price: Lower Low
- RSI: Higher Low
- Meaning: Selling exhausted, bounce imminent

> 💎 Look for hidden divergence to identify trend continuation.`
                }
            ]
        }
    ]
};
