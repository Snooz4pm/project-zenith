'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    LayoutDashboard, Zap, Crown, Award, Lock, ChevronRight,
    MessageSquare, Copy, Users
} from 'lucide-react';
import ThreeHourPulse from '@/components/ThreeHourPulse';
import XPProgressionCard from '@/components/XPProgressionCard';
import PredictionStreaks from '@/components/PredictionStreaks';
import ArenaLeaderboard from '@/components/ArenaLeaderboard';
import CommunityFeed from '@/components/CommunityFeed';
import CloneTrading from '@/components/CloneTrading';
import PremiumWall from '@/components/PremiumWall';
import { isPremiumUser, getPremiumDaysRemaining } from '@/lib/premium';
import { AlertCircle, Calendar } from 'lucide-react';

export default function DashboardPage() {
    const [premium, setPremium] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'community' | 'arena'>('overview');
    const [showPremiumWall, setShowPremiumWall] = useState(false);

    useEffect(() => {
        setPremium(isPremiumUser());
        setDaysRemaining(getPremiumDaysRemaining());
    }, []);

    // Handle premium action - show wall if not premium
    const handlePremiumAction = (callback?: () => void) => {
        if (premium) {
            callback?.();
        } else {
            setShowPremiumWall(true);
        }
    };

    // Premium wall modal for actions
    const PremiumActionWall = () => (
        showPremiumWall ? (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full mx-4"
                >
                    <div className="relative">
                        <button
                            onClick={() => setShowPremiumWall(false)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white z-10"
                        >
                            ×
                        </button>
                        <PremiumWall
                            stocksLocked={0}
                            onUnlock={() => {
                                setPremium(true);
                                setShowPremiumWall(false);
                            }}
                        />
                    </div>
                </motion.div>
            </div>
        ) : null
    );

    // Premium: Full dashboard
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            {/* Premium Action Modal */}
            <PremiumActionWall />

            <div className="container mx-auto px-6 py-6">
                {/* Expiration Warning */}
                {daysRemaining <= 5 && (
                    <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                                <AlertCircle size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Subscription Expiring Soon</p>
                                <p className="text-xs text-gray-400">You have {daysRemaining} days left. Renew now to maintain your Arena rank and Coach access.</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-400 transition-colors">
                            Renew Now
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                                <LayoutDashboard className="text-cyan-400" />
                                Dashboard
                                {premium && <Crown className="w-5 h-5 text-yellow-400" />}
                                {!premium && <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">Try Premium</span>}
                            </h1>
                            <p className="text-gray-400 mt-1 text-sm">Your command center for market intelligence</p>
                        </div>

                        <button
                            onClick={() => handlePremiumAction(() => window.location.href = '/trading/coach')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                        >
                            <Award size={16} />
                            Trading Coach
                            {!premium && <Lock size={12} />}
                            {premium && <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {[
                        { id: 'overview' as const, label: 'Overview', icon: Zap },
                        { id: 'community' as const, label: 'Community', icon: MessageSquare },
                        { id: 'arena' as const, label: 'Arena', icon: Users },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-black'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Main Grid */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Left Column - 3-Hour Pulse (Large) */}
                            <div className="lg:col-span-2">
                                <ThreeHourPulse />
                            </div>

                            {/* Right Column - XP Card */}
                            <div>
                                <XPProgressionCard />
                            </div>
                        </div>

                        {/* Second Row */}
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            {/* Predictions */}
                            <PredictionStreaks />

                            {/* Clone Trading */}
                            <CloneTrading />
                        </div>
                    </>
                )}

                {/* Community Tab */}
                {activeTab === 'community' && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <CommunityFeed />
                        </div>
                        <div className="space-y-6">
                            <XPProgressionCard />
                            <PredictionStreaks />
                        </div>
                    </div>
                )}

                {/* Arena Tab */}
                {activeTab === 'arena' && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <ArenaLeaderboard />
                        </div>
                        <div className="space-y-6">
                            <CloneTrading />
                            <XPProgressionCard />
                        </div>
                    </div>
                )}

                {/* Quick Links Footer */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { href: '/stocks', label: 'Stocks', icon: '📈' },
                        { href: '/crypto', label: 'Crypto', icon: '₿' },
                        { href: '/forex', label: 'Forex', icon: '💱' },
                        { href: '/trading', label: 'Trading', icon: '⚡' },
                    ].map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all text-center"
                        >
                            <span className="text-2xl block mb-2">{link.icon}</span>
                            <span className="text-sm text-gray-400">{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
