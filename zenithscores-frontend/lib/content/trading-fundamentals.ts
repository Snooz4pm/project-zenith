import { ModuleContent } from '../learning-types';

export const TRADING_FUNDAMENTALS: ModuleContent = {
    id: 'trading-fundamentals',
    title: 'Trading Fundamentals: The Comprehensive Masterclass',
    subtitle: 'From Ancient Barter to Algorithmic HFT',
    icon: '📚',
    estimatedTime: '80h 00min',
    difficulty: 'beginner',
    parts: [
        {
            id: 'tf-part-1',
            title: 'The Philosophical and Historical Foundations',
            estimatedTime: '10h',
            chapters: [
                {
                    id: 'tf-ch-1-1',
                    title: 'The Genesis of Value',
                    content: `
# 1.1 The Genesis of Value

To understand trading, one must first understand what "Value" is. At its most fundamental level, value is a social construct used to facilitate the exchange of goods, services, and time.

## The Barter System
The earliest form of trading was Barter—a direct exchange of one good for another. However, Barter is catastrophically inefficient due to the "Double Coincidence of Wants" problem.

## The Invention of Money
Money acts as:
1. **Medium of Exchange**
2. **Unit of Account**
3. **Store of Value**

## The Dutch East India Company
In 1602, the VOC issued the first-ever "Shares" to the public, creating the first modern stock market.

## Modern Markets
After Nixon took the US off the gold standard in 1971, we entered the era of "Floating Exchange Rates."

> 📖 **Student Insight:** Understanding history prevents you from thinking that the current market setup is permanent.
`
                },
                {
                    id: 'tf-ch-1-2',
                    title: 'The Five Axioms of Market Reality',
                    content: `
# 1.2 The Axioms of Trading

### Axiom 1: Markets Are Uncertain
No one knows for certain what will happen next. Every trade is probabilistic.

### Axiom 2: Price Is Not Value
Price is what you see on the screen. Value is the underlying economic worth.

### Axiom 3: The Market Is Indifferent
The market doesn't know you exist and doesn't care about your situation.

### Axiom 4: Liquidity Is Oxygen
A 1,000% gain on an asset you cannot sell is worth zero.

### Axiom 5: Leverage Is a Magnifier
If you are disciplined, leverage helps. If you are impulsive, it destroys.

> 🎯 **Goal:** Become a "Logic Machine" in a sea of emotional noise.
`
                }
            ]
        },
        {
            id: 'tf-part-2',
            title: 'Market Participants and Ecosystem',
            estimatedTime: '10h',
            chapters: [
                {
                    id: 'tf-ch-2-1',
                    title: 'Institutional Giants',
                    content: `
# 2.1 Understanding the Heavyweights

## Central Banks
The Federal Reserve, ECB, and BoJ are the most powerful participants. They manage inflation and employment through interest rates.

## Investment Banks
Goldman Sachs, JP Morgan provide liquidity and market-making services.

## Hedge Funds
Renaissance Technologies, Bridgewater seek alpha through leverage and alternative strategies.

## High-Frequency Traders
They provide micro-liquidity and arbitrage opportunities.

> 🐋 **Whale Watch:** When you see massive volume with no news, institutions are moving.
`
                },
                {
                    id: 'tf-ch-2-2',
                    title: 'Retail Psychology',
                    content: `
# 2.2 Why Most Retail Traders Fail

95% of retail traders lose money because of psychological biases:

## Cognitive Biases
1. **Confirmation Bias**
2. **Disposition Effect**
3. **Anchoring**

## The Solution
Adopt a process-over-outcome mindset. Focus on executing a system, not predicting outcomes.

> 🧠 **Professional Mindset:** Care about the quality of the process, not the outcome of individual trades.
`
                }
            ]
        }
    ]
};
