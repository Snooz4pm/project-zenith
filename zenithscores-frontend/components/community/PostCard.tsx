'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, User, CheckCircle, HelpCircle, Lightbulb, TrendingUp, Trash2, MoreHorizontal, Smile } from 'lucide-react';

interface PostAuthor {
    id: string;
    name: string | null;
    image: string | null;
}

interface PostCardProps {
    id: string;
    author: PostAuthor;
    title: string;
    body: string;
    asset?: string | null;
    marketType?: string | null;
    imageUrl?: string | null;
    postType: string;
    resolved?: boolean;
    commentCount: number;
    createdAt: Date | string;
    currentUserId?: string;
    onMessage?: (authorId: string) => void;
    onDelete?: (postId: string) => void;
}

const postTypeConfig = {
    question: { icon: HelpCircle, label: 'Question', color: 'text-amber-400' },
    insight: { icon: Lightbulb, label: 'Insight', color: 'text-blue-400' },
    thesis: { icon: TrendingUp, label: 'Thesis', color: 'text-emerald-400' }
};

// Quick emoji reactions
const QUICK_EMOJIS = ['👍', '🎯', '💡', '📈', '🤔'];

export default function PostCard({
    id,
    author,
    title,
    body,
    asset,
    marketType,
    imageUrl,
    postType,
    resolved,
    commentCount,
    createdAt,
    currentUserId,
    onMessage,
    onDelete
}: PostCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [reactions, setReactions] = useState<string[]>([]);

    const config = postTypeConfig[postType as keyof typeof postTypeConfig] || postTypeConfig.insight;
    const IconComponent = config.icon;
    const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    const isOwnPost = currentUserId === author.id;

    const handleAddReaction = (emoji: string) => {
        if (!reactions.includes(emoji)) {
            setReactions([...reactions, emoji]);
        }
        setShowEmojis(false);
    };

    const handleDelete = () => {
        if (onDelete && confirm('Delete this post?')) {
            onDelete(id);
        }
        setShowMenu(false);
    };

    return (
        <article className="border border-white/5 rounded-xl p-5 bg-[#0c0c10] hover:border-white/10 transition-colors relative">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Author Avatar */}
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                        {author.image ? (
                            <img src={author.image} alt={author.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <User size={16} className="text-zinc-500" />
                        )}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-white">{author.name || 'Anonymous'}</span>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>{timeAgo}</span>
                            {asset && (
                                <>
                                    <span>·</span>
                                    <span className="px-1.5 py-0.5 bg-white/5 rounded font-mono text-zinc-400">{asset}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Post Type Badge */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 ${config.color} text-xs`}>
                        <IconComponent size={12} />
                        <span>{config.label}</span>
                        {resolved && postType === 'question' && (
                            <CheckCircle size={12} className="ml-1 text-emerald-400" />
                        )}
                    </div>

                    {/* More Menu (for own posts) */}
                    {isOwnPost && onDelete && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <MoreHorizontal size={16} className="text-zinc-500" />
                            </button>
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 top-full mt-1 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                                        <button
                                            onClick={handleDelete}
                                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Title */}
            <Link href={`/community/${id}`}>
                <h3 className="text-base font-medium text-white mb-2 hover:text-[var(--accent-mint)] transition-colors">
                    {title}
                </h3>
            </Link>

            {/* Body Preview */}
            <p className="text-sm text-zinc-400 line-clamp-3 mb-4">
                {body}
            </p>

            {/* Attached Image */}
            {imageUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-white/10 bg-black/20">
                    <img
                        src={imageUrl}
                        alt="Post attachment"
                        className="w-full h-auto max-h-[400px] object-contain"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>
            )}

            {/* Reactions */}
            {reactions.length > 0 && (
                <div className="flex items-center gap-1 mb-3">
                    {reactions.map((emoji, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 rounded-full text-sm">{emoji}</span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/community/${id}`}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                        <MessageSquare size={14} />
                        <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
                    </Link>

                    {/* Emoji Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowEmojis(!showEmojis)}
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                        >
                            <Smile size={14} />
                        </button>
                        {showEmojis && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowEmojis(false)} />
                                <div className="absolute left-0 bottom-full mb-2 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-xl z-20 p-2 flex gap-1">
                                    {QUICK_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleAddReaction(emoji)}
                                            className="p-1.5 hover:bg-white/10 rounded transition-colors text-lg"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {onMessage && !isOwnPost && (
                    <button
                        onClick={() => onMessage(author.id)}
                        className="text-xs text-zinc-500 hover:text-[var(--accent-mint)] transition-colors"
                    >
                        Message Author
                    </button>
                )}
            </div>
        </article>
    );
}

