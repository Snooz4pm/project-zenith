'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, User, CheckCircle, HelpCircle, Lightbulb, TrendingUp } from 'lucide-react';

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
    postType: string;
    resolved?: boolean;
    commentCount: number;
    createdAt: Date | string;
    onMessage?: (authorId: string) => void;
}

const postTypeConfig = {
    question: { icon: HelpCircle, label: 'Question', color: 'text-amber-400' },
    insight: { icon: Lightbulb, label: 'Insight', color: 'text-blue-400' },
    thesis: { icon: TrendingUp, label: 'Thesis', color: 'text-emerald-400' }
};

export default function PostCard({
    id,
    author,
    title,
    body,
    asset,
    marketType,
    postType,
    resolved,
    commentCount,
    createdAt,
    onMessage
}: PostCardProps) {
    const config = postTypeConfig[postType as keyof typeof postTypeConfig] || postTypeConfig.insight;
    const IconComponent = config.icon;
    const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

    return (
        <article className="border border-white/5 rounded-xl p-5 bg-[#0c0c10] hover:border-white/10 transition-colors">
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

                {/* Post Type Badge */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 ${config.color} text-xs`}>
                    <IconComponent size={12} />
                    <span>{config.label}</span>
                    {resolved && postType === 'question' && (
                        <CheckCircle size={12} className="ml-1 text-emerald-400" />
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

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <Link
                    href={`/community/${id}`}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                    <MessageSquare size={14} />
                    <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
                </Link>

                {onMessage && (
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
