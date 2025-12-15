'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowUp, ArrowDown, Activity, Zap, TrendingUp, Info,
    Copy, ExternalLink, Shield, Wallet, CheckCircle, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { getZenithSignal, generateInsight } from '@/lib/zenith';
import { getCryptoMetadata, CryptoMetadata } from '@/lib/crypto-data';
import Link from 'next/link';

// Mock History Data Generator (Preserved)
const generateHistory = (currentPrice: number, score: number) => {
    const data = [];
    let price = currentPrice * 0.85;
    const points = 30;
    const trend = score > 60 ? 1.02 : score < 40 ? 0.98 : 1.00;

    for (let i = 0; i < points; i++) {
        const volatility = (Math.random() - 0.4) * 0.05;
        price = price * trend + (price * volatility);
        if (i === points - 1) price = currentPrice;

        data.push({
            day: `Day ${i + 1}`,
            price: price,
            signal: i === 10 && score > 70 ? 'STRONG BUY' : i === 20 && score < 40 ? 'AVOID' : null
        });
    }
    return data;
};

export default function AssetPage() {
    const params = useParams();
    const symbol = typeof params.symbol === 'string' ? params.symbol : '';

    const [token, setToken] = useState<any>(null);
    const [meta, setMeta] = useState<CryptoMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    const [activeStep, setActiveStep] = useState<number | null>(0);
    const [copied, setCopied] = useState(false);
    const [compareMode, setCompareMode] = useState(false);

    // New Features State
    const [subScores, setSubScores] = useState({ momentum: 0, volume: 0, social: 0 });
    const [relatedAssets, setRelatedAssets] = useState<any[]>([]);

    useEffect(() => {
        if (!symbol) return;

        const fetchData = async () => {
            try {
                // Feature 1: Get Static Metadata
                const metadata = getCryptoMetadata(symbol);
                setMeta(metadata);

                // Feature 2: Get Dynamic Market Data
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/v1/search?query=${symbol}`);
                const data = await res.json();

                if (data.status === 'success' && data.data.length > 0) {
                    const t = data.data[0];
                    // Score Fallback
                    if (!t.zenith_score) {
                        t.zenith_score = 50 + (t.price_change_24h || 0) + ((t.volume_24h || 0) > 100000 ? 10 : 0);
                        if (t.zenith_score > 100) t.zenith_score = 99;
                        if (t.zenith_score < 0) t.zenith_score = 10;
                    }
                    setToken(t);
                    setHistory(generateHistory(t.price_usd, t.zenith_score || 50));

                    // Mock Sub-Scores derived from main score
                    setSubScores({
                        momentum: Math.min(99, Math.floor(t.zenith_score * (1 + (Math.random() * 0.2 - 0.1)))),
                        volume: Math.min(99, Math.floor(t.zenith_score * (1 + (Math.random() * 0.3 - 0.15)))),
                        social: Math.min(99, Math.floor(t.zenith_score * (1 + (Math.random() * 0.4 - 0.2)))),
                    });

                    // Mock Related Assets
                    setRelatedAssets([
                        { symbol: 'ETH', name: 'Ethereum', score: t.zenith_score - 5, change: 1.2 },
                        { symbol: 'SOL', name: 'Solana', score: t.zenith_score + 2, change: 3.4 },
                        { symbol: 'AVAX', name: 'Avalanche', score: t.zenith_score - 12, change: -0.5 },
                    ]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbol]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">Initializing Zenith Protocol...</div>;
    if (!token || !meta) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Asset not found.</div>;

    const signal = getZenithSignal(token.zenith_score);
    const isPositive = (token.price_change_24h || 0) >= 0;
    const isExtreme = token.zenith_score >= 80 || token.zenith_score <= 20;

    return (
        <div className="min-h-screen bg-black text-white pb-20 font-sans selection:bg-blue-500/30">
            {/* Nav */}
            <div className="border-b border-gray-800 bg-black/80 backdrop-blur sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/crypto" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 font-mono">LIVE FEED</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-8">

                {/* EXTREME SIGNAL ALERT - New Feature */}
                {isExtreme && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-8 p-4 rounded-xl border flex items-start gap-4 ${token.zenith_score >= 80 ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}
                    >
                        <AlertTriangle className={token.zenith_score >= 80 ? 'text-green-500' : 'text-red-500'} />
                        <div>
                            <h3 className={`font-bold ${token.zenith_score >= 80 ? 'text-green-400' : 'text-red-400'}`}>Extreme Signal Detected</h3>
                            <p className="text-sm text-gray-300 mt-1">
                                {token.zenith_score >= 80
                                    ? "This asset has entered 'Strong Bullish' territory suitable for momentum trading. High volatility expected."
                                    : "This asset is in 'Deep Bear' territory. Oversold conditions detected but trend remains negative."}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* TOP HEADER SECTION */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-3xl font-bold border border-gray-700 shadow-xl">
                                {token.symbol[0]}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-black ${signal.bg}`}>
                                {signal.type === 'STRONG_BUY' ? <TrendingUp size={16} className="text-black" /> : <Activity size={16} className="text-black" />}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-heading mb-2 text-white">{token.name}</h1>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700 font-medium">{meta.network}</span>
                                <span className="text-gray-500 font-mono-premium">{token.symbol}</span>
                            </div>
                        </div>
                    </div>

                    {/* Price Block */}
                    <div className="text-right">
                        <div className="text-6xl font-mono-premium font-bold tracking-tighter mb-1 text-white">
                            ${token.price_usd < 1 ? token.price_usd.toFixed(6) : token.price_usd.toFixed(2)}
                        </div>
                        <div className={`text-lg font-medium flex items-center justify-end gap-2 ${isPositive ? 'text-zenith-green' : 'text-zenith-red'}`}>
                            {isPositive ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                            {Math.abs(token.price_change_24h || 0).toFixed(2)}% (24h)
                        </div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN (8/12) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. CHART CARD with COMPARISON TOOL */}
                        <div className="glass-panel rounded-2xl p-6 relative">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="label-premium text-gray-400 flex items-center gap-2">
                                        <Activity size={16} /> PRICE ACTION vs SIGNAL
                                    </h3>
                                    {/* Comparison Toggle */}
                                    <button
                                        onClick={() => setCompareMode(!compareMode)}
                                        className={`text-xs px-2 py-1 rounded font-bold border transition-all ${compareMode ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-700 text-gray-500 hover:text-white'}`}
                                    >
                                        + Compare BTC
                                    </button>
                                </div>
                                <div className="flex gap-4 text-xs font-mono-premium">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full" /> PRICE</span>
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> BUY SIGNAL</span>
                                    {compareMode && <span className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full" /> BTC</span>}
                                </div>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history}>
                                        <defs>
                                            <linearGradient id="gradientPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                        {compareMode && (
                                            <Line
                                                type="monotone"
                                                dataKey="price" // Mocking comparison with same data slightly offset for visual
                                                stroke="#f97316"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={false}
                                            />
                                        )}
                                        {history.map((entry, index) => (
                                            entry.signal ?
                                                <ReferenceDot key={index} x={entry.day} y={entry.price} r={6} fill={entry.signal === 'STRONG BUY' ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth={2} />
                                                : null
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. RELATED ASSETS FEED - New Feature */}
                        <div>
                            <h3 className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-4">Related Opportunities</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {relatedAssets.map((asset) => (
                                    <Link key={asset.symbol} href={`/crypto/${asset.symbol}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-500/30 transition-all flex items-center justify-between group">
                                        <div>
                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{asset.symbol}</div>
                                            <div className="text-xs text-gray-500">{asset.name}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-white">{asset.score}</div>
                                            <div className={`text-xs ${asset.change > 0 ? 'text-green-500' : 'text-red-500'}`}>{asset.change > 0 ? '+' : ''}{asset.change}%</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* 3. BLOCKCHAIN INTELLIGENCE (Moved Down) */}
                        <div className="glass-panel rounded-2xl p-8">
                            {/* ... content preserved ... */}
                            <h2 className="text-2xl font-heading mb-6 flex items-center gap-2">
                                <Zap className="text-zenith-yellow" /> Blockchain Architecture
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                                    <div className="label-premium text-gray-500 mb-1">Network</div>
                                    <div className="font-medium text-lg text-white flex items-center gap-2">
                                        {meta.network}
                                        <CheckCircle size={14} className="text-zenith-green" />
                                    </div>
                                </div>
                                <div className="bg-black/30 p-4 rounded-xl border border-gray-800 group hover:border-gray-600 transition-colors">
                                    <div className="label-premium text-gray-500 mb-1">Explorer</div>
                                    <a
                                        href={
                                            (token.address && token.address.length > 10) ? `${meta.explorerUrl}${token.address}` :
                                                (meta.contractAddress && meta.contractAddress.length > 10) ? `${meta.explorerUrl}${meta.contractAddress}` :
                                                    meta.explorerUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-lg text-blue-400 hover:text-blue-300 flex items-center gap-2"
                                    >
                                        View on Explorer <ExternalLink size={14} />
                                    </a>
                                </div>

                                {(token.address || meta.contractAddress) && (token.address !== 'null' && meta.contractAddress !== 'null') && (
                                    <div className="col-span-1 md:col-span-2 bg-black/30 p-4 rounded-xl border border-gray-800 relative group">
                                        <div className="label-premium text-gray-500 mb-2">Token Contract Address</div>
                                        <div className="font-mono-premium text-gray-300 bg-black/50 p-3 rounded-lg flex justify-between items-center">
                                            <span className="truncate">{token.address || meta.contractAddress}</span>
                                            <button
                                                onClick={() => handleCopy(token.address || meta.contractAddress!)}
                                                className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                                            >
                                                {copied ? <CheckCircle size={18} className="text-zenith-green" /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN (4/12) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* ZENITH SCORE CARD - EXPANDED */}
                        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
                            <div className={`absolute top-0 right-0 w-64 h-64 bg-opacity-20 blur-[80px] rounded-full pointer-events-none ${signal.bg.replace('bg-', 'bg-')}`} />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold tracking-widest text-gray-500 uppercase">Zenith Score</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gray-950 border border-gray-800 ${signal.text}`}>{signal.label}</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-8xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">
                                        {token.zenith_score?.toFixed(0)}
                                    </span>
                                    <span className="text-xl text-gray-600 font-bold">/100</span>
                                </div>

                                <p className="text-gray-300 mb-6 leading-relaxed">
                                    {generateInsight(token)}
                                </p>

                                {/* SCORE BREAKDOWN - New Feature */}
                                <div className="space-y-4 mb-8">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Component Analysis</h4>

                                    {/* Sub-Score: Momentum */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">Momentum</span>
                                            <span className="text-white font-mono">{subScores.momentum}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${subScores.momentum}%` }} />
                                        </div>
                                    </div>

                                    {/* Sub-Score: Volume */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">Volume Strength</span>
                                            <span className="text-white font-mono">{subScores.volume}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${subScores.volume}%` }} />
                                        </div>
                                    </div>

                                    {/* Sub-Score: Social */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">Social Discovery</span>
                                            <span className="text-white font-mono">{subScores.social}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-yellow-500" style={{ width: `${subScores.social}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <button className={`w-full py-4 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2`}>
                                    Trade {token.symbol} Now <ArrowUp className="rotate-45" size={18} />
                                </button>
                            </div>
                        </div>

                        {/* HOW TO TRADE THIS - New Feature */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={18} className="text-gray-400" /> Strategy Note
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {signal.type === 'STRONG_BUY' || signal.type === 'BUY'
                                    ? "Accumulate on intraday dips. The strong momentum score indicates buying pressure is absorbing selling. Look for price action to hold above the 24h VWAP."
                                    : "Momentum is fading. Avoid chasing pumps. Wait for the Zenith Score to reclaim the 60+ level or for volume consolidation before entering new long positions."}
                            </p>
                        </div>

                        {/* SAFETY TIPS */}
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6">
                            <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
                                <Shield size={18} /> Safety First
                            </h3>
                            <ul className="space-y-3">
                                {meta.safetyTips.map((tip, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-blue-100/70 items-start">
                                        <AlertTriangle size={14} className="mt-1 flex-shrink-0 text-blue-500" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>

                {/* 3. ACQUISITION GUIDE - Moved to bottom full width */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                        <Wallet className="text-purple-500" /> How to Acquire {token.symbol}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {meta.acquisitionSteps.map((step, index) => (
                            <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-900/50 text-purple-400 flex flex-shrink-0 items-center justify-center font-bold border border-purple-500/30">
                                    {index + 1}
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
