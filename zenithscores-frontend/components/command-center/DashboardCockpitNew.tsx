'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import MarketPulseTile from './tiles/MarketPulseTile';
import ActiveTradesTileNew from './tiles/ActiveTradesTileNew';
import PLStatusTile from './tiles/PLStatusTile';
import ActiveSignalsTile from './tiles/ActiveSignalsTile';
import CryptoFindsTileNew from './tiles/CryptoFindsTileNew';
import DecisionLabTile from './tiles/DecisionLabTile';
import CommunityFeedTile from './tiles/CommunityFeedTile';
import NotesSnapshotTile from './tiles/NotesSnapshotTile';

interface DashboardCockpitNewProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export default function DashboardCockpitNew({ user }: DashboardCockpitNewProps) {
    const userName = user?.name?.split(' ')[0] || 'Trader';

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header - Minimal */}
            <div className="px-6 py-4 border-b border-white/[0.06]">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-medium text-white">
                            Welcome back, {userName}
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-500">Live</span>
                    </div>
                </div>
            </div>

            {/* Bento Grid - Robinhood Style */}
            <div className="p-6">
                <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-3 auto-rows-[minmax(160px,auto)]">

                    {/* 1. Market Pulse - PRIMARY (TOP LEFT) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="col-span-12 lg:col-span-5 row-span-2"
                    >
                        <MarketPulseTile />
                    </motion.div>

                    {/* 2. Active Trades - TOP CENTER */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="col-span-12 sm:col-span-6 lg:col-span-4"
                    >
                        <ActiveTradesTileNew />
                    </motion.div>

                    {/* 3. P&L Status - TOP RIGHT */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="col-span-12 sm:col-span-6 lg:col-span-3"
                    >
                        <PLStatusTile />
                    </motion.div>

                    {/* 4. Active Signals */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="col-span-12 sm:col-span-6 lg:col-span-4"
                    >
                        <ActiveSignalsTile />
                    </motion.div>

                    {/* 5. Crypto Finds (NO progress bars) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="col-span-12 sm:col-span-6 lg:col-span-3"
                    >
                        <CryptoFindsTileNew />
                    </motion.div>

                    {/* 7. Community Feed - RIGHT COLUMN */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="col-span-12 lg:col-span-3 row-span-2"
                    >
                        <CommunityFeedTile />
                    </motion.div>

                    {/* 6. Decision Lab Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="col-span-12 sm:col-span-6 lg:col-span-4"
                    >
                        <DecisionLabTile />
                    </motion.div>

                    {/* 8. Notes Snapshot */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="col-span-12 sm:col-span-6 lg:col-span-3"
                    >
                        <NotesSnapshotTile />
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
