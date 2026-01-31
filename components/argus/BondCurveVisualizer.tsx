'use client';

import React from 'react';
import {
    ComposedChart,
    Area,
    Line,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Info, AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react';

interface BondCurveVisualizerProps {
    ammCurveData: { cumulativeUSD: number; price: number }[];
    trajectoryPoints: { cumulativeUSD: number; price: number; timestamp: number }[];
    fittedCurve: { cumulativeUSD: number; price: number }[];
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
    ammCurveData,
    trajectoryPoints,
    fittedCurve,
    targetPrice,
    currentPrice,
    symbol
}) => {
    const maxObservedPrice = Math.max(...trajectoryPoints.map(p => p.price), currentPrice);
    const targetReachable = maxObservedPrice >= targetPrice;

    // We use the fitted curve to find capital required for truth-based reachability
    const capitalAtTarget = fittedCurve.find(p => p.price >= targetPrice)?.cumulativeUSD ?? null;

    return (
        <div className="bg-zinc-950/20 rounded-2xl border border-zinc-900 overflow-hidden">
            <div className="p-6 border-b border-zinc-900 bg-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-indigo-400" />
                        <div className="text-[11px] text-white font-black uppercase tracking-widest italic">Empirical Capital Trajectory</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-black italic tracking-tighter ${targetReachable ? 'bg-emerald-500 text-black' : 'bg-amber-500/20 text-amber-500'
                        }`}>
                        {targetReachable ? 'Target Reachable on Trajectory' : 'Trajectory Resistance Detected'}
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="ammGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#27272a" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#27272a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                            <XAxis
                                type="number"
                                dataKey="cumulativeUSD"
                                stroke="#3f3f46"
                                fontSize={10}
                                tickFormatter={formatUSD}
                                domain={['dataMin', 'auto']}
                                label={{ value: 'Net Capital Injected (USD)', position: 'insideBottom', offset: -5, fill: '#3f3f46', fontSize: 8, fontWeight: 'bold' }}
                            />
                            <YAxis
                                type="number"
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

                            {/* AMM Baseline Area */}
                            <Area
                                data={ammCurveData}
                                type="monotone"
                                dataKey="price"
                                stroke="#27272a"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#ammGradient)"
                                animationDuration={1000}
                                name="AMM Baseline"
                            />

                            {/* Fitted Logarithmic Trajectory */}
                            <Line
                                data={fittedCurve}
                                type="monotone"
                                dataKey="price"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={false}
                                animationDuration={2000}
                                name="Fitted Trajectory"
                            />

                            {/* Real Transaction Points */}
                            <Scatter
                                data={trajectoryPoints}
                                name="Real Transactions"
                                fill="#fff"
                            >
                                {trajectoryPoints.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.price >= currentPrice ? '#10b981' : '#f43f5e'}
                                        opacity={0.6}
                                    />
                                ))}
                            </Scatter>

                            <ReferenceLine y={targetPrice} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Target', fill: '#ef4444', fontSize: 8, fontWeight: 'black' }} />
                            <ReferenceLine x={0} stroke="#525252" strokeWidth={1} />
                        </ComposedChart>
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
                                Trajectory Verdict
                            </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                            {targetReachable
                                ? `Based on empirical price response, reaching the target price would require approximately ${formatUSD(capitalAtTarget || 0)} in net buying logic.`
                                : `The price-to-capital ceiling derived from historical swaps suggests the curve flattens before reaching $${targetPrice.toFixed(4)}. Current behavior indicates structural resistance.`}
                        </p>
                    </div>

                    <div className="bg-black/40 p-4 rounded-xl border border-zinc-900">
                        <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-3">Model Logic</div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                            Unlike pure AMM models, this **Empirical Trajectory** uses logarithmic regression ($P(C) = P_0 + a \cdot \ln(1 + b \cdot C)$) fitted to your specific coin's trade history to reveal its true capital response.
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-3 bg-zinc-900/30 border-t border-zinc-900">
                <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-zinc-600" />
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">
                        Model: Empirical Logarithmic Regression • Phase 12 Trajectory
                    </p>
                </div>
            </div>
        </div>
    );
};
