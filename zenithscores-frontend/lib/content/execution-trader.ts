import { ModuleContent } from '../learning-types';

export const EXECUTION_TRADER_COURSES: ModuleContent[] = [{
    id: 'order-flow-dynamics',
    title: 'Order Flow & Execution',
    subtitle: 'Reading the Tape',
    icon: '🔢',
    estimatedTime: '25h 00min',
    difficulty: 'advanced',
    parts: [
        {
            id: 'of-part-1',
            title: 'Module Overview & Foundations',
            estimatedTime: '5h',
            chapters: [
                {
                    id: 'of-ch-1-1',
                    title: 'The Reality of the Market',
                    content: `
# Module Overview

## What this module teaches
This module is the red pill of trading. It moves beyond "patterns" and "indicators" (which are derivatives of price) to the raw data source itself: **Liquidity and Aggression**. You will learn to read the Order Book (DOM), interpret executed volume (Time & Sales), and visualize the battle between buyers and sellers in real-time.

## Why it matters
Price does not move because of a "Head and Shoulders" pattern. Price moves because aggressive market orders consumed all available passive liquidity at a specific level, forcing the auction to tick higher or lower. Understanding this mechanism is the difference between betting on a chart painting and understanding the mechanics of price delivery.

## Learning Objectives
By the end of this module, you will be able to:
1. **Identify** the difference between passive liquidity (limit orders) and aggressive execution (market orders).
2. **Interpret** the Depth of Market (DOM) to spot spoofing, iceberg orders, and genuine absorption.
3. **Analyze** Footprint charts to determine who is trapped at key swing highs/lows.
4. **Execute** trades based on Delta Divergences rather than lagging indicators.
5. **Evaluate** the quality of a breakout before it happens by watching the bid/ask reload rate.

> 🛑 **Warning:** This is advanced content. If you do not understand basic support/resistance or candlestick logic, go back to the Fundamentals module.
`
                },
                {
                    id: 'of-ch-1-2',
                    title: 'Auction Market Theory',
                    content: `
# The Engine of Price

The market is a continuous two-way auction. Its purpose is **Price Discovery** and **Volume Facilitation**. It moves to advertise prices where business can be conducted.

## The Two Participants
1. **Passive Traders (Liquidity Providers):** They place LIMIT orders. They *rest* at specific prices. They provide the "walls" of the room.
2. **Aggressive Traders (Liquidity Takers):** They use MARKET orders. They *attack* the passive orders. They are the energy moving the walls.

## The Core Interaction
- Price moves UP only when Aggressive Buyers consume all Passive Sellers at the current offer.
- Price moves DOWN only when Aggressive Sellers consume all Passive Buyers at the current bid.

> 💡 **Key Concept:** Absorption. When aggressive buying hits a level but price DOES NOT go up, it means a passive seller is absorbing the flow (Iceberg). This is often a reversal signal.
`
                }
            ]
        },
        {
            id: 'of-part-2',
            title: 'Tools of the Trade',
            estimatedTime: '10h',
            chapters: [
                {
                    id: 'of-ch-2-1',
                    title: 'The DOM (Depth of Market)',
                    content: `
# Reading the Ladder

The DOM shows you the intent (Limit Orders) before the action (Trades).

## Anatomy of the DOM
- **The Bid Column:** Buy limit orders waiting below price. Support.
- **The Ask Column:** Sell limit orders waiting above price. Resistance.
- **Volume Profile:** Historical volume traded at each price.

## Common DOM Events
1. **Spoofing:** Large orders appear to scare the market, then vanish before execution.
2. **Reloading:** As fast as buyers eat the Ask, new sellers add more liquidity. This indicates a strong ceiling.
3. **The Vacuum:** Liquidity suddenly pulled, causing price to slip rapidly to the next level.

> 🛠️ **Practical Rule:** Do not trade "levels" found on a daily chart blindly. Watch the DOM at those levels. If the bids disappear as price approaches, your support level is a mirage.
`
                },
                {
                    id: 'of-ch-2-2',
                    title: 'Footprint Charts & Delta',
                    content: `
# X-Ray Vision for Candles

A Footprint chart breaks open a single candlestick to show you the volume traded at EVERY price level within that candle.

## Interpreting Imbalance
- **Buying Imbalance:** 3x or 4x more buying volume than selling volume at a specific tick.
- **Stacked Imbalances:** Multiple aggressive buy levels in a row. This creates a "zone" of strong support.
- **Unfinished Business:** When a candle high/low has volume on both the bid and ask, the market often revisits it.

## Delta Analysis
**Delta** = (Ask Volume) - (Bid Volume).
- **Positive Delta:** Aggressive buyers won.
- **Negative Delta:** Aggressive sellers won.

> ⚠️ **The Trap:** If price makes a Higher High, but Delta is Negative, it means passive sellers are absorbing the buyers. This is a massive reversal signal (Delta Divergence).
`
                }
            ]
        },
        {
            id: 'of-part-3',
            title: 'Execution & Strategy',
            estimatedTime: '10h',
            chapters: [
                {
                    id: 'of-ch-3-1',
                    title: 'Setup: The Absorption Reversal',
                    content: `
# The Absorption Play

## Logic
We want to enter when a "Stop Run" fails.

## The Setup Steps
1. **Context:** Price approaches a key High/Low.
2. **The Trap:** Price breaks the level by 2-3 ticks.
3. **The Signal:**
   - Massive Aggressive Buying on the tape.
   - Price DOES NOT advance further.
   - Delta is hugely positive, but price stalls.
4. **The Trigger:** Price ticks back inside the range.
5. **Entry:** Short immediately.
6. **Stop Loss:** 2 ticks above the failed high.

## Why it works
The aggressive buyers are now trapped. As price drops, their stop-losses (which are sell market orders) will trigger, fueling the move down.
`
                },
                {
                    id: 'of-ch-3-2',
                    title: 'Risk & Reality Check',
                    content: `
# Where Traders Die

Order flow gives you precision, but it can lead to "Analysis Paralysis."

## The Microscope Problem
Staring at the tape can make you miss the forest for the trees. You might see selling on the DOM and go short, oblivious to the fact that you are shorting into a massive Daily Support level.

## Limitations
- **HFT Noise:** 80% of DOM flicker is algo noise. Ignore small size. Filter for large lots only.
- **Liquidity Gaps:** In low cap crypto or thin forex hours, order flow is jumpy and unreliable.
- **Reaction Speed:** You are competing with machines. You cannot beat them on speed. You must beat them on **structure**.

## Final Summary
- Order flow confirms the *timing* of the trade, not the *direction*.
- Use Technical Analysis for "Where" to trade.
- Use Order Flow for "When" to trade.

> 🎓 **Takeaway:** The market is a mechanism for finding liquidity. Trade where the liquidity is, not where you want it to be.
`
                }
            ]
        }
    ]
}];
