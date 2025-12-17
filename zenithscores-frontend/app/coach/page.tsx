'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Zap, Trophy, Target, Flame, Shield, Lock,
    ChevronRight, Star, Award, TrendingUp, Clock, Check
} from 'lucide-react';
import Link from 'next/link';
import { isPremiumUser, savePremiumStatus } from '@/lib/premium';

const FEATURES = [
    {
        icon: Bot,
        title: 'Brutal Honesty AI',
        description: 'No sugarcoating. Real feedback on every trade. Get roasted when you mess up, praised when you nail it.',
        color: 'from-red-500 to-orange-500',
    },
    {
        icon: Zap,
        title: '3-Hour Market Pulse',
        description: 'Every 3 hours, get the market mood, hot assets, and YOUR edge. Build the ritual.',
        color: 'from-cyan-500 to-blue-500',
    },
    {
        icon: Trophy,
        title: 'Arena Competition',
        description: 'Compete on leaderboards, earn XP, unlock badges. Trading is now a sport.',
        color: 'from-yellow-500 to-orange-500',
    },
    {
        icon: Target,
        title: 'Prediction Streaks',
        description: 'Predict market direction, track your accuracy. Build confidence through data.',
        color: 'from-purple-500 to-pink-500',
    },
    {
        icon: Flame,
        title: 'Discipline Tracking',
        description: 'We track your mistakes so you don\'t repeat them. Earn "Discipline Streaks" for clean trading.',
        color: 'from-orange-500 to-red-500',
    },
    {
        icon: Shield,
        title: 'Clone Trading',
        description: 'Copy the top traders\' positions. Learn from the best while you build your edge.',
        color: 'from-green-500 to-emerald-500',
    },
];

const WHAT_YOU_GET = [
    'Instant market pulse alerts (not 15-min delayed)',
    'Full "Brutal" coaching diagnostics on every trade',
    'Clone trading from top Arena performers',
    'Private community feed with trade sharing',
    '2x XP boost for faster leaderboard climbing',
    'Weekly personalized performance reports',
];

export default function CoachWelcomePage() {
    const [premium, setPremium] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    useEffect(() => {
        setPremium(isPremiumUser());
    }, []);

    // If already premium, redirect to dashboard
    if (premium) {
        return (
            <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center">
                <div className="text-center">
                    <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">You're Already Premium!</h1>
                    <p className="text-gray-400 mb-6">Your coach is ready and waiting.</p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold"
                    >
                        Enter Dashboard <ChevronRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />

                <div className="relative container mx-auto px-6 py-16">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm mb-6">
                            <Flame size={14} />
                            Warning: This Coach Doesn't Sugarcoat
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold mb-4">
                            Meet Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Brutal</span> Trading Coach
                        </h1>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                            Most trading apps show you charts. We show you <span className="text-white font-bold">exactly why you're losing money</span> — and how to stop.
                        </p>

                        {/* CTA */}
                        <Link
                            href="#pricing"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                        >
                            Get Your Coach — $19.99/mo
                            <ChevronRight size={20} />
                        </Link>

                        <p className="text-sm text-gray-500 mt-4">
                            Cancel anytime. Your first roast is on us.
                        </p>
                    </div>

                    {/* Preview Quote */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-2xl mx-auto p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-red-500/20">
                                <Bot size={24} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-red-400 mb-1">Sample Roast</p>
                                <p className="text-white italic">
                                    "You just paper-handed a 12% winner for 2% gains. That's not profit-taking — that's panic.
                                    The market thanks you for leaving money on the table. <span className="text-yellow-400">Lesson: Set trailing stops and trust your thesis.</span>"
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="container mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">
                    What Your Coach Does
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                                <feature.icon size={24} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Comparison */}
            <div className="container mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-center mb-4">
                    Free vs Premium
                </h2>
                <p className="text-gray-400 text-center mb-12">
                    The difference between watching and winning
                </p>

                <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
                    {/* Free */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-xl font-bold mb-4 text-gray-400">Free Tier</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-500" />
                                15-minute delayed pulse
                            </li>
                            <li className="flex items-center gap-2">
                                <Lock size={14} className="text-gray-500" />
                                Basic "Good/Bad" feedback
                            </li>
                            <li className="flex items-center gap-2">
                                <Lock size={14} className="text-gray-500" />
                                View-only leaderboard
                            </li>
                            <li className="flex items-center gap-2">
                                <Lock size={14} className="text-gray-500" />
                                1x XP earnings
                            </li>
                        </ul>
                    </div>

                    {/* Premium */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
                        <h3 className="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
                            <Star size={18} className="text-yellow-400" />
                            Premium — $19.99/mo
                        </h3>
                        <ul className="space-y-3 text-sm text-white">
                            {WHAT_YOU_GET.map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Check size={14} className="text-green-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pricing CTA */}
            <div id="pricing" className="container mx-auto px-6 py-16">
                <div className="max-w-xl mx-auto text-center p-8 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
                    <Award className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Ready to Trade Better?</h2>
                    <p className="text-gray-400 mb-6">
                        Join traders who turned their losses into lessons.
                    </p>

                    <div className="text-4xl font-bold text-white mb-2">
                        $19.99<span className="text-lg text-gray-400">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Less than one bad trade costs you
                    </p>

                    <Link
                        href="/dashboard"
                        onClick={(e) => {
                            e.preventDefault();
                            savePremiumStatus(true);
                            setPremium(true);
                            window.location.href = '/dashboard';
                        }}
                        className="block w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
                    >
                        Activate Premium Now
                    </Link>

                    <p className="text-xs text-gray-500 mt-4">
                        7-day money-back guarantee • Cancel anytime
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 py-8">
                <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
                    <Link href="/" className="hover:text-white transition-colors">
                        ← Back to ZenithScores
                    </Link>
                </div>
            </div>
        </div>
    );
}
