'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
    TrendingUp, TrendingDown, Wallet, History, Activity,
    ArrowRight, Lock, CheckCircle, Target, RefreshCw
} from 'lucide-react';
import { getPortfolio, executeTrade, resetAccount } from '@/lib/actions/trading';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import AssetPicker from '@/components/AssetPicker'; // Assuming this exists or dynamic import

// Helper functions (move to utils if shared)
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

export default function TradingPage() {
    const { data: authSession } = useSession();
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null); // { symbol, current_price, ... }
    const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState('');

    // -- LEDGER STATE --
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [trades, setTrades] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        if (authSession?.user?.id) {
            refreshPortfolio();
        }
    }, [authSession]);

    async function refreshPortfolio() {
        if (!authSession?.user?.id) return;
        const data = await getPortfolio(authSession.user.id);
        if (data) {
            setPortfolioData(data);
            setPositions(data.positions);
            setTrades(data.trades);
            setSnapshots(data.snapshots);
        }
    }

    const handleTradeSubmit = async () => {
        if (!authSession?.user?.id || !selectedAsset) return;

        setIsExecuting(true);
        const price = selectedAsset.current_price || selectedAsset.price; // Handle diff asset shapes
        const qty = parseFloat(quantity);

        if (isNaN(qty) || qty <= 0) {
            setIsExecuting(false);
            return;
        }

        const res = await executeTrade(
            authSession.user.id,
            selectedAsset.symbol,
            orderSide,
            qty,
            price
        );

        if (res.success) {
            setQuantity('');
            setTradeSuccess(`Executed ${orderSide} ${selectedAsset.symbol}`);
            setTimeout(() => setTradeSuccess(null), 3000);
            await refreshPortfolio();
        } else {
            alert(res.error || "Trade Failed");
        }
        setIsExecuting(false);
    };

    const handleReset = async () => {
        if (!authSession?.user?.id) return;
        if (confirm("Reset account to $50,000? History will be wiped.")) {
            await resetAccount(authSession.user.id);
            await refreshPortfolio();
        }
    };

    // Derived Calculations
    const cash = portfolioData?.balance || 0;
    const investedValue = positions.reduce((acc: number, p: any) => {
        // Use live price if selected asset matches, else entry (conservative fallback)
        const currentPrice = (selectedAsset && p.symbol === selectedAsset.symbol) ? selectedAsset.current_price : p.avgEntryPrice;
        return acc + (p.quantity * currentPrice);
    }, 0);

    const totalEquity = cash + investedValue;
    const totalPnL = portfolioData?.totalRealizedPnL || 0;
    const costBasis = positions.reduce((acc: number, p: any) => acc + (p.quantity * p.avgEntryPrice), 0);
    const unrealizedPnL = investedValue - costBasis;

    if (!authSession) {
        return <div className="min-h-screen bg-[#0a0a0c] pt-24 text-center text-zinc-500">Please sign in to access the Trading Engine.</div>
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white pt-24 pb-20 font-sans selection:bg-emerald-500/30">
            <div className="container mx-auto px-4 lg:px-6">

                {/* 1. Header & Portfolio Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Main Balance Card */}
                    <div className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 z-20">
                            <button onClick={handleReset} className="text-xs text-zinc-600 hover:text-red-500 flex items-center gap-1 transition-colors border border-white/5 px-2 py-1 rounded">
                                <RefreshCw size={12} /> RESET ENGINE
                            </button>
                        </div>

                        <div className="flex flex-col h-full justify-between relative z-10">
                            <div>
                                <h1 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">Total Equity</h1>
                                <div className="text-5xl font-bold font-display tracking-tight text-white mb-2">
                                    {formatCurrency(totalEquity)}
                                </div>
                                <div className="flex items-center gap-4 text-sm font-bold">
                                    <span className={totalPnL + unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}>
                                        {formatCurrency(totalPnL + unrealizedPnL)} All-Time
                                    </span>
                                    <span className="text-zinc-600">
                                        Cash: {formatCurrency(cash)}
                                    </span>
                                </div>
                            </div>

                            {/* Portfolio Chart Area */}
                            <div className="h-48 mt-8 w-full -ml-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={snapshots.length > 0 ? snapshots.map((s: any) => ({ time: new Date(s.timestamp).toLocaleDateString(), value: s.totalEquity })) : [{ time: 'Start', value: 50000 }]}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={['auto', 'auto']} hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: any) => [formatCurrency(Number(value)), 'Equity']}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Quick Order Entry */}
                    <div className="p-6 rounded-3xl bg-[#0a0a0c] border border-white/10 flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-4">Execute Order</h3>

                            {/* Asset Selector */}
                            <button
                                onClick={() => setIsAssetPickerOpen(true)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all mb-4"
                            >
                                <div className="flex items-center gap-3">
                                    {selectedAsset ? (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                {selectedAsset.symbol?.substring(0, 1)}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-white">{selectedAsset.symbol}</div>
                                                <div className="text-xs text-zinc-500">{formatCurrency(selectedAsset.current_price || selectedAsset.price || 0)}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-zinc-500">Select Asset</span>
                                    )}
                                </div>
                                <ArrowRight size={16} className="text-zinc-600" />
                            </button>

                            {/* Side Toggle */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button
                                    onClick={() => setOrderSide('BUY')}
                                    className={`py-3 rounded-lg font-bold text-sm transition-all ${orderSide === 'BUY' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                                >
                                    BUY / LONG
                                </button>
                                <button
                                    onClick={() => setOrderSide('SELL')}
                                    className={`py-3 rounded-lg font-bold text-sm transition-all ${orderSide === 'SELL' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                                >
                                    SELL / SHORT
                                </button>
                            </div>

                            {/* Quantity Input */}
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>Quantity</span>
                                    <span>Avail: {formatCurrency(cash)}</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 outline-none focus:border-indigo-500/50 transition-all font-mono"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600 font-bold">
                                        {selectedAsset?.symbol || 'UNITS'}
                                    </span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleTradeSubmit}
                                disabled={isExecuting || !selectedAsset || !quantity}
                                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 ${isExecuting ? 'opacity-50 cursor-not-allowed bg-zinc-800' :
                                    orderSide === 'BUY'
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black hover:scale-[1.02] shadow-emerald-500/20'
                                        : 'bg-gradient-to-r from-red-500 to-red-400 text-white hover:scale-[1.02] shadow-red-500/20'
                                    }`}
                            >
                                {isExecuting ? "EXECUTING..." : `CONFIRM ${orderSide}`}
                            </button>

                        </div>
                    </div>
                </div>

                {/* 2. Positions & History Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Current Positions */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Target size={14} /> Open Positions
                            </h3>
                        </div>

                        {positions.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl">
                                <p className="text-zinc-600 text-sm">No open positions. Use the order panel to execute a trade.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {positions.map((pos: any) => {
                                    // Use live price if selected, or fallback to entry to avoid confusing "0 change"
                                    // ideally we map all prices from a context/store for all held assets
                                    const currentPrice = (selectedAsset && pos.symbol === selectedAsset.symbol) ? selectedAsset.current_price : pos.avgEntryPrice;
                                    const value = pos.quantity * currentPrice;
                                    const pnl = value - (pos.quantity * pos.avgEntryPrice);
                                    const pnlPercent = (pnl / (pos.quantity * pos.avgEntryPrice)) * 100;

                                    return (
                                        <div key={pos.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                                                    {pos.symbol.substring(0, 1)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{pos.symbol}</div>
                                                    <div className="text-xs text-zinc-500">{pos.quantity} units @ {formatCurrency(pos.avgEntryPrice)}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-white">{formatCurrency(value)}</div>
                                                <div className={`text-xs font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({!isNaN(pnlPercent) ? pnlPercent.toFixed(2) : '0.00'}%)
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recent Trade History */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 h-full flex flex-col">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <History size={14} /> Ledger
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[500px]">
                                {trades.length === 0 && (
                                    <p className="text-zinc-600 text-xs italic">Ledger is empty.</p>
                                )}
                                {trades.map((trade: any) => (
                                    <div key={trade.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                        <div>
                                            <div className={`text-xs font-bold ${trade.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {trade.side} {trade.symbol}
                                            </div>
                                            <div className="text-[10px] text-zinc-500">
                                                {new Date(trade.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-white font-mono">
                                                {formatCurrency(trade.price)}
                                            </div>
                                            {trade.realizedPnL !== null && (
                                                <div className={`text-[10px] font-bold ${trade.realizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    PnL: {formatCurrency(trade.realizedPnL)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asset Picker Modal */}
                <AnimatePresence>
                    {isAssetPickerOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-2xl h-[600px] bg-[#0a0a0c] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                            >
                                <button
                                    onClick={() => setIsAssetPickerOpen(false)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                                >
                                    <ArrowRight size={16} className="rotate-45" /> {/* Close icon */}
                                </button>

                                <AssetPicker
                                    assets={[
                                        { symbol: 'BTC', name: 'Bitcoin', current_price: 65000, price_change_24h: 2.5, asset_type: 'CRYPTO', max_leverage: 100 },
                                        { symbol: 'ETH', name: 'Ethereum', current_price: 3500, price_change_24h: 1.2, asset_type: 'CRYPTO', max_leverage: 100 },
                                        { symbol: 'SOL', name: 'Solana', current_price: 145, price_change_24h: 5.4, asset_type: 'CRYPTO', max_leverage: 50 },
                                        { symbol: 'AAPL', name: 'Apple Inc.', current_price: 189.50, price_change_24h: 0.5, asset_type: 'STOCK', max_leverage: 20 },
                                        { symbol: 'TSLA', name: 'Tesla', current_price: 240.20, price_change_24h: -1.2, asset_type: 'STOCK', max_leverage: 20 },
                                        { symbol: 'EURUSD', name: 'Euro / USD', current_price: 1.0850, price_change_24h: 0.05, asset_type: 'FOREX', max_leverage: 500 },
                                        { symbol: 'GBPUSD', name: 'GBP / USD', current_price: 1.2750, price_change_24h: -0.1, asset_type: 'FOREX', max_leverage: 500 },
                                    ]}
                                    onSelect={(asset: any) => { setSelectedAsset(asset); setIsAssetPickerOpen(false); }}
                                />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Success Toast */}
                <AnimatePresence>
                    {tradeSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(20,241,149,0.4)] flex items-center gap-2"
                        >
                            <CheckCircle size={20} />
                            {tradeSuccess}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
