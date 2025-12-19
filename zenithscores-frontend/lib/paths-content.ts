import {
    Activity, Database, Cpu, Target, Globe, LucideIcon
} from 'lucide-react';

export interface PathRole {
    title: string;
    description: string;
}

export interface PathSkill {
    name: string;
    module: string;
    quizId: string;
}

export interface PathContent {
    id: string;
    name: string;
    icon: LucideIcon;
    startColor: string;
    endColor: string;
    tagline: string;
    why: string;
    superpower: string;
    risk: string;
    careerMatches: string[]; // For the summary card
    deepDive: {
        roles: PathRole[];
        skills: PathSkill[];
    };
}

export const PATHS_CONTENT: Record<string, PathContent> = {
    'market-analyst': {
        id: 'market-analyst',
        name: 'Market Analyst',
        icon: Activity,
        startColor: 'from-blue-500',
        endColor: 'to-indigo-600',
        tagline: "The Architect of Reasons",
        why: "You value structure over speed. You avoid trades unless the underlying logic is clear. Your edge is synthesis — not reaction.",
        superpower: "Connecting dots others miss.",
        risk: "Analysis paralysis — being right, but late.",
        careerMatches: ["Equity Research", "Macro Strategy", "Investment Analysis"],
        deepDive: {
            roles: [
                { title: "Equity Research Associate", description: "Analyzes company fundamentals to recommend buy/sell." },
                { title: "Macro Strategy Analyst", description: "Predicts broad market moves based on economic data." },
                { title: "Investment Committee Support", description: "Prepares data-driven memos for fund decision-makers." }
            ],
            skills: [
                { name: "Fundamental Analysis", module: "Valuation 101: DCF & Multiples", quizId: "valuation-basics" },
                { name: "Financial Modeling", module: "Excel for Finance Pros", quizId: "financial-modeling" },
                { name: "Macroeconomic Theory", module: "Central Banks & Interest Rates", quizId: "macro-economics" },
                { name: "Thesis Writing", module: "Structuring the Investment Memo", quizId: "investment-writing" }
            ]
        }
    },
    'data-research': {
        id: 'data-research',
        name: 'Data / Research',
        icon: Database,
        startColor: 'from-emerald-500',
        endColor: 'to-teal-600',
        tagline: "The Quant Hunter",
        why: "You trust numbers over narratives. You think in distributions, not certainties. Emotional neutrality is your edge.",
        superpower: "Unbiased truth-seeking.",
        risk: "Overfitting the past and missing regime shifts.",
        careerMatches: ["Quant Research", "Risk Management", "Data Science"],
        deepDive: {
            roles: [
                { title: "Quantitative Researcher", description: "Builds mathematical models to find market edge." },
                { title: "Risk Manager", description: "Identifies and quantifies portfolio threats." },
                { title: "Data Scientist (Fintech)", description: "Analyzes user/market data for product insights." }
            ],
            skills: [
                { name: "Statistical Arbitrage", module: "Mean Reversion & Z-Scores", quizId: "stat-arb-basics" },
                { name: "Risk Metrics", module: "VaR & Expected Shortfall", quizId: "risk-management-pro" },
                { name: "Python/SQL", module: "Backtesting Frameworks", quizId: "algo-python-intro" },
                { name: "Market Microstructure", module: "Order Books & Liquidity", quizId: "market-microstructure" }
            ]
        }
    },
    'systematic-trading': {
        id: 'systematic-trading',
        name: 'Systematic Trading',
        icon: Cpu,
        startColor: 'from-purple-500',
        endColor: 'to-violet-600',
        tagline: "The Machine Builder",
        why: "You believe in rules, not exceptions. If it can’t be tested, it doesn’t exist. You execute boring plans with elite discipline.",
        superpower: "Relentless consistency.",
        risk: "Rigidity when market structure changes.",
        careerMatches: ["Algorithmic Trading", "Systematic Portfolio Management"],
        deepDive: {
            roles: [
                { title: "Algorithmic Trader", description: "Designs and monitors automated trading systems." },
                { title: "Portfolio Manager (Quant)", description: "Allocates capital based on systematic signals." },
                { title: "Execution Algorithm Developer", description: "Optimizes trade entry/exit logic." }
            ],
            skills: [
                { name: "System Design", module: "Building a Trading Plan", quizId: "system-design" },
                { name: "Backtesting Rigor", module: "Avoiding Overfitting", quizId: "backtest-rigor" },
                { name: "Portfolio Construction", module: "Correlation & Diversification", quizId: "modern-portfolio-theory" },
                { name: "Execution Logic", module: "TWAP/VWAP Strategies", quizId: "execution-algos" }
            ]
        }
    },
    'execution-trader': {
        id: 'execution-trader',
        name: 'Execution Trader',
        icon: Target,
        startColor: 'from-red-500',
        endColor: 'to-orange-600',
        tagline: "The Sniper",
        why: "You perform best under pressure. While others hesitate, you act. You focus on price behavior, not narratives.",
        superpower: "Adaptability under fire.",
        risk: "Overtrading and cognitive burnout.",
        careerMatches: ["Prop Trading", "Execution Desk", "Market Making"],
        deepDive: {
            roles: [
                { title: "Proprietary Trader", description: "Trades firm capital for profit." },
                { title: "Execution Trader (Agency)", description: "Executes large orders for clients efficiently." },
                { title: "Market Maker", description: "Provides liquidity and profits from spreads." }
            ],
            skills: [
                { name: "Price Action", module: "Candlestick Patterns & Support/Resistance", quizId: "technical-analysis" },
                { name: "Tape Reading", module: "Level 2 & Order Flow", quizId: "order-flow-dynamics" },
                { name: "Risk Management", module: "Position Sizing Under Fire", quizId: "intraday-risk-mgmt" },
                { name: "Psychology", module: "Managing Tilt", quizId: "trading-psychology" }
            ]
        }
    },
    'macro-observer': {
        id: 'macro-observer',
        name: 'Macro Observer',
        icon: Globe,
        startColor: 'from-cyan-500',
        endColor: 'to-blue-500',
        tagline: "The Big Picture Thinker",
        why: "You operate on longer horizons. Policy, capital flows, and geopolitics matter more to you than short-term noise.",
        superpower: "Patience and narrative synthesis.",
        risk: "Correct thesis, mistimed execution.",
        careerMatches: ["Global Macro", "Asset Allocation", "Thematic Research"],
        deepDive: {
            roles: [
                { title: "Global Macro Strategist", description: "Allocates across asset classes based on world events." },
                { title: "Asset Allocation Manager", description: "Decides stocks vs. bonds vs. commodities mix." },
                { title: "Thematic Researcher", description: "Identifies long-term structural shifts (e.g., AI, Green Energy)." }
            ],
            skills: [
                { name: "Monetary Policy", module: "The Fed & Global Central Banking", quizId: "monetary-policy" },
                { name: "Cross-Asset Correlation", module: "how Bonds Impact Tech Stocks", quizId: "cross-asset-correlations" },
                { name: "Geopolitics", module: "Energy Markets & Conflict", quizId: "geopolitics-markets" },
                { name: "Cycle Analysis", module: "The Debt Cycle", quizId: "market-cycles" }
            ]
        }
    }
};
