import { ModuleContent } from '../learning-types';

export const MARKET_ANALYST_COURSES: ModuleContent[] = [{
    id: 'valuation-basics',
    title: 'Valuation & Market Analysis',
    subtitle: 'Finding Intrinsic Worth',
    icon: '📊',
    estimatedTime: '80h 00min',
    difficulty: 'intermediate',
    parts: [{
        id: 'va-part-1',
        title: 'Philosophy of Value',
        estimatedTime: '15h',
        chapters: [{
            id: 'va-ch-1-1',
            title: 'Mr. Market Allegory',
            content: `# The Manic-Depressive Partner

Benjamin Graham's Mr. Market offers you a price every day. Sometimes euphoric, sometimes depressed.

## Your Job
Calculate intrinsic value independently. Buy when he's depressed, sell when he's euphoric.

> 📖 A stock is a contract on future cash flows, not a ticker symbol.`
        }, {
            id: 'va-ch-1-2',
            title: 'Margin of Safety',
            content: `# Protection from Being Wrong

If a bridge is designed for 10,000 lbs, only allow 6,000 lb trucks.

## In Valuation
If DCF says $100, buy at $60 (40% margin). You can be wrong about growth and still profit.

> 🛡️ Investing is about surviving when you're wrong.`
        }]
    }, {
        id: 'va-part-2',
        title: 'DCF Masterclass',
        estimatedTime: '20h',
        chapters: [{
            id: 'va-ch-2-1',
            title: 'UFCF Calculation',
            content: `# Unlevered Free Cash Flow

1. EBIT (Operating Income)
2. Less: Taxes
3. Add: D&A (non-cash)
4. Less: CapEx (real cash)
5. Less: Change in NWC

## Why UFCF?
Ignores capital structure. Shows business quality independent of financing.`
        }, {
            id: 'va-ch-2-2',
            title: 'WACC Sensitivity',
            content: `# The Discount Rate

WACC = (Cost of Equity × % Equity) + (Cost of Debt × % Debt)

## Sensitivity Analysis
If WACC moves 1% and valuation drops 50%, the investment is unstable.

Use sensitivity tables to understand risk.`
        }]
    }]
}];

export const DATA_RESEARCH_COURSES: ModuleContent[] = [];
