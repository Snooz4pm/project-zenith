'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, RefreshCw, TrendingUp, Globe, DollarSign, Clock, Zap } from 'lucide-react';
import { isPremiumUser, FREE_STOCK_LIMIT } from '@/lib/premium';
import PremiumWall from '@/components/PremiumWall';
import QuickTradePrompt from '@/components/QuickTradePrompt';
import { useRouter } from 'next/navigation';

interface ForexPair {
    from: string;
    to: string;
    rate: number;
    change: number;
    lastUpdate: string;
    zenithScore: number;
}

// Major currency pairs (7 pairs)
const MAJOR_PAIRS = [
    { from: 'EUR', to: 'USD', flag: '🇪🇺🇺🇸', name: 'Euro / US Dollar' },
    { from: 'GBP', to: 'USD', flag: '🇬🇧🇺🇸', name: 'British Pound / US Dollar' },
    { from: 'USD', to: 'JPY', flag: '🇺🇸🇯🇵', name: 'US Dollar / Japanese Yen' },
    { from: 'USD', to: 'CHF', flag: '🇺🇸🇨🇭', name: 'US Dollar / Swiss Franc' },
    { from: 'AUD', to: 'USD', flag: '🇦🇺🇺🇸', name: 'Australian Dollar / US Dollar' },
    { from: 'USD', to: 'CAD', flag: '🇺🇸🇨🇦', name: 'US Dollar / Canadian Dollar' },
    { from: 'NZD', to: 'USD', flag: '🇳🇿🇺🇸', name: 'New Zealand Dollar / US Dollar' },
];

// Minor/Cross pairs (20+ pairs)
const MINOR_PAIRS = [
    { from: 'EUR', to: 'GBP', flag: '🇪🇺🇬🇧', name: 'Euro / British Pound' },
    { from: 'EUR', to: 'JPY', flag: '🇪🇺🇯🇵', name: 'Euro / Japanese Yen' },
    { from: 'EUR', to: 'CHF', flag: '🇪🇺🇨🇭', name: 'Euro / Swiss Franc' },
    { from: 'EUR', to: 'AUD', flag: '🇪🇺🇦🇺', name: 'Euro / Australian Dollar' },
    { from: 'EUR', to: 'NZD', flag: '🇪🇺🇳🇿', name: 'Euro / New Zealand Dollar' },
    { from: 'EUR', to: 'CAD', flag: '🇪🇺🇨🇦', name: 'Euro / Canadian Dollar' },
    { from: 'GBP', to: 'JPY', flag: '🇬🇧🇯🇵', name: 'British Pound / Japanese Yen' },
    { from: 'GBP', to: 'CHF', flag: '🇬🇧🇨🇭', name: 'British Pound / Swiss Franc' },
    { from: 'GBP', to: 'AUD', flag: '🇬🇧🇦🇺', name: 'British Pound / Australian Dollar' },
    { from: 'GBP', to: 'NZD', flag: '🇬🇧🇳🇿', name: 'British Pound / New Zealand Dollar' },
    { from: 'GBP', to: 'CAD', flag: '🇬🇧🇨🇦', name: 'British Pound / Canadian Dollar' },
    { from: 'AUD', to: 'JPY', flag: '🇦🇺🇯🇵', name: 'Australian Dollar / Japanese Yen' },
    { from: 'AUD', to: 'NZD', flag: '🇦🇺🇳🇿', name: 'Australian Dollar / New Zealand Dollar' },
    { from: 'AUD', to: 'CHF', flag: '🇦🇺🇨🇭', name: 'Australian Dollar / Swiss Franc' },
    { from: 'AUD', to: 'CAD', flag: '🇦🇺🇨🇦', name: 'Australian Dollar / Canadian Dollar' },
    { from: 'NZD', to: 'JPY', flag: '🇳🇿🇯🇵', name: 'New Zealand Dollar / Japanese Yen' },
    { from: 'NZD', to: 'CHF', flag: '🇳🇿🇨🇭', name: 'New Zealand Dollar / Swiss Franc' },
    { from: 'NZD', to: 'CAD', flag: '🇳🇿🇨🇦', name: 'New Zealand Dollar / Canadian Dollar' },
    { from: 'CAD', to: 'JPY', flag: '🇨🇦🇯🇵', name: 'Canadian Dollar / Japanese Yen' },
    { from: 'CAD', to: 'CHF', flag: '🇨🇦🇨🇭', name: 'Canadian Dollar / Swiss Franc' },
    { from: 'CHF', to: 'JPY', flag: '🇨🇭🇯🇵', name: 'Swiss Franc / Japanese Yen' },
];

