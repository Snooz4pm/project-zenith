'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Lock, TrendingUp, BarChart2, Check, ArrowRight, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

type MarketType = 'ALL' | 'CRYPTO' | 'FOREX' | 'STOCKS';

interface Scenario {
    id: string;
    title: string;
    marketType: string;
    symbol: string;
    timeframe: string;
    difficulty: string;
    completed?: boolean;
    result?: {
        choice: string;
        pnl: number;
    } | null;
}

interface MobileDecisionLabProps {
    scenarios: Scenario[];
}

export default function MobileDecisionLab({ scenarios }: MobileDecisionLabProps) {
    const [activeTab, setActiveTab] = useState<MarketType>('ALL');
    const router = useRouter();

    const filteredScenarios = activeTab === 'ALL'
        ? scenarios
        : scenarios.filter(s => s.marketType.toUpperCase() === activeTab);

    const tabs: { id: MarketType; label: string }[] = [
        { id: 'ALL', label: 'All' },
        { id: 'CRYPTO', label: 'Crypto' },
        { id: 'STOCKS', label: 'Stocks' },
        { id: 'FOREX', label: 'Forex' },
    ];

    return (
        <div className="min-h-screen bg-[var(--void)] pb-20">
            {/* Header */}
            <div className="sticky top-16 z-20 bg-[var(--void)]/95 backdrop-blur-xl border-b border-white/5">
                <div className="px-4 py-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={16} className="text-[var(--accent-mint)]" />
                        <span className="text-xs font-bold text-[var(--accent-mint)] uppercase tracking-widest">Training Ground</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white font-display">
                        Decision Lab
                    </h1>
                </div>

                {/* Tabs */}
                <div className="px-4 pb-4 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors touch-target ${activeTab === tab.id
                                        ? 'bg-[var(--accent-mint)] text-black shadow-[0_0_15px_rgba(20,241,149,0.3)]'
                                        : 'bg-white/5 text-[var(--text-secondary)] border border-white/5'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scenarios List */}
            <div className="px-4 py-4 space-y-4">
                {filteredScenarios.length === 0 ? (
                    <div className="text-center py-20">
                        <Activity className="mx-auto h-12 w-12 text-white/10 mb-4" />
                        <p className="text-[var(--text-muted)]">No scenarios found for this category.</p>
                    </div>
                ) : (
                    filteredScenarios.map((scenario, index) => (
                        <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
                    ))
                )}
            </div>
        </div>
    );
}

function ScenarioCard({ scenario, index }: { scenario: Scenario; index: number }) {
    const isLocked = scenario.completed;

    const getIcon = () => {
        switch (scenario.marketType.toLowerCase()) {
            case 'crypto': return <TrendingUp size={20} />;
            case 'forex': return <Activity size={20} />;
            default: return <BarChart2 size={20} />;
        }
    };

    const getDifficultyColor = () => {
        switch (scenario.difficulty.toLowerCase()) {
            case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'hard': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            {isLocked ? (
                <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5 p-5 opacity-70">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                        <div className="px-4 py-2 bg-black/60 rounded-full border border-white/10 flex items-center gap-2 backdrop-blur-md">
                            <Lock size={12} className="text-white/60" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Completed</span>
                        </div>
                    </div>

                    <div className="flex items-start justify-between mb-4 filter blur-[2px]">
                        <div className="p-3 rounded-xl bg-white/5 text-white/30 border border-white/5">
                            {getIcon()}
                        </div>
                    </div>
                    <div className="space-y-2 filter blur-[2px]">
                        <div className="h-6 w-3/4 bg-white/5 rounded-md" />
                        <div className="h-4 w-1/2 bg-white/5 rounded-md" />
                    </div>

                    {/* Result Badge (Visible on top) */}
                    {scenario.result && (
                        <div className="absolute top-4 right-4 z-20">
                            <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border flex items-center gap-1.5 ${scenario.result.pnl >= 0
                                    ? 'bg-[var(--accent-mint)]/20 border-[var(--accent-mint)]/30 text-[var(--accent-mint)]'
                                    : 'bg-[var(--accent-danger)]/20 border-[var(--accent-danger)]/30 text-[var(--accent-danger)]'
                                }`}>
                                {scenario.result.pnl >= 0 ? '+' : ''}${scenario.result.pnl.toFixed(0)}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Link href={`/decision-lab/${scenario.id}`}>
                    <div className="group relative overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.03)] border border-white/5 p-5 active:scale-[0.98] transition-all touch-target">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 text-white border border-white/10 group-active:border-[var(--accent-mint)]/50 transition-colors">
                                {getIcon()}
                            </div>
                            <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${getDifficultyColor()}`}>
                                {scenario.difficulty}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white mb-1 font-display leading-tight">
                                {scenario.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
                                <span>{scenario.symbol}</span>
                                <span className="opacity-30">•</span>
                                <span>{scenario.timeframe}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] group-active:text-[var(--accent-mint)] transition-colors">
                                Initialize
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-active:bg-[var(--accent-mint)] group-active:text-black transition-colors">
                                <Play size={14} className="ml-0.5" />
                            </div>
                        </div>
                    </div>
                </Link>
            )}
        </motion.div>
    );
}
