'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain, Zap, Target, Flame, TrendingUp, Lock,
    ChevronRight, BarChart3, Award, Infinity as InfinityIcon, Play, Crown
} from 'lucide-react';
import Link from 'next/link';
import { isPremiumUser } from '@/lib/premium';

interface QuotaInfo {
    used: number;
    limit: number;
    remaining: number;
    isPremium: boolean;
}

interface TradingCoachEmptyStateProps {
    quota?: QuotaInfo;
    onStartSession?: () => void;
}

export default function TradingCoachEmptyState({ quota, onStartSession }: TradingCoachEmptyStateProps) {
    const [isPremium, setIsPremium] = useState(false);
    const [currentQuota, setCurrentQuota] = useState<QuotaInfo>({
        used: 0,
        limit: 5,
        remaining: 5,
        isPremium: false
    });

    useEffect(() => {
        const premium = isPremiumUser();
        setIsPremium(premium);
        if (quota) {
            setCurrentQuota(quota);
        } else {
            // Default quota for demo
            setCurrentQuota({
                used: 3,
                limit: 5,
                remaining: 2,
                isPremium: premium
            });
        }
    }, [quota]);

    // Calculate quota bar color
    const getQuotaColor = () => {
        if (isPremium) return 'from-yellow-500 to-amber-500';
        if (currentQuota.remaining >= 3) return 'from-emerald-500 to-green-500';
        if (currentQuota.remaining === 2) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-orange-500';
    };

    const quotaPercentage = isPremium ? 100 : (currentQuota.remaining / currentQuota.limit) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 border border-white/10 shadow-2xl shadow-purple-500/10"
            >
                {/* Subtle neon border glow */}
                <div className="absolute inset-0 rounded-2xl border border-purple-500/20" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />

                {/* Content */}
                <div className="relative p-8">
                    {/* Animated Brain Icon */}
                    <div className="flex justify-center mb-6">
                        <motion.div
                            animate={{
                                boxShadow: [
                                    '0 0 20px rgba(139, 92, 246, 0.3)',
                                    '0 0 40px rgba(139, 92, 246, 0.5)',
                                    '0 0 20px rgba(139, 92, 246, 0.3)'
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20"
                        >
                            <Brain size={48} className="text-purple-400" />
                        </motion.div>
                    </div>

                    {/* Main Headline */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            Your Coach Is Waiting for Data
                        </h2>
                        <p className="text-gray-400">
                            This is a <span className="text-purple-400 font-semibold">Live AI Engine</span>, not a course.
                            <br />
                            Log trades. Get judged. Improve.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

                    {/* How to Activate */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Zap size={14} className="text-cyan-400" />
                            How to Activate
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">1</div>
                                    <span className="font-medium text-white">Start a Session</span>
                                </div>
                                <p className="text-xs text-gray-500">Trade in paper mode or log a real trade.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
                                    <span className="font-medium text-white">Log Execution</span>
                                </div>
                                <p className="text-xs text-gray-500">Entry, exit, position size, stop-loss.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">3</div>
                                    <span className="font-medium text-white">Get AI Feedback</span>
                                </div>
                                <p className="text-xs text-gray-500">Each analysis uses 1 AI credit.</p>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

                    {/* What Will Appear Here */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Target size={14} className="text-purple-400" />
                            What You'll See
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <Flame size={18} className="text-orange-400" />
                                <span className="text-sm text-white">Live Trade Analysis</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <Brain size={18} className="text-purple-400" />
                                <span className="text-sm text-white">Discipline Score</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <BarChart3 size={18} className="text-cyan-400" />
                                <span className="text-sm text-white">Performance Insights</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <Zap size={18} className="text-yellow-400" />
                                <span className="text-sm text-white">XP & Streaks</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                    {/* AI Quota Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Award size={14} className="text-yellow-400" />
                            AI Quota Status
                        </h3>

                        {isPremium ? (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-yellow-500/20">
                                            <Crown size={20} className="text-yellow-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white flex items-center gap-2">
                                                <InfinityIcon size={18} className="text-yellow-400" />
                                                Unlimited Coaching Active
                                            </div>
                                            <p className="text-xs text-gray-400">Premium users get unlimited AI analyses</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-400">
                                        Free: <span className="text-white font-bold">{currentQuota.remaining}</span> / {currentQuota.limit} remaining
                                    </span>
                                    <span className="text-[10px] text-gray-500">Resets daily at 00:00 UTC</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${quotaPercentage}%` }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                        className={`h-full rounded-full bg-gradient-to-r ${getQuotaColor()}`}
                                    />
                                </div>
                                {currentQuota.remaining === 0 && (
                                    <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                        <Lock size={10} />
                                        Daily AI limit reached. Upgrade to continue receiving feedback.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tagline */}
                    <p className="text-center text-sm text-gray-500 italic mb-6">
                        Serious traders don't trade without feedback.
                    </p>

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                        <Link
                            href="/trading"
                            onClick={onStartSession}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/20"
                        >
                            <Play size={20} />
                            Start Trading Session
                        </Link>

                        {!isPremium && (
                            <Link
                                href="/coach#pricing"
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-yellow-400 font-bold flex items-center justify-center gap-2 hover:from-yellow-500/20 hover:to-amber-500/20 transition-all"
                            >
                                <Lock size={16} />
                                Upgrade for Unlimited Coaching
                                <ChevronRight size={16} />
                            </Link>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
