'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Calendar, BrainCircuit, Activity } from 'lucide-react';

type Timeframe = 'TODAY' | 'WEEK' | 'MONTH';

interface MarketData {
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number;
    volume_change: string;
    volatility: string;
    description: string;
}

const MARKET_DATA: Record<Timeframe, MarketData> = {
    TODAY: {
        sentiment: 'NEUTRAL',
        score: 52,
        volume_change: '+5.2%',
        volatility: 'Low',
        description: "Markets are pausing after yesterday's rally. Crypto volume is consolidating while Tech stocks show mild weakness."
    },
    WEEK: {
        sentiment: 'BULLISH',
        score: 68,
        volume_change: '+12.4%',
        volatility: 'Moderate',
        description: "Strong structural uptrend confirmed. Institutional net inflows have been positive for 4 consecutive days."
    },
    MONTH: {
        sentiment: 'BEARISH',
        score: 41,
        volume_change: '-8.1%',
        volatility: 'High',
        description: "Macro-economic headwinds are suppressing long-term risk appetite. Major resistance levels remain unbroken."
    }
};

const FORECAST = {
    prediction: "Accumulation Phase",
    confidence: 87,
    outlook: "Zenith algorithms detect a silent accumulation phase in major L1 tokens. Expect a breakout attempt within 48-72 hours if Bitcoin holds $62k.",
    target_sectors: ["Layer 1 Crypto", "AI Hardware Stocks"]
};

export default function MarketPulse() {
    const [activeTab, setActiveTab] = useState<Timeframe>('TODAY');
    const data = MARKET_DATA[activeTab];

    const getSentimentColor = (s: string) => {
        if (s === 'BULLISH') return 'text-zenith-green';
        if (s === 'BEARISH') return 'text-zenith-red';
        return 'text-zenith-yellow';
    };

    const getSentimentIcon = (s: string) => {
        if (s === 'BULLISH') return <TrendingUp className="w-5 h-5 text-zenith-green" />;
        if (s === 'BEARISH') return <TrendingDown className="w-5 h-5 text-zenith-red" />;
        return <Minus className="w-5 h-5 text-zenith-yellow" />;
    };

    return (
        <section className="container mx-auto px-6 py-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* LEFT: Market Context (Historical/Current) */}
                <div className="glass-panel p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className="text-zenith-blue w-6 h-6" />
                        <h2 className="text-2xl font-bold text-white font-heading">Market Pulse</h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 bg-black/20 p-1 rounded-lg w-max backdrop-blur-sm border border-white/5">
                        {(['TODAY', 'WEEK', 'MONTH'] as Timeframe[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-300 ${activeTab === tab
                                        ? 'bg-zinc-800 text-white shadow-lg'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-mono flex items-center gap-2 ${getSentimentColor(data.sentiment)}`}>
                                    {getSentimentIcon(data.sentiment)}
                                    {data.sentiment}
                                </div>
                                <span className="text-gray-500 text-sm font-mono">
                                    Vigor Score: <span className="text-white">{data.score}/100</span>
                                </span>
                            </div>
                        </div>

                        <p className="text-xl text-gray-200 leading-relaxed font-light border-l-2 border-zenith-blue/50 pl-6">
                            "{data.description}"
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Volume Delta</div>
                                <div className="text-lg font-mono text-white">{data.volume_change}</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Volatility</div>
                                <div className="text-lg font-mono text-white">{data.volatility}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT: Zenith Forecast (Predictive) */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                    <div className="relative glass-panel p-8 rounded-2xl h-full border-t border-blue-500/30">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600/20 p-2 rounded-lg">
                                    <BrainCircuit className="text-blue-400 w-6 h-6 animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-bold text-white font-heading">Zenith Forecast</h2>
                            </div>
                            <div className="text-xs font-mono text-blue-300 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-500/30">
                                AI CONFIDENCE: {FORECAST.confidence}%
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Next 48 Hours</h3>
                                <div className="text-3xl font-bold text-white mb-2">{FORECAST.prediction}</div>
                                <p className="text-blue-100/80 leading-relaxed">
                                    {FORECAST.outlook}
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-blue-900/10 to-transparent p-1 rounded-xl">
                                <div className="glass-panel p-4 rounded-lg bg-black/60">
                                    <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                                        Target Sectors
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {FORECAST.target_sectors.map(sector => (
                                            <span key={sector} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-sm text-gray-300 font-mono hover:bg-white/10 transition-colors cursor-default">
                                                {sector}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500 font-mono">
                                <span>Model: Z-Score v4.2</span>
                                <span>Updated: Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
