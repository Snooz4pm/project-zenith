'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, TrendingUp, BarChart3, Lightbulb, Clock, Bot } from 'lucide-react';
import Link from 'next/link';
import WeeklySummary from '@/components/WeeklySummary';
import TradeFeedbackCard from '@/components/TradeFeedbackCard';
import BrutalCoachCard from '@/components/BrutalCoachCard';
import PremiumWall from '@/components/PremiumWall';
import { isPremiumUser } from '@/lib/premium';
import { generateTradeFeedback, generateWeeklySummary, type Trade, type TradeFeedback, type WeeklySummary as WeeklySummaryType } from '@/lib/coaching-engine';

export default function TradingCoachPage() {
    const [premium, setPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [feedbacks, setFeedbacks] = useState<TradeFeedback[]>([]);
    const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryType | null>(null);

    useEffect(() => {
        setPremium(isPremiumUser());
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            const sessionId = localStorage.getItem('zenith_trading_session') || 'demo-user';
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
            const res = await fetch(`${apiUrl}/api/v1/trading/history?session_id=${sessionId}&limit=50`);
            const data = await res.json();

            if (data.trades) {
                // Filter to only sell trades (closed positions) for feedback
                const closedTrades = data.trades.filter((t: Trade) => t.trade_type === 'sell');
                setTrades(closedTrades);

                // Generate feedback for each trade
                const allFeedbacks = closedTrades.map((t: Trade) => generateTradeFeedback(t));
                setFeedbacks(allFeedbacks);

                // Generate weekly summary
                setWeeklySummary(generateWeeklySummary(closedTrades));
            }
        } catch (error) {
            console.error('Failed to fetch trades:', error);
            // Generate demo data
            generateDemoData();
        } finally {
            setLoading(false);
        }
    };

    const generateDemoData = () => {
        const demoTrades: Trade[] = [
            { id: 1, symbol: 'BTC', trade_type: 'sell', quantity: 0.1, price_at_execution: 95000, realized_pnl: 450, executed_at: new Date().toISOString(), leverage: 2 },
            { id: 2, symbol: 'ETH', trade_type: 'sell', quantity: 2, price_at_execution: 3400, realized_pnl: -120, executed_at: new Date().toISOString(), leverage: 1 },
            { id: 3, symbol: 'SOL', trade_type: 'sell', quantity: 10, price_at_execution: 220, realized_pnl: 280, executed_at: new Date().toISOString(), leverage: 3 },
            { id: 4, symbol: 'NVDA', trade_type: 'sell', quantity: 5, price_at_execution: 140, realized_pnl: 85, executed_at: new Date().toISOString(), leverage: 1 },
            { id: 5, symbol: 'TSLA', trade_type: 'sell', quantity: 3, price_at_execution: 420, realized_pnl: -210, executed_at: new Date().toISOString(), leverage: 2 },
        ];

        setTrades(demoTrades);
        setFeedbacks(demoTrades.map(t => generateTradeFeedback(t)));
        setWeeklySummary(generateWeeklySummary(demoTrades));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading coach...</div>
            </div>
        );
    }

    // Non-premium: Show preview + paywall
    if (!premium) {
        return (
            <div className="min-h-screen bg-[#0a0a12] text-white">
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/trading" className="text-sm text-gray-500 hover:text-cyan-400 mb-2 inline-block">
                            ← Back to Trading
                        </Link>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <GraduationCap className="text-purple-400" />
                            Trading Coach
                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">Premium</span>
                        </h1>
                        <p className="text-gray-400 mt-2">AI-powered feedback to improve your trading</p>
                    </div>

                    {/* Preview (blurred) */}
                    <div className="relative mb-8">
                        <div className="blur-sm pointer-events-none opacity-50">
                            {weeklySummary && <WeeklySummary summary={weeklySummary} />}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="w-12 h-12 text-purple-400" />
                        </div>
                    </div>

                    {/* Premium Wall */}
                    <PremiumWall
                        stocksLocked={0}
                        onUnlock={() => setPremium(true)}
                    />
                </div>
            </div>
        );
    }

    // Premium: Full coach access
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/trading" className="text-sm text-gray-500 hover:text-cyan-400 mb-2 inline-block">
                        ← Back to Trading
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <GraduationCap className="text-purple-400" />
                        Trading Coach
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Active</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Your personalized trading feedback</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Weekly Summary (Left/Top) */}
                    <div className="lg:col-span-2">
                        {weeklySummary && <WeeklySummary summary={weeklySummary} />}
                    </div>

                    {/* Quick Stats (Right) */}
                    <div className="space-y-4">
                        {/* Brutal Coach */}
                        <BrutalCoachCard />

                        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                <Lightbulb size={14} className="text-yellow-400" />
                                Quick Insights
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Trades analyzed</span>
                                    <span className="text-white font-bold">{feedbacks.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Avg grade</span>
                                    <span className="text-cyan-400 font-bold">
                                        {feedbacks.length > 0 ? feedbacks[0].grade : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Top asset</span>
                                    <span className="text-white font-bold">
                                        {weeklySummary?.bestTrade?.symbol || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-purple-400 mb-2">💡 Coach Tip</h4>
                            <p className="text-xs text-gray-400">
                                {weeklySummary && weeklySummary.winRate < 50
                                    ? "Focus on waiting for better setups rather than forcing trades."
                                    : "Great win rate! Consider increasing position sizes on high-conviction trades."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trade Feedbacks */}
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-cyan-400" />
                        Recent Trade Feedback
                    </h3>

                    {feedbacks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                            No closed trades yet. Complete some trades to get feedback!
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {feedbacks.slice(0, 6).map((feedback) => (
                                <TradeFeedbackCard key={feedback.tradeId} feedback={feedback} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
