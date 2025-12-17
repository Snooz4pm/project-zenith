'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy, TrendingUp, TrendingDown, Users, Crown,
    Lock, CheckCircle, AlertTriangle, ChevronRight, Zap
} from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';

interface TopTrader {
    id: string;
    name: string;
    rank: number;
    weeklyPnl: number;
    winRate: number;
    copiers: number;
    openTrades: TradeSignal[];
    verified: boolean;
}

interface TradeSignal {
    id: string;
    symbol: string;
    direction: 'long' | 'short';
    entryPrice: number;
    currentPrice: number;
    pnlPercent: number;
    leverage: number;
    openedAt: Date;
}

const DEMO_TRADERS: TopTrader[] = [
    {
        id: 't1',
        name: 'CryptoKing99',
        rank: 1,
        weeklyPnl: 15.4,
        winRate: 78,
        copiers: 42,
        verified: true,
        openTrades: [
            { id: 'tr1', symbol: 'BTC', direction: 'long', entryPrice: 94500, currentPrice: 95200, pnlPercent: 0.74, leverage: 2, openedAt: new Date(Date.now() - 1000 * 60 * 60) },
        ],
    },
    {
        id: 't2',
        name: 'TradingMaster',
        rank: 2,
        weeklyPnl: 12.8,
        winRate: 72,
        copiers: 31,
        verified: true,
        openTrades: [
            { id: 'tr2', symbol: 'ETH', direction: 'long', entryPrice: 3380, currentPrice: 3420, pnlPercent: 1.18, leverage: 1, openedAt: new Date(Date.now() - 1000 * 60 * 120) },
            { id: 'tr3', symbol: 'SOL', direction: 'long', entryPrice: 215, currentPrice: 222, pnlPercent: 3.26, leverage: 2, openedAt: new Date(Date.now() - 1000 * 60 * 30) },
        ],
    },
    {
        id: 't3',
        name: 'BullRunner',
        rank: 3,
        weeklyPnl: 9.2,
        winRate: 68,
        copiers: 18,
        verified: false,
        openTrades: [],
    },
];

export default function CloneTrading() {
    const [premium, setPremium] = useState(false);
    const [traders, setTraders] = useState<TopTrader[]>(DEMO_TRADERS);
    const [selectedTrader, setSelectedTrader] = useState<TopTrader | null>(null);
    const [clonedTraders, setClonedTraders] = useState<string[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        setPremium(isPremiumUser());

        // Load cloned traders from localStorage
        const stored = localStorage.getItem('zenith_cloned_traders');
        if (stored) setClonedTraders(JSON.parse(stored));
    }, []);

    const handleClone = (traderId: string) => {
        const updated = clonedTraders.includes(traderId)
            ? clonedTraders.filter(id => id !== traderId)
            : [...clonedTraders, traderId];

        setClonedTraders(updated);
        localStorage.setItem('zenith_cloned_traders', JSON.stringify(updated));
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 2000);
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Crown size={14} className="text-yellow-400" />;
        if (rank === 2) return <span className="text-gray-300 font-bold">#2</span>;
        if (rank === 3) return <span className="text-orange-400 font-bold">#3</span>;
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    };

    if (!premium) {
        return (
            <div className="relative rounded-2xl border border-white/10 bg-[#1a1a2e]/80 p-5 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-10 flex flex-col items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-sm text-white font-bold">Clone Trading</p>
                    <p className="text-[10px] text-gray-400">Copy top traders' positions</p>
                </div>
                <div className="blur-sm opacity-40">
                    <div className="h-20 bg-white/5 rounded-xl mb-3" />
                    <div className="h-20 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                        <Copy size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Clone Trading</h3>
                        <p className="text-[10px] text-gray-500">Copy top performers</p>
                    </div>
                </div>
                <span className="text-xs text-cyan-400">{clonedTraders.length} cloned</span>
            </div>

            {/* Confirmation Toast */}
            <AnimatePresence>
                {showConfirmation && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-4 mt-2 p-2 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-2"
                    >
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-xs text-green-400">Clone settings updated!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Traders */}
            <div className="p-4 space-y-3">
                {traders.map((trader) => (
                    <motion.div
                        key={trader.id}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedTrader?.id === trader.id
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                        onClick={() => setSelectedTrader(selectedTrader?.id === trader.id ? null : trader)}
                    >
                        {/* Trader Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 flex justify-center">{getRankBadge(trader.rank)}</div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-white">{trader.name}</span>
                                        {trader.verified && <CheckCircle size={10} className="text-cyan-400" />}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <span>{trader.winRate}% win</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5">
                                            <Users size={10} />
                                            {trader.copiers}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className={`text-sm font-bold font-mono ${trader.weeklyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {trader.weeklyPnl >= 0 ? '+' : ''}{trader.weeklyPnl}%
                                </span>
                                <p className="text-[10px] text-gray-500">this week</p>
                            </div>
                        </div>

                        {/* Expanded View */}
                        <AnimatePresence>
                            {selectedTrader?.id === trader.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    {/* Open Trades */}
                                    {trader.openTrades.length > 0 ? (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
                                                <Zap size={10} className="text-cyan-400" />
                                                OPEN POSITIONS
                                            </p>
                                            <div className="space-y-2">
                                                {trader.openTrades.map((trade) => (
                                                    <div key={trade.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                                                        <div className="flex items-center gap-2">
                                                            {trade.direction === 'long' ? (
                                                                <TrendingUp size={12} className="text-green-400" />
                                                            ) : (
                                                                <TrendingDown size={12} className="text-red-400" />
                                                            )}
                                                            <span className="text-xs font-bold text-white">{trade.symbol}</span>
                                                            <span className="text-[10px] text-gray-500">{trade.leverage}x</span>
                                                        </div>
                                                        <span className={`text-xs font-mono ${trade.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-xs text-gray-500 text-center py-2">No open positions</p>
                                        </div>
                                    )}

                                    {/* Clone Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClone(trader.id);
                                        }}
                                        className={`w-full mt-3 py-2 rounded-lg font-medium text-sm transition-all ${clonedTraders.includes(trader.id)
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                                            }`}
                                    >
                                        {clonedTraders.includes(trader.id) ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <CheckCircle size={14} />
                                                Cloning Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Copy size={14} />
                                                Clone This Trader
                                            </span>
                                        )}
                                    </button>

                                    {/* Warning */}
                                    <p className="text-[10px] text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
                                        <AlertTriangle size={10} className="text-yellow-400" />
                                        Paper trading only. Past performance ≠ future results.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
