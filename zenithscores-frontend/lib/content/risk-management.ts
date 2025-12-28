import { ModuleContent } from '../learning-types';

export const RISK_MANAGEMENT: ModuleContent = {
    id: 'risk-management-pro',
    title: 'Risk Management Pro',
    subtitle: 'The Art of Absolute Survival',
    icon: '🛡️',
    estimatedTime: '60h 00min',
    difficulty: 'advanced',
    parts: [
        {
            id: 'rm-part-1',
            title: 'Psychology of Loss',
            estimatedTime: '10h',
            chapters: [
                {
                    id: 'rm-ch-1-1',
                    title: 'Loss Aversion & Prospect Theory',
                    content: `# Why Your Brain Is Your Enemy

Humans feel loss pain **2x stronger** than gain pleasure (Kahneman).

## The Behavior
- Down 10%: Hold and pray
- Up 5%: Sell immediately

This is the opposite of what professionals do.

## Sunk Cost Fallacy
"I've already lost $5,000, I can't sell now!" The market doesn't care about your history.

> 🧠 Visualize the stop-loss being hit BEFORE entering the trade.`
                },
                {
                    id: 'rm-ch-1-2',
                    title: 'FOMO and Tilt',
                    content: `# The Emotional Circuit Breaker

## Tilt
When the emotional brain takes over and you revenge trade.

## The Solution
Hard daily loss limits. If you lose 2%, close the laptop. Cash is a position.

> 🎨 The most profitable trade is often the one you didn't take.`
                }
            ]
        },
        {
            id: 'rm-part-2',
            title: 'Mathematics of Ruin',
            estimatedTime: '10h',
            chapters: [
                {
                    id: 'rm-ch-2-1',
                    title: 'Asymmetric Recovery',
                    content: `# The Deadly Gravity

- Lose 10%: Need 11% to recover
- Lose 50%: Need 100% to recover
- Lose 90%: Need 900% to recover

## Expectancy Formula
(Win Rate × Avg Win) - (Loss Rate × Avg Loss)

Positive expectancy means you can be wrong 60% of the time and still profit if your wins are 3x your losses.

> 📊 Track your Profit Factor: Total Wins / Total Losses. Above 1.5 is professional.`
                }
            ]
        },
        {
            id: 'rm-part-3',
            title: 'Position Sizing Mastery',
            estimatedTime: '15h',
            chapters: [
                {
                    id: 'rm-ch-3-1',
                    title: 'The 1% Rule',
                    content: `# Fixed-Fractional Sizing

Never risk more than 1% of total equity per trade.

## The Formula
1. Account: $100,000
2. Risk (1%): $1,000
3. Entry: $50, Stop: $45
4. Risk per share: $5
5. **Quantity: 200 shares**

## Why 1%?
You can survive 20 losses in a row and still have 81% of your account.

> 🎯 In a losing streak, reduce to 0.5% until you win again.`
                }
            ]
        }
    ]
};
