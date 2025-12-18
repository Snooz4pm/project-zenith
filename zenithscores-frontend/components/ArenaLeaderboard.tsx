'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Crown, Medal, Flame, TrendingUp, Users,
    Lock, Swords, Star, ChevronRight
} from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';
import Link from 'next/link';

interface ArenaEntry {
    rank: number;
    name: string;
    portfolioValue: number;
    weeklyPnl: number;
    winRate: number;
    streak: number;
    isYou?: boolean;
}

const DEMO_LEADERBOARD: ArenaEntry[] = [
    { rank: 1, name: 'CryptoKing99', portfolioValue: 25420, weeklyPnl: 3420, winRate: 78, streak: 12 },
    { rank: 2, name: 'TradingMaster', portfolioValue: 21850, weeklyPnl: 2850, winRate: 72, streak: 8 },
    { rank: 3, name: 'BullRunner', portfolioValue: 18960, weeklyPnl: 1960, winRate: 68, streak: 5 },
    { rank: 4, name: 'DiamondHands', portfolioValue: 16540, weeklyPnl: 1540, winRate: 65, streak: 3 },
    { rank: 5, name: 'AlphaHunter', portfolioValue: 14280, weeklyPnl: 780, winRate: 62, streak: 2 },
];

const CHALLENGES = [
    { id: 1, title: 'Weekly Champion', description: 'Beat the weekly leaderboard', reward: '500 XP + Badge', active: true },
    { id: 2, title: 'Perfect Week', description: '5 correct predictions in a row', reward: '💎 Diamond Badge', active: false },
    { id: 3, title: '10x Trader', description: 'Grow portfolio 10% in a week', reward: 'Featured Profile', active: true },
];

export default function ArenaLeaderboard() {
    const [premium, setPremium] = useState(false);
    const [leaderboard, setLeaderboard] = useState<ArenaEntry[]>(DEMO_LEADERBOARD);
    const [activeTab, setActiveTab] = useState<'weekly' | 'alltime' | 'challenges'>('weekly');

    useEffect(() => {
        setPremium(isPremiumUser());

        // Fetch real leaderboard if available
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
            const res = await fetch(`${apiUrl}/api/v1/trading/leaderboard?limit=10`);
            const data = await res.json();

            if (data.data && data.data.length > 0) {
                setLeaderboard(data.data.map((entry: any, i: number) => ({
                    rank: entry.rank || i + 1,
                    name: entry.display_name,
                    portfolioValue: entry.portfolio_value,
                    weeklyPnl: entry.total_pnl,
                    winRate: entry.win_rate,
                    streak: 0,
                })));
            }
        } catch (e) {
            // Use demo data
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={16} className="text-yellow-400" />;
        if (rank === 2) return <Medal size={16} className="text-gray-300" />;
        if (rank === 3) return <Medal size={16} className="text-orange-400" />;
        return <span className="text-xs text-gray-500">#{rank}</span>;
    };

    if (!premium) {
        return (
            <div className="relative rounded-2xl border border-white/10 bg-[#1a1a2e]/80 p-5 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-10 flex flex-col items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-sm text-white font-bold">The Arena</p>
                    <p className="text-[10px] text-gray-400">Compete on the leaderboard</p>
                </div>
                <div className="blur-sm opacity-40">
                    <div className="h-12 bg-white/5 rounded-xl mb-3" />
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-5"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                        <Swords size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">The Arena</h3>
                        <p className="text-[10px] text-gray-500">Weekly trading competition</p>
                    </div>
                </div>

                <Link
                    href="/trading"
                    className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300"
                >
                    Full Board <ChevronRight size={12} />
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {(['weekly', 'alltime', 'challenges'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Leaderboard */}
            {activeTab !== 'challenges' ? (
                <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry, i) => (
                        <motion.div
                            key={entry.rank}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-center justify-between p-3 rounded-xl ${entry.rank <= 3
                                ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20'
                                : 'bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex justify-center">
                                    {getRankIcon(entry.rank)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{entry.name}</p>
                                    <p className="text-[10px] text-gray-500">{entry.winRate}% win rate</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-bold text-white font-mono">
                                    ${entry.portfolioValue.toLocaleString()}
                                </p>
                                <p className={`text-[10px] font-mono ${entry.weeklyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {entry.weeklyPnl >= 0 ? '+' : ''}{entry.weeklyPnl.toLocaleString()}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                /* Challenges Tab */
                <div className="space-y-3">
                    {CHALLENGES.map((challenge) => (
                        <div
                            key={challenge.id}
                            className={`p-3 rounded-xl border ${challenge.active
                                ? 'bg-purple-500/10 border-purple-500/30'
                                : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-bold text-white">{challenge.title}</p>
                                {challenge.active && (
                                    <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{challenge.description}</p>
                            <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                                <Star size={10} />
                                {challenge.reward}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Your Rank Footer */}
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-cyan-400" />
                        <span className="text-xs text-gray-400">Your Rank</span>
                    </div>
                    <span className="text-sm font-bold text-cyan-400">#42 of 128</span>
                </div>
            </div>
        </motion.div>
    );
}
