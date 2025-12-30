'use client';

import { X, Target, Shield, Zap, TrendingUp, Activity, BarChart3, Clock, AlertTriangle } from 'lucide-react';

interface SignalDrillDownProps {
    signal: any; // Ideally typed properly
    onClose: () => void;
}

export default function SignalDrillDown({ signal, onClose }: SignalDrillDownProps) {
    if (!signal) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#0B0E14] border-l border-zinc-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">

            {/* HEADER */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#0f1219]">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-zinc-100">{signal.asset}</h2>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${signal.type === 'LONG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {signal.type} SETUP
                        </span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">ID: {signal.id} • DETECTED {signal.time} (UTC)</span>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* 1. THE "WHY" (REASONING) */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" /> Why This Signal?
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <div>
                                <strong className="text-zinc-200 block text-sm">Liquidity Sweep Confirmed</strong>
                                <p className="text-xs text-zinc-500 leading-relaxed">Price aggressively took out the previous 4H low, trapping breakout shorts before reclaiming the range.</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <div>
                                <strong className="text-zinc-200 block text-sm">Volatility Compression</strong>
                                <p className="text-xs text-zinc-500 leading-relaxed">Bollinger Band Width % is in the lowest 5th percentile, signalling imminent expansion.</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <div>
                                <strong className="text-zinc-200 block text-sm">Correlation Divergence</strong>
                                <p className="text-xs text-zinc-500 leading-relaxed">Asset is showing relative strength while the broader market/sector is making lower lows.</p>
                            </div>
                        </li>
                    </ul>
                </section>

                <div className="h-px bg-zinc-800" />

                {/* 2. CONFIDENCE COMPOSITION */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Activity size={16} className="text-blue-500" /> Confidence Composition
                    </h3>
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 space-y-3">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-bold text-blue-400">{signal.confidence}%</span>
                            <span className="text-xs text-zinc-500 mb-1">AGGREGATE SCORE</span>
                        </div>

                        {/* Breakdown Bars */}
                        {[
                            { label: 'Market Regime', score: 92, color: 'bg-emerald-500' },
                            { label: 'Liquidity Quality', score: 85, color: 'bg-blue-500' },
                            { label: 'Volatility Profile', score: 76, color: 'bg-purple-500' },
                            { label: 'Hist. Outcome', score: 88, color: 'bg-amber-500' },
                        ].map((item) => (
                            <div key={item.label} className="space-y-1">
                                <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold">
                                    <span>{item.label}</span>
                                    <span>{item.score}/100</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: `${item.score}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="h-px bg-zinc-800" />

                {/* 3. EXECUTION PLAN */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Target size={16} className="text-emerald-500" /> Execution Parameters
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded">
                            <span className="text-[10px] text-zinc-500 uppercase block mb-1">Optimal Entry Zone</span>
                            <span className="text-lg font-mono text-zinc-200">1.2340 - 1.2355</span>
                        </div>
                        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded">
                            <span className="text-[10px] text-zinc-500 uppercase block mb-1">Invalidation (Stop)</span>
                            <span className="text-lg font-mono text-rose-400">1.2310</span>
                        </div>
                        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded col-span-2">
                            <span className="text-[10px] text-zinc-500 uppercase block mb-1">Targets (TP1 / TP2)</span>
                            <div className="flex justify-between items-baseline">
                                <span className="text-lg font-mono text-emerald-400">1.2450</span>
                                <span className="text-sm font-mono text-zinc-600">to</span>
                                <span className="text-lg font-mono text-emerald-400">1.2520</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-zinc-800" />

                {/* 4. RISK COACHING */}
                <section className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg">
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <AlertTriangle size={14} /> Risk Advisory
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                        Taking this trade increases your portfolio correlation to <strong>USD</strong> by <strong>0.12</strong>.
                    </p>
                    <div className="text-xs text-zinc-500">
                        Recommended Size: <span className="text-zinc-300 font-bold">0.8% Risk</span> (High Volatility Env)
                    </div>
                </section>

            </div>

            {/* FOOTER ACTION */}
            <div className="p-4 border-t border-zinc-800 bg-[#0f1219]">
                <button className="w-full py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                    Generate Trade Plan
                </button>
            </div>
        </div>
    );
}
