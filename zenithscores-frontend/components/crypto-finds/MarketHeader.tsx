'use client';

import { ExternalLink, RefreshCw } from 'lucide-react';
import { useDisciplineGate } from '@/hooks/useDisciplineGate';
import { FlowRegime } from '@/lib/flow/flow-types';
import FlowRegimeBadge from './FlowRegimeBadge';

interface MarketHeaderProps {
    pair: {
        pairAddress: string;
        chainId: string;
        baseToken: { symbol: string; name: string };
        quoteToken: { symbol: string };
        priceUsd: number;
        priceChange: { h1?: number; h24?: number };
        url: string;
    };
    flowRegime?: FlowRegime;
}

export default function MarketHeader({ pair, flowRegime = FlowRegime.QUIET }: MarketHeaderProps) {
    const { isLocked, localDecision } = useDisciplineGate();

    const priceChange24h = pair.priceChange?.h24 || 0;
    const priceChange1h = pair.priceChange?.h1 || 0;
    const isPositive24h = priceChange24h >= 0;
    const isPositive1h = priceChange1h >= 0;

    // Discipline Gate status
    const dgStatus = isLocked ? 'locked' : localDecision.status;
    const dgConfig = {
        open: { label: 'CLEAR', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '🟢' },
        warning: { label: 'CAUTION', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '🟡' },
        locked: { label: 'LOCKED', color: 'text-red-400', bg: 'bg-red-500/10', icon: '🔴' }
    };
    const dg = dgConfig[dgStatus];

    return (
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.06] bg-[#0c0c10]">
            <div className="flex items-center justify-between">
                {/* Left: Pair Info */}
                <div className="flex items-center gap-4">
                    {/* Symbol */}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">{pair.baseToken.symbol}</span>
                            <span className="text-sm text-zinc-600">/ {pair.quoteToken.symbol}</span>
                        </div>
                        <div className="text-xs text-zinc-500">{pair.baseToken.name}</div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                        <div className="text-xl font-mono font-bold text-white">
                            ${pair.priceUsd < 0.01
                                ? pair.priceUsd.toExponential(2)
                                : pair.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })
                            }
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={isPositive24h ? 'text-emerald-400' : 'text-red-400'}>
                                {isPositive24h ? '+' : ''}{priceChange24h.toFixed(2)}% 24h
                            </span>
                            <span className={isPositive1h ? 'text-emerald-400' : 'text-red-400'}>
                                {isPositive1h ? '+' : ''}{priceChange1h.toFixed(2)}% 1h
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-3">
                    {/* DG Badge (READ-ONLY) */}
                    <div className={`px-3 py-1.5 rounded-lg ${dg.bg} flex items-center gap-2`}>
                        <span>{dg.icon}</span>
                        <span className={`text-xs font-bold ${dg.color}`}>DG: {dg.label}</span>
                    </div>

                    {/* Flow Regime Badge */}
                    <FlowRegimeBadge regime={flowRegime} compact />

                    {/* External Link */}
                    <a
                        href={pair.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Open in Dexscreener"
                    >
                        <ExternalLink size={16} />
                    </a>

                    {/* Chain Badge */}
                    <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-zinc-400 uppercase">
                        {pair.chainId}
                    </div>
                </div>
            </div>
        </div>
    );
}
