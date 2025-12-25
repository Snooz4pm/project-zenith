'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Star, Plus, X, Bookmark, BookmarkPlus,
    TrendingUp, TrendingDown, FileText, ExternalLink
} from 'lucide-react';
import ExperimentalWrapper, { ExperimentalBadge } from '@/components/ExperimentalWrapper';

interface AssetData {
    symbol: string;
    name: string;
    current_price: number;
    price_change_24h: number;
    asset_type: string;
    high_24h?: number;
    low_24h?: number;
    volume_24h?: number;
    market_cap?: number;
}

export default function ExplorePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();

    const type = params.type as string; // stocks, crypto, forex
    const id = params.id as string; // NVDA, BTC, EURUSD

    const [asset, setAsset] = useState<AssetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isWatchlisted, setIsWatchlisted] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [showNoteForm, setShowNoteForm] = useState(false);

    // Valid types
    const validTypes = ['stocks', 'crypto', 'forex'];

    useEffect(() => {
        if (!validTypes.includes(type)) {
            setError('Invalid asset type');
            setLoading(false);
            return;
        }

        fetchAssetData();
        logView();
        checkWatchlist();
    }, [type, id]);

    const fetchAssetData = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
            const res = await fetch(`${API_URL}/api/v1/trading/assets`);
            const data = await res.json();

            if (data.status === 'success') {
                const found = data.data.find((a: AssetData) =>
                    a.symbol.toLowerCase() === id.toLowerCase()
                );
                if (found) {
                    setAsset(found);
                } else {
                    setError('Asset not found');
                }
            }
        } catch (e) {
            console.error('Failed to fetch asset:', e);
            setError('Failed to load asset data');
        } finally {
            setLoading(false);
        }
    };

    const logView = async () => {
        if (!session?.user) return;
        try {
            await fetch('/api/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'view',
                    targetId: id.toUpperCase(),
                    targetType: type,
                }),
            });
        } catch (e) {
            console.error('Failed to log view:', e);
        }
    };

    const checkWatchlist = async () => {
        if (!session?.user) return;
        try {
            const res = await fetch(`/api/watchlist?type=${type}`);
            const data = await res.json();
            if (data.status === 'success') {
                const found = data.data.some((w: any) =>
                    w.symbol.toLowerCase() === id.toLowerCase()
                );
                setIsWatchlisted(found);
            }
        } catch (e) {
            console.error('Failed to check watchlist:', e);
        }
    };

    const toggleWatchlist = async () => {
        if (!session?.user) {
            router.push('/auth/login');
            return;
        }

        try {
            if (isWatchlisted) {
                await fetch(`/api/watchlist?symbol=${id.toUpperCase()}&type=${type}`, {
                    method: 'DELETE',
                });
            } else {
                await fetch('/api/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol: id.toUpperCase(),
                        assetType: type,
                        name: asset?.name || id.toUpperCase(),
                    }),
                });
            }
            setIsWatchlisted(!isWatchlisted);
        } catch (e) {
            console.error('Failed to update watchlist:', e);
        }
    };

    const saveNote = async () => {
        if (!session?.user || !noteText.trim()) return;

        try {
            await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: noteText.trim(),
                    asset: id.toUpperCase(),
                }),
            });
            setNoteText('');
            setShowNoteForm(false);
        } catch (e) {
            console.error('Failed to save note:', e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-white animate-pulse">Loading asset data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Link href="/" className="text-cyan-400 hover:underline">
                        ← Back to home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20 pb-12">
            <div className="container mx-auto px-4 md:px-6">
                {/* Back Navigation */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* Asset Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${type === 'crypto' ? 'bg-purple-500/20 text-purple-400' :
                                    type === 'stocks' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                {type}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-bold">{asset?.symbol}</h1>
                        </div>
                        <p className="text-gray-400">{asset?.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Watchlist Button */}
                        <button
                            onClick={toggleWatchlist}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isWatchlisted
                                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {isWatchlisted ? <Bookmark size={16} /> : <BookmarkPlus size={16} />}
                            {isWatchlisted ? 'Watching' : 'Add to Watchlist'}
                        </button>

                        {/* Add Note Button */}
                        <button
                            onClick={() => setShowNoteForm(!showNoteForm)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                        >
                            <FileText size={16} />
                            Add Note
                        </button>
                    </div>
                </div>

                {/* Price Section */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex items-end gap-4 mb-4">
                        <span className="text-4xl font-bold font-mono">
                            ${asset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`flex items-center gap-1 text-lg font-medium ${(asset?.price_change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {(asset?.price_change_24h || 0) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            {(asset?.price_change_24h || 0) >= 0 ? '+' : ''}{asset?.price_change_24h?.toFixed(2)}%
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">24h High</span>
                            <p className="font-mono text-gray-200">${asset?.high_24h?.toLocaleString() || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">24h Low</span>
                            <p className="font-mono text-gray-200">${asset?.low_24h?.toLocaleString() || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">24h Volume</span>
                            <p className="font-mono text-gray-200">${asset?.volume_24h?.toLocaleString() || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Market Cap</span>
                            <p className="font-mono text-gray-200">${asset?.market_cap?.toLocaleString() || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Note Form */}
                {showNoteForm && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">Quick Note for {asset?.symbol}</h3>
                            <button onClick={() => setShowNoteForm(false)} className="text-gray-500 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Your thoughts on this asset..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                            rows={3}
                        />
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={saveNote}
                                disabled={!noteText.trim()}
                                className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                )}

                {/* Chart Placeholder */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h3 className="font-medium mb-4">Price Chart</h3>
                    <div className="h-64 flex items-center justify-center bg-black/20 rounded-lg text-gray-500">
                        Chart integration available
                    </div>
                </div>

                {/* Experimental Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trade Execution - DISABLED */}
                    <ExperimentalWrapper label="Trade execution — coming soon">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="font-medium mb-4">Quick Trade</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <button className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium">
                                        Buy
                                    </button>
                                    <button className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium">
                                        Sell
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
                                />
                            </div>
                        </div>
                    </ExperimentalWrapper>

                    {/* Signals - DISABLED */}
                    <ExperimentalWrapper label="Signal alerts — coming soon">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="font-medium mb-4">Active Signals</h3>
                            <div className="space-y-2">
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <span className="text-emerald-400 font-medium">Strong Buy</span>
                                    <p className="text-sm text-gray-400">Momentum breakout detected</p>
                                </div>
                            </div>
                        </div>
                    </ExperimentalWrapper>
                </div>
            </div>
        </div>
    );
}
