'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BondCurveVisualizerProps {
    curveData: { cumulativeUSD: number; price: number }[];
    targetPrice: number;
    currentPrice: number;
    symbol: string;
}

const formatUSD = (val: number) => {
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (Math.abs(val) >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
};

export const BondCurveVisualizer: React.FC<BondCurveVisualizerProps> = ({
    curveData,
    targetPrice,
    currentPrice,
    symbol
}) => {
    const maxObservedPrice = Math.max(...curveData.map(p => p.price));
    const targetReachable = maxObservedPrice >= targetPrice;

    const capitalAtTarget = curveData.find(p => p.price >= targetPrice)?.cumulativeUSD ?? null;

    return (
        <div className="bg-zinc-950/20 rounded-2xl border border-zinc-900 overflow-hidden">
            <div className="p-6 border-b border-zinc-900 bg-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        <div className="text-[11px] text-white font-black uppercase tracking-widest italic">Market Mechanics: Bond Curve Replay</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-black italic tracking-tighter ${targetReachable ? 'bg-emerald-500 text-black' : 'bg-amber-500/20 text-amber-500'
                        }`}>
                        {targetReachable ? 'Target Reachable on Curve' : 'Curve Resistance Detected'}
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={curveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                            <XAxis
                                dataKey="cumulativeUSD"
                                stroke="#3f3f46"
                                fontSize={10}
                                tickFormatter={formatUSD}
                                label={{ value: 'Net Capital Injected (USD)', position: 'insideBottom', offset: -5, fill: '#3f3f46', fontSize: 8, fontWeight: 'bold' }}
                            />
                            <YAxis
                                stroke="#3f3f46"
                                fontSize={10}
                                tickFormatter={(val) => `$${val.toFixed(4)}`}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                                labelFormatter={(label) => `Net Capital: ${formatUSD(Number(label))}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#curveGradient)"
                                animationDuration={1500}
                            />
                            <ReferenceLine y={targetPrice} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Target', fill: '#ef4444', fontSize: 8, fontWeight: 'black' }} />
                            <ReferenceLine x={0} stroke="#525252" strokeWidth={1} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-4 rounded-xl border border-zinc-900 space-y-3">
                        <div className="flex items-center gap-2">
                            {targetReachable ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                            <div className="text-[10px] text-zinc-100 font-black uppercase tracking-wider">
                                Mechanics Verdict
                            </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                            {targetReachable
                                ? `At current liquidity, reaching the target price would require approximately ${formatUSD(capitalAtTarget || 0)} in net buying along the curve.`
                                : `Based on current liquidity and observed trading behavior, the curve flattens before reaching the target price. This means the target would require a significant change in liquidity or market participation.`}
                        </p>
                    </div>

                    <div className="bg-black/40 p-4 rounded-xl border border-zinc-900">
                        <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-3">Model Logic</div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                            This chart shows how price actually moves as capital enters or exits the market. Each point represents real buy and sell transactions replayed on the AMM constant-product curve ($x \cdot y = k$).
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-3 bg-zinc-900/30 border-t border-zinc-900">
                <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-zinc-600" />
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">
                        Model: Constant Product AMM Invariant • Phase 11 Interpreter
                    </p>
                </div>
            </div>
        </div>
    );
};
