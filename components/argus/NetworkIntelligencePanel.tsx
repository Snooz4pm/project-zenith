'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Network, AlertTriangle, Users, X } from 'lucide-react';
import {
    WalletExposure,
    extractTokens,
    buildMatrix,
    normalizeMatrix,
    getIntensityLevel,
    findSignificantCorrelations,
    MAX_WALLETS,
    MAX_TOKENS
} from '@/lib/argus/correlationEngine';

interface NetworkIntelligencePanelProps {
    exposures: WalletExposure[];
    onClose?: () => void;
}

const INTENSITY_COLORS = {
    empty: 'bg-zinc-900/50',
    low: 'bg-amber-500/20',
    medium: 'bg-amber-500/50',
    high: 'bg-red-500/70'
};

const INTENSITY_TEXT = {
    empty: 'text-zinc-700',
    low: 'text-amber-400/70',
    medium: 'text-amber-300',
    high: 'text-red-300'
};

function formatCompact(val: number): string {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    if (val > 0) return `$${val.toFixed(0)}`;
    return '-';
}

function shortenAddress(addr: string): string {
    if (addr.length <= 8) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function NetworkIntelligencePanel({ exposures, onClose }: NetworkIntelligencePanelProps) {
    const limitedExposures = exposures.slice(0, MAX_WALLETS);

    const { tokens, matrix, normalizedMatrix, correlations } = useMemo(() => {
        const tokens = extractTokens(limitedExposures);
        const matrix = buildMatrix(limitedExposures, tokens);
        const normalizedMatrix = normalizeMatrix(matrix);
        const correlations = findSignificantCorrelations(limitedExposures, tokens, matrix, 0.3);

        return { tokens, matrix, normalizedMatrix, correlations };
    }, [limitedExposures]);

    if (limitedExposures.length === 0) {
        return (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center font-mono">
                <Network size={32} className="text-zinc-800 mx-auto mb-4" />
                <div className="text-zinc-500 text-xs uppercase tracking-widest">
                    No Wallet Data Available
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden font-mono shadow-2xl"
        >
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <Network size={16} className="text-cyan-400" />
                    </div>
                    <div>
                        <div className="text-sm font-black italic tracking-tight text-white">
                            Network Intelligence
                        </div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em]">
                            Wallet ↔ Token Correlation Matrix
                        </div>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <X size={16} className="text-zinc-500" />
                    </button>
                )}
            </div>

            {/* Matrix Grid */}
            <div className="p-6 overflow-x-auto">
                <div className="min-w-fit">
                    {/* Column Headers (Tokens) */}
                    <div className="flex mb-2">
                        <div className="w-24 shrink-0" /> {/* Empty corner cell */}
                        {tokens.map((token, idx) => (
                            <div
                                key={token}
                                className="w-16 shrink-0 text-center"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="text-[9px] font-black uppercase tracking-tight text-zinc-400 truncate px-1"
                                    title={token}
                                >
                                    {token.length > 6 ? token.slice(0, 6) : token}
                                </motion.div>
                            </div>
                        ))}
                    </div>

                    {/* Matrix Rows */}
                    {limitedExposures.map((wallet, rowIdx) => (
                        <motion.div
                            key={wallet.wallet}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: rowIdx * 0.05 }}
                            className="flex items-center mb-1"
                        >
                            {/* Row Header (Wallet) */}
                            <div className="w-24 shrink-0 pr-3">
                                <div className="text-[9px] font-mono text-zinc-500 truncate text-right">
                                    {shortenAddress(wallet.wallet)}
                                </div>
                            </div>

                            {/* Matrix Cells */}
                            {tokens.map((token, colIdx) => {
                                const value = matrix[rowIdx][colIdx];
                                const normalized = normalizedMatrix[rowIdx][colIdx];
                                const intensity = getIntensityLevel(normalized);

                                return (
                                    <motion.div
                                        key={`${rowIdx}-${colIdx}`}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: (rowIdx + colIdx) * 0.02 }}
                                        className={`
                                            w-16 h-10 shrink-0 mx-0.5 rounded
                                            flex items-center justify-center
                                            border border-zinc-800/50
                                            transition-all duration-300
                                            hover:border-zinc-600 hover:scale-105
                                            ${INTENSITY_COLORS[intensity]}
                                        `}
                                        title={`${shortenAddress(wallet.wallet)} → ${token}: ${formatCompact(value)}`}
                                    >
                                        <span className={`text-[9px] font-mono ${INTENSITY_TEXT[intensity]}`}>
                                            {value > 0 ? formatCompact(value) : '·'}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-zinc-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-[8px] text-zinc-600 uppercase tracking-widest">Exposure:</div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className={`w-3 h-3 rounded ${INTENSITY_COLORS.empty}`} />
                                <span className="text-[8px] text-zinc-600">None</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className={`w-3 h-3 rounded ${INTENSITY_COLORS.low}`} />
                                <span className="text-[8px] text-zinc-600">Low</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className={`w-3 h-3 rounded ${INTENSITY_COLORS.medium}`} />
                                <span className="text-[8px] text-zinc-600">Med</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className={`w-3 h-3 rounded ${INTENSITY_COLORS.high}`} />
                                <span className="text-[8px] text-zinc-600">High</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-[8px] text-zinc-700 font-mono">
                        {limitedExposures.length} wallets × {tokens.length} tokens
                    </div>
                </div>
            </div>

            {/* Correlation Insights */}
            {correlations.length > 0 && (
                <div className="px-6 pb-6">
                    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={14} className="text-amber-400" />
                            <div className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-black">
                                Detected Correlations
                            </div>
                        </div>

                        <div className="space-y-3">
                            {correlations.slice(0, 3).map((corr, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50"
                                >
                                    <Users size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-zinc-300 font-mono mb-1">
                                            <span className="text-amber-400">{shortenAddress(corr.walletA)}</span>
                                            <span className="text-zinc-600 mx-2">↔</span>
                                            <span className="text-amber-400">{shortenAddress(corr.walletB)}</span>
                                        </div>
                                        <div className="text-[9px] text-zinc-500">
                                            Share exposure in:{' '}
                                            <span className="text-zinc-400">
                                                {corr.sharedTokens.join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`
                                        px-2 py-1 rounded text-[9px] font-black
                                        ${corr.score > 0.66 ? 'bg-red-500/20 text-red-400' :
                                            corr.score > 0.5 ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-zinc-800 text-zinc-400'}
                                    `}>
                                        {(corr.score * 100).toFixed(0)}%
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {correlations.length > 3 && (
                            <div className="mt-3 text-center">
                                <span className="text-[9px] text-zinc-600 font-mono">
                                    +{correlations.length - 3} more correlations
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* No Correlations State */}
            {correlations.length === 0 && limitedExposures.length > 1 && (
                <div className="px-6 pb-6">
                    <div className="bg-emerald-950/20 rounded-xl border border-emerald-500/20 p-4 text-center">
                        <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">
                            No Significant Overlap Detected
                        </div>
                        <div className="text-[9px] text-zinc-500 mt-1">
                            These wallets have independent exposure profiles
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
