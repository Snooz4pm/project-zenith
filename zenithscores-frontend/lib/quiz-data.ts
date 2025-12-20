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
    // === EXISTING QUIZZES ===
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
    },

    // === NEW QUIZZES (14 Total) ===

    // -- Market Analyst --
    "valuation-basics": {
        "easy": [{
            id: "val-1",
            question: "In a Discounted Cash Flow model, what does WACC stand for?",
            options: ["a) Weighted Average Cost of Capital", "b) Weighted Asset Capital Cost", "c) Working Asset Capital Calculation", "d) Weighted Average Credit Cost"],
            correctAnswer: "a",
            explanation: "WACC = Weighted Average Cost of Capital. It's the average rate a company pays to finance its assets."
        }],
        "medium": [{
            id: "val-2",
            question: "Which multiple is most appropriate for valuing a pre-revenue biotech company?",
            options: ["a) P/E Ratio", "b) EV/Revenue", "c) P/S Ratio", "d) Price/Book Value"],
            correctAnswer: "c",
            explanation: "P/S (Price to Sales) or EV/Revenue multiples work for pre-revenue companies where earnings are negative."
        }],
        "hard": [{
            id: "val-3",
            question: "In a DCF model, the Terminal Value typically represents what percentage of total valuation?",
            options: ["a) 20-30%", "b) 40-60%", "c) 60-80%", "d) 80-90%"],
            correctAnswer: "c",
            explanation: "Terminal Value often comprises 60-80% of total DCF valuation due to perpetuity assumptions."
        }]
    },
    "financial-modeling": {
        "easy": [{
            id: "fm-1",
            question: "What Excel shortcut creates an absolute reference ($)?",
            options: ["a) F2", "b) F4", "c) Ctrl+Shift+$", "d) Alt+F4"],
            correctAnswer: "b",
            explanation: "F4 toggles through reference types: A1 → $A$1 → A$1 → $A1"
        }],
        "medium": [{
            id: "fm-2",
            question: "Which is NOT a best practice for financial models?",
            options: ["a) Using hardcoded numbers in formulas", "b) Separating inputs, calculations, and outputs", "c) Documenting assumptions clearly", "d) Building error checks"],
            correctAnswer: "a",
            explanation: "Hardcoded numbers should be in input cells, not embedded in formulas."
        }],
        "hard": [{
            id: "fm-3",
            question: "A circular reference in a financial model is typically solved by:",
            options: ["a) Removing the reference", "b) Enabling iterative calculation", "c) Using a macro", "d) All of the above"],
            correctAnswer: "b",
            explanation: "Iterative calculation allows Excel to solve circular references, often used in interest expense calculations."
        }]
    },
    "macro-economics": {
        "easy": [{
            id: "macro-1",
            question: "What tool do central banks use for quantitative easing?",
            options: ["a) Lowering reserve requirements", "b) Buying government bonds", "c) Issuing government bonds", "d) Raising interest rates"],
            correctAnswer: "b",
            explanation: "QE involves central banks purchasing government bonds to increase money supply."
        }],
        "medium": [{
            id: "macro-2",
            question: "The Taylor Rule helps determine what?",
            options: ["a) Optimal tax rates", "b) Appropriate interest rates", "c) GDP growth targets", "d) Inflation ceilings"],
            correctAnswer: "b",
            explanation: "The Taylor Rule suggests appropriate interest rates based on inflation and output gaps."
        }],
        "hard": [{
            id: "macro-3",
            question: "An inverted yield curve has historically predicted:",
            options: ["a) Hyperinflation", "b) Recession", "c) Stock market boom", "d) Currency devaluation"],
            correctAnswer: "b",
            explanation: "Yield curve inversion (short rates > long rates) is a reliable recession indicator."
        }]
    },
    "investment-writing": {
        "easy": [{
            id: "inv-write-1",
            question: "What is the most critical part of an investment memo?",
            options: ["a) The Executive Summary", "b) The Financial Model", "c) The Appendix", "d) The Risk Factors"],
            correctAnswer: "a",
            explanation: "Most decision makers only read the summary. It must convey the entire thesis."
        }],
        "medium": [{
            id: "inv-write-2",
            question: "Which structure is best for a 'Short' thesis?",
            options: ["a) Catalyst-driven", "b) Valuation-driven", "c) Forensic accounting-driven", "d) All of the above"],
            correctAnswer: "d",
            explanation: "A robust short thesis typically combines multiple angles: business model, accounting, and valuation."
        }],
        "hard": [{
            id: "inv-write-3",
            question: "When presenting a 'Variant View', you are:",
            options: ["a) Agreeing with consensus", "b) Explaining why the market is wrong", "c) Hedging your position", "d) Summarizing analyst reports"],
            correctAnswer: "b",
            explanation: "Variant View explains the gap between your analysis and the market consensus."
        }]
    },

    // -- Data / Research --
    "stat-arb-basics": {
        "easy": [{
            id: "stat-arb-1",
            question: "Mean reversion assumes prices will move towards:",
            options: ["a) Zero", "b) The Average", "c) Infinity", "d) The Previous High"],
            correctAnswer: "b",
            explanation: "Mean reversion assumes asset prices fluctuate around a long-term average."
        }],
        "medium": [{
            id: "stat-arb-2",
            question: "A Z-Score of +2.0 implies the price is:",
            options: ["a) 2% above average", "b) 2 standard deviations above mean", "c) Double the average", "d) Undervalued"],
            correctAnswer: "b",
            explanation: "Z-Score measures standard deviations from the mean."
        }],
        "hard": [{
            id: "stat-arb-3",
            question: "Cointegration testing is used to:",
            options: ["a) Find correlated assets", "b) Find assets that move together in the long run", "c) Measure volatility", "d) Backtest strategies"],
            correctAnswer: "b",
            explanation: "Cointegration ensures the spread between two assets is mean-reverting."
        }]
    },
    "algo-python-intro": {
        "easy": [{
            id: "algo-py-1",
            question: "Which Python library is standard for data manipulation?",
            options: ["a) NumPy", "b) Pandas", "c) Matplotlib", "d) Scikit-learn"],
            correctAnswer: "b",
            explanation: "Pandas provides the DataFrame structure essential for time-series data."
        }],
        "medium": [{
            id: "algo-py-2",
            question: "Vectorization in Python helps to:",
            options: ["a) Draw charts", "b) Speed up calculations", "c) Connect to APIs", "d) Write data to SQL"],
            correctAnswer: "b",
            explanation: "Vectorized operations replace slow loops with optimized C-level array operations."
        }],
        "hard": [{
            id: "algo-py-3",
            question: "In backtesting, look-ahead bias occurs when:",
            options: ["a) You use future data to make decisions", "b) You optimize parameters too much", "c) You ignore transaction costs", "d) You use wrong time zone"],
            correctAnswer: "a",
            explanation: "Look-ahead bias invalidates results by using information not available at trade time."
        }]
    },
    "market-microstructure": {
        "easy": [{
            id: "micro-1",
            question: "Liquidity refers to:",
            options: ["a) Amount of cash in account", "b) Ease of entering/exiting positions", "c) Dividend yield", "d) Market cap"],
            correctAnswer: "b",
            explanation: "High liquidity means you can trade large size without moving the price."
        }],
        "medium": [{
            id: "micro-2",
            question: "The 'Spread' is the difference between:",
            options: ["a) Open and Close", "b) High and Low", "c) Bid and Ask", "d) VWAP and TWAP"],
            correctAnswer: "c",
            explanation: "Bid-Ask spread represents the transaction cost demanded by market makers."
        }],
        "hard": [{
            id: "micro-3",
            question: "Iceberg orders are used to:",
            options: ["a) Freeze the market", "b) Hide large order size", "c) Execute at specific time", "d) Stop hunt"],
            correctAnswer: "b",
            explanation: "Iceberg orders display only a small visible portion to avoid revealing full intent."
        }]
    },

    // -- Systematic Trading --
    "system-design": {
        "easy": [{
            id: "sys-des-1",
            question: "A trading system must have clear rules for:",
            options: ["a) Entry only", "b) Exit only", "c) Entry, Exit, and Sizing", "d) Indicator selection"],
            correctAnswer: "c",
            explanation: "A complete system defines exactly when to enter, exactly when to exit, and how much to trade."
        }],
        "medium": [{
            id: "sys-des-2",
            question: "What is 'Curve Fitting'?",
            options: ["a) Optimizing strategy to past noise", "b) Drawing trendlines", "c) Adjusting chart scale", "d) Smoothing moving averages"],
            correctAnswer: "a",
            explanation: "Curve fitting (overfitting) creates rules that work perfectly in the past but fail in the future."
        }],
        "hard": [{
            id: "sys-des-3",
            question: "Monte Carlo simulation helps assess:",
            options: ["a) Profit potential", "b) Robustness and drawdown risk", "c) Execution speed", "d) Code efficiency"],
            correctAnswer: "b",
            explanation: "Shuffling trade order helps reveal potential worst-case drawdowns."
        }]
    },
    "backtest-rigor": {
        "easy": [{
            id: "backtest-1",
            question: "Out-of-sample testing means:",
            options: ["a) Testing on data not used for optimization", "b) Testing on live account", "c) Testing with random entries", "d) Testing on different asset"],
            correctAnswer: "a",
            explanation: "Using unseen data verifies the strategy didn't just memorize the training set."
        }],
        "medium": [{
            id: "backtest-2",
            question: "Survivorship bias in backtesting leads to:",
            options: ["a) Underestimating returns", "b) Overestimating returns", "c) Higher volatility", "d) Lower Sharpe ratio"],
            correctAnswer: "b",
            explanation: "Ignoring delisted (failed) stocks makes historical performance look better than reality."
        }],
        "hard": [{
            id: "backtest-3",
            question: "Walk-forward analysis involves:",
            options: ["a) Re-optimizing on a rolling window", "b) Predicting tomorrow's price", "c) Step-by-step code debugging", "d) Manual paper trading"],
            correctAnswer: "a",
            explanation: "It mimics real-life trading by periodically re-optimizing parameters on recent data."
        }]
    },
    "modern-portfolio-theory": {
        "easy": [{
            id: "mpt-1",
            question: "Diversification aims to reduce:",
            options: ["a) Returns", "b) Unsystematic Risk", "c) Transaction costs", "d) Taxes"],
            correctAnswer: "b",
            explanation: "Diversification removes asset-specific risk, leaving only market risk."
        }],
        "medium": [{
            id: "mpt-2",
            question: "The Efficient Frontier represents portfolios with:",
            options: ["a) Highest return for given risk", "b) Lowest return", "c) Zero risk", "d) Highest leverage"],
            correctAnswer: "a",
            explanation: "Portfolios on the frontier are mathematically optimal."
        }],
        "hard": [{
            id: "mpt-3",
            question: "Correlation of -1.0 between two assets means:",
            options: ["a) They move together", "b) They move exactly opposite", "c) No relationship", "d) One is leverage"],
            correctAnswer: "b",
            explanation: "Perfect negative correlation allows for perfect hedging."
        }]
    },
    "execution-algos": {
        "easy": [{
            id: "exec-1",
            question: "VWAP stands for:",
            options: ["a) Volume Weighted Average Price", "b) Volatility Weighted Average Price", "c) Value Weighted Asset Price", "d) Variable Weighted Average Price"],
            correctAnswer: "a",
            explanation: "VWAP is a benchmark used to measure execution quality."
        }],
        "medium": [{
            id: "exec-2",
            question: "A TWAP algorithm executes orders based on:",
            options: ["a) Volume profile", "b) Time intervals", "c) Price levels", "d) Volatility"],
            correctAnswer: "b",
            explanation: "Time Weighted Average Price slices orders evenly over time."
        }],
        "hard": [{
            id: "exec-3",
            question: "Implementation Shortfall measures:",
            options: ["a) Slippage vs. Arrival Price", "b) Commission costs", "c) Algorithm speed", "d) Market impact only"],
            correctAnswer: "a",
            explanation: "It captures the total cost of trading including delay, slippage, and fees."
        }]
    },

    // -- Execution Trader --
    "order-flow-dynamics": {
        "easy": [{
            id: "of-1",
            question: "Absorption in order flow typically indicates:",
            options: ["a) Price reversal", "b) Passive Limit orders absorbing Aggressive Market orders", "c) Lack of interest", "d) Market closure"],
            correctAnswer: "b",
            explanation: "Large limit orders 'soaking up' buying/selling pressure often stop a trend."
        }],
        "medium": [{
            id: "of-2",
            question: "Delta in order flow refers to:",
            options: ["a) Option sensitivity", "b) Net difference between Ask vs Bid volume", "c) Change in price", "d) Time decay"],
            correctAnswer: "b",
            explanation: "Positive Delta means more aggressive buying; Negative means aggressive selling."
        }],
        "hard": [{
            id: "of-3",
            question: "A 'Sweep' order is characterized by:",
            options: ["a) Passive entry", "b) Executing against multiple price levels instantly", "c) Hidden size", "d) Cancelled orders"],
            correctAnswer: "b",
            explanation: "Sweeps consume all liquidity at best price and move to next levels immediately."
        }]
    },
    "intraday-risk-mgmt": {
        "easy": [{
            id: "risk-intra-1",
            question: "The max loss per day rule is designed to prevent:",
            options: ["a) Taxes", "b) Emotional tilt", "c) High commissions", "d) Boredom"],
            correctAnswer: "b",
            explanation: "Hitting a hard stop for the day prevents 'revenge trading' spiraling."
        }],
        "medium": [{
            id: "risk-intra-2",
            question: "Scaling out of a position reduces:",
            options: ["a) Risk exposure", "b) Max profit potential", "c) Both A and B", "d) Neither"],
            correctAnswer: "c",
            explanation: "Booking partial profits secures gains (reducing risk) but lowers total potential win."
        }],
        "hard": [{
            id: "risk-intra-3",
            question: "Gamma risk is highest for options traders:",
            options: ["a) Far from expiration", "b) At the money near expiration", "c) Deep in the money", "d) Out of the money"],
            correctAnswer: "b",
            explanation: "Price sensitivity explodes near expiration for ATM options, requiring tight risk control."
        }]
    },

    // -- Macro Observer --
    "monetary-policy": {
        "easy": [{
            id: "mon-pol-1",
            question: "Expansionary monetary policy typically involves:",
            options: ["a) Raising rates", "b) Lowering rates", "c) Increasing taxes", "d) Decreasing spending"],
            correctAnswer: "b",
            explanation: "Lowering rates encourages borrowing and spending."
        }],
        "medium": [{
            id: "mon-pol-2",
            question: "'Hawkish' sentiment implies the central bank is worried about:",
            options: ["a) Inflation", "b) Unemployment", "c) Deflation", "d) Growth"],
            correctAnswer: "a",
            explanation: "Hawks want to raise rates to fight inflation."
        }],
        "hard": [{
            id: "mon-pol-3",
            question: "Real Interest Rate is calculated as:",
            options: ["a) Nominal Rate - Inflation", "b) Nominal Rate + Inflation", "c) Libor + Spread", "d) 10Y Yield"],
            correctAnswer: "a",
            explanation: "Real rates determine the true cost of borrowing/return on saving."
        }]
    },
    "cross-asset-correlations": {
        "easy": [{
            id: "corr-1",
            question: "Typically, when the USD strengthens, commodities:",
            options: ["a) Rise", "b) Fall", "c) Stay flat", "d) Double"],
            correctAnswer: "b",
            explanation: "Commodities priced in dollars become more expensive for foreign buyers, reducing demand."
        }],
        "medium": [{
            id: "corr-2",
            question: "Rising bond yields generally are negative for:",
            options: ["a) Bank stocks", "b) Growth/Tech stocks", "c) Cash", "d) Insurance companies"],
            correctAnswer: "b",
            explanation: "Higher discount rates hurt valuations of long-duration growth assets most."
        }],
        "hard": [{
            id: "corr-3",
            question: "Risk On / Risk Off sentiment describes:",
            options: ["a) Individual stock picking", "b) Global capital flow between safety and growth", "c) Retail trading", "d) Options hedging"],
            correctAnswer: "b",
            explanation: "In Risk Off, capital flees stocks/emerging markets into Bonds/USD/Yen."
        }]
    },
    "geopolitics-markets": {
        "easy": [{
            id: "geo-1",
            question: "Geopolitical tension in the Middle East typically spikes:",
            options: ["a) Wheat prices", "b) Oil prices", "c) Tech stocks", "d) Lumber"],
            correctAnswer: "b",
            explanation: "Supply disruption fears drive oil prices up."
        }],
        "medium": [{
            id: "geo-2",
            question: "Safe haven assets include:",
            options: ["a) Bitcoin, Tesla, AUD", "b) Gold, USD, CHF", "c) Copper, Oil, CAD", "d) Real Estate"],
            correctAnswer: "b",
            explanation: "Gold, US Dollar, and Swiss Franc are traditional safety plays."
        }],
        "hard": [{
            id: "geo-3",
            question: "Sanctions on a major commodity exporter lead to:",
            options: ["a) Global supply glut", "b) Global supply shock and price rise", "c) Reduced volatility", "d) No impact"],
            correctAnswer: "b",
            explanation: "Removing supply from the global market forces prices up."
        }]
    },
    "market-cycles": {
        "easy": [{
            id: "cycle-1",
            question: "The four stages of a market cycle are:",
            options: ["a) Up, Down, Left, Right", "b) Accumulation, Markup, Distribution, Markdown", "c) Buy, Sell, Hold, Fold", "d) Boom, Bust, Bang, Whimper"],
            correctAnswer: "b",
            explanation: "Wyckoff market cycle theory."
        }],
        "medium": [{
            id: "cycle-2",
            question: "Late cycle economy is characterized by:",
            options: ["a) Low inflation", "b) Tight labor market and rising inflation", "c) High unemployment", "d) Rate cuts"],
            correctAnswer: "b",
            explanation: "Economy overheats before the recession."
        }],
        "hard": [{
            id: "cycle-3",
            question: "Kondratiev waves refer to:",
            options: ["a) Intraday noise", "b) 50-60 year economic supercycles", "c) Elliot waves", "d) Seasonal trends"],
            correctAnswer: "b",
            explanation: "Long-term technological and debt cycles."
        }]
    }
};
