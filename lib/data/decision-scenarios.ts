
export interface DecisionScenario {
    id: string;
    market: string;
    assetClass: 'crypto' | 'stock' | 'forex';
    date: string;
    timeframe: '1m' | '15m' | '1h' | '4h' | 'Daily' | 'Weekly';
    regime: 'trend' | 'range' | 'breakout' | 'breakdown' | 'chaos';
    pauseContext: string;
    capitalOptions: number[];
    decisionOptions: string[];
    historicalOutcome: string;
    performanceImpact: string;
    behavioralInsight: string;
}

export const SCENARIOS: DecisionScenario[] = [
    // 1. BITCOIN - 2017 Top (Euphoria/Chaos)
    {
        id: "BTC-2017-TOP",
        market: "BTC/USD",
        assetClass: "crypto",
        date: "Dec 16, 2017",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "BTC has rallied vertically from $6k to $19k in weeks. Retail mania is at an all-time high; grandmothers are asking how to buy. Futures launch is imminent (CME). News is 100% bullish. Price is printing massive green candles but starting to wick longer on the top.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The absolute top. BTC crashed 30% in days, entering a year-long bear market that took it to $3k (-84%). Volatility was extreme.",
        performanceImpact: "Long 100% = Catastrophic loss. Short = Generational wealth. Reduce = Preserved capital.",
        behavioralInsight: "Rewards: Contrarian thinking & recognizing euphoria. Punishes: FOMO & 'New Paradigm' thinking. Bias: Herd mentality."
    },
    // 2. SP500 - Covid Crash Bottom (Panic)
    {
        id: "SPX-2020-COVID",
        market: "S&P 500",
        assetClass: "stock",
        date: "March 23, 2020",
        timeframe: "Daily",
        regime: "breakdown",
        pauseContext: "Global lockdowns announced. Markets have circuit-broken multiple times. VIX is above 80. Everyone predicts the end of the economy. Price is in freefall, but volume is historic. The Fed just announced unlimited QE.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The exact bottom. SPX rallied >100% over the next 18 months without retesting the low. The wildest V-shape recovery in history.",
        performanceImpact: "Long 50%+ = Career-making trade. Short = Whipsawed and crushed. Stay out = Missed opportunity.",
        behavioralInsight: "Rewards: Buying blood/panic (Buffett rule). Punishes: Linear extrapolation of bad news. Bias: Recency bias (fear)."
    },
    // 3. ETH - The Merge Run-up (Trend)
    {
        id: "ETH-2022-MERGE",
        market: "ETH/USD",
        assetClass: "crypto",
        date: "July 15, 2022",
        timeframe: "4h",
        regime: "trend",
        pauseContext: "After a brutal crash to $880, ETH reclaims $1000 and forms a higher low. Narrative is building around 'The Merge' (PoS transition). Price consolidates at resistance ($1200) with rising volume.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Breakout successful. ETH rallied to $2000 (+60%) in 4 weeks leading up to the event as a 'buy the rumor' trade.",
        performanceImpact: "Long 25% = Solid trend capture. High conviction 50% = Excellent r/r. Short = Squeezed immediately.",
        behavioralInsight: "Rewards: Narrative-driven trading. Punishes: Disbelief in trend reversals. Bias: Anchoring to previous bear lows."
    },
    // 4. EUR/USD - Parity Support (Range)
    {
        id: "EURUSD-2022-PARITY",
        market: "EUR/USD",
        assetClass: "forex",
        date: "July 2022",
        timeframe: "Daily",
        regime: "range",
        pauseContext: "Euro has dropped relentlessly to 1.0000 (Parity) for the first time in 20 years. Psychological level. Energy crisis in Europe is peaking. Everyone is bearish, expecting a flush to 0.95 immediately.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Bounced off parity initially for a multi-week relief rally to 1.03 before eventually breaking down later. A short-term mean reversion play.",
        performanceImpact: "Long (Probe) = Profitable scalp. Short (All-in) = Trapped at bottom of range. Hold = Neutral.",
        behavioralInsight: "Rewards: Respecting major psychological levels. Punishes: Shorting into major support (late bears). Bias: Gambler's fallacy."
    },
    // 5. GAMESTOP - The Short Squeeze (Chaos/Breakout)
    {
        id: "GME-2021-SQUEEZE",
        market: "GME",
        assetClass: "stock",
        date: "Jan 25, 2021",
        timeframe: "1h",
        regime: "breakout",
        pauseContext: "Stock is up 300% in a week. Mainstream media is mocking retail traders. Short interest is reported over 100%. Price is flagging at $75 after a halt. volatility is 500%.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Exploded to $480 (+540%) in days. One of the most violent short squeezes in history.",
        performanceImpact: "Long 10% (Lotto) = Massive payoff. Long 100% = extremely dangerous but lucky. Short = Liquidation.",
        behavioralInsight: "Rewards: Understanding market mechanics (squeeze). Punishes: Valuing fundamentals in a liquidity crisis. Bias: Normalcy bias."
    },
    // 6. LUNA - The Death Spiral (Breakdown)
    {
        id: "LUNA-2022-CRASH",
        market: "LUNA/USD",
        assetClass: "crypto",
        date: "May 9, 2022",
        timeframe: "1h",
        regime: "chaos",
        pauseContext: "UST peg has slipped to 0.98. LUNA is dumping (-20%). Do Kwon tweets 'Deploying more capital'. Support at $60 is breaking. Panic is setting in, but dip buyers say 'it always recovers'.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Wipeout. Price went to literally zero within 72 hours. Dip buyers were erased. The algorithmic peg failed completely.",
        performanceImpact: "Long = 100% Loss. Short = Legendary gain. Reduce/Exit = Survival.",
        behavioralInsight: "Rewards: Risk management & cutting losers fast. Punishes: Catching falling knives in systemic failure. Bias: Sunken cost fallacy."
    },
    // 7. AAPL - 2008 Financial Crisis (Trend)
    {
        id: "AAPL-2008-BOTTOM",
        market: "AAPL",
        assetClass: "stock",
        date: "Jan 2009",
        timeframe: "Weekly",
        regime: "trend",
        pauseContext: "Markets have been bleeding for a year. AAPL is down 50% from highs but showing relative strength vs market. Jobs is healthy. iPhone 3GS rumors. Price reclaims the 200-week moving average.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The start of a decade-long bull run. AAPL outperformed the entire market.",
        performanceImpact: "Long 50% = The investment of a lifetime. Short = Painful slow bleed.",
        behavioralInsight: "Rewards: Relative strength analysis. Punishes: Macro-fear paralyzing stock selection. Bias: Pessimism bias."
    },
    // 8. DOGE - The Elon Musk SNL Top (Euphoria)
    {
        id: "DOGE-2021-SNL",
        market: "DOGE/USD",
        assetClass: "crypto",
        date: "May 8, 2021",
        timeframe: "15m",
        regime: "chaos",
        pauseContext: "DOGE hits $0.74 leading into Elon Musk's SNL appearance. Crowd expects $1.00 tonight. It's the only thing trending on Twitter. Price stalls as the show begins.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Classic 'Sell the News'. Crashed 30% during the episode and never recovered that high. Down 90% in bear market.",
        performanceImpact: "Long = Holding the bag. Short = Quick profits. Reduce = Smart exit.",
        behavioralInsight: "Rewards: Selling into liquidity events. Punishes: Buy the rumor, buy the news. Bias: Confirmation bias."
    },
    // 9. NVDA - AI Breakout (Breakout)
    {
        id: "NVDA-2023-EARNINGS",
        market: "NVDA",
        assetClass: "stock",
        date: "May 24, 2023",
        timeframe: "Daily",
        regime: "breakout",
        pauseContext: "AI narrative is heating up. NVDA reports earnings after close. Stock is near ATH. Analysts are split. Implied volatility is huge.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Gapped up 25% overnight on massive guidance raise. Started a run to $1T market cap.",
        performanceImpact: "Long 25% = Huge gap winner. Short = Account blowup (gap risk).",
        behavioralInsight: "Rewards: Identifying paradigm shifts. Punishes: Fighting momentum with valuation logic. Bias: Conservatism bias."
    },
    // 10. GOLD - 2011 Top (Trend Reversal)
    {
        id: "XAU-2011-TOP",
        market: "Gold (XAU/USD)",
        assetClass: "forex",
        date: "Sept 2011",
        timeframe: "Weekly",
        regime: "trend",
        pauseContext: "Gold hits $1920. Dollar is weak. Inflation fears following QE2. Parabolic move for 10 years. Price prints a massive 'shooting star' candle on monthly timeframe.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The multi-year top. Gold corrected for 4 years down to $1050. Didn't break ATH again until 2020.",
        performanceImpact: "Long = Dead money for 9 years. Short = Great macro swing.",
        behavioralInsight: "Rewards: Technical reversal signals on high timeframes. Punishes: Perma-bull mentality. Bias: Trend-following late."
    },
    // 11. BTC - COVID Panic (Black Swan)
    {
        id: "BTC-2020-MARCH",
        market: "BTC/USD",
        assetClass: "crypto",
        date: "March 12, 2020",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "Everything is crashing. Equities -10%. BTC breaks $6k support. Miners are capitulating. Liquidity on exchanges is vanishing. Price touches $3800. Fear index is maxed.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "A wick to $3600 marked the absolute bottom before a 2-year run to $69k. V-shape recovery was instant.",
        performanceImpact: "Long 100% = Legendary entry. Short = Wrecked. Reduce = Sold the bottom.",
        behavioralInsight: "Rewards: Buying when blood is in the streets. Punishes: Panic selling spot assets. Bias: Fear-driven myopia."
    },
    // 12. TSLA - 2020 Split Run (Parabolic)
    {
        id: "TSLA-2020-SPLIT",
        market: "TSLA",
        assetClass: "stock",
        date: "Aug 2020",
        timeframe: "4h",
        regime: "chaos",
        pauseContext: "Tesla announces stock split. Retail traders are buying purely because 'split means cheaper'. Price goes vertical day after day without corrections. RSI is 92.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Continued to rally another 50% into the split date before a cooling off. Shorting early was fatal.",
        performanceImpact: "Long = Easy money. Short = Squeeze. Hold = Good.",
        behavioralInsight: "Rewards: Respecting momentum. Punishes: Applying logic to irrational markets. Bias: Greater fool theory."
    },
    // 13. GBP/USD - Flash Crash (Liquidity Crisis)
    {
        id: "GBP-2016-FLASH",
        market: "GBP/USD",
        assetClass: "forex",
        date: "Oct 7, 2016",
        timeframe: "15m",
        regime: "chaos",
        pauseContext: "Asian session, low liquidity. Brexit concerns lingering. Suddenly price slips 50 pips. Spreads widen massively. No specific news.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Collapsed 6% in minutes (1.26 to 1.14) then recovered most of it. Algo failure chain reaction.",
        performanceImpact: "Any limit order Long = Filled at varied prices usually good. Market sell = Slippage death. High leverage = Wiped.",
        behavioralInsight: "Rewards: Not trading illiquid times or using wide stops. Punishes: High leverage during thin markets. Bias: Availability heuristic."
    },
    // 14. SOL - Summer 2021 (Discovery)
    {
        id: "SOL-2021-BREAKOUT",
        market: "SOL/USD",
        assetClass: "crypto",
        date: "Aug 15, 2021",
        timeframe: "Daily",
        regime: "breakout",
        pauseContext: "SOL has been ranging $20-$40 for months. 'NFT Summer' on Solana is starting. Price breaks $45 ATH with volume. Twitter sentiment shifts to 'SOL is the ETH killer'.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The 'Solana Summer' run. Went from $45 to $260 in 3 months with barely any pullback.",
        performanceImpact: "Long 100% = Life changing. Short = Rekt. Sell early = Regret.",
        behavioralInsight: "Rewards: Riding price discovery. Punishes: Selling winners too early. Bias: Anchoring to old prices."
    },
    // 15. META - Earnings Disaster (Gap Risk)
    {
        id: "META-2022-EARNINGS",
        market: "META",
        assetClass: "stock",
        date: "Feb 2, 2022",
        timeframe: "Daily",
        regime: "breakdown",
        pauseContext: "Metaverse pivot is expensive. TikTok competition rising. Earnings call after close. Market is jittery. Stock is -3% intra-day ahead of print.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Dropped 26% overnight. Largest single-day market cap loss in history ($230B).",
        performanceImpact: "Long = Devastating loss. Short = Massive win. Flat = Safe.",
        behavioralInsight: "Rewards: Avoiding binary events (earnings gambling). Punishes: Holding risky tech through uncertainty. Bias: Optimism bias."
    },
    // 16. CRUDE OIL - Negative Prices (Anomaly)
    {
        id: "USOIL-2020-NEGATIVE",
        market: "WTI Crude",
        assetClass: "forex",
        date: "April 20, 2020",
        timeframe: "1h",
        regime: "chaos",
        pauseContext: "Futures expiry. storage is full globally. Demand is zero due to Covid. Price breaks $10. Then $1. Then $0.01. Traders think 'it can't go lower'.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Went to -$37.00. Traders buying at $0.01 were liquidated and owed brokers millions. First time in history.",
        performanceImpact: "Long = Bankruptcy. Short = Historic. Stay out = Wise.",
        behavioralInsight: "Rewards: Understanding contract specs (expiry/delivery). Punishes: 'Floor' picking in commodities. Bias: Normalcy bias."
    },
    // 17. USD/JPY - The Intervention (Reversal)
    {
        id: "USDJPY-2022-INTERVENTION",
        market: "USD/JPY",
        assetClass: "forex",
        date: "Sept 22, 2022",
        timeframe: "1h",
        regime: "trend",
        pauseContext: "Yen has weakened to 145.00. BOJ hasn't intervened since 1998. Traders are essentially longing USD for free carry. Price hits 145.90.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "BOJ Intervention. Dropped 500 pips (to 140) in minutes. The 'Widowmaker' trade struck.",
        performanceImpact: "Long = Stop hunt death. Short = Huge profit. Reduce = Smart caution.",
        behavioralInsight: "Rewards: Don't fight Central Banks. Punishes: Crowded trades at policy limits. Bias: Trend complacency."
    },
    // 18. ETH - 2018 Capitulation (Bear low)
    {
        id: "ETH-2018-LOW",
        market: "ETH/USD",
        assetClass: "crypto",
        date: "Dec 2018",
        timeframe: "Weekly",
        regime: "breakdown",
        pauseContext: "ETH is down 90% from ATH. ICOs are dumping treasuries. Influencers calling for $0. Price breaks $100 support to $80.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Bottomed at $80. Rallied to $350 in 6 months. Was the cycle low.",
        performanceImpact: "Long (DCA) = Optimal. Short = Late chaser. Panic Sell = Maximum regret.",
        behavioralInsight: "Rewards: Buying despair. Punishes: Late stage bearing. Bias: Recency bias."
    },
    // 19. AMC - Ape Army (Meme)
    {
        id: "AMC-2021-JUNE",
        market: "AMC",
        assetClass: "stock",
        date: "June 2, 2021",
        timeframe: "15m",
        regime: "chaos",
        pauseContext: "Stock halted 3 times already. Up 80% today. CEO tweeting to 'Apes'. Volume is higher than the float. Price is $60.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Hit $72 then collapsed. Slow bleed for years after.",
        performanceImpact: "Long = Top tick. Short = Dangerous volatility. Reduce = Take profit.",
        behavioralInsight: "Rewards: Taking profits into parabolic moves. Punishes: Greed at the top. Bias: Hindsight bias (hoping for GME 2.0)."
    },
    // 20. SVB - Bank Run (Systemic Fear)
    {
        id: "SVB-2023-COLLAPSE",
        market: "Regional Banks (KRE)",
        assetClass: "stock",
        date: "March 9, 2023",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "Silicon Valley Bank fails capital raise. Tech VCs telling founders to pull cash. Bank stocks crashing -10% across board. Fears of 2008 repeat.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Govt bailed out depositors over weekend. Banks rallied hard on Monday. The 'End of World' trade failed.",
        performanceImpact: "Short = Squeezed on bailout. Long = Risky but successful. Cash = Safe.",
        behavioralInsight: "Rewards: Betting on Govt intervention. Punishes: Panic shorting systemic bottoms. Bias: Availability heuristic (2008 PTSD)."
    },
    // 21. FTX - The Collapse (Fraud)
    {
        id: "FTX-2022-NOV",
        market: "FTT Token",
        assetClass: "crypto",
        date: "Nov 8, 2022",
        timeframe: "4h",
        regime: "breakdown",
        pauseContext: "Binance announces they are selling FTT. SBF says 'Assets are fine'. Price holding $22 support. Withdrawals paused rumors circulating.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Support broke. Collapsed to $2 in hours. Exchange bankruptcy filed days later.",
        performanceImpact: "Long = 100% loss (funds stuck). Short = Massive gain. Exit = Survival.",
        behavioralInsight: "Rewards: Trusting on-chain data over CEO tweets. Punishes: Loyalty to centralized entities. Bias: Authority bias."
    },
    // 22. RIPPLE - SEC Win (News Spike)
    {
        id: "XRP-2023-SEC",
        market: "XRP/USD",
        assetClass: "crypto",
        date: "July 13, 2023",
        timeframe: "15m",
        regime: "breakout",
        pauseContext: "Judge rules XRP is not a security for retail sales. Years of suppression lifting. Price jumps 20% in 1 minute at $0.47.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Doubled to $0.93 in 3 hours. Then retraced fully over months.",
        performanceImpact: "Long immediately = Profit. Wait and see = Bought top. Short = Rekt.",
        behavioralInsight: "Rewards: Speed of execution (News trading). Punishes: Hesitation. Bias: Status quo bias."
    },
    // 23. ZOOM - Pandemic Peak (Valuation)
    {
        id: "ZM-2020-TOP",
        market: "ZM",
        assetClass: "stock",
        date: "Oct 2020",
        timeframe: "Weekly",
        regime: "trend",
        pauseContext: "Essential for WFH. Trading at 100x Sales. Vaccine news rumored but cases rising. Stock is $560.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The absolute top. Vaccine announced Nov 2020. Stock fell 90% to $60 by 2023.",
        performanceImpact: "Long = Bagholder for life. Short = Career trade. Reduce = Discipline.",
        behavioralInsight: "Rewards: Valuation fundamentals eventually matter. Punishes: Extrapolating temporary trends forever. Bias: Projection bias."
    },
    // 24. LUNA 2.0 - The Rebirth (Trap)
    {
        id: "LUNA2-LAUNCH",
        market: "LUNA (v2)",
        assetClass: "crypto",
        date: "May 28, 2022",
        timeframe: "15m",
        regime: "chaos",
        pauseContext: "New chain launches after the crash. Airdrop received. Price opens at $15, spikes to $30. 'Community needs to rebuild'.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Dumped immediately to $5. Never recovered. Pure exit liquidity event.",
        performanceImpact: "Long = Loss. Sell Airdrop = Free money. Short = Unavailable.",
        behavioralInsight: "Rewards: Recognizing lost trust. Punishes: Hope. Bias: Endowment effect."
    },
    // 25. GOLD - COVID ATH (Safe Haven)
    {
        id: "XAU-2020-AUG",
        market: "Gold (XAU/USD)",
        assetClass: "forex",
        date: "Aug 6, 2020",
        timeframe: "Daily",
        regime: "trend",
        pauseContext: "Gold breaks $2000 for first time ever. Dollar collapsing ($DXY 92). Real yields negative. 'Buffett bought Gold miners'. Extreme bullishness.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Topped at $2075. Corrected to $1680 over next 6 months.",
        performanceImpact: "Long = Bought top. Short = Counter-trend win. Reduce = Good exit.",
        behavioralInsight: "Rewards: Selling extreme deviation from mean. Punishes: Chasing after 50% run. Bias: Herd behavior."
    },
    // 26. PEPE - The Meme Launch (Lottery)
    {
        id: "PEPE-2023-MANIA",
        market: "PEPE/USD",
        assetClass: "crypto",
        date: "May 5, 2023",
        timeframe: "1h",
        regime: "chaos",
        pauseContext: "Binance listing announced. Market cap hits $1.5B in weeks. Everyone is looking for 'Next Pepe'. Gas fees on ETH are $100.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Listing marked the local top. Correction of 70% followed for months.",
        performanceImpact: "Long = Exit liquidity. Short = Good (if available). Sell = Perfect timing.",
        behavioralInsight: "Rewards: Selling the listing news. Punishes: Buying the top of hype cycle. Bias: Survivor bias."
    },
    // 27. ARKK - The Innovation Bubble (Pop)
    {
        id: "ARKK-2021-TOP",
        market: "ARKK ETF",
        assetClass: "stock",
        date: "Feb 12, 2021",
        timeframe: "Daily",
        regime: "trend",
        pauseContext: "Cathie Wood is hailed as newly Buffett. Fund is up 150% in a year. Flows are record breaking. Price hits $155.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The peak. Interest rate fears started. Fund fell 80% to $30 over 2 years.",
        performanceImpact: "Long = Destroyed savings. Short = Easy trend follow down. Reduce = Saved portfolio.",
        behavioralInsight: "Rewards: Recognizing euphoria in unprofitable tech. Punishes: Hero worship. Bias: Halo effect."
    },
    // 28. EUR/CHF - The Peg Break (Black Swan)
    {
        id: "EURCHF-2015-SNB",
        market: "EUR/CHF",
        assetClass: "forex",
        date: "Jan 15, 2015",
        timeframe: "1m",
        regime: "range",
        pauseContext: "SNB has pegged Franc to Euro at 1.20 for years. Traders treat 1.2000 as a hard floor, putting massive longs with tight stops just below.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "SNB unexpectedly removed peg. Price dropped 1.20 -> 0.85 in one minute (-30%). Brokers went bankrupt. Stops were not honored.",
        performanceImpact: "Long = Balance wiped (negative balance). Short = Millionaire. No position = Lucky.",
        behavioralInsight: "Rewards: Diversification. Punishes: Trusting Central Bank guarantees fully. Bias: Illusion of control."
    },
    // 29. MATIC - L2 Scaling Run (Fundamentals)
    {
        id: "MATIC-2021-RUN",
        market: "MATIC/USD",
        assetClass: "crypto",
        date: "April 26, 2021",
        timeframe: "Daily",
        regime: "breakout",
        pauseContext: "Ethereum fees are unbearable ($50 per swap). Polygon (MATIC) rebrands and offers cheap txs. Aave launches on Polygon. Price is $0.35 breaking out.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Fundamental driver + Utility. Rallied to $2.70 (8x) in 4 weeks.",
        performanceImpact: "Long 50% = Massive winner. Short = Ran over. Wait = Missed entry.",
        behavioralInsight: "Rewards: Utility-driven thesis in crypto. Punishes: Ignoring user friction (Eth fees). Bias: Status quo bias (Eth purism)."
    },
    // 30. TLT - Bond Crash (Macro)
    {
        id: "TLT-2023-CRASH",
        market: "TLT (20yr Treasuries)",
        assetClass: "stock",
        date: "Oct 2023",
        timeframe: "Weekly",
        regime: "trend",
        pauseContext: "Fed 'higher for longer'. Yields hitting 5%. TLT down 50% from highs. Everyone hates bonds. 'Bill Ackman is short'.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Marked the bottom of the yield scare. TLT rallied 20% in Q4 2023.",
        performanceImpact: "Long = Contrarian win. Short = Caught at bottom. Hold = Pain relief.",
        behavioralInsight: "Rewards: Fading extreme sentiment. Punishes: Late shorts. Bias: Recency bias."
    },
    // 31. UNISWAP - The Airdrop (Stimulus)
    {
        id: "UNI-2020-AIRDROP",
        market: "UNI/USD",
        assetClass: "crypto",
        date: "Sept 17, 2020",
        timeframe: "1h",
        regime: "chaos",
        pauseContext: "Uniswap launches token unexpectedly. Airdrops 400 UNI to every user. Price opens $3. Everyone is dumping for 'free money'.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Dumped to $2 initially, then ripped to $8 in days as selling exhausted and hype took over. Later $40.",
        performanceImpact: "Sell immediately = modest cash. Hold/Buy = Massive gain. Short = Rekt.",
        behavioralInsight: "Rewards: Patience with free assets. Punishes: Instant gratification. Bias: Hyperbolic discounting."
    },
    // 32. COIN - IPO Top (Sell News)
    {
        id: "COIN-2021-IPO",
        market: "COIN",
        assetClass: "stock",
        date: "April 14, 2021",
        timeframe: "Daily",
        regime: "breakout",
        pauseContext: "Coinbase goes public via DPO. Bitcoin is at $64k ATH. Peak euphoria. Valuation opens at $85B ($380/share).",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Marked the exact top of the 2021 Crypto bull market (Part 1). Stock drifted to $32 (-90%) over next 18 months.",
        performanceImpact: "Long = Disaster. Avoid = Wisdom. Short = Legendary.",
        behavioralInsight: "Rewards: Recognizing cycle peaks. Punishes: Buying hype at peak valuation. Bias: Social proof."
    },
    // 33. TRY - Lira Collapse (Currency Crisis)
    {
        id: "USDTRY-2021-CRISIS",
        market: "USD/TRY",
        assetClass: "forex",
        date: "Dec 2021",
        timeframe: "Daily",
        regime: "trend",
        pauseContext: "Erdogan cuts rates despite 20% inflation. Lira is freefalling. USD/TRY goes 10 -> 18 in weeks. Locals panicking into Dollars/Crypto.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Govt announced 'Lira protection scheme'. USD/TRY crashed 18 -> 11 in hours (massive reversal). Shorting USD late was fatal.",
        performanceImpact: "Long USD early = Safe. Long USD late = Wrecked. Short = Lucky.",
        behavioralInsight: "Rewards: Policy awareness. Punishes: Chasing parabolic moves where Govt has painful incentive to intervene. Bias: Trend extrapolation."
    },
    // 34. NKLA - Fraud Report (Short Report)
    {
        id: "NKLA-2020-HINDENBURG",
        market: "NKLA",
        assetClass: "stock",
        date: "Sept 10, 2020",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "Nikola is rivaling Ford in market cap with $0 revenue. Hindenburg Research releases report: 'Ocean of Lies'. Claims truck rolling down hill was staged.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Stock collapsed 40% in days, CEO resigned. Delisted/Pennystock later.",
        performanceImpact: "Long = Loss. Short = Win. Hold = Denial.",
        behavioralInsight: "Rewards: Skepticism & Research. Punishes: Blind faith in 'next Tesla'. Bias: Confirmation bias."
    },
    // 35. LINK - DeFi Summer (Outperformance)
    {
        id: "LINK-2020-SUMMER",
        market: "LINK/USD",
        assetClass: "crypto",
        date: "Aug 8, 2020",
        timeframe: "Daily",
        regime: "trend",
        pauseContext: "DeFi is booming. Every protocol needs an Oracle. LINK is the only player. Price breaks $10 ATH. 'LINK Marines' are strongest community.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Went parabolic to $20 in a week. Short squeeze + spot buying. Classic discovery run.",
        performanceImpact: "Long = Easy 2x. Short = Squeeze. Partial profit = Good.",
        behavioralInsight: "Rewards: Buying the leader of a sector. Punishes: Fading strong momentum. Bias: Anchoring."
    },
    // 36. SAND - Metaverse Hype (Narrative)
    {
        id: "SAND-2021-FB",
        market: "SAND/USD",
        assetClass: "crypto",
        date: "Oct 28, 2021",
        timeframe: "1h",
        regime: "breakout",
        pauseContext: "Facebook changes name to 'Meta'. Zuckerberg validates Metaverse. Gaming tokens (MANA, SAND) start moving. Price $0.80.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The strongest narrative trade of the year. SAND went $0.80 -> $8.00 (10x) in 4 weeks.",
        performanceImpact: "Long = 10x return. Ignore = Opportunity cost. Short = Suicide.",
        behavioralInsight: "Rewards: Identifying validation events. Punishes: Ignoring narrative shifts. Bias: Conservatism."
    },
    // 37. OIL - 2008 Spike (Bubble)
    {
        id: "USOIL-2008-PEAK",
        market: "WTI Crude",
        assetClass: "forex",
        date: "July 2008",
        timeframe: "Weekly",
        regime: "trend",
        pauseContext: "Peak Oil theory. China demand insatiable. Oil hits $147/barrel. Goldman predicts $200. Gas prices crushing consumers.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The GFC hit. Demand collapsed. Oil fell $147 -> $30 in 5 months (-80%).",
        performanceImpact: "Long = Account wipeout. Short = Career maker. Reduce = Survival.",
        behavioralInsight: "Rewards: Macro awareness (Recession vs Commodity). Punishes: Linear thinking. Bias: Trend projection."
    },
    // 38. BNB - BSC Boom (Utility)
    {
        id: "BNB-2021-BSC",
        market: "BNB/USD",
        assetClass: "crypto",
        date: "Feb 2021",
        timeframe: "Daily",
        regime: "breakout",
        pauseContext: "ETH gas is too high. Binance Smart Chain (BSC) launches PancakeSwap. Cheap degen farming. BNB is required for gas. Price $50.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Rallied $50 -> $600 in 3 months. Massive utility driven demand spike.",
        performanceImpact: "Long 50% = Life changing. Short = Rekt. Ignore = Missed trend.",
        behavioralInsight: "Rewards: Following user migration/incentives. Punishes: Snobbery (centralized chain hate). Bias: In-group bias."
    },
    // 39. VW - Short Squeeze 2008 (The Mother of Squeezes)
    {
        id: "VW-2008-SQUEEZE",
        market: "Volkswagen (DAX)",
        assetClass: "stock",
        date: "Oct 26, 2008",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "Porsche reveals they own 74% of VW. Lower Saxony owns 20%. Float is <6%. Short interest is 12%. Shorts are mathematically trapped.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Stock rose 400% in 2 days to €1000. Briefly largest company in world. Hedge funds collapsed.",
        performanceImpact: "Long = Lottery win. Short = Death. Hold = Win.",
        behavioralInsight: "Rewards: Mechanics > Fundamentals. Punishes: Shorting low float. Bias: Neglect of probability."
    },
    // 40. PTON - Lockdown Boom (Stay at Home)
    {
        id: "PTON-2020-LOCKDOWN",
        market: "PTON",
        assetClass: "stock",
        date: "Sept 2020",
        timeframe: "Weekly",
        regime: "trend",
        pauseContext: "Gyms are closed. Everyone buying Pelotons. Order backlog is months long. Stock hits $100. Analysts say 'New normal'.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Topped at $170 Jan 2021. Then crashed to $4 by 2024 as gyms reopened.",
        performanceImpact: "Long = Good for 3 months, then disaster. Short (2021) = Huge win. Reduce = Smart.",
        behavioralInsight: "Rewards: Selling cyclical peaks. Punishes: Confusing temporary tailwinds with permanent shifts. Bias: Extrapolation."
    },
    // 41. RUBLE - War Sanctions (Geopolitics)
    {
        id: "USDRUB-2022-WAR",
        market: "USD/RUB",
        assetClass: "forex",
        date: "Feb 28, 2022",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "Ukraine invasion begins. West freezes Russian Central Bank reserves. Ruble crashes 30% gap open. Russians queuing at ATMs.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Went to 150. Then capital controls + oil payments forced it back to 50 (stronger than pre-war). Volatility was un-tradable for most.",
        performanceImpact: "Long USD = Win then Loss. Short USD (later) = Win. Avoid = Best (Liquidity risk).",
        behavioralInsight: "Rewards: Staying out of war zones. Punishes: Trading broken markets. Bias: Action bias."
    },
    // 42. SHIB - The Top (Mania)
    {
        id: "SHIB-2021-OCT",
        market: "SHIB/USD",
        assetClass: "crypto",
        date: "Oct 27, 2021",
        timeframe: "4h",
        regime: "chaos",
        pauseContext: "SHIB flips DOGE market cap. Coinbase crashes due to volume. Retail frenzy absolute peak. Up 1000% in a month.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "The absolute top. Slow bleed -90% followed. Classic blow-off top pattern.",
        performanceImpact: "Long = Bagholding. Sell = Life changing. Short = Dangerous but profitable.",
        behavioralInsight: "Rewards: Selling into liquidity. Punishes: Greed. Bias: Herd mentality."
    },
    // 43. NDX - Bear Market Rally (Trap)
    {
        id: "NDX-2022-AUG",
        market: "Nasdaq 100",
        assetClass: "stock",
        date: "Aug 16, 2022",
        timeframe: "Daily",
        regime: "trend",
        pauseContext: "Tech stocks rally 20% off June lows. Inflation seems cooling. 'Pivot' narrative. Price hits 200 DMA resistance. Powell Jackson Hole speech imminent.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Powell hawkish speech ('Pain'). Market reversed and made new lows in October. Classic bull trap.",
        performanceImpact: "Long = Trapped. Short = Perfect entry. Reduce = Prudent.",
        behavioralInsight: "Rewards: Don't fight the Fed (still hiking). Punishes: Premature pivoting. Bias: Optimism."
    },
    // 44. AXS - Play To Earn (Ponzi Dynamics)
    {
        id: "AXS-2021-PEAK",
        market: "AXS",
        assetClass: "crypto",
        date: "Nov 2021",
        timeframe: "Daily",
        regime: "trend",
        pauseContext: "People in Philippines earning living wage playing Axie. Token at $160. Staking APY 100%. User growth plateauing but hype maxed.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Collapsed to $4. Economy became unsustainable as new user growth slowed. Death spiral.",
        performanceImpact: "Long = ReKT. Short = Win. Sell = Smart.",
        behavioralInsight: "Rewards: analyzing tokenomics sustainability. Punishes: Ponzi participation late. Bias: Bandwagon effect."
    },
    // 45. BBBY - Ryan Cohen Pump (Retail Liquidity)
    {
        id: "BBBY-2022-AUG",
        market: "BBBY",
        assetClass: "stock",
        date: "Aug 17, 2022",
        timeframe: "1h",
        regime: "chaos",
        pauseContext: "Stock up 400% in weeks. Ryan Cohen (GME chair) bought calls. Retail is all-in. News drops after close: Cohen filed to sell EVERYTHING.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Stock crashed 50% next day. Eventually bankrupt. Cohen exited on retail liquidity.",
        performanceImpact: "Long = Bagholder. Short = Win. Sell immediately = Survival.",
        behavioralInsight: "Rewards: Reading SEC filings (Form 144). Punishes: Following gurus blindly. Bias: Authority bias."
    },
    // 46. KODK - Pharma Pivots (Meaningless Hype)
    {
        id: "KODK-2020-PUMP",
        market: "KODK",
        assetClass: "stock",
        date: "July 29, 2020",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "Camera company Kodak announces 'crypto' pivot (failed) now announces 'Pharma' pivot for COVID drug ingredients. Stock halts up 1500% in 2 days.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Top was transient. Insider trading investigation. Stock fell back to $5 range mostly.",
        performanceImpact: "Long >$40 = Dead money. Short = Risky but right. Trade volatility = Scalp.",
        behavioralInsight: "Rewards: Skepticism of zombie companies pivoting. Punishes: FOMO. Bias: Framing effect."
    },
    // 47. 2024 BTC ETF - Sell the News (Correction)
    {
        id: "BTC-2024-ETF",
        market: "BTC/USD",
        assetClass: "crypto",
        date: "Jan 11, 2024",
        timeframe: "1h",
        regime: "chaos",
        pauseContext: "Spot ETF approved yesterday. Trading launch day. Volume huge. Price spikes to $49k. Grayscale unlocking GBTC selling pressure feared.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Sold off to $38.5k (-20%) over next 2 weeks before resuming structural bull run to $73k.",
        performanceImpact: "Long = Drawdown (but recovered). Short = Quick scalp. Wait = Better entry.",
        behavioralInsight: "Rewards: Expecting flow dynamics (GBTC unlock). Punishes: Buying tops of news events. Bias: Confirmation bias."
    },
    // 48. NVDA - Crypto Hangover (Cycle Low)
    {
        id: "NVDA-2018-CRASH",
        market: "NVDA",
        assetClass: "stock",
        date: "Nov 2018",
        timeframe: "Weekly",
        regime: "breakdown",
        pauseContext: "Crypto bubble popped. GPU inventory flooding secondary market. Earnings guidance cut. Stock down 50% from high.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Bottomed near $120 (split adj much lower). Buying here was buying one of greatest compounds ever. ",
        performanceImpact: "Long = Wealth. Short = Temporary win vs long term pain.",
        behavioralInsight: "Rewards: Cylcical awareness in semis. Punishes: Thinking cycle low is permanent death. Bias: Recency."
    },
    // 49. DJT - Truth Social (Meme/Political)
    {
        id: "DJT-2024-LAUNCH",
        market: "DJT (DWAC)",
        assetClass: "stock",
        date: "March 26, 2024",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "Merger complete. Ticker changes to DJT. Trump net worth jumps billions. Stock trading on pure political sentiment, detached from revenue ($4M rev vs $9B cap).",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Spiked to $79 then bled to $25 over months. Highly volatile proxy for election odds.",
        performanceImpact: "Long = Loss (unless scalped). Short = Expensive borrow but profitable. Avoid = Peace.",
        behavioralInsight: "Rewards: Structural shorting of overvalued hype. Punishes: Political bias in trading. Bias: Affect heuristic."
    },
    // 50. SMCI - AI Volatility (Gamma Squeeze)
    {
        id: "SMCI-2024-FEB",
        market: "SMCI",
        assetClass: "stock",
        date: "Feb 16, 2024",
        timeframe: "15m",
        regime: "chaos",
        pauseContext: "Up 300% in a month. Gamma squeeze. Hits $1000. Friday OpEx. RSI is 98. Vertical parabola.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Reversed -20% in a single day ($1070 -> $800). The fever broke.",
        performanceImpact: "Long at top = Instant -20%. Short = Scary but huge win. Reduce = Perfect.",
        behavioralInsight: "Rewards: Recognizing blow-off tops. Punishes: Chasing parabolic extensions. Bias: Hot hand fallacy."
    },
    // 51. GBP - Black Wednesday (Soros)
    {
        id: "GBP-1992-SOROS",
        market: "GBP/USD",
        assetClass: "forex",
        date: "Sept 16, 1992",
        timeframe: "Daily",
        regime: "breakdown",
        pauseContext: "BoE is hiking rates to 15% to defend the peg. Soros is selling billions. Price is hovering at the floor of the ERM band. UK Treasury is bleeding reserves.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "UK exited ERM. Pound crashed 15% in absolute freefall. Soros made $1B.",
        performanceImpact: "Long = Crushed. Short = The greatest trade ever. Hold = Loss.",
        behavioralInsight: "Rewards: Analyzing macro fundamentals vs political will. Punishes: Believing politicians defending a broken peg. Bias: Authority bias."
    },
    // 52. CITI - Financial Crisis Bottom (Deep Value)
    {
        id: "C-2009-BOTTOM",
        market: "Citigroup (C)",
        assetClass: "stock",
        date: "March 5, 2009",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "Stock is trading at $0.97. Down from $50. 'Nationalization' rumors are rampant. Everyone says banks are zero. Market cap is <$6B.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Marked the generational bottom. Rallied 400% in months. Gov bailout confirmed.",
        performanceImpact: "Long 10% = Massive gain. Short = Squeezed at the bottom. Long 100% = Gambling.",
        behavioralInsight: "Rewards: Buying option value on major assets. Punishes: Shorting penny stocks of systemically important firms. Bias: Recency bias."
    },
    // 53. SPX - Flash Crash 2010 (Algo)
    {
        id: "SPX-2010-FLASH",
        market: "S&P 500 E-mini",
        assetClass: "stock",
        date: "May 6, 2010",
        timeframe: "1m",
        regime: "chaos",
        pauseContext: "Market is down 2% on Greek news. Suddenly, liquidity evaporates. E-mini drops 5% in 2 minutes. P&G drops 25%. Accenture trades at $0.01.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Rebounded 600 points in 10 minutes. Trades at irrational prices were cancelled, but index trades stood.",
        performanceImpact: "Limit Order Longs = Fills of a lifetime. Market Sell = Disastrous slippage.",
        behavioralInsight: "Rewards: Calibrated limit orders. Punishes: Panic market selling. Bias: Availability cascade."
    },
    // 54. CHINA - Devaluation 2015 (Black Swan)
    {
        id: "CNY-2015-DEVAL",
        market: "USD/CNY",
        assetClass: "forex",
        date: "Aug 11, 2015",
        timeframe: "Daily",
        regime: "breakout",
        pauseContext: "PBOC surprisingly devalues Yuan by 2%. Global markets panic. S&P 500 futures limit down. 'China Hard Landing' fears.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Sparked a global correction (S&P down 10%). Yuan trended weaker for years.",
        performanceImpact: "Short Risk Assets = Win. Long Volatility = Win. Long China = Loss.",
        behavioralInsight: "Rewards: Macro shock reaction. Punishes: Complacency in low vol regimes. Bias: Normalcy bias."
    },
    // 55. XIV - Volmageddon (Structure Failure)
    {
        id: "XIV-2018-DEATH",
        market: "XIV (Short VIX ETF)",
        assetClass: "stock",
        date: "Feb 5, 2018",
        timeframe: "Daily",
        regime: "chaos",
        pauseContext: "VIX spikes from 10 to 30. XIV product rebalancing rules trigger massive buying of VIX futures at close. Price at $90.",
        capitalOptions: [0, 10, 25, 50, 100],
        decisionOptions: ["long", "short", "hold", "reduce"],
        historicalOutcome: "Product imploded 96% after hours to $4. Terminated. A $2B fund went to zero in one evening.",
        performanceImpact: "Long = 100% Loss. Short = Legendary. Hold = Zero.",
        behavioralInsight: "Rewards: Reading the prospectus (acceleration clauses). Punishes: Picking up pennies in front of steamroller. Bias: Survivor bias."
    }
];
