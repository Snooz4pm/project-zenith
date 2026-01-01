'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import ActiveTradesTile from './ActiveTradesTile';
import SignalsTile from './SignalsTile';
import PerformanceTile from './PerformanceTile';
import CommunityTile from './CommunityTile';
import LearningTile from './LearningTile';
import NotesTile from './NotesTile';
import NewsTile from './NewsTile';
import MarketModeTile from './MarketModeTile';

interface DashboardCockpitProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export default function DashboardCockpit({ user }: DashboardCockpitProps) {
    const userName = user?.name?.split(' ')[0] || 'Trader';

    return (
        <div className="min-h-screen bg-[var(--void)] text-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                            Welcome back, {userName}
                        </h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Activity size={12} className="text-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-400">Markets Live</span>
                    </div>
                </div>
            </div>

            {/* Bento Grid Dashboard */}
            <div className="p-6">
                <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-4 auto-rows-[minmax(140px,auto)]">

                    {/* Market Movers - Tall left tile */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="col-span-12 lg:col-span-4 row-span-2"
                    >
                        <MarketModeTile />
                    </motion.div>

                    {/* Active Trades */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="col-span-12 sm:col-span-6 lg:col-span-4"
                    >
                        <ActiveTradesTile />
                    </motion.div>

                    {/* Signals */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="col-span-6 lg:col-span-2"
                    >
                        <SignalsTile />
                    </motion.div>

                    {/* P&L Performance */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="col-span-6 lg:col-span-2"
                    >
                        <PerformanceTile />
                    </motion.div>

                    {/* Community */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="col-span-6 sm:col-span-3 lg:col-span-2"
                    >
                        <CommunityTile />
                    </motion.div>

                    {/* Learning */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="col-span-6 sm:col-span-3 lg:col-span-2"
                    >
                        <LearningTile />
                    </motion.div>

                    {/* Notes / Journal */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="col-span-6 sm:col-span-3 lg:col-span-2"
                    >
                        <NotesTile />
                    </motion.div>

                    {/* News */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="col-span-6 sm:col-span-3 lg:col-span-2"
                    >
                        <NewsTile />
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
