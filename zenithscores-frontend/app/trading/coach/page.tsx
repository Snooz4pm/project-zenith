'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Lightbulb, Clock, Brain } from 'lucide-react';
import Link from 'next/link';
import WeeklySummary from '@/components/WeeklySummary';
import TradeFeedbackCard from '@/components/TradeFeedbackCard';
import BrutalCoachCard from '@/components/BrutalCoachCard';
import TradingCoachEmptyState from '@/components/TradingCoachEmptyState';
import ThreeHourPulse from '@/components/ThreeHourPulse';
import CloneTrading from '@/components/CloneTrading';
import PredictionStreaks from '@/components/PredictionStreaks';
import { isPremiumUser } from '@/lib/premium';
import { generateTradeFeedback, generateWeeklySummary, type Trade, type TradeFeedback, type WeeklySummary as WeeklySummaryType } from '@/lib/coaching-engine';

interface QuotaInfo {
    used: number;
    limit: number;
    remaining: number;
    isPremium: boolean;
}

export default function TradingCoachPage() {
    const [premium, setPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [feedbacks, setFeedbacks] = useState<TradeFeedback[]>([]);
    const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryType | null>(null);
    const [quota, setQuota] = useState<QuotaInfo>({
        used: 0,
        limit: 5,
        remaining: 5,
        isPremium: false
    });

    useEffect(() => {
        const isPremium = isPremiumUser();
        setPremium(isPremium);
        fetchTrades();
        // Load quota from localStorage or API
        loadQuota(isPremium);
    }, []);

    const loadQuota = async (isPremiumUser: boolean) => {
        // Get daily quota from localStorage
        const today = new Date().toISOString().split('T')[0];
        const storedQuota = localStorage.getItem('ai_quota');

        if (storedQuota) {
            const parsed = JSON.parse(storedQuota);
            if (parsed.date === today) {
                setQuota({
                    used: parsed.used,
                    limit: 5,
                    remaining: 5 - parsed.used,
                    isPremium: isPremiumUser
                });
                return;
            }
        }

        // Reset for new day
        localStorage.setItem('ai_quota', JSON.stringify({ date: today, used: 0 }));
        setQuota({
            used: 0,
            limit: 5,
            remaining: 5,
            isPremium: isPremiumUser
        });
    };

    const fetchTrades = async () => {
        try {
            const sessionId = localStorage.getItem('trading_session_id');
            if (!sessionId) {
                setLoading(false);
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
            const res = await fetch(`${apiUrl}/api/v1/trading/history/${sessionId}?limit=50`);
            const data = await res.json();

            if (data.status === 'success' && data.data) {
                // Filter to only sell trades (closed positions) for feedback
                const closedTrades = data.data.filter((t: Trade) => t.trade_type === 'sell');
                setTrades(closedTrades);

                // Generate feedback for each trade
                const allFeedbacks = closedTrades.map((t: Trade) => generateTradeFeedback(t));
                setFeedbacks(allFeedbacks);

                // Generate weekly summary
                setWeeklySummary(generateWeeklySummary(closedTrades));
            }
        } catch (error) {
            console.error('Failed to fetch trades:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading coach...</div>
            </div>
        );
    }

    // No trades yet - Show the beautiful empty state
    if (trades.length === 0) {
        return (
            <div className="min-h-screen bg-[#0a0a12] text-white ">
                <div className="container mx-auto px-4 md:px-6 py-8">
                    <TradingCoachEmptyState
                        quota={quota}
                        onStartSession={() => { }}
                    />
                </div>
            </div>
        );
    }

    // Has trades - Full coach access
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white ">
            <div className="container mx-auto px-4 md:px-6 py-8">
                {/* Status Bar */}
                {!premium && (
                    <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Brain size={18} className="text-purple-400" />
                            <span className="text-sm text-gray-400">
                                AI Credits: <span className="text-white font-bold">{quota.remaining}</span> / {quota.limit} today
                            </span>
                        </div>
                        <Link
                            href="/coach#pricing"
                            className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-400 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                        >
                            Upgrade for Unlimited
                        </Link>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Weekly Summary (Left/Top) */}
                    <div className="lg:col-span-2 space-y-6">
                        <ThreeHourPulse />
                        {weeklySummary && <WeeklySummary summary={weeklySummary} />}

                        <div className="grid md:grid-cols-2 gap-6">
                            <PredictionStreaks />
                            <CloneTrading />
                        </div>
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

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {feedbacks.slice(0, 6).map((feedback) => (
                            <TradeFeedbackCard key={feedback.tradeId} feedback={feedback} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
