'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Play, TrendingUp, Activity, BarChart2 } from 'lucide-react';
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
                    setScenarios(data);
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
        <div className="min-h-screen bg-[var(--void)] text-white p-6 md:p-12 lg:p-16">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
                        Decision<span className="text-[var(--accent-mint)]">Lab</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl">
                        Train your execution under pressure. Real historical data. Zero indicators.
                        <br />
                        <span className="text-zinc-500 text-sm mt-2 block">
                            Warning: This is not a game. Your behavior is tracked.
                        </span>
                    </p>
                </div>

                {/* Filters */}
                <div className="flex gap-4 border-b border-zinc-800 pb-1 overflow-x-auto">
                    {['ALL', 'CRYPTO', 'FOREX', 'STOCKS'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 font-mono text-sm tracking-widest transition-colors border-b-2 ${activeTab === tab
                                    ? 'border-[var(--accent-mint)] text-[var(--accent-mint)]'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Scenarios Grid */}
                {filteredScenarios.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-zinc-800 rounded-xl">
                        <Activity className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
                        <h3 className="text-zinc-500 text-lg">No scenarios available yet.</h3>
                        <p className="text-zinc-600">The lab is currently generating new simulations.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredScenarios.map((scenario) => (
                            <Link
                                href={`/learning/decision-lab/${scenario.id}`}
                                key={scenario.id}
                                className="group relative bg-[#0c0c10] border border-white/5 rounded-xl overflow-hidden hover:border-[var(--accent-mint)]/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Premium Badge */}
                                {scenario.isPremium && (
                                    <div className="absolute top-3 right-3 z-10">
                                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                            <Lock size={10} /> Premium
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[var(--accent-mint)]/10 transition-colors">
                                            {scenario.marketType === 'crypto' ? <TrendingUp size={24} className="text-zinc-400 group-hover:text-[var(--accent-mint)]" /> :
                                                scenario.marketType === 'forex' ? <Activity size={24} className="text-zinc-400 group-hover:text-[var(--accent-mint)]" /> :
                                                    <BarChart2 size={24} className="text-zinc-400 group-hover:text-[var(--accent-mint)]" />}
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded ${getDifficultyColor(scenario.difficulty)}`}>
                                            {scenario.difficulty}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[var(--accent-mint)] transition-colors">
                                            {scenario.title}
                                        </h3>
                                        <div className="flex gap-3 text-xs text-zinc-500 font-mono mt-2">
                                            <span>{scenario.symbol}</span>
                                            <span>•</span>
                                            <span>{scenario.timeframe}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-xs text-zinc-600 font-medium group-hover:text-zinc-400 transition-colors">
                                            ENTER SIMULATION
                                        </span>
                                        <Play size={16} className="text-[var(--accent-mint)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
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
