'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, BarChart3, TrendingUp, Shield, Zap, Clock } from 'lucide-react';

interface ScanningExplainerProps {
    isOpen: boolean;
    onClose: () => void;
}

const scanningSteps = [
    {
        icon: BarChart3,
        title: 'Data Collection',
        description: 'We aggregate real-time price data, volume, and order book information from 50+ exchanges worldwide.',
        color: '#00f0ff',
    },
    {
        icon: Cpu,
        title: 'AI Analysis',
        description: 'Our proprietary algorithms analyze momentum, volatility, and market microstructure patterns.',
        color: '#a855f7',
    },
    {
        icon: TrendingUp,
        title: 'Trend Detection',
        description: 'We identify accumulation/distribution phases, support/resistance levels, and breakout signals.',
        color: '#10b981',
    },
    {
        icon: Shield,
        title: 'Risk Assessment',
        description: 'Each asset is evaluated for downside risk, liquidity depth, and historical volatility.',
        color: '#f59e0b',
    },
    {
        icon: Zap,
        title: 'Score Generation',
        description: 'All factors are combined into a single Zenith Score (0-100) indicating bullish or bearish sentiment.',
        color: '#f72585',
    },
    {
        icon: Clock,
        title: 'Real-Time Updates',
        description: 'Scores are recalculated every 15 seconds to reflect the latest market conditions.',
        color: '#06b6d4',
    },
];

export function ScanningExplainer({ isOpen, onClose }: ScanningExplainerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] z-[201] overflow-auto"
                    >
                        <div className="relative bg-[#0a0a12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Glowing header effect */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-cyan-500/20 blur-[60px] pointer-events-none" />

                            {/* Header */}
                            <div className="relative p-6 border-b border-white/10">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                                        <Cpu className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">How Zenith Scanning Works</h2>
                                        <p className="text-sm text-gray-400">Real-time market intelligence in 6 steps</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {scanningSteps.map((step, index) => (
                                    <motion.div
                                        key={step.title}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
                                    >
                                        <div
                                            className="flex-shrink-0 p-2.5 rounded-lg border transition-all duration-300"
                                            style={{
                                                backgroundColor: `${step.color}10`,
                                                borderColor: `${step.color}30`,
                                                boxShadow: `0 0 20px ${step.color}20`,
                                            }}
                                        >
                                            <step.icon
                                                size={20}
                                                style={{ color: step.color }}
                                                className="group-hover:scale-110 transition-transform"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: `${step.color}20`,
                                                        color: step.color,
                                                    }}
                                                >
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                                <h3 className="font-semibold text-white">{step.title}</h3>
                                            </div>
                                            <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/10 bg-white/[0.02]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                                        <span>Analyzing <strong className="text-white">24,392</strong> assets right now</span>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
                                    >
                                        Got it!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ScanningExplainer;