// Exotic pairs (20+ pairs)
const EXOTIC_PAIRS = [
    { from: 'USD', to: 'TRY', flag: '🇺🇸🇹🇷', name: 'US Dollar / Turkish Lira' },
    { from: 'USD', to: 'ZAR', flag: '🇺🇸🇿🇦', name: 'US Dollar / South African Rand' },
    { from: 'USD', to: 'MXN', flag: '🇺🇸🇲🇽', name: 'US Dollar / Mexican Peso' },
    { from: 'USD', to: 'SGD', flag: '🇺🇸🇸🇬', name: 'US Dollar / Singapore Dollar' },
    { from: 'USD', to: 'HKD', flag: '🇺🇸🇭🇰', name: 'US Dollar / Hong Kong Dollar' },
    { from: 'USD', to: 'NOK', flag: '🇺🇸🇳🇴', name: 'US Dollar / Norwegian Krone' },
    { from: 'USD', to: 'SEK', flag: '🇺🇸🇸🇪', name: 'US Dollar / Swedish Krona' },
    { from: 'USD', to: 'DKK', flag: '🇺🇸🇩🇰', name: 'US Dollar / Danish Krone' },
    { from: 'USD', to: 'PLN', flag: '🇺🇸🇵🇱', name: 'US Dollar / Polish Zloty' },
    { from: 'USD', to: 'HUF', flag: '🇺🇸🇭🇺', name: 'US Dollar / Hungarian Forint' },
    { from: 'USD', to: 'CZK', flag: '🇺🇸🇨🇿', name: 'US Dollar / Czech Koruna' },
    { from: 'USD', to: 'THB', flag: '🇺🇸🇹🇭', name: 'US Dollar / Thai Baht' },
    { from: 'USD', to: 'INR', flag: '🇺🇸🇮🇳', name: 'US Dollar / Indian Rupee' },
    { from: 'USD', to: 'MAD', flag: '🇺🇸🇲🇦', name: 'US Dollar / Moroccan Dirham' },
    { from: 'USD', to: 'AED', flag: '🇺🇸🇦🇪', name: 'US Dollar / UAE Dirham' },
    { from: 'USD', to: 'SAR', flag: '🇺🇸🇸🇦', name: 'US Dollar / Saudi Riyal' },
    { from: 'EUR', to: 'TRY', flag: '🇪🇺🇹🇷', name: 'Euro / Turkish Lira' },
    { from: 'EUR', to: 'ZAR', flag: '🇪🇺🇿🇦', name: 'Euro / South African Rand' },
    { from: 'EUR', to: 'PLN', flag: '🇪🇺🇵🇱', name: 'Euro / Polish Zloty' },
    { from: 'EUR', to: 'NOK', flag: '🇪🇺🇳🇴', name: 'Euro / Norwegian Krone' },
    { from: 'EUR', to: 'SEK', flag: '🇪🇺🇸🇪', name: 'Euro / Swedish Krona' },
    { from: 'GBP', to: 'ZAR', flag: '🇬🇧🇿🇦', name: 'British Pound / South African Rand' },
];

// Combined for "All" view
const ALL_FOREX_PAIRS = [...MAJOR_PAIRS, ...MINOR_PAIRS, ...EXOTIC_PAIRS];

