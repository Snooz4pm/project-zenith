'use client';

import { Building2, ChevronRight, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useLivePrice } from '@/lib/market/live';
import Link from 'next/link';
import { useState } from 'react';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

// ALL 50 US STOCKS - Finnhub free tier
const ALL_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'AMD', 'INTC', 'CRM', 'ORCL',
    'ADBE', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'IBM', 'NOW',
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'C', 'AXP', 'V', 'MA',
    'JNJ', 'UNH', 'PFE', 'MRK', 'ABBV', 'LLY', 'TMO', 'ABT',
    'TSLA', 'HD', 'NKE', 'MCD', 'SBUX', 'DIS', 'NFLX', 'COST', 'WMT', 'TGT',
    'BA', 'CAT', 'GE', 'XOM', 'CVX',
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
    const volatility = price * 0.015;
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
function StockCard({ symbol }: { symbol: string }) {
    const data = useLivePrice({ symbol, assetType: 'stock', enabled: true });

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
    const score = Math.min(99, Math.max(1, Math.round(50 + change * 8)));

    let regime = "Neutral";
    let regimeColor = "text-gray-400";
    if (Math.abs(change) > 3) { regime = isPositive ? "Momentum" : "Sell-off"; regimeColor = isPositive ? "text-[var(--accent-mint)]" : "text-[var(--accent-danger)]"; }
    else if (Math.abs(change) > 1) { regime = isPositive ? "Bullish" : "Bearish"; regimeColor = isPositive ? "text-[var(--accent-mint)]" : "text-orange-400"; }

    return (
        <Link
            href={`/stocks/${symbol}`}
            className="block p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[var(--accent-cyan)]/30 transition-all active:scale-[0.98]"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-sm text-[var(--accent-cyan)]">
                        {symbol.substring(0, 1)}
                    </div>
                    <div>
                        <div className="font-bold text-white">{symbol}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Stock</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-white font-medium" style={{ fontFamily: "var(--font-data)" }}>
                        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`font-mono text-sm flex items-center justify-end gap-1 ${isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`} style={{ fontFamily: "var(--font-data)" }}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(change).toFixed(2)}%
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

function StockRow({ symbol, index }: { symbol: string, index: number }) {
    const data = useLivePrice({ symbol, assetType: 'stock', enabled: true });

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
    const score = Math.min(99, Math.max(1, Math.round(50 + change * 8)));

    let regime = "Neutral";
    let regimeColor = "text-gray-400";
    if (Math.abs(change) > 3) { regime = isPositive ? "Momentum" : "Sell-off"; regimeColor = isPositive ? "text-[var(--accent-mint)]" : "text-[var(--accent-danger)]"; }
    else if (Math.abs(change) > 1) { regime = isPositive ? "Bullish" : "Bearish"; regimeColor = isPositive ? "text-[var(--accent-mint)]" : "text-orange-400"; }


    return (
        <tr className={`group border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${index % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : 'bg-transparent'}`}>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center font-bold text-xs text-[var(--accent-cyan)]">
                        {symbol.substring(0, 1)}
                    </div>
                    <div>
                        <div className="font-bold text-white">{symbol}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Stock</div>
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
                <Link href={`/stocks/${symbol}`} className="inline-flex w-10 h-10 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] hover:text-white transition-colors">
                    <ChevronRight size={20} />
                </Link>
            </td>
        </tr>
    );
}

export default function StocksPage() {
    const isMobile = useIsMobile();
    const [search, setSearch] = useState('');

    const filteredStocks = ALL_STOCKS.filter(s => s.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] pt-24 pb-20">
            <main className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                            <Building2 className="text-[var(--accent-cyan)]" size={32} />
                            Stock Market
                        </h1>
                        <p className="text-[var(--text-secondary)]">Live equity data from major US exchanges.</p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-[var(--text-muted)]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search ticker..."
                            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile: Vertical Cards (NO horizontal scroll) */}
                {isMobile ? (
                    <div className="space-y-2">
                        {filteredStocks.map((symbol) => (
                            <StockCard key={symbol} symbol={symbol} />
                        ))}
                        {filteredStocks.length === 0 && (
                            <div className="p-8 text-center text-[var(--text-muted)] bg-white/[0.02] rounded-xl">
                                No stocks found matching "{search}"
                            </div>
                        )}
                    </div>
                ) : (
                    /* Desktop: Table */
                    <div className="glass-panel rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.05)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)]">
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider pl-6">Ticker</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Price</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Change</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-32">Trend</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Score</th>
                                        <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right pr-6"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStocks.map((symbol, index) => (
                                        <StockRow key={symbol} symbol={symbol} index={index} />
                                    ))}
                                    {filteredStocks.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">No stocks found matching "{search}"</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
