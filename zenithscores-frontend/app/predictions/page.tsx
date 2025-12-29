'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Target, Clock, Users, Trophy,
    ThumbsUp, ThumbsDown, Zap, Calendar, ChevronRight, Plus, X,
    CheckCircle, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Prediction {
    id: string;
    author: { id: string; name: string; image: string | null };
    symbol: string;
    assetType: string;
    direction: 'BULLISH' | 'BEARISH';
    targetPrice: number;
    currentPrice: number;
    deadline: string;
    thesis: string;
    confidence: number;
    agreesCount: number;
    disagreesCount: number;
    status: string;
    wasCorrect: boolean | null;
    createdAt: string;
    votes: { voterId: string; vote: string }[];
}

interface LeaderboardEntry {
    rank: number;
    user: { id: string; name: string; image: string | null };
    stats: {
        totalPredictions: number;
        correctPredictions: number;
        accuracyRate: number;
        totalPoints: number;
        streak: number;
    };
}

export default function PredictionsPage() {
    const { data: session } = useSession();
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filter, setFilter] = useState<'active' | 'resolved' | 'all'>('active');

    // Form state
    const [symbol, setSymbol] = useState('');
    const [assetType, setAssetType] = useState('crypto');
    const [direction, setDirection] = useState<'BULLISH' | 'BEARISH'>('BULLISH');
    const [targetPrice, setTargetPrice] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [thesis, setThesis] = useState('');
    const [confidence, setConfidence] = useState(50);
    const [deadline, setDeadline] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        try {
            const [predRes, leaderRes] = await Promise.all([
                fetch(`/api/predictions?status=${filter}`),
                fetch('/api/predictions/leaderboard?limit=10')
            ]);

            if (predRes.ok) {
                const data = await predRes.json();
                setPredictions(data.predictions || []);
            }

            if (leaderRes.ok) {
                const data = await leaderRes.json();
                setLeaderboard(data.leaderboard || []);
            }
        } catch (e) {
            console.error('Failed to load predictions:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    assetType,
                    direction,
                    targetPrice,
                    currentPrice,
                    deadline,
                    thesis,
                    confidence
                })
            });

            if (res.ok) {
                setShowCreateModal(false);
                setSymbol('');
                setTargetPrice('');
                setCurrentPrice('');
                setThesis('');
                setConfidence(50);
                setDeadline('');
                loadData();
            }
        } catch (e) {
            console.error('Failed to create prediction:', e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (predictionId: string, vote: 'AGREE' | 'DISAGREE') => {
        if (!session?.user?.id) return;

        try {
            const res = await fetch('/api/predictions/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ predictionId, vote })
            });

            if (res.ok) {
                loadData();
            }
        } catch (e) {
            console.error('Failed to vote:', e);
        }
    };

    const getTimeRemaining = (deadline: string) => {
        const diff = new Date(deadline).getTime() - Date.now();
        if (diff <= 0) return 'Expired';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    const getUserVote = (prediction: Prediction) => {
        if (!session?.user?.id) return null;
        const vote = prediction.votes?.find(v => v.voterId === session.user.id);
        return vote?.vote || null;
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Target className="w-6 h-6 text-amber-400" />
                        <h1 className="text-xl font-bold">Market Conviction</h1>
                    </div>
                    {session?.user && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all"
                        >
                            <Plus size={18} />
                            Make a Call
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Filters */}
                        <div className="flex gap-2">
                            {(['active', 'resolved', 'all'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-white/5 text-zinc-400 border border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Predictions List */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20 text-zinc-500">
                                <Clock className="animate-spin mr-2" size={20} />
                                Loading predictions...
                            </div>
                        ) : predictions.length === 0 ? (
                            <div className="text-center py-20">
                                <Target className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">No predictions yet</h3>
                                <p className="text-zinc-500 mb-6">Be the first to make a market call!</p>
                                {session?.user && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all"
                                    >
                                        Make Your First Call
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {predictions.map((prediction) => (
                                    <PredictionCard
                                        key={prediction.id}
                                        prediction={prediction}
                                        userVote={getUserVote(prediction)}
                                        onVote={handleVote}
                                        getTimeRemaining={getTimeRemaining}
                                        isOwn={prediction.author.id === session?.user?.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Leaderboard */}
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Trophy className="text-amber-400" size={20} />
                                Top Predictors
                            </h3>
                            {leaderboard.length === 0 ? (
                                <p className="text-sm text-zinc-500 text-center py-4">
                                    No leaderboard data yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {leaderboard.map((entry) => (
                                        <Link key={entry.user.id} href={`/user/${entry.user.id}`}>
                                            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${entry.rank === 1 ? 'bg-amber-500 text-black' :
                                                        entry.rank === 2 ? 'bg-zinc-400 text-black' :
                                                            entry.rank === 3 ? 'bg-amber-700 text-white' :
                                                                'bg-white/10 text-zinc-400'
                                                    }`}>
                                                    {entry.rank}
                                                </div>
                                                {entry.user.image ? (
                                                    <img src={entry.user.image} alt="" className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold">
                                                        {entry.user.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{entry.user.name}</div>
                                                    <div className="text-xs text-zinc-500">{entry.stats.totalPredictions} calls</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold ${entry.stats.accuracyRate >= 60 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                                        {entry.stats.accuracyRate.toFixed(0)}%
                                                    </div>
                                                    {entry.stats.streak > 0 && (
                                                        <div className="text-xs text-amber-400">🔥 {entry.stats.streak}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stats CTA */}
                        {session?.user && (
                            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                <h4 className="font-bold mb-2">Your Prediction Score</h4>
                                <p className="text-sm text-zinc-400 mb-4">
                                    Make 3+ predictions to appear on the leaderboard
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-all"
                                >
                                    Make a Call
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0a0a0c] border border-white/10 rounded-2xl max-w-lg w-full p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Target className="text-amber-400" size={24} />
                                    Make Your Call
                                </h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Symbol & Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Asset</label>
                                        <input
                                            type="text"
                                            value={symbol}
                                            onChange={e => setSymbol(e.target.value.toUpperCase())}
                                            placeholder="BTC, AAPL..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Type</label>
                                        <select
                                            value={assetType}
                                            onChange={e => setAssetType(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none"
                                        >
                                            <option value="crypto">Crypto</option>
                                            <option value="stock">Stock</option>
                                            <option value="forex">Forex</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Direction */}
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Direction</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setDirection('BULLISH')}
                                            className={`py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${direction === 'BULLISH'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                                                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-emerald-500/50'
                                                }`}
                                        >
                                            <TrendingUp size={18} />
                                            Bullish
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDirection('BEARISH')}
                                            className={`py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${direction === 'BEARISH'
                                                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
                                                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-red-500/50'
                                                }`}
                                        >
                                            <TrendingDown size={18} />
                                            Bearish
                                        </button>
                                    </div>
                                </div>

                                {/* Prices */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Current Price</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={currentPrice}
                                            onChange={e => setCurrentPrice(e.target.value)}
                                            placeholder="$0.00"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Target Price</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={targetPrice}
                                            onChange={e => setTargetPrice(e.target.value)}
                                            placeholder="$0.00"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Deadline */}
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Deadline</label>
                                    <input
                                        type="datetime-local"
                                        value={deadline}
                                        onChange={e => setDeadline(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none"
                                        required
                                    />
                                </div>

                                {/* Thesis */}
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Your Thesis</label>
                                    <textarea
                                        value={thesis}
                                        onChange={e => setThesis(e.target.value)}
                                        placeholder="Why do you believe this? What's your reasoning?"
                                        rows={3}
                                        maxLength={500}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none resize-none"
                                        required
                                    />
                                    <div className="text-xs text-zinc-600 text-right mt-1">{thesis.length}/500</div>
                                </div>

                                {/* Confidence */}
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">
                                        Confidence: <span className="text-amber-400">{confidence}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={confidence}
                                        onChange={e => setConfidence(parseInt(e.target.value))}
                                        className="w-full accent-amber-500"
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Publishing...' : 'Publish Prediction'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Prediction Card Component
function PredictionCard({
    prediction,
    userVote,
    onVote,
    getTimeRemaining,
    isOwn
}: {
    prediction: Prediction;
    userVote: string | null;
    onVote: (id: string, vote: 'AGREE' | 'DISAGREE') => void;
    getTimeRemaining: (deadline: string) => string;
    isOwn: boolean;
}) {
    const isBullish = prediction.direction === 'BULLISH';
    const isResolved = prediction.status === 'resolved';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-xl border transition-all ${isResolved
                    ? prediction.wasCorrect
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Link href={`/user/${prediction.author.id}`}>
                        {prediction.author.image ? (
                            <img src={prediction.author.image} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold">
                                {prediction.author.name?.charAt(0) || '?'}
                            </div>
                        )}
                    </Link>
                    <div>
                        <Link href={`/user/${prediction.author.id}`} className="font-medium hover:text-amber-400 transition-colors">
                            {prediction.author.name}
                        </Link>
                        <div className="text-xs text-zinc-500">
                            {new Date(prediction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                {isResolved ? (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${prediction.wasCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {prediction.wasCorrect ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {prediction.wasCorrect ? 'Correct' : 'Wrong'}
                    </div>
                ) : (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-xs text-zinc-400">
                        <Clock size={14} />
                        {getTimeRemaining(prediction.deadline)}
                    </div>
                )}
            </div>

            {/* Prediction Content */}
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isBullish ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {isBullish ? <TrendingUp className="inline mr-1" size={14} /> : <TrendingDown className="inline mr-1" size={14} />}
                        {prediction.direction}
                    </span>
                    <span className="text-lg font-bold">{prediction.symbol}</span>
                    <span className="text-zinc-500">→</span>
                    <span className="text-lg font-mono">${prediction.targetPrice.toLocaleString()}</span>
                </div>

                <p className="text-zinc-400 text-sm">{prediction.thesis}</p>

                <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                    <span>Entry: ${prediction.currentPrice.toLocaleString()}</span>
                    <span className={`font-medium ${prediction.confidence >= 70 ? 'text-amber-400' : 'text-zinc-400'
                        }`}>
                        {prediction.confidence}% confident
                    </span>
                </div>
            </div>

            {/* Voting Area */}
            {!isResolved && !isOwn && (
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={() => onVote(prediction.id, 'AGREE')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${userVote === 'AGREE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/5 text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                            }`}
                    >
                        <ThumbsUp size={16} />
                        Agree ({prediction.agreesCount})
                    </button>
                    <button
                        onClick={() => onVote(prediction.id, 'DISAGREE')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${userVote === 'DISAGREE'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-white/5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400'
                            }`}
                    >
                        <ThumbsDown size={16} />
                        Disagree ({prediction.disagreesCount})
                    </button>
                </div>
            )}

            {/* Vote Summary for own predictions */}
            {isOwn && !isResolved && (
                <div className="flex items-center gap-4 pt-4 border-t border-white/5 text-sm text-zinc-500">
                    <span className="text-emerald-400">👍 {prediction.agreesCount} agree</span>
                    <span className="text-red-400">👎 {prediction.disagreesCount} disagree</span>
                </div>
            )}
        </motion.div>
    );
}
