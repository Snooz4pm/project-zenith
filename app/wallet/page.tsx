'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ExternalLink, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Copy, Check } from 'lucide-react';
import WalletGate from '@/components/wallet/WalletGate';
import { useDirectWallet } from '@/components/wallet/DirectConnectButton';
import { fetchPortfolio, fetchTransactions, formatTransaction, PortfolioData, WalletTransaction, clearPortfolioCache } from '@/lib/wallet/portfolio';

// No more Connection needed - portfolio functions use server-side API routes

function formatUsd(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(4)}`;
}

function formatBalance(balance: number, decimals: number = 4): string {
    if (balance >= 1_000_000) return `${(balance / 1_000_000).toFixed(2)}M`;
    if (balance >= 1_000) return `${(balance / 1_000).toFixed(2)}K`;
    return balance.toFixed(Math.min(decimals, 6));
}

export default function WalletPage() {
    const { publicKey, isConnected } = useDirectWallet();
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'holdings' | 'transactions'>('holdings');

    useEffect(() => {
        if (!isConnected || !publicKey) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            setTxLoading(true);

            try {
                const pk = new PublicKey(publicKey);

                // Fetch portfolio and transactions in parallel (via API routes)
                const [portfolioData, txData] = await Promise.all([
                    fetchPortfolio(pk),
                    fetchTransactions(pk, 20)
                ]);

                setPortfolio(portfolioData);
                setTransactions(txData);
            } catch (err) {
                console.error('[Wallet] Load error:', err);
            } finally {
                setLoading(false);
                setTxLoading(false);
            }
        };

        loadData();
    }, [isConnected, publicKey]);

    const handleRefresh = async () => {
        if (!publicKey) return;
        setLoading(true);
        clearPortfolioCache();
        try {
            const pk = new PublicKey(publicKey);
            const portfolioData = await fetchPortfolio(pk);
            setPortfolio(portfolioData);
        } catch (err) {
            console.error('[Wallet] Refresh error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <WalletGate>
            <div className="min-h-screen bg-black relative">
                {/* Background gradient */}
                <div className="fixed inset-0 bg-gradient-to-b from-black via-black to-zinc-900 pointer-events-none opacity-50" />

                <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-medium tracking-tight text-white">Portfolio</h1>
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>

                        {/* Wallet Address */}
                        {publicKey && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-zinc-500 font-mono">
                                    {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                                </span>
                                <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-colors">
                                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                                <a
                                    href={`https://solscan.io/account/${publicKey}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        )}
                    </header>

                    {/* Portfolio Summary Cards */}
                    {portfolio && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            {/* Total Value */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-xs text-zinc-500 mb-1">Total Value</p>
                                <p className="text-2xl font-mono text-white">{formatUsd(portfolio.totalValueUsd)}</p>
                            </div>

                            {/* 24h Change */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-xs text-zinc-500 mb-1">24h Change</p>
                                <p className={`text-2xl font-mono flex items-center gap-1 ${portfolio.totalChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {portfolio.totalChange24h >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                    {portfolio.totalChange24h >= 0 ? '+' : ''}{portfolio.totalChange24h.toFixed(2)}%
                                </p>
                            </div>

                            {/* 7d Projection */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-xs text-zinc-500 mb-1">7d Projection</p>
                                <p className="text-2xl font-mono text-emerald-400">{formatUsd(portfolio.totalProjection7d)}</p>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setActiveTab('holdings')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'holdings'
                                ? 'bg-white/10 text-white'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Holdings
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'transactions'
                                ? 'bg-white/10 text-white'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Transactions
                        </button>
                    </div>

                    {/* Holdings Tab */}
                    {activeTab === 'holdings' && (
                        <div className="space-y-2">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                                ))
                            ) : !portfolio || portfolio.holdings.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-zinc-500">No holdings found</p>
                                </div>
                            ) : (
                                <>
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-zinc-500 font-medium">
                                        <div className="col-span-4">Token</div>
                                        <div className="col-span-2 text-right">Balance</div>
                                        <div className="col-span-2 text-right">Value</div>
                                        <div className="col-span-2 text-right">24h %</div>
                                        <div className="col-span-2 text-right">7d Proj.</div>
                                    </div>

                                    {/* Holdings Rows */}
                                    {portfolio.holdings.map((holding) => (
                                        <div
                                            key={holding.mint}
                                            className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors items-center"
                                        >
                                            {/* Token */}
                                            <div className="col-span-4 flex items-center gap-3">
                                                {holding.logoURI ? (
                                                    <img src={holding.logoURI} alt={holding.symbol} className="w-8 h-8 rounded-full bg-zinc-800" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                                                        {holding.symbol[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white font-medium">{holding.symbol}</p>
                                                    <p className="text-[10px] text-zinc-500">{holding.name}</p>
                                                </div>
                                            </div>

                                            {/* Balance */}
                                            <div className="col-span-2 text-right">
                                                <p className="text-white font-mono text-sm">{formatBalance(holding.balance)}</p>
                                            </div>

                                            {/* Value */}
                                            <div className="col-span-2 text-right">
                                                <p className="text-white font-mono text-sm">{formatUsd(holding.valueUsd)}</p>
                                            </div>

                                            {/* 24h Change */}
                                            <div className="col-span-2 text-right">
                                                <p className={`font-mono text-sm ${holding.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {holding.priceChange24h >= 0 ? '+' : ''}{holding.priceChange24h.toFixed(2)}%
                                                </p>
                                            </div>

                                            {/* 7d Projection */}
                                            <div className="col-span-2 text-right">
                                                <p className="text-emerald-400 font-mono text-sm">{formatUsd(holding.projection7d)}</p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {holding.projectionChange >= 0 ? '+' : ''}{holding.projectionChange.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Projection Disclaimer */}
                                    <div className="flex items-start gap-2 mt-6 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                        <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-200/60">
                                            <span className="font-medium">Projection Disclaimer:</span> 7-day projections are estimates based on recent 24h momentum (×0.7 factor).
                                            Not financial advice. Crypto prices are highly volatile.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                        <div className="space-y-2">
                            {txLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                                ))
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-zinc-500">No recent transactions</p>
                                </div>
                            ) : (
                                transactions.map((tx) => {
                                    const formatted = formatTransaction(tx);
                                    return (
                                        <a
                                            key={tx.signature}
                                            href={formatted.solscanUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                <div>
                                                    <p className="text-white font-mono text-sm">{formatted.shortSig}</p>
                                                    <p className="text-[10px] text-zinc-500">{formatted.timeAgo}</p>
                                                </div>
                                            </div>
                                            <ExternalLink size={14} className="text-zinc-500" />
                                        </a>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Privacy Note */}
                    <footer className="mt-12 pt-8 border-t border-white/5">
                        <p className="text-xs text-zinc-600 text-center">
                            All data fetched directly from the Solana blockchain — nothing is stored or logged.
                        </p>
                    </footer>
                </div>
            </div>
        </WalletGate>
    );
}
