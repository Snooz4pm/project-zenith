export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    calculation?: string;
}

export interface QuizSet {
    [difficulty: string]: QuizQuestion[];
}

export interface AcademyQuizzes {
    [moduleId: string]: QuizSet;
}

export const ACADEMY_QUIZZES: AcademyQuizzes = {
    "trading-fundamentals": {
        "easy": [
            {
                id: "tf_e1",
                question: "During the London-New York trading session overlap (13:00-17:00 GMT), what is the PRIMARY driver of increased liquidity in EUR/USD?",
                options: ["a) Retail trader activity", "b) Coordinated central bank intervention", "c) Institutional cross-border capital flows and corporate hedging", "d) High-frequency trading firms reducing positions"],
                correctAnswer: "c",
                explanation: "The overlap of the two largest financial centers creates massive institutional flow and corporate hedging requirements."
            },
            {
                id: "tf_e2",
                question: "True or False: In the FOREX market, the bid-ask spread for EUR/USD typically widens significantly during Asian trading hours compared to London hours.",
                options: ["a) True", "b) False"],
                correctAnswer: "a",
                explanation: "Reduced liquidity from European and North American banks during the Asian session leads to wider spreads."
            },
            {
                id: "tf_e3",
                question: "Which of the following represents a CONTANGO market structure in futures?",
                options: ["a) Spot price > 1-month future > 3-month future", "b) Spot price < 1-month future < 3-month future", "c) Spot price = 1-month future = 3-month future", "d) Irregular pricing with no discernible pattern"],
                correctAnswer: "b",
                explanation: "Contango occurs when futures prices are higher than the spot price, often due to storage costs and interest rates."
            }
        ],
        "medium": [
            {
                id: "tf_m1",
                question: "A Market Maker on the NASDAQ adjusts their quote from 172.50/172.55 to 172.48/172.53 after a large institutional sell. This PRIMARILY reflects:",
                options: ["a) New fundamental information", "b) The Market Maker's inventory management and risk exposure", "c) A change in overall market trend", "d) Regulatory requirements"],
                correctAnswer: "b",
                explanation: "Market makers adjust quotes to balance their inventory and manage risk after taking on a large position."
            },
            {
                id: "tf_m2",
                question: "The Federal Reserve announces an unexpected rate hike. Algorithmic systems parse the FOMC statement and execute massive sell orders in Treasury futures within milliseconds. This is an example of:",
                options: ["a) Retail traders reading the news", "b) Algorithmic trading systems parsing the FOMC statement", "c) Mutual funds rebalancing", "d) Market makers adjusting spreads"],
                correctAnswer: "b",
                explanation: "HFT and algo systems are programmed to react to specific keywords and data points in economic releases instantly."
            }
        ],
        "hard": [
            {
                id: "tf_h1",
                question: "Portfolio: $2,500,000. Max drawdown: 15%. Correlation-adjusted VaR (95%, 1-day): $85,000. Adding $300,000 position: Vol: 2.5%, Correlation: 0.6. Calculate the INCREASE in 1-day 95% VaR.",
                options: ["a) $5,250", "b) $7,910", "c) $9,875", "d) $12,400"],
                correctAnswer: "b",
                explanation: "Using the portfolio volatility formula: New VaR = $92,910. Increase = 92,910 - 85,000 = $7,910.",
                calculation: "sigma_p = 85000/1.645 ≈ 51672; sigma_i = 300000*0.025 = 7500; New_sigma = sqrt(51672^2 + 7500^2 + 2*0.6*51672*7500) ≈ 56480; New_VaR = 56480*1.645 ≈ 92910."
            }
        ]
    },
    "zenith-score-mastery": {
        "easy": [
            {
                id: "zsm_e1",
                question: "A stock's Zenith Score drops from 88 to 72 while price rises 5%. The MOST likely pillar deterioration is:",
                options: ["a) Momentum Strength (divergence)", "b) Trend Consistency", "c) Volatility Adjustment", "d) Market Regime Alignment"],
                correctAnswer: "a",
                explanation: "Price rising while momentum indicators fall is a classic bearish divergence, often leading to a score drop."
            },
            {
                id: "zsm_e2",
                question: "True or False: The Market Regime Pillar uses Markov switching models with a 3-day confirmation buffer to reduce whipsaws.",
                options: ["a) True", "b) False"],
                correctAnswer: "a",
                explanation: "Regime detection requires filtering noise, and Markov models are standard for detecting state transitions."
            }
        ],
        "medium": [
            {
                id: "zsm_m1",
                question: "The Zenith Score's Momentum Pillar weighting: ROC (40%), ADX (35%), Volume (25%). Stock has ROC: +12% (vs 5% bench), ADX: 42 (vs 25), Volume: 1.8x avg. Calculate Momentum sub-score.",
                options: ["a) 85", "b) 92", "c) 100", "d) 98"],
                correctAnswer: "c",
                explanation: "All factors are significantly above strong thresholds, reaching the maximum capped score of 100."
            }
        ],
        "hard": [
            {
                id: "zsm_h1",
                question: "Calculate Information Ratio: Bench return 12%, Vol 15%. Strategy return 18%, Vol 22%, Correlation 0.85.",
                options: ["a) 0.27", "b) 0.52", "c) 0.73", "d) 1.15"],
                correctAnswer: "b",
                explanation: "Tracking Error = 11.59%. Excess Return = 6%. IR = 6/11.59 = 0.518.",
                calculation: "TE = 22 * sqrt(1 - 0.85^2) = 11.59%. IR = (18-12)/11.59 = 0.52."
            }
        ]
    },
    "technical-analysis": {
        "easy": [
            {
                id: "ta_e1",
                question: "On the 4H chart, you identify an ascending triangle with base at $440 and resistance at $450. The measured move target is:",
                options: ["a) $455", "b) $460", "c) $465", "d) $470"],
                correctAnswer: "b",
                explanation: "Measured move = resistance - base + resistance = 450 - 440 + 450 = 460."
            },
            {
                id: "ta_e2",
                question: "The 1H chart shows a completed bear flag after a decline from $452 to $445. Price breaks support at $446. The minimum target is:",
                options: ["a) $440", "b) $439", "c) $438", "d) $437"],
                correctAnswer: "b",
                explanation: "Flag pole = 7. Target = 446 - 7 = 439."
            }
        ],
        "medium": [
            {
                id: "ta_m1",
                question: "Chart B5 shows a rising wedge in an uptrend. Technical theory suggests:",
                options: ["a) 75% break to upside", "b) 75% break to downside", "c) Continue in trend direction", "d) No predictive value"],
                correctAnswer: "b",
                explanation: "Rising wedges are bearish reversal patterns in an uptrend."
            }
        ],
        "hard": [
            {
                id: "ta_h1",
                question: "Position sizing: Entry $50, stop $47.50 (5% risk). Account $100,000, max risk 2%. Max position size?",
                options: ["a) $20,000", "b) $40,000", "c) $50,000", "d) $80,000"],
                correctAnswer: "b",
                explanation: "Risk = $2,000. Risk per share = $2.50. Shares = 800. Position = 800 * 50 = $40,000."
            }
        ]
    },
    "risk-management-pro": {
        "easy": [
            {
                id: "rm_e1",
                question: "Calculate 1-day 95% VaR using Historical Simulation. Worst 5 P&Ls: -450k, -420k, -410k, -395k, -380k.",
                options: ["a) $450,000", "b) $410,000", "c) $395,000", "d) $380,000"],
                correctAnswer: "d",
                explanation: "95% VaR is the 5th worst loss in a 100-day series."
            }
        ],
        "medium": [
            {
                id: "rm_m1",
                question: "Parametric VaR: σ = 2.1%, mean = 0.04%. Calculate 99% 1-day VaR for $10M portfolio.",
                options: ["a) $441,200", "b) $465,800", "c) $485,300", "d) $502,100"],
                correctAnswer: "c",
                explanation: "Z-score for 99% is 2.33. VaR = 10M * (0.0004 - 2.33*0.021) ≈ $485,300."
            }
        ],
        "hard": [
            {
                id: "rm_h1",
                question: "Calculate 99.9% Credit VaR using Vasicek: PD = 2%, LGD = 60%, EAD = $5M, Correlation = 0.15.",
                options: ["a) $312,000", "b) $468,000", "c) $525,000", "d) $580,000"],
                correctAnswer: "b",
                explanation: "WCDR calculation results in 17.6%. Unexpected loss = (0.176 - 0.02) * 0.6 * 5M = $468,000."
            }
        ]
    },
    "trading-psychology": {
        "easy": [
            {
                id: "psy_e1",
                question: "Which neurotransmitter imbalance is most associated with revenge trading ('tilt')?",
                options: ["a) Low serotonin, high dopamine", "b) High serotonin, low dopamine", "c) Balanced GABA and glutamate", "d) Elevated oxytocin"],
                correctAnswer: "a",
                explanation: "Low impulse control (serotonin) and high reward seeking (dopamine) lead to aggressive revenge trading."
            }
        ],
        "medium": [
            {
                id: "psy_m1",
                question: "Calculate Brier Score: 100 estimates at 80% confidence, correct 65% of the time.",
                options: ["a) 0.15", "b) 0.25", "c) 0.35", "d) 0.45"],
                correctAnswer: "b",
                explanation: "Brier = ((0.8-1)^2 * 65 + (0.8-0)^2 * 35) / 100 = 0.25."
            }
        ],
        "hard": [
            {
                id: "psy_h1",
                question: "Calculate annualized Sharpe decay rate: S starts at 1.8, drops to 1.2 in 6 months.",
                options: ["a) 0.40", "b) 0.81", "c) 1.20", "d) 1.65"],
                correctAnswer: "b",
                explanation: "S_t = S_0 * e^(-kt). ln(1.2/1.8) = -k*0.5. k = 0.81."
            }
        ]
    },
    "defi-deep-dive": {
        "easy": [
            {
                id: "defi_e1",
                question: "Calculate Balancer pool IL if ETH price doubles. Pool: 50% ETH, 50% USDC.",
                options: ["a) -2.5%", "b) -5.71%", "c) -8.25%", "d) -13.4%"],
                correctAnswer: "b",
                explanation: "IL in a 50/50 pool for a 2x price move is approximately 5.71%."
            }
        ],
        "medium": [
            {
                id: "defi_m1",
                question: "Aave utilization = 85%. U_opt=80%, R_base=0%, R_s1=4%, R_s2=60%. Borrow rate?",
                options: ["a) 12.5%", "b) 19.0%", "c) 27.5%", "d) 35.0%"],
                correctAnswer: "b",
                explanation: "0.04 + 0.60 * (0.85-0.80)/0.20 = 4% + 15% = 19%."
            }
        ],
        "hard": [
            {
                id: "defi_h1",
                question: "Uniswap V3 L for range [1500, 2500] at P=2000 with 1 ETH deposit?",
                options: ["a) 318.45", "b) 423.73", "c) 512.89", "d) 645.50"],
                correctAnswer: "b",
                explanation: "1 = L * (1/sqrt(2000) - 1/sqrt(2500)). L = 423.73."
            }
        ]
    }
};
