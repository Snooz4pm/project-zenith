'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, RefreshCw, TrendingUp, Globe, DollarSign, Clock } from 'lucide-react';
import { isPremiumUser, FREE_STOCK_LIMIT } from '@/lib/premium';
import PremiumWall from '@/components/PremiumWall';

interface ForexPair {
    from: string;
    to: string;
    rate: number;
    change: number;
    lastUpdate: string;
    zenithScore: number;
}

// Major currency pairs
const FOREX_PAIRS = [
    { from: 'EUR', to: 'USD', flag: '🇪🇺🇺🇸', name: 'Euro / US Dollar' },
    { from: 'GBP', to: 'USD', flag: '🇬🇧🇺🇸', name: 'British Pound / US Dollar' },
    { from: 'USD', to: 'JPY', flag: '🇺🇸🇯🇵', name: 'US Dollar / Japanese Yen' },
    { from: 'USD', to: 'CHF', flag: '🇺🇸🇨🇭', name: 'US Dollar / Swiss Franc' },
    { from: 'AUD', to: 'USD', flag: '🇦🇺🇺🇸', name: 'Australian Dollar / US Dollar' },
    { from: 'USD', to: 'CAD', flag: '🇺🇸🇨🇦', name: 'US Dollar / Canadian Dollar' },
    { from: 'NZD', to: 'USD', flag: '🇳🇿🇺🇸', name: 'New Zealand Dollar / US Dollar' },
    { from: 'EUR', to: 'GBP', flag: '🇪🇺🇬🇧', name: 'Euro / British Pound' },
    { from: 'EUR', to: 'JPY', flag: '🇪🇺🇯🇵', name: 'Euro / Japanese Yen' },
    { from: 'GBP', to: 'JPY', flag: '🇬🇧🇯🇵', name: 'British Pound / Japanese Yen' },
    { from: 'USD', to: 'MAD', flag: '🇺🇸🇲🇦', name: 'US Dollar / Moroccan Dirham' },
    { from: 'USD', to: 'TRY', flag: '🇺🇸🇹🇷', name: 'US Dollar / Turkish Lira' },
];

// Precious metals (via forex codes)
const METALS = [
    { from: 'XAU', to: 'USD', flag: '🥇', name: 'Gold / US Dollar' },
    { from: 'XAG', to: 'USD', flag: '🥈', name: 'Silver / US Dollar' },
    { from: 'XPT', to: 'USD', flag: '💎', name: 'Platinum / US Dollar' },
    { from: 'XPD', to: 'USD', flag: '💍', name: 'Palladium / US Dollar' },
];

export default function ForexScreener() {
    const [pairs, setPairs] = useState<ForexPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [premium, setPremium] = useState(false);
    const [activeTab, setActiveTab] = useState<'forex' | 'metals'>('forex');

    useEffect(() => {
        setPremium(isPremiumUser());
        fetchForexData();
    }, []);

    const fetchForexData = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/forex/rates`);
            const data = await res.json();

            if (data.status === 'success') {
                setPairs(data.data);
            } else {
                // Fallback to mock data
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
        const allPairs = activeTab === 'forex' ? FOREX_PAIRS : METALS;
        const mockData: ForexPair[] = allPairs.map(pair => ({
            from: pair.from,
            to: pair.to,
            rate: pair.from === 'XAU' ? 2650.45 : pair.from === 'XAG' ? 31.25 :
                pair.to === 'JPY' ? 149.85 : pair.to === 'MAD' ? 10.05 :
                    0.8 + Math.random() * 0.4,
            change: (Math.random() - 0.5) * 2,
            lastUpdate: new Date().toISOString(),
            zenithScore: 40 + Math.floor(Math.random() * 50),
        }));
        setPairs(mockData);
    };

    const currentPairs = activeTab === 'forex' ? FOREX_PAIRS : METALS;
    const displayPairs = premium ? pairs : pairs.slice(0, FREE_STOCK_LIMIT);

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => { setActiveTab('forex'); generateMockData(); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'forex'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Globe size={16} className="inline mr-2" />
                    Currency Pairs
                </button>
                <button
                    onClick={() => { setActiveTab('metals'); generateMockData(); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'metals'
                            ? 'bg-white text-yellow-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    🥇 Precious Metals
                </button>
            </div>

            {/* Refresh Bar */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {lastRefresh && `Last updated: ${lastRefresh.toLocaleTimeString()}`}
                </div>
                <button
                    onClick={fetchForexData}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Pairs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {displayPairs.map((pair, i) => {
                        const pairInfo = currentPairs.find(p => p.from === pair.from && p.to === pair.to);

                        return (
                            <motion.div
                                key={`${pair.from}/${pair.to}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{pairInfo?.flag}</span>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {pair.from}/{pair.to}
                                            </h3>
                                            <p className="text-xs text-gray-500">{pairInfo?.name}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-bold ${pair.change >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {pair.change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        {Math.abs(pair.change).toFixed(2)}%
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 font-mono">
                                            {pair.rate.toFixed(pair.from === 'XAU' || pair.from === 'XPT' ? 2 : 4)}
                                        </p>
                                    </div>

                                    <div className="w-24">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">Zenith</span>
                                            <span className="font-bold text-gray-900">{pair.zenithScore}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${pair.zenithScore >= 70 ? 'bg-green-500' :
                                                        pair.zenithScore >= 50 ? 'bg-blue-500' : 'bg-red-500'
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

            {/* Premium Wall */}
            {!premium && pairs.length > FREE_STOCK_LIMIT && (
                <div className="mt-8">
                    <PremiumWall
                        stocksLocked={pairs.length - FREE_STOCK_LIMIT}
                        onUnlock={() => setPremium(true)}
                    />
                </div>
            )}
        </div>
    );
}
