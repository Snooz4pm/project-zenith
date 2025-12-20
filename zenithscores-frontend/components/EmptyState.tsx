'use client';

import { motion } from 'framer-motion';
import { TrendingUp, BarChart2, Activity, Package } from 'lucide-react';

interface EmptyStateProps {
    type: 'no-sessions' | 'no-signals' | 'no-notifications' | 'no-data' | 'loading';
    title?: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
    const configs = {
        'no-sessions': {
            icon: <TrendingUp className="w-12 h-12" />,
            defaultTitle: 'No Trading Sessions',
            defaultDescription: 'Start your first trade to begin tracking your performance.',
            gradient: 'from-blue-500/20 to-cyan-500/20'
        },
        'no-signals': {
            icon: <Activity className="w-12 h-12" />,
            defaultTitle: 'No High-Score Signals',
            defaultDescription: 'Zenith is scanning... No assets above the 80-score threshold right now.',
            gradient: 'from-purple-500/20 to-pink-500/20'
        },
        'no-notifications': {
            icon: <BarChart2 className="w-12 h-12" />,
            defaultTitle: 'All Caught Up',
            defaultDescription: 'You have no new notifications. Enable alerts to stay informed.',
            gradient: 'from-emerald-500/20 to-teal-500/20'
        },
        'no-data': {
            icon: <Package className="w-12 h-12" />,
            defaultTitle: 'No Data Available',
            defaultDescription: 'We couldn\'t load the data. Please try again later.',
            gradient: 'from-orange-500/20 to-red-500/20'
        },
        'loading': {
            icon: <Activity className="w-12 h-12 animate-spin" />,
            defaultTitle: 'Loading...',
            defaultDescription: 'Fetching the latest market data.',
            gradient: 'from-cyan-500/20 to-blue-500/20'
        }
    };

    const config = configs[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            {/* Animated Icon Container */}
            <motion.div
                className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-6`}
                animate={{
                    scale: [1, 1.02, 1],
                    rotate: [0, 1, -1, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 blur-xl" />

                {/* Pulsing ring */}
                <motion.div
                    className="absolute inset-0 rounded-2xl border border-white/10"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Icon */}
                <div className="relative z-10 text-white/60">
                    {config.icon}
                </div>

                {/* Chart line decoration */}
                <svg className="absolute bottom-2 left-4 right-4 h-8 opacity-30" viewBox="0 0 100 30">
                    <motion.path
                        d="M0,25 Q20,20 30,15 T50,10 T70,18 T100,5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-cyan-400"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </svg>
            </motion.div>

            {/* Title */}
            <h3 className="text-lg font-bold text-white mb-2">
                {title || config.defaultTitle}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-500 max-w-xs mb-6">
                {description || config.defaultDescription}
            </p>

            {/* Action Button */}
            {action && (
                <motion.button
                    onClick={action.onClick}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
}
