'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceData {
    price: number;
    source: string;
    timestamp: number;
}

interface PriceDisplayProps {
    symbol: string;
    market: 'stock' | 'forex' | 'crypto';
    initialPrice?: number;
}

export default function PriceDisplay({ symbol, market }: PriceDisplayProps) {
    const [data, setData] = useState<PriceData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<number>(0);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    const COOLDOWN_MS = 15000;

    const fetchPrice = useCallback(async (isManual = false) => {
        const now = Date.now();
        if (isManual && now - lastFetch < COOLDOWN_MS) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Construct URL properly handling slashes for forex/crypto if needed
            // The API route expects raw symbol, but let's URL encode just in case
            const res = await fetch(
                `/api/price?market=${market}&symbol=${encodeURIComponent(symbol)}`,
                { cache: 'no-store' }
            );

            const json = await res.json();

            if (json.status === "unavailable" || !json.price) {
                if (json.error) throw new Error(json.error);
                throw new Error("Price unavailable");
            }

            setData({
                price: json.price,
                source: json.source,
                timestamp: json.timestamp
            });
            setLastFetch(now);

        } catch (err) {
            console.error("Price fetch error:", err);
            setError("Unavailable");
        } finally {
            setLoading(false);
        }
    }, [market, symbol, lastFetch]);

    // Initial load
    useEffect(() => {
        fetchPrice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only on mount

    // Cooldown timer effect
    useEffect(() => {
        if (lastFetch === 0) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastFetch;
            const remaining = Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000));
            setCooldownRemaining(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [lastFetch]);

    const isCooldownActive = cooldownRemaining > 0;

    return (
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-4">
                {/* Price */}
                <div className="text-right">
                    <AnimatePresence mode="wait">
                        {data ? (
                            <motion.div
                                key="price"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl font-bold font-mono text-white tracking-tight"
                            >
                                ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </motion.div>
                        ) : error ? (
                            <div className="text-xl font-bold text-red-400 flex items-center gap-2">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        ) : (
                            <div className="h-9 w-32 bg-white/10 animate-pulse rounded" />
                        )}
                    </AnimatePresence>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={() => fetchPrice(true)}
                    disabled={loading || isCooldownActive}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        border border-white/10
                        ${loading || isCooldownActive
                            ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                            : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
                        }
                    `}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Updating...' : isCooldownActive ? `Wait ${cooldownRemaining}s` : 'Refresh'}
                </button>
            </div>

            {/* Disclaimer & Source */}
            <div className="mt-2 flex flex-col items-end gap-0.5">
                <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5">
                    {data?.source && (
                        <span className="uppercase tracking-wider opacity-70">
                            via {data.source.replace('_', ' ')}
                        </span>
                    )}
                </div>
                <div className="text-[10px] text-gray-600 italic">
                    Prices may be delayed. Click refresh to update.
                </div>
            </div>
        </div>
    );
}
