'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, RefreshCw, Flame, Droplets, Zap, Clock } from 'lucide-react';
import { isPremiumUser, FREE_STOCK_LIMIT } from '@/lib/premium';
import PremiumWall from '@/components/PremiumWall';

interface Commodity {
    symbol: string;
    name: string;
    price: number;
    change: number;
    unit: string;
    lastUpdate: string;
    zenithScore: number;
    category: 'energy' | 'metals' | 'agriculture';
}

// Available commodities from Alpha Vantage
const COMMODITIES = [
    // Energy
    { symbol: 'WTI', name: 'WTI Crude Oil', icon: '🛢️', unit: '/barrel', category: 'energy' as const },
    { symbol: 'BRENT', name: 'Brent Crude Oil', icon: '🛢️', unit: '/barrel', category: 'energy' as const },
    { symbol: 'NATURAL_GAS', name: 'Natural Gas', icon: '⛽', unit: '/MMBtu', category: 'energy' as const },

    // Metals
    { symbol: 'COPPER', name: 'Copper', icon: '🔴', unit: '/lb', category: 'metals' as const },
    { symbol: 'ALUMINUM', name: 'Aluminum', icon: '⚪', unit: '/lb', category: 'metals' as const },

    // Agriculture
    { symbol: 'WHEAT', name: 'Wheat', icon: '🌾', unit: '/bushel', category: 'agriculture' as const },
    { symbol: 'CORN', name: 'Corn', icon: '🌽', unit: '/bushel', category: 'agriculture' as const },
    { symbol: 'COFFEE', name: 'Coffee', icon: '☕', unit: '/lb', category: 'agriculture' as const },
    { symbol: 'COTTON', name: 'Cotton', icon: '🫧', unit: '/lb', category: 'agriculture' as const },
    { symbol: 'SUGAR', name: 'Sugar', icon: '🍬', unit: '/lb', category: 'agriculture' as const },
];

const CATEGORY_INFO = {
    energy: { label: 'Energy', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
    metals: { label: 'Metals', icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    agriculture: { label: 'Agriculture', icon: Droplets, color: 'text-green-500', bg: 'bg-green-50' },
};

export default function CommoditiesScreener() {
    const [commodities, setCommodities] = useState<Commodity[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [premium, setPremium] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'all' | 'energy' | 'metals' | 'agriculture'>('all');

    useEffect(() => {
        setPremium(isPremiumUser());
        fetchCommoditiesData();
    }, []);

    const fetchCommoditiesData = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
            const res = await fetch(`${apiUrl}/api/v1/commodities/prices`);
            const data = await res.json();

            if (data.status === 'success') {
                setCommodities(data.data);
            } else {
                generateMockData();
            }
        } catch (error) {
            console.error('Failed to fetch commodities:', error);
            generateMockData();
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    };

    const generateMockData = () => {
        const mockData: Commodity[] = COMMODITIES.map(c => ({
            symbol: c.symbol,
            name: c.name,
            price: c.symbol === 'WTI' ? 71.25 : c.symbol === 'BRENT' ? 75.80 :
                c.symbol === 'NATURAL_GAS' ? 2.45 : c.symbol === 'COPPER' ? 4.12 :
                    c.symbol === 'WHEAT' ? 5.85 : 1 + Math.random() * 100,
            change: (Math.random() - 0.5) * 4,
            unit: c.unit,
            lastUpdate: new Date().toISOString(),
            zenithScore: 35 + Math.floor(Math.random() * 55),
            category: c.category,
        }));
        setCommodities(mockData);
    };

    const filteredCommodities = activeCategory === 'all'
        ? commodities
        : commodities.filter(c => c.category === activeCategory);

    const displayCommodities = premium ? filteredCommodities : filteredCommodities.slice(0, FREE_STOCK_LIMIT);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    All Commodities
                </button>
                {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(key as any)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeCategory === key
                            ? `${info.bg} ${info.color} border border-current`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <info.icon size={14} />
                        {info.label}
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
                    onClick={fetchCommoditiesData}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Commodities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {displayCommodities.map((commodity, i) => {
                        const info = COMMODITIES.find(c => c.symbol === commodity.symbol);
                        const catInfo = CATEGORY_INFO[commodity.category];

                        return (
                            <motion.div
                                key={commodity.symbol}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{info?.icon}</span>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{commodity.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${catInfo.bg} ${catInfo.color}`}>
                                                {catInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-bold ${commodity.change >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {commodity.change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        {Math.abs(commodity.change).toFixed(2)}%
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-gray-900 font-mono">
                                            ${commodity.price.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">{commodity.unit}</p>
                                    </div>

                                    <div className="w-28">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">Zenith Score</span>
                                            <span className="font-bold text-gray-900">{commodity.zenithScore}</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${commodity.zenithScore >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                                    commodity.zenithScore >= 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                                                        'bg-gradient-to-r from-red-500 to-orange-400'
                                                    }`}
                                                style={{ width: `${commodity.zenithScore}%` }}
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
            {!premium && filteredCommodities.length > FREE_STOCK_LIMIT && (
                <div className="mt-8">
                    <PremiumWall
                        stocksLocked={filteredCommodities.length - FREE_STOCK_LIMIT}
                        onUnlock={() => setPremium(true)}
                    />
                </div>
            )}
        </div>
    );
}
