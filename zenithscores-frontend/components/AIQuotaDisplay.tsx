'use client';

import { useState, useEffect } from 'react';
import { Bot, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://defioracleworkerapi.vercel.app';

interface QuotaData {
    allowed: boolean;
    remaining: number;
    limit: number;
    is_premium: boolean;
    used?: number;
}

export default function AIQuotaDisplay() {
    const [quota, setQuota] = useState<QuotaData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuota();
    }, []);

    const fetchQuota = async () => {
        const sessionId = localStorage.getItem('zenith_session_id') || localStorage.getItem('trading_session_id') || 'demo-user';

        try {
            const res = await fetch(`${API_URL}/api/v1/ai/quota/${sessionId}`);
            const data = await res.json();
            if (data.status === 'success') {
                setQuota(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch AI quota:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-gray-400 text-xs animate-pulse">
                <Bot size={14} />
                <span>Loading...</span>
            </div>
        );
    }

    if (!quota) return null;

    // Premium user - unlimited
    if (quota.is_premium) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 text-xs">
                <Sparkles size={14} />
                <span className="font-medium">Pro AI - Unlimited</span>
            </div>
        );
    }

    // Free user with quota
    const percentUsed = (quota.used || 0) / quota.limit * 100;
    const isLow = quota.remaining <= 1;
    const isExhausted = quota.remaining === 0;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${isExhausted
                ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                : isLow
                    ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                    : 'bg-white/5 border border-white/10 text-gray-400'
            }`}>
            <Bot size={14} />
            <span className="font-medium">
                AI: {quota.remaining}/{quota.limit}
            </span>

            {/* Mini progress bar */}
            <div className="w-8 h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${isExhausted ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-cyan-500'
                        }`}
                    style={{ width: `${100 - percentUsed}%` }}
                />
            </div>

            {isExhausted && (
                <Link
                    href="/profile"
                    className="ml-1 text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                    <Lock size={10} />
                    Upgrade
                </Link>
            )}
        </div>
    );
}
