'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PortfolioHeader from '@/components/command-center/PortfolioHeader';
import QuickActions from '@/components/command-center/QuickActions';
import AssetCard from '@/components/command-center/AssetCard';
import { Sparkles, TrendingUp, Activity, Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Asset {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    holdings?: number;
    value?: number;
    icon?: string;
    href: string;
}

export default function CommandCenterPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [portfolioBalance, setPortfolioBalance] = useState(50000);
    const [totalPnL, setTotalPnL] = useState(2450);
    const [pnlPercent, setPnlPercent] = useState(5.14);
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState<Asset[]>([]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    // Load portfolio data
    useEffect(() => {
        async function loadPortfolio() {
            try {
                // Load portfolio stats
                const statsRes = await fetch('/api/user/portfolio');
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setPortfolioBalance(data.balance || 50000);
                    setTotalPnL(data.totalPnL || 0);
                    setPnlPercent(((data.totalPnL || 0) / (data.balance || 50000)) * 100);
                }

                // Mock assets for now - replace with real data
                const mockAssets: Asset[] = [
                    {
                        symbol: 'BTC',
                        name: 'Bitcoin',
                        price: 45230.50,
                        change24h: 3.45,
                        holdings: 0.5,
                        value: 22615.25,
                        href: '/crypto/BTC'
                    },
                    {
                        symbol: 'ETH',
                        name: 'Ethereum',
                        price: 2340.80,
                        change24h: 5.12,
                        holdings: 5.2,
                        value: 12172.16,
                        href: '/crypto/ETH'
                    },
                    {
                        symbol: 'SOL',
                        name: 'Solana',
                        price: 98.45,
                        change24h: -2.34,
                        holdings: 50,
                        value: 4922.50,
                        href: '/crypto/SOL'
                    },
                    {
                        symbol: 'AAPL',
                        name: 'Apple Inc.',
                        price: 178.25,
                        change24h: 1.23,
                        holdings: 25,
                        value: 4456.25,
                        href: '/stocks/AAPL'
                    },
                    {
                        symbol: 'TSLA',
                        name: 'Tesla Inc.',
                        price: 245.67,
                        change24h: -1.45,
                        holdings: 10,
                        value: 2456.70,
                        href: '/stocks/TSLA'
                    },
                    {
                        symbol: 'NVDA',
                        name: 'NVIDIA Corp.',
                        price: 495.32,
                        change24h: 4.67,
                        holdings: 5,
                        value: 2476.60,
                        href: '/stocks/NVDA'
                    },
                ];

                setAssets(mockAssets);
            } catch (error) {
                console.error('Failed to load portfolio:', error);
            } finally {
                setLoading(false);
            }
        }

        if (session) {
            loadPortfolio();
        }
    }, [session]);

    const userName = session?.user?.name?.split(' ')[0] || 'Trader';

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-mint)] border-t-transparent animate-spin" />
                    <span className="text-[var(--accent-mint)] font-mono text-sm animate-pulse">Loading Portfolio...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] pb-24 md:pb-8">
            {/* Premium Header Bar */}
            <div className="sticky top-16 z-30 px-4 py-3 bg-[rgba(0,0,0,0.8)] backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                            Welcome back, {userName}
                        </h1>
                        <p className="text-xs text-[var(--text-muted)]">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Market Status */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Activity size={12} className="text-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-400">Live</span>
                        </div>
                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-all touch-target">
                            <Bell size={18} className="text-[var(--text-muted)]" />
                            <div className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-mint)] rounded-full shadow-[0_0_10px_var(--glow-mint)]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Vertical Scroll (Robinhood Style) */}
            <div className="max-w-2xl mx-auto smooth-scroll">
                {/* Portfolio Header - Robinhood Style */}
                <PortfolioHeader
                    balance={portfolioBalance}
                    totalPnL={totalPnL}
                    pnlPercent={pnlPercent}
                    isLoading={false}
                />

                {/* Chart Placeholder */}
                <div className="px-4 mb-6">
                    <div className="h-64 bg-gradient-to-br from-[rgba(20,241,149,0.05)] to-[rgba(0,212,255,0.05)] rounded-2xl border border-white/5 flex items-center justify-center">
                        <div className="text-center">
                            <TrendingUp size={48} className="text-[var(--accent-mint)] mx-auto mb-2 opacity-30" />
                            <p className="text-sm text-[var(--text-muted)]">Portfolio Chart</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">(Coming Soon)</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - Trust Wallet Style */}
                <QuickActions />

                {/* Premium Banner */}
                {!session?.user?.isPremium && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-4 mb-6"
                    >
                        <div
                            onClick={() => router.push('/profile/subscription')}
                            className="group relative p-6 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 border border-purple-500/30 rounded-2xl cursor-pointer overflow-hidden active:scale-[0.98] transition-transform"
                        >
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                                    <Sparkles size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-white mb-1">Upgrade to Premium</h3>
                                    <p className="text-xs text-purple-200">Unlock advanced signals, real-time alerts & more</p>
                                </div>
                                <div className="px-4 py-2 bg-white/10 rounded-lg font-bold text-sm text-white">
                                    Try Free
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Assets Section - Trust Wallet Style */}
                <div className="px-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                            Your Assets
                        </h2>
                        <button
                            onClick={() => router.push('/crypto')}
                            className="text-sm font-medium text-[var(--accent-mint)] hover:text-[var(--accent-cyan)] transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-2">
                        {assets.map((asset, index) => (
                            <AssetCard
                                key={asset.symbol}
                                {...asset}
                                index={index}
                            />
                        ))}
                    </div>
                </div>

                {/* Discover More Section */}
                <div className="px-4 pb-8">
                    <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Discover
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { title: 'Community', desc: 'Join traders', href: '/community', color: 'from-cyan-500 to-blue-500' },
                            { title: 'Academy', desc: 'Learn trading', href: '/learning', color: 'from-purple-500 to-pink-500' },
                            { title: 'Crypto Finds', desc: 'New gems', href: '/markets/crypto-finds', color: 'from-emerald-500 to-teal-500' },
                            { title: 'News', desc: 'Market updates', href: '/news', color: 'from-orange-500 to-amber-500' },
                        ].map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: (index + assets.length) * 0.05 }}
                                onClick={() => router.push(item.href)}
                                className={`group p-5 bg-gradient-to-br ${item.color} bg-opacity-10 border border-white/10 rounded-2xl cursor-pointer active:scale-95 transition-all`}
                            >
                                <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                                <p className="text-xs text-white/70">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
