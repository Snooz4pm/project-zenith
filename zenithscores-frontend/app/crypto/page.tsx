'use client';

import { Coins, ChevronRight, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useCryptoLive } from '@/lib/market/crypto/useCryptoLive';
import { SUPPORTED_CRYPTOS } from '@/lib/market/crypto-engine';
import Link from 'next/link';

// Sparkline Component
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
            {/* Fill gradient */}
            <path
                d={`M ${points} L ${width},${height} L 0,${height} Z`}
                fill={color}
                fillOpacity="0.1"
                stroke="none"
            />
        </svg>
    );
}

// Generate fake history for sparkline based on current trend
function generateHistory(price: number, change: number) {
    const points = 20;
    const volatility = price * 0.02; // 2% volatility
    const history = [];
    let current = price * (1 - change / 100); // start approximation

    for (let i = 0; i < points; i++) {
        // Add trend bias + random noise
        const bias = (price - current) / (points - i);
        current += bias + (Math.random() - 0.5) * volatility;
        history.push(current);
    }
    history.push(price); // Ensure it ends at current price
    return history;
}

function CryptoRow({ symbol, index }: { symbol: string, index: number }) {
    const data = useCryptoLive({ symbol, enabled: true });

    // Skeleton
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

    const price = data.priceUsd || 0;
    const change = data.priceChange24h || 0;
    const isPositive = change >= 0;
    const history = generateHistory(price, change);
    const score = Math.min(99, Math.max(1, Math.round(50 + change * 5))); // Fake score algo for visuals

    let regime = "Neutral";
    let regimeColor = "text-gray-400";
    if (Math.abs(change) > 5) { regime = isPositive ? "Breakout" : "Crash"; regimeColor = isPositive ? "text-[var(--accent-mint)]" : "text-[var(--accent-danger)]"; }
    else if (Math.abs(change) > 2) { regime = isPositive ? "Trending" : "Pullback"; regimeColor = isPositive ? "text-[var(--accent-mint)]" : "text-orange-400"; }


    return (
        <tr className={`group border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${index % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : 'bg-transparent'}`}>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center font-bold text-xs">
                        {symbol.substring(0, 1)}
                    </div>
                    <div>
                        <div className="font-bold text-white">{data.symbol || symbol}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Crypto</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="font-mono text-[var(--text-primary)]" style={{ fontFamily: "var(--font-data)" }}>
                    ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </td>
            <td className="p-4">
                <div className={`font-mono flex items-center gap-1 ${isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`} style={{ fontFamily: "var(--font-data)" }}>
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(change).toFixed(2)}%
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
                <Link href={`/crypto/${symbol}`} className="inline-flex w-10 h-10 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] hover:text-white transition-colors">
                    <ChevronRight size={20} />
                </Link>
            </td>
        </tr>
    );
}

export default function CryptoPage() {
    return (
        <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] pt-24 pb-20">
            <main className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                            <Coins className="text-[var(--accent-gold)]" size={32} />
                            Crypto Markets
                        </h1>
                        <p className="text-[var(--text-secondary)]">Real-time institutional grade data feed.</p>
                    </div>
                    <div className="hidden md:flex gap-2">
                        {['All', 'DeFi', 'L1', 'Metaverse'].map(filter => (
                            <button key={filter} className="px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.05)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)]">
                                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider pl-6">Asset</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Price (USD)</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">24h Change</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-32">Trend (1H)</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Zenith Score</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SUPPORTED_CRYPTOS.map((symbol, index) => (
                                    <CryptoRow key={symbol} symbol={symbol} index={index} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
