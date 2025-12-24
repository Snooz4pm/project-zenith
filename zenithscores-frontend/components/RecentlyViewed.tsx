'use client';

import { TrendingUp, BarChart3, Clock } from 'lucide-react';
import { GhostFeature } from './GhostFeature';
import { useSession } from 'next-auth/react';

interface RecentlyViewedProps {
    onLoginClick?: () => void;
}

// Mock data for preview
const mockAssets = [
    { symbol: 'BTC', name: 'Bitcoin', change: 2.3 },
    { symbol: 'ETH', name: 'Ethereum', change: -1.2 },
    { symbol: 'AAPL', name: 'Apple', change: 0.8 },
    { symbol: 'TSLA', name: 'Tesla', change: 3.4 }
];

export function RecentlyViewed({ onLoginClick }: RecentlyViewedProps) {
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;

    if (isLoggedIn) {
        // TODO: Fetch actual recently viewed assets from user history
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock size={18} className="text-blue-600" />
                        Recently Viewed
                    </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {mockAssets.map((asset) => (
                        <div
                            key={asset.symbol}
                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            <div className="font-bold text-sm text-gray-900 dark:text-white">
                                {asset.symbol}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {asset.name}
                            </div>
                            <div
                                className={`text-xs font-semibold mt-1 ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {asset.change >= 0 ? '+' : ''}
                                {asset.change.toFixed(1)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Ghost preview for non-logged-in users
    return (
        <GhostFeature
            title="Recently Viewed"
            unlockMessage="Track your browsing history and never lose opportunities"
            onClick={onLoginClick}
            preview={
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 opacity-60">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            Recently Viewed
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {mockAssets.map((asset) => (
                            <div
                                key={asset.symbol}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <div className="font-bold text-sm text-gray-900 dark:text-white">
                                    {asset.symbol}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {asset.name}
                                </div>
                                <div className="text-xs font-semibold mt-1 text-gray-400">
                                    +0.0%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        />
    );
}
