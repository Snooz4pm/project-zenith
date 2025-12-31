'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, TrendingUp, Activity, BarChart2 } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';

interface Scenario {
    id: string;
    title: string;
    marketType: string;
    symbol: string;
    timeframe: string;
    difficulty: string;
    isPremium: boolean;
}

export default function DecisionLabListPage() {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'CRYPTO' | 'FOREX' | 'STOCKS'>('ALL');

    useEffect(() => {
        async function fetchScenarios() {
            try {
                const res = await fetch('/api/decision-lab');
                if (res.ok) {
                    const data = await res.json();
                    setScenarios(data.scenarios || data);
                }
            } catch (error) {
                console.error('Failed to load scenarios');
            } finally {
                setIsLoading(false);
            }
        }
        fetchScenarios();
    }, []);

    const filteredScenarios = scenarios.filter(s =>
        activeTab === 'ALL' ? true : s.marketType.toUpperCase() === activeTab
    );

    const getDifficultyColor = (diff: string) => {
        switch (diff.toLowerCase()) {
            case 'easy': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            case 'medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
            case 'hard': return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
            default: return 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10';
        }
    };

    if (isLoading) return <PageLoader pageName="Decision Lab" />;

    return (
        <div className="min-h-screen bg-void text-white pt-32 pb-20 px-6 md:px-12 lg:px-16 overflow-x-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent-mint/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-16 relative z-10">
                {/* Header */}
                <div className="space-y-6 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-mint/10 border border-accent-mint/20 text-accent-mint text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                        <Activity size={12} />
                        Live Simulation Environment
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight leading-tight">
                        DECISION<span className="text-accent-mint text-glow">LAB</span>
                    </h1>
                    <p className="text-xl text-text-secondary max-w-2xl leading-relaxed">
                        Master the art of risk management under pressure.
                        Live historical data playback with zero indicators.
                        Your survival is the only metric that matters.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 p-1 bg-surface-2 rounded-xl border border-white/5 w-fit">
                    {['ALL', 'CRYPTO', 'FOREX', 'STOCKS'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-lg font-data text-xs tracking-widest transition-all ${activeTab === tab
                                ? 'bg-accent-mint text-void font-bold shadow-[0_0_15px_var(--glow-mint)]'
                                : 'text-text-muted hover:text-text-secondary'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Scenarios Grid */}
                {filteredScenarios.length === 0 ? (
                    <div className="py-32 text-center glass-panel rounded-2xl border-dashed border-white/10">
                        <Activity className="mx-auto h-16 w-16 text-white/10 mb-6 animate-pulse" />
                        <h3 className="text-text-secondary text-2xl font-display">No simulations found</h3>
                        <p className="text-text-muted mt-2">The lab is currently synthesizing new market datasets.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredScenarios.map((scenario) => (
                            <Link
                                href={`/decision-lab/${scenario.id}`}
                                key={scenario.id}
                                className="group relative glass-panel rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                            >
                                <div className="p-8 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-accent-mint/20 transition-all duration-500 border border-white/5 group-hover:border-accent-mint/30">
                                            {scenario.marketType === 'crypto' ? <TrendingUp size={28} className="text-text-secondary group-hover:text-accent-mint" /> :
                                                scenario.marketType === 'forex' ? <Activity size={28} className="text-text-secondary group-hover:text-accent-mint" /> :
                                                    <BarChart2 size={28} className="text-text-secondary group-hover:text-accent-mint" />}
                                        </div>
                                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border rounded-full ${getDifficultyColor(scenario.difficulty)} flex items-center gap-1.5`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {scenario.difficulty}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-accent-mint transition-colors font-display">
                                            {scenario.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-text-muted font-data mt-3">
                                            <span className="text-text-secondary">{scenario.symbol}</span>
                                            <span className="opacity-30">•</span>
                                            <span className="px-2 py-0.5 rounded bg-white/5">{scenario.timeframe}</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex items-center justify-between group/btn">
                                        <span className="text-xs text-text-muted font-bold tracking-widest group-hover:text-text-primary transition-colors uppercase">
                                            Initialize Pilot
                                        </span>
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent-mint group-hover:text-void transition-all duration-300 shadow-inner">
                                            <Play size={18} className="ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

