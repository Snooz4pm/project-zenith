'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Target, Shield, ArrowRight, BarChart2, X, Info } from 'lucide-react';
import { generateSignalExplanation, getQuickStats, type SignalData } from '@/lib/signals/transparency-engine';

export default function SignalsTable() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedSignal, setSelectedSignal] = useState<typeof signals[0] | null>(null);
    const [showMathModal, setShowMathModal] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const signals = [
        {
            id: 1,
            symbol: 'BTC/USDT',
            name: 'Bitcoin',
            icon: '₿',
            color: 'bg-[#f7931a]/20 text-[#f7931a]',
            price: 43250.00,
            score: 85,
            signal: 'BUY',
            signalType: 'momentum-breakout',
            timeframe: '4H',
            entry: 42800,
            target: 45000,
            stopLoss: 41500
        },
        {
            id: 2,
            symbol: 'ETH/USDT',
            name: 'Ethereum',
            icon: 'Ξ',
            color: 'bg-[#627eea]/20 text-[#627eea]',
            price: 2285.50,
            score: 78,
            signal: 'BUY',
            signalType: 'mean-reversion',
            timeframe: '1H',
            entry: 2270,
            target: 2380,
            stopLoss: 2200
        },
        {
            id: 3,
            symbol: 'SOL/USDT',
            name: 'Solana',
            icon: '◎',
            color: 'bg-[#14f195]/20 text-[#14f195]',
            price: 98.45,
            score: 65,
            signal: 'SELL',
            signalType: 'trend-following',
            timeframe: '15M',
            entry: 99.20,
            target: 95.50,
            stopLoss: 101.00
        },
        {
            id: 4,
            symbol: 'BNB/USDT',
            name: 'Binance Coin',
            icon: 'B',
            color: 'bg-[#f3ba2f]/20 text-[#f3ba2f]',
            price: 312.80,
            score: 72,
            signal: 'BUY',
            signalType: 'support-resistance',
            timeframe: '1D',
            entry: 310.00,
            target: 325.00,
            stopLoss: 305.00
        },
        {
            id: 5,
            symbol: 'XRP/USDT',
            name: 'Ripple',
            icon: 'X',
            color: 'bg-[#23a8db]/20 text-[#23a8db]',
            price: 0.6245,
            score: 58,
            signal: 'BUY',
            signalType: 'volatility-breakout',
            timeframe: '4H',
            entry: 0.6180,
            target: 0.6450,
            stopLoss: 0.6050
        }
    ];

    const handleShowMath = (signal: typeof signals[0]) => {
        setSelectedSignal(signal);
        setShowMathModal(true);
    };

    const getSignalExplanation = (signal: typeof signals[0]) => {
        const signalData: SignalData = {
            id: signal.id.toString(),
            symbol: signal.symbol,
            direction: signal.signal === 'BUY' ? 'long' : 'short',
            type: signal.signalType,
            strength: signal.score,
            timeframe: signal.timeframe,
            entryPrice: signal.entry,
            targetPrice: signal.target,
            stopLoss: signal.stopLoss
        };
        return generateSignalExplanation(signalData);
    };

    return (
        <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Active Signals
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Live</span>
                </h2>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="bg-[#141829] border border-[#1a1f3a] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#1a1f3a]/50 text-left">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Asset</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Signal</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Targets</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Analysis</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1f3a]">
                            {signals.map((signal) => (
                                <motion.tr
                                    key={signal.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-[#1a1f3a]/30 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${signal.color}`}>
                                                {signal.icon}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{signal.name}</div>
                                                <div className="text-xs text-gray-500">{signal.symbol}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-white">${signal.price.toLocaleString()}</div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <Clock size={12} />
                                            {signal.timeframe}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`
                                            inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg
                                            ${signal.score >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                signal.score >= 60 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-400 border border-red-500/20'}
                                        `}>
                                            {signal.score}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`
                                            inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
                                            ${signal.signal === 'BUY'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'}
                                        `}>
                                            {signal.signal === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {signal.signal}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-gray-500">Entry:</span>
                                                <span className="text-white font-mono">${signal.entry.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-green-500/70 flex items-center gap-1"><Target size={10} /> TP:</span>
                                                <span className="text-green-400 font-mono">${signal.target.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-red-500/70 flex items-center gap-1"><Shield size={10} /> SL:</span>
                                                <span className="text-red-400 font-mono">${signal.stopLoss.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleShowMath(signal);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <BarChart2 size={14} />
                                            Show Math
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-[#1a1f3a] bg-[#1a1f3a]/20">
                    <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors group">
                        View All Technical Signals
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Transparency Modal */}
            <AnimatePresence>
                {showMathModal && selectedSignal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowMathModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#141829] border border-[#1a1f3a] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <BarChart2 className="text-cyan-400" />
                                    Signal Transparency: {selectedSignal.symbol}
                                </h2>
                                <button
                                    onClick={() => setShowMathModal(false)}
                                    className="text-gray-500 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {(() => {
                                const explanation = getSignalExplanation(selectedSignal);
                                return (
                                    <div className="space-y-4">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-500 uppercase">Historical Signals</div>
                                                <div className="text-xl font-bold text-white">{explanation.statistics.historicalOccurrences.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-500 uppercase">Win Rate</div>
                                                <div className="text-xl font-bold text-emerald-400">{explanation.statistics.winRate}%</div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-500 uppercase">Avg Profit</div>
                                                <div className="text-xl font-bold text-green-400">+{explanation.statistics.avgProfit}%</div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-500 uppercase">Max Drawdown</div>
                                                <div className="text-xl font-bold text-red-400">-{explanation.statistics.maxDrawdown}%</div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-500 uppercase">Sharpe Ratio</div>
                                                <div className="text-xl font-bold text-cyan-400">{explanation.statistics.sharpeRatio}</div>
                                            </div>
                                        </div>

                                        {/* Edge Source */}
                                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                                                <Info size={16} />
                                                Edge Source
                                            </div>
                                            <p className="text-gray-300 text-sm">{explanation.edgeSource}</p>
                                        </div>

                                        {/* Technical Rationale */}
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <div className="font-semibold text-white mb-2">Technical Rationale</div>
                                            <p className="text-gray-400 text-sm">{explanation.technicalRationale}</p>
                                        </div>

                                        {/* Risk Warning */}
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                            <p className="text-yellow-400 text-sm">{explanation.riskWarning}</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            <button
                                onClick={() => setShowMathModal(false)}
                                className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

