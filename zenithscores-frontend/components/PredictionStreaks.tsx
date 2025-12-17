'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, TrendingUp, TrendingDown, Clock, CheckCircle, X,
    Award, Zap, Lock, ChevronDown
} from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';
import { createPrediction, type Prediction } from '@/lib/pulse-engine';

const STORAGE_KEY = 'zenith_predictions';

interface PredictionCardProps {
    assets?: { symbol: string; score: number; price: number }[];
}

export default function PredictionStreaks({ assets = [] }: PredictionCardProps) {
    const [premium, setPremium] = useState(false);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [direction, setDirection] = useState<'up' | 'down'>('up');
    const [timeframe, setTimeframe] = useState<'3h' | '24h' | '7d'>('24h');

    // Demo assets if none provided
    const demoAssets = assets.length > 0 ? assets : [
        { symbol: 'BTC', score: 85, price: 95000 },
        { symbol: 'ETH', score: 78, price: 3400 },
        { symbol: 'NVDA', score: 92, price: 140 },
        { symbol: 'TSLA', score: 72, price: 420 },
        { symbol: 'SOL', score: 80, price: 220 },
    ];

    useEffect(() => {
        setPremium(isPremiumUser());

        // Load predictions from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Convert date strings back to Date objects
            setPredictions(parsed.map((p: any) => ({
                ...p,
                createdAt: new Date(p.createdAt),
                expiresAt: new Date(p.expiresAt),
            })));
        }
    }, []);

    const handleSubmitPrediction = () => {
        if (!selectedSymbol) return;

        const userId = localStorage.getItem('zenith_trading_session') || 'demo-user';
        const newPrediction = createPrediction(userId, selectedSymbol, direction, timeframe);

        const updated = [newPrediction, ...predictions].slice(0, 10); // Keep last 10
        setPredictions(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        setShowForm(false);
        setSelectedSymbol('');
    };

    // Calculate streak stats
    const completedPredictions = predictions.filter(p => p.result && p.result !== 'pending');
    const correctPredictions = completedPredictions.filter(p => p.result === 'correct');
    const accuracy = completedPredictions.length > 0
        ? Math.round((correctPredictions.length / completedPredictions.length) * 100)
        : 0;

    // Calculate current streak
    let currentStreak = 0;
    for (const p of completedPredictions) {
        if (p.result === 'correct') currentStreak++;
        else break;
    }

    if (!premium) {
        return (
            <div className="relative rounded-2xl border border-white/10 bg-[#1a1a2e]/80 p-5 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-10 flex flex-col items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-sm text-white font-bold">Prediction Streaks</p>
                    <p className="text-[10px] text-gray-400">Predict prices, track accuracy</p>
                </div>
                <div className="blur-sm opacity-40">
                    <div className="h-20 bg-white/5 rounded-xl mb-3" />
                    <div className="h-12 bg-white/5 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] p-5"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                        <Target size={18} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Prediction Streaks</h3>
                        <p className="text-[10px] text-gray-500">Test your market intuition</p>
                    </div>
                </div>

                {/* Accuracy Badge */}
                <div className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                    <span className="text-sm font-bold text-cyan-400">{accuracy}%</span>
                    <span className="text-xs text-gray-500 ml-1">accuracy</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded-lg bg-white/5 text-center">
                    <p className="text-lg font-bold text-white">{predictions.filter(p => p.result === 'pending').length}</p>
                    <p className="text-[10px] text-gray-500">Active</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10 text-center">
                    <p className="text-lg font-bold text-green-400">{correctPredictions.length}</p>
                    <p className="text-[10px] text-gray-500">Correct</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10 text-center">
                    <p className="text-lg font-bold text-orange-400">{currentStreak}</p>
                    <p className="text-[10px] text-gray-500">Streak 🔥</p>
                </div>
            </div>

            {/* New Prediction Form */}
            <AnimatePresence>
                {showForm ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="p-3 rounded-xl bg-white/5 space-y-3">
                            {/* Asset Select */}
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">ASSET</label>
                                <select
                                    value={selectedSymbol}
                                    onChange={(e) => setSelectedSymbol(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                >
                                    <option value="">Select asset...</option>
                                    {demoAssets.map((a) => (
                                        <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Direction */}
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">DIRECTION</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setDirection('up')}
                                        className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${direction === 'up'
                                                ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                                                : 'bg-white/5 text-gray-400'
                                            }`}
                                    >
                                        <TrendingUp size={14} /> UP
                                    </button>
                                    <button
                                        onClick={() => setDirection('down')}
                                        className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${direction === 'down'
                                                ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                                                : 'bg-white/5 text-gray-400'
                                            }`}
                                    >
                                        <TrendingDown size={14} /> DOWN
                                    </button>
                                </div>
                            </div>

                            {/* Timeframe */}
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">TIMEFRAME</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['3h', '24h', '7d'] as const).map((tf) => (
                                        <button
                                            key={tf}
                                            onClick={() => setTimeframe(tf)}
                                            className={`py-1.5 rounded-lg text-xs transition-all ${timeframe === tf
                                                    ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                                                    : 'bg-white/5 text-gray-400'
                                                }`}
                                        >
                                            {tf}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitPrediction}
                                    disabled={!selectedSymbol}
                                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-bold disabled:opacity-50"
                                >
                                    Submit Prediction
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full py-3 mb-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-400 font-medium hover:from-purple-500/30 hover:to-cyan-500/30 transition-all"
                    >
                        + Make a Prediction
                    </button>
                )}
            </AnimatePresence>

            {/* Recent Predictions */}
            <div>
                <p className="text-[10px] text-gray-500 mb-2">RECENT PREDICTIONS</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {predictions.length === 0 ? (
                        <p className="text-center text-xs text-gray-500 py-4">No predictions yet</p>
                    ) : (
                        predictions.slice(0, 5).map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <div className="flex items-center gap-2">
                                    {p.direction === 'up' ? (
                                        <TrendingUp size={14} className="text-green-400" />
                                    ) : (
                                        <TrendingDown size={14} className="text-red-400" />
                                    )}
                                    <span className="text-sm font-bold text-white">{p.symbol}</span>
                                    <span className="text-xs text-gray-500">{p.timeframe}</span>
                                </div>
                                <div>
                                    {p.result === 'pending' ? (
                                        <Clock size={14} className="text-yellow-400" />
                                    ) : p.result === 'correct' ? (
                                        <CheckCircle size={14} className="text-green-400" />
                                    ) : (
                                        <X size={14} className="text-red-400" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}
