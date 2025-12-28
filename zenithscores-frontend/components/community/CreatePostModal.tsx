'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        body: string;
        postType: 'question' | 'insight' | 'thesis';
        asset?: string;
        marketType?: string;
    }) => Promise<void>;
}

const postTypes = [
    { value: 'question', label: 'Question', icon: HelpCircle, desc: 'Ask the community' },
    { value: 'insight', label: 'Insight', icon: Lightbulb, desc: 'Share an observation' },
    { value: 'thesis', label: 'Thesis', icon: TrendingUp, desc: 'Share your trade thesis' }
] as const;

const marketTypes = [
    { value: 'stock', label: 'Stock' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'forex', label: 'Forex' }
];

export default function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [postType, setPostType] = useState<'question' | 'insight' | 'thesis'>('insight');
    const [asset, setAsset] = useState('');
    const [marketType, setMarketType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!body.trim()) {
            setError('Content is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                title: title.trim(),
                body: body.trim(),
                postType,
                asset: asset.trim() || undefined,
                marketType: marketType || undefined
            });
            // Reset form
            setTitle('');
            setBody('');
            setPostType('insight');
            setAsset('');
            setMarketType('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 z-50 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Create Post</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X size={18} className="text-zinc-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Post Type Selection */}
                            <div>
                                <label className="text-xs text-zinc-500 mb-2 block">Post Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {postTypes.map(type => {
                                        const Icon = type.icon;
                                        const isSelected = postType === type.value;
                                        return (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setPostType(type.value)}
                                                className={`p-3 rounded-lg border text-center transition-all ${isSelected
                                                        ? 'border-[var(--accent-mint)] bg-[var(--accent-mint)]/10'
                                                        : 'border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <Icon size={18} className={`mx-auto mb-1 ${isSelected ? 'text-[var(--accent-mint)]' : 'text-zinc-500'}`} />
                                                <span className={`text-xs ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                                    {type.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Asset & Market Type */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1.5 block">Asset (optional)</label>
                                    <input
                                        type="text"
                                        value={asset}
                                        onChange={(e) => setAsset(e.target.value.toUpperCase())}
                                        placeholder="BTC, AAPL, EURUSD"
                                        maxLength={20}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1.5 block">Market</label>
                                    <select
                                        value={marketType}
                                        onChange={(e) => setMarketType(e.target.value)}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--accent-mint)]/50"
                                    >
                                        <option value="">Select...</option>
                                        {marketTypes.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="text-xs text-zinc-500 mb-1.5 block">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={postType === 'question' ? 'What would you like to ask?' : 'Give your post a title'}
                                    maxLength={200}
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/50"
                                />
                                <div className="text-right text-[10px] text-zinc-600 mt-1">{title.length}/200</div>
                            </div>

                            {/* Body */}
                            <div>
                                <label className="text-xs text-zinc-500 mb-1.5 block">Content</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    maxLength={2000}
                                    rows={5}
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/50 resize-none"
                                />
                                <div className="text-right text-[10px] text-zinc-600 mt-1">{body.length}/2000</div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !title.trim() || !body.trim()}
                                className="w-full py-3 bg-[var(--accent-mint)] text-[var(--void)] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Posting...' : 'Post'}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
