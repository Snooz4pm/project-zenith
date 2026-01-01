'use client';

import { Droplets, Activity, Clock, DollarSign } from 'lucide-react';
import LiveMarketFlow from './LiveMarketFlow';
import { NormalizedTx } from '@/lib/flow/flow-types';

interface MarketStatsPanelProps {
    pair: {
        pairAddress: string;
        priceUsd: number;
        priceChange: { m5?: number; h1?: number; h6?: number; h24?: number };
        volume: { m5?: number; h1?: number; h6?: number; h24?: number };
        liquidity: { usd?: number; base?: number; quote?: number };
        fdv: number;
        txns: {
            m5?: { buys: number; sells: number };
            h1?: { buys: number; sells: number };
            h24?: { buys: number; sells: number };
        };
        pairCreatedAt: number;
    } | null;
    transactions?: NormalizedTx[];
    isPolling?: boolean;
}

export default function MarketStatsPanel({ pair, transactions = [], isPolling = false }: MarketStatsPanelProps) {
    if (!pair) {
        return (
            <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                Select a pair
            </div>
        );
    }

    const liquidity = pair.liquidity?.usd || 0;
    const volume24h = pair.volume?.h24 || 0;
    const volume1h = pair.volume?.h1 || 0;

    const pairAge = pair.pairCreatedAt
        ? formatAge(Date.now() - pair.pairCreatedAt)
        : 'Unknown';

    return (
        <div className="h-full flex flex-col bg-[#0c0c10]">
            {/* Stats Section - Compact */}
            <div className="flex-shrink-0">
                {/* Liquidity */}
                <Section title="Liquidity">
                    <StatRow
                        icon={<Droplets size={14} className="text-cyan-400" />}
                        label="Total"
                        value={`$${formatCompact(liquidity)}`}
                    />
                    <StatRow
                        icon={<DollarSign size={14} className="text-zinc-500" />}
                        label="FDV"
                        value={`$${formatCompact(pair.fdv)}`}
                    />
                </Section>

                {/* Volume */}
                <Section title="Volume">
                    <StatRow
                        icon={<Activity size={14} className="text-purple-400" />}
                        label="24H"
                        value={`$${formatCompact(volume24h)}`}
                    />
                    <StatRow
                        icon={<Activity size={14} className="text-purple-400/60" />}
                        label="1H"
                        value={`$${formatCompact(volume1h)}`}
                    />
                </Section>

                {/* Price Changes */}
                <Section title="Price Change">
                    <div className="grid grid-cols-2 gap-2">
                        <ChangeChip label="5m" value={pair.priceChange?.m5} />
                        <ChangeChip label="1h" value={pair.priceChange?.h1} />
                        <ChangeChip label="6h" value={pair.priceChange?.h6} />
                        <ChangeChip label="24h" value={pair.priceChange?.h24} />
                    </div>
                </Section>

                {/* Pair Info */}
                <Section title="Pair Info">
                    <StatRow
                        icon={<Clock size={14} className="text-zinc-500" />}
                        label="Age"
                        value={pairAge}
                    />
                </Section>
            </div>

            {/* Live Market Flow - Takes remaining space */}
            <div className="flex-1 min-h-0 border-t border-white/[0.06]">
                <LiveMarketFlow transactions={transactions} isPolling={isPolling} />
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="p-3 border-b border-white/[0.06]">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                {title}
            </h3>
            {children}
        </div>
    );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-xs text-zinc-400">
                {icon}
                {label}
            </span>
            <span className="text-sm font-mono text-white">{value}</span>
        </div>
    );
}

function ChangeChip({ label, value }: { label: string; value?: number }) {
    const v = value || 0;
    const isPositive = v >= 0;
    return (
        <div className={`px-2 py-1.5 rounded text-center ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <div className="text-[10px] text-zinc-500">{label}</div>
            <div className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{v.toFixed(1)}%
            </div>
        </div>
    );
}

function formatCompact(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
}

function formatAge(ms: number): string {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days > 30) return `${Math.floor(days / 30)}mo`;
    if (days > 0) return `${days}d`;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;
    const mins = Math.floor(ms / (1000 * 60));
    return `${mins}m`;
}