export default function ForexScreener() {
    const [pairs, setPairs] = useState<ForexPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [premium, setPremium] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'majors' | 'minors' | 'exotics'>('all');
    const [selectedPair, setSelectedPair] = useState<ForexPair | null>(null);
    const [showQuickTrade, setShowQuickTrade] = useState(false);
    const router = useRouter();

    const handlePairClick = (pair: ForexPair) => {
        setSelectedPair(pair);
        setShowQuickTrade(true);
    };

    const handleTrade = () => {
        setShowQuickTrade(false);
        router.push('/trading');
    };

    useEffect(() => {
        setPremium(isPremiumUser());
        generateMockData();
    }, []);

    const fetchForexData = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
            const res = await fetch(`${apiUrl}/api/v1/forex/rates`);
            const data = await res.json();

            if (data.status === 'success') {
                setPairs(data.data);
            } else {
                generateMockData();
            }
        } catch (error) {
            console.error('Failed to fetch forex data:', error);
            generateMockData();
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    };

    const generateMockData = () => {
        const currentPairsList = activeTab === 'all' ? ALL_FOREX_PAIRS :
            activeTab === 'majors' ? MAJOR_PAIRS :
                activeTab === 'minors' ? MINOR_PAIRS : EXOTIC_PAIRS;

        const mockData: ForexPair[] = currentPairsList.map((pair: { from: string; to: string; flag: string; name: string }) => ({
            from: pair.from,
            to: pair.to,
            rate: pair.to === 'JPY' ? 149.85 + Math.random() * 5 :
                pair.to === 'MAD' ? 10.05 + Math.random() * 0.2 :
                    pair.to === 'TRY' ? 29.5 + Math.random() * 0.5 :
                        pair.to === 'ZAR' ? 18.2 + Math.random() * 0.3 :
                            pair.to === 'MXN' ? 17.1 + Math.random() * 0.2 :
                                0.8 + Math.random() * 0.4,
            change: (Math.random() - 0.5) * 3,
            lastUpdate: new Date().toISOString(),
            zenithScore: 45 + Math.floor(Math.random() * 50),
        }));
        setPairs(mockData);
        setLoading(false);
        setLastRefresh(new Date());
    };

    useEffect(() => {
        generateMockData();
    }, [activeTab]);

    const currentPairs = activeTab === 'all' ? ALL_FOREX_PAIRS :
        activeTab === 'majors' ? MAJOR_PAIRS :
            activeTab === 'minors' ? MINOR_PAIRS : EXOTIC_PAIRS;
    const displayPairs = premium ? pairs : pairs.slice(0, FREE_STOCK_LIMIT);

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Category Tabs - Zenith Theme */}
            <div className="flex flex-wrap gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                {[
                    { id: 'all' as const, label: 'All Pairs', count: ALL_FOREX_PAIRS.length },
                    { id: 'majors' as const, label: 'Majors', count: MAJOR_PAIRS.length },
                    { id: 'minors' as const, label: 'Minors', count: MINOR_PAIRS.length },
                    { id: 'exotics' as const, label: 'Exotics', count: EXOTIC_PAIRS.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Globe size={14} />
                        {tab.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Refresh Bar */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {lastRefresh && `Last updated: ${lastRefresh.toLocaleTimeString()}`}
                </div>
                <button
                    onClick={fetchForexData}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Pairs Grid - Zenith Dark Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {displayPairs.map((pair, i) => {
                        const pairInfo = currentPairs.find((p: { from: string; to: string }) => p.from === pair.from && p.to === pair.to);

                        return (
                            <motion.div
                                key={`${pair.from}/${pair.to}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => handlePairClick(pair)}
                                className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all group cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{pairInfo?.flag}</span>
                                        <div>
                                            <h3 className="font-bold text-white">
                                                {pair.from}/{pair.to}
                                            </h3>
                                            <p className="text-xs text-gray-500">{pairInfo?.name}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-bold ${pair.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {pair.change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        {Math.abs(pair.change).toFixed(2)}%
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-white font-mono">
                                            {pair.rate.toFixed(pair.to === 'JPY' ? 2 : 4)}
                                        </p>
                                    </div>

                                    <div className="w-24">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">Zenith</span>
                                            <span className={`font-bold ${pair.zenithScore >= 70 ? 'text-emerald-400' :
                                                pair.zenithScore >= 50 ? 'text-cyan-400' : 'text-red-400'
                                                }`}>{pair.zenithScore}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${pair.zenithScore >= 70 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                                    pair.zenithScore >= 50 ? 'bg-gradient-to-r from-cyan-500 to-blue-400' :
                                                        'bg-gradient-to-r from-red-500 to-orange-400'
                                                    }`}
                                                style={{ width: `${pair.zenithScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Premium Wall - Zenith Theme */}
            {!premium && pairs.length > FREE_STOCK_LIMIT && (
                <div className="mt-8">
                    <PremiumWall
                        stocksLocked={pairs.length - FREE_STOCK_LIMIT}
                        onUnlock={() => setPremium(true)}
                    />
                </div>
            )}

            {/* Quick Trade Prompt */}
            <QuickTradePrompt
                asset={selectedPair ? {
                    symbol: `${selectedPair.from}/${selectedPair.to}`,
                    name: currentPairs.find((p: { from: string; to: string }) => p.from === selectedPair.from && p.to === selectedPair.to)?.name || '',
                    current_price: selectedPair.rate,
                    price_change_24h: selectedPair.change,
                    asset_type: 'forex',
                    max_leverage: 50
                } : null}
                isOpen={showQuickTrade}
                onClose={() => setShowQuickTrade(false)}
                onTrade={handleTrade}
            />
        </div>
    );
}

