'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, AlertTriangle, Users, X, Shield, Zap, TrendingUp } from 'lucide-react';
import {
    WalletExposure,
    extractTokens,
    buildMatrix,
    normalizeMatrix,
    getIntensityLevel,
    findSignificantCorrelations,
    calculateNetworkRisk,
    getCorrelatedWallets,
    MAX_WALLETS,
    NetworkRiskLevel
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

const RISK_STYLING: Record<NetworkRiskLevel, { bg: string; border: string; text: string; icon: string }> = {
    LOW: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '🟢' },
    MEDIUM: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: '🟡' },
    HIGH: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: '🟠' },
    CRITICAL: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300', icon: '🔴' }
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

interface TooltipData {
    wallet: string;
    token: string;
    exposure: number;
    portfolioPercent: number;
    x: number;
    y: number;
}

export function NetworkIntelligencePanel({ exposures, onClose }: NetworkIntelligencePanelProps) {
    const limitedExposures = exposures.slice(0, MAX_WALLETS);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const { tokens, matrix, normalizedMatrix, correlations, networkRisk, correlatedWallets, walletTotals } = useMemo(() => {
        const tokens = extractTokens(limitedExposures);
        const matrix = buildMatrix(limitedExposures, tokens);
        const normalizedMatrix = normalizeMatrix(matrix);
        const correlations = findSignificantCorrelations(limitedExposures, tokens, matrix, 0.3);
        const networkRisk = calculateNetworkRisk(limitedExposures, correlations);
        const correlatedWallets = getCorrelatedWallets(correlations);

        // Calculate total exposure per wallet
        const walletTotals = limitedExposures.map(w =>
            w.holdings.reduce((sum, h) => sum + h.usdValue, 0)
        );

        return { tokens, matrix, normalizedMatrix, correlations, networkRisk, correlatedWallets, walletTotals };
    }, [limitedExposures]);

    const riskStyle = RISK_STYLING[networkRisk.level];

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

    const handleCellHover = (
        e: React.MouseEvent,
        walletIdx: number,
        tokenIdx: number,
        value: number
    ) => {
        if (value === 0) {
            setTooltip(null);
            return;
        }

        const wallet = limitedExposures[walletIdx];
        const walletTotal = walletTotals[walletIdx];
        const portfolioPercent = walletTotal > 0 ? (value / walletTotal) * 100 : 0;

        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setTooltip({
            wallet: wallet.wallet,
            token: tokens[tokenIdx],
            exposure: value,
            portfolioPercent,
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden font-mono shadow-2xl relative"
        >
            {/* Tooltip */}
            {tooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl min-w-[180px]">
                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Cell Intelligence</div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">Wallet:</span>
                                <span className="text-cyan-400 font-mono">{shortenAddress(tooltip.wallet)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">Token:</span>
                                <span className="text-white font-bold">{tooltip.token}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">Exposure:</span>
                                <span className="text-amber-400 font-bold">{formatCompact(tooltip.exposure)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">% of Portfolio:</span>
                                <span className="text-white">{tooltip.portfolioPercent.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Network Risk Score Header */}
            <div className={`px-6 py-4 border-b border-zinc-900 ${riskStyle.bg}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${riskStyle.bg} border ${riskStyle.border} flex items-center justify-center`}>
                            <Shield size={20} className={riskStyle.text} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{riskStyle.icon}</span>
                                <span className={`text-xl font-black italic tracking-tight ${riskStyle.text}`}>
                                    {networkRisk.level} RISK
                                </span>
                            </div>
                            <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em]">
                                Network Intelligence Score: {networkRisk.score}/100
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

                {/* Risk Factors */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {networkRisk.factors.map((factor, idx) => (
                        <div
                            key={idx}
                            className="px-2 py-1 bg-zinc-900/50 border border-zinc-800 rounded text-[9px] text-zinc-400"
                        >
                            {factor}
                        </div>
                    ))}
                </div>
            </div>

            {/* Header Row */}
            <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Network size={16} className="text-cyan-400" />
                    <div>
                        <div className="text-sm font-black italic tracking-tight text-white">
                            Wallet ↔ Token Matrix
                        </div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em]">
                            Correlation Analysis
                        </div>
                    </div>
                </div>
                {correlatedWallets.size > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <Zap size={12} className="text-red-400" />
                        <span className="text-[10px] text-red-400 font-black uppercase">
                            {correlatedWallets.size} Clustered Wallets
                        </span>
                    </div>
                )}
            </div>

            {/* Matrix Grid */}
            <div className="p-6 overflow-x-auto">
                <div className="min-w-fit">
                    {/* Column Headers (Tokens) + Summary Column */}
                    <div className="flex mb-2">
                        <div className="w-24 shrink-0" /> {/* Empty corner cell */}
                        {tokens.map((token, idx) => (
                            <div key={token} className="w-16 shrink-0 text-center">
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
                        {/* Summary Column Header */}
                        <div className="w-20 shrink-0 text-center border-l border-zinc-800 ml-2 pl-2">
                            <div className="text-[9px] font-black uppercase tracking-tight text-emerald-400">
                                TOTAL
                            </div>
                        </div>
                    </div>

                    {/* Matrix Rows */}
                    {limitedExposures.map((wallet, rowIdx) => {
                        const isCorrelated = correlatedWallets.has(wallet.wallet);

                        return (
                            <motion.div
                                key={wallet.wallet}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: rowIdx * 0.05 }}
                                className={`flex items-center mb-1 rounded-lg transition-all ${
                                    isCorrelated ? 'bg-red-500/5 ring-1 ring-red-500/20' : ''
                                }`}
                            >
                                {/* Row Header (Wallet) */}
                                <div className="w-24 shrink-0 pr-3 flex items-center gap-2">
                                    {isCorrelated && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                    <div className={`text-[9px] font-mono truncate text-right flex-1 ${
                                        isCorrelated ? 'text-red-400' : 'text-zinc-500'
                                    }`}>
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
                                                transition-all duration-300 cursor-pointer
                                                hover:border-cyan-500/50 hover:scale-105 hover:z-10
                                                ${INTENSITY_COLORS[intensity]}
                                            `}
                                            onMouseEnter={(e) => handleCellHover(e, rowIdx, colIdx, value)}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            <span className={`text-[9px] font-mono ${INTENSITY_TEXT[intensity]}`}>
                                                {value > 0 ? formatCompact(value) : '·'}
                                            </span>
                                        </motion.div>
                                    );
                                })}

                                {/* Summary Column (Total Exposure) */}
                                <div className="w-20 shrink-0 border-l border-zinc-800 ml-2 pl-2">
                                    <div className={`
                                        h-10 rounded flex items-center justify-center
                                        bg-emerald-500/10 border border-emerald-500/20
                                    `}>
                                        <div className="flex items-center gap-1">
                                            <TrendingUp size={10} className="text-emerald-400" />
                                            <span className="text-[10px] font-bold text-emerald-400">
                                                {formatCompact(walletTotals[rowIdx])}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
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
                        <div className="border-l border-zinc-800 pl-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[8px] text-zinc-600">Correlated</span>
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
                                    className={`
                                        flex items-start gap-3 p-3 rounded-lg border
                                        ${corr.sharedTokens.length >= 2
                                            ? 'bg-red-950/30 border-red-500/30'
                                            : 'bg-zinc-950/50 border-zinc-800/50'
                                        }
                                    `}
                                >
                                    <Users size={14} className={
                                        corr.sharedTokens.length >= 2 ? 'text-red-400' : 'text-amber-500'
                                    } />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-zinc-300 font-mono mb-1">
                                            <span className={corr.sharedTokens.length >= 2 ? 'text-red-400' : 'text-amber-400'}>
                                                {shortenAddress(corr.walletA)}
                                            </span>
                                            <span className="text-zinc-600 mx-2">↔</span>
                                            <span className={corr.sharedTokens.length >= 2 ? 'text-red-400' : 'text-amber-400'}>
                                                {shortenAddress(corr.walletB)}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-zinc-500">
                                            Share exposure in:{' '}
                                            <span className="text-zinc-400 font-bold">
                                                {corr.sharedTokens.join(' + ')}
                                            </span>
                                        </div>
                                        {corr.sharedTokens.length >= 2 && (
                                            <div className="mt-2 px-2 py-1 bg-red-500/10 rounded text-[8px] text-red-400 font-black uppercase inline-block">
                                                Cluster Detected
                                            </div>
                                        )}
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
