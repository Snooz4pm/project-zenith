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
    moduleId: string; // Added for consistency with prompt
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
    careerMatches: string[];
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
                {
                    name: "Valuation 101: DCF & Multiples",
                    module: "Valuation 101: DCF & Multiples",
                    moduleId: "valuation-basics",
                    quizId: "valuation-basics"
                },
                {
                    name: "Excel for Finance Pros",
                    module: "Excel for Finance Pros",
                    moduleId: "financial-modeling",
                    quizId: "financial-modeling"
                },
                {
                    name: "Central Banks & Interest Rates",
                    module: "Central Banks & Interest Rates",
                    moduleId: "macro-economics",
                    quizId: "macro-economics"
                },
                {
                    name: "Structuring the Investment Memo",
                    module: "Structuring the Investment Memo",
                    moduleId: "investment-writing",
                    quizId: "investment-writing"
                }
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
                {
                    name: "Mean Reversion & Z-Scores",
                    module: "Mean Reversion & Z-Scores",
                    moduleId: "stat-arb-basics",
                    quizId: "stat-arb-basics"
                },
                {
                    name: "VaR & Expected Shortfall",
                    module: "VaR & Expected Shortfall",
                    moduleId: "risk-management-pro",
                    quizId: "risk-management-pro"
                },
                {
                    name: "Backtesting Frameworks",
                    module: "Backtesting Frameworks",
                    moduleId: "algo-python-intro",
                    quizId: "algo-python-intro"
                },
                {
                    name: "Order Books & Liquidity",
                    module: "Order Books & Liquidity",
                    moduleId: "market-microstructure",
                    quizId: "market-microstructure"
                }
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
                {
                    name: "Building a Trading Plan",
                    module: "Building a Trading Plan",
                    moduleId: "system-design",
                    quizId: "system-design"
                },
                {
                    name: "Avoiding Overfitting",
                    module: "Avoiding Overfitting",
                    moduleId: "backtest-rigor",
                    quizId: "backtest-rigor"
                },
                {
                    name: "Correlation & Diversification",
                    module: "Correlation & Diversification",
                    moduleId: "modern-portfolio-theory",
                    quizId: "modern-portfolio-theory"
                },
                {
                    name: "TWAP/VWAP Strategies",
                    module: "TWAP/VWAP Strategies",
                    moduleId: "execution-algos",
                    quizId: "execution-algos"
                }
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
                {
                    name: "Candlestick Patterns",
                    module: "Candlestick Patterns",
                    moduleId: "technical-analysis",
                    quizId: "technical-analysis"
                },
                {
                    name: "Level 2 & Order Flow",
                    module: "Level 2 & Order Flow",
                    moduleId: "order-flow-dynamics",
                    quizId: "order-flow-dynamics"
                },
                {
                    name: "Position Sizing Under Fire",
                    module: "Position Sizing Under Fire",
                    moduleId: "intraday-risk-mgmt",
                    quizId: "intraday-risk-mgmt"
                },
                {
                    name: "Managing Tilt",
                    module: "Managing Tilt",
                    moduleId: "trading-psychology",
                    quizId: "trading-psychology"
                }
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
                {
                    name: "The Fed & Global Central Banking",
                    module: "The Fed & Global Central Banking",
                    moduleId: "monetary-policy",
                    quizId: "monetary-policy"
                },
                {
                    name: "How Bonds Impact Tech Stocks",
                    module: "How Bonds Impact Tech Stocks",
                    moduleId: "cross-asset-correlations",
                    quizId: "cross-asset-correlations"
                },
                {
                    name: "Energy Markets & Conflict",
                    module: "Energy Markets & Conflict",
                    moduleId: "geopolitics-markets",
                    quizId: "geopolitics-markets"
                },
                {
                    name: "The Debt Cycle",
                    module: "The Debt Cycle",
                    moduleId: "market-cycles",
                    quizId: "market-cycles"
                }
            ]
        }
    }
};

// Also export as PATH_SKILLS for compatibility if needed, though PATHS_CONTENT is main
export const PATH_SKILLS = Object.entries(PATHS_CONTENT).reduce((acc, [key, value]) => {
    acc[key] = value.deepDive.skills;
    return acc;
}, {} as Record<string, PathSkill[]>);
