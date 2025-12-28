'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    allowImages?: boolean;
    onSubmit: (data: {
        title: string;
        body: string;
        postType: 'question' | 'insight' | 'thesis';
        asset?: string;
        marketType?: string;
        imageUrl?: string;
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

export default function CreatePostModal({ isOpen, onClose, onSubmit, allowImages = false }: CreatePostModalProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [postType, setPostType] = useState<'question' | 'insight' | 'thesis'>('insight');
    const [asset, setAsset] = useState('');
    const [marketType, setMarketType] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (validation)
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
                marketType: marketType || undefined,
                imageUrl: allowImages && imageUrl.trim() ? imageUrl.trim() : undefined
            });
            // Reset form
            setTitle('');
            setBody('');
            setPostType('insight');
            setAsset('');
            setMarketType('');
            setImageUrl('');
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
                    {/* ... (Backdrop) */}
                    {/* ... (Modal Header) */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ... (Post Type) */}

                        {/* Asset & Market Type */}
                        {/* ... (Asset inputs) */}

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

                        {/* Image URL (Conditional) */}
                        {allowImages && (
                            <div>
                                <label className="text-xs text-zinc-500 mb-1.5 block">Image URL (Optional)</label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.png"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/50"
                                />
                            </div>
                        )}

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
    )
}
        </AnimatePresence >
    );
}
