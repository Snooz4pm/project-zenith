'use client';

import { Globe, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useLivePrice } from '@/lib/market/live';
import Link from 'next/link';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

// ALL FOREX PAIRS
const ALL_FOREX = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/CHF',
];

function Sparkline({ data, color }: { data: number[], color: string }) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 30;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <path
                d={`M ${points}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d={`M ${points} L ${width},${height} L 0,${height} Z`}
                fill={color}
                fillOpacity="0.1"
                stroke="none"
            />
        </svg>
    );
}

function generateHistory(price: number, change: number) {
    const points = 20;
    const volatility = price * 0.005; // Lower vol for forex
    const history = [];
    let current = price * (1 - change / 100);

    for (let i = 0; i < points; i++) {
        const bias = (price - current) / (points - i);
        current += bias + (Math.random() - 0.5) * volatility;
        history.push(current);
    }
    history.push(price);
    return history;
}

// Mobile Card Component
function ForexCard({ symbol }: { symbol: string }) {
    const data = useLivePrice({ symbol, assetType: 'forex', enabled: true });

    if (data.isLoading) {
        return (
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl animate-pulse">
                <div className="h-16 bg-white/5 rounded" />
            </div>
        );
    }

    const price = data.price || 0;
    const change = data.previousClose > 0 ? ((data.price - data.previousClose) / data.previousClose) * 100 : 0;
    const isPositive = change >= 0;
    const score = Math.min(99, Math.max(1, Math.round(50 + change * 20)));

    let regime = "Range";
    let regimeColor = "text-gray-400";
    if (Math.abs(change) > 0.5) { regime = isPositive ? "Trend" : "Weakness"; regimeColor = isPositive ? "text-[var(--accent-mint)]" : "text-[var(--accent-danger)]"; }

    return (
        <Link
            href={`/forex/${symbol.replace('/', '-')}`}
            className="block p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[var(--accent-gold)]/30 transition-all active:scale-[0.98]"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-sm text-[var(--accent-gold)]">
                        {symbol.substring(0, 1)}
                    </div>
                    <div>
                        <div className="font-bold text-white">{symbol}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Forex</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-white font-medium" style={{ fontFamily: "var(--font-data)" }}>
                        {price.toFixed(4)}
                    </div>
                    <div className={`font-mono text-sm flex items-center justify-end gap-1 ${isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`} style={{ fontFamily: "var(--font-data)" }}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(change).toFixed(3)}%
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-bold font-mono border ${score > 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-[var(--accent-mint)]' :
                            score < 30 ? 'bg-red-500/10 border-red-500/20 text-[var(--accent-danger)]' :
                                'bg-gray-500/10 border-gray-500/20 text-gray-400'
                        }`}>
                        {score}
                    </div>
                    <span className={`text-xs uppercase tracking-wider ${regimeColor}`}>{regime}</span>
                </div>
                <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </div>
        </Link>
    );
}

function ForexRow({ symbol, index }: { symbol: string, index: number }) {
    const data = useLivePrice({ symbol, assetType: 'forex', enabled: true });

    if (data.isLoading) {
        return (
            <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <td className="p-4"><div className="h-6 w-24 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-6 w-20 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-6 w-16 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-8 w-24 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-6 w-12 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-8 w-8 bg-[rgba(255,255,255,0.05)] rounded-full animate-pulse ml-auto" /></td>
            </tr>
        );
    }

    const price = data.price || 0;
    const change = data.previousClose > 0 ? ((data.price - data.previousClose) / data.previousClose) * 100 : 0;
    const isPositive = change >= 0;
    const history = generateHistory(price, change);
    const score = Math.min(99, Math.max(1, Math.round(50 + change * 20))); // Higher sensitivity for forex

    let regime = "Range";
    let regimeColor = "text-gray-400";
    if (Math.abs(change) > 0.5) { regime = isPositive ? "Trend" : "Weakness"; regimeColor = isPositive ? "text-[var(--accent-mint)]" : "text-[var(--accent-danger)]"; }


    return (
        <tr className={`group border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${index % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : 'bg-transparent'}`}>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center font-bold text-xs text-[var(--accent-gold)]">
                        {symbol.substring(0, 1)}
                    </div>
                    <div>
                        <div className="font-bold text-white">{symbol}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Forex</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="font-mono text-[var(--text-primary)]" style={{ fontFamily: "var(--font-data)" }}>
                    {price.toFixed(4)}
                </div>
            </td>
            <td className="p-4">
                <div className={`font-mono flex items-center gap-1 ${isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`} style={{ fontFamily: "var(--font-data)" }}>
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(change).toFixed(3)}%
                </div>
            </td>
            <td className="p-4">
                <Sparkline data={history} color={isPositive ? 'var(--accent-mint)' : 'var(--accent-danger)'} />
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-bold font-mono border ${score > 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-[var(--accent-mint)]' :
                            score < 30 ? 'bg-red-500/10 border-red-500/20 text-[var(--accent-danger)]' :
                                'bg-gray-500/10 border-gray-500/20 text-gray-400'
                        }`}>
                        {score}
                    </div>
                    <span className={`text-xs uppercase tracking-wider ${regimeColor}`}>{regime}</span>
                </div>
            </td>
            <td className="p-4 text-right">
                <Link href={`/forex/${symbol.replace('/', '-')}`} className="inline-flex w-10 h-10 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] hover:text-white transition-colors">
                    <ChevronRight size={20} />
                </Link>
            </td>
        </tr>
    );
}

export default function ForexPage() {
    const isMobile = useIsMobile();

    return (
        <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] pt-24 pb-20">
            <main className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                            <Globe className="text-[var(--accent-gold)]" size={32} />
                            Forex Pairs
                        </h1>
                        <p className="text-[var(--text-secondary)]">24/7 Global Currency Markets.</p>
                    </div>
                </div>

                {/* Mobile: Vertical Cards (NO horizontal scroll) */}
                {isMobile ? (
                    <div className="space-y-2">
                        {ALL_FOREX.map((symbol) => (
                            <ForexCard key={symbol} symbol={symbol} />
                        ))}
                    </div>
                ) : (
                    /* Desktop: Table */
                    <div className="glass-panel rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.05)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)]">
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider pl-6">Pair</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Rate</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Change</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-32">Trend</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Strength</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right pr-6"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ALL_FOREX.map((symbol, index) => (
                                        <ForexRow key={symbol} symbol={symbol} index={index} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
