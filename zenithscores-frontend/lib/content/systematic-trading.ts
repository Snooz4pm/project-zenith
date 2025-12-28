import { ModuleContent } from '../learning-types';

export const SYSTEMATIC_TRADING_COURSES: ModuleContent[] = [{
    id: 'system-design',
    title: 'Systematic Trading',
    subtitle: 'Algorithmic Strategy Design',
    icon: '🏗️',
    estimatedTime: '100h 00min',
    difficulty: 'intermediate',
    parts: [{
        id: 'sd-part-1',
        title: 'Quantitative Mindset',
        estimatedTime: '20h',
        chapters: [{
            id: 'sd-ch-1-1',
            title: 'Elimination of Ego',
            content: `# Why Systems Win

Humans see patterns in noise, hold losers, and revenge trade.

## A System Is:
Unambiguous rules for what, when, how much, and exit criteria.

## Advantages
- Backtestable
- Repeatable
- Scalable
- Emotionally immune

> 🤖 You don't build systems to predict. You build them to eliminate human errors.`
        }, {
            id: 'sd-ch-1-2',
            title: 'Research Pipeline',
            content: `# From Hypothesis to Code

1. **Hypothesis:** Based on human behavior observation
2. **Data Cleaning:** Account for dividends, splits, survivorship bias
3. **Backtesting**
4. **Parameter Optimization**

> 🧪 If you can't explain WHY it works logically, it's probably spurious correlation.`
        }]
    }, {
        id: 'sd-part-2',
        title: 'Backtesting Mastery',
        estimatedTime: '25h',
        chapters: [{
            id: 'sd-ch-2-1',
            title: 'Overfitting Trap',
            content: `# The Ghost

Customizing rules to fit past noise. Works in backtest, fails in real time.

## Solution
- In-Sample: 2010-2020 (build)
- Out-of-Sample: 2021-2024 (test)

If performance drops drastically on out-of-sample, it's overfitted.`
        }, {
            id: 'sd-ch-2-2',
            title: 'Look-Ahead Bias',
            content: `# Accidentally Peeking

"Buy at Open if Close > Open" - ERROR. You don't know the Close at the Open.

> 🛠️ Generate signals using t-1 data, execute at t.`
        }]
    }]
}];

export const EXECUTION_TRADER_COURSES: ModuleContent[] = [{
    id: 'order-flow-dynamics',
    title: 'Order Flow & Execution',
    subtitle: 'Reading the Tape',
    icon: '🔢',
    estimatedTime: '100h 00min',
    difficulty: 'advanced',
    parts: [{
        id: 'of-part-1',
        title: 'Exchange Physics',
        estimatedTime: '25h',
        chapters: [{
            id: 'of-ch-1-1',
            title: 'Matching Engine FIFO',
            content: `# Price-Time Priority

In most exchanges: First In, First Out at the same price.

## HFT Edge
Pay millions for co-location to be #1 in the queue.

> ⚡ Your chart is a summary. The order book is reality.`
        }]
    }, {
        id: 'of-part-2',
        title: 'Footprint & Delta',
        estimatedTime: '25h',
        chapters: [{
            id: 'of-ch-2-1',
            title: 'Bid-Ask Volume',
            content: `# Inside the Candle

Footprint shows HOW MUCH traded at Bid vs Ask.

## Positive Delta
More buying at Ask (aggressive). Bullish.

## Negative Delta
More selling at Bid (aggressive). Bearish.

> 🔎 New high + negative delta = fake rally.`
        }, {
            id: 'of-ch-2-2',
            title: 'Spoofing Detection',
            content: `# DOM Walls

100,000 share sell wall appears. Price approaches. Wall vanishes.

## Real vs Fake
Real walls get chipped away slowly. Fake walls get pulled.`
        }]
    }]
}];
