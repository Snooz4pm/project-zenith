'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
    ArrowLeft, User, HelpCircle, Lightbulb, TrendingUp,
    CheckCircle, Trash2, MessageSquare
} from 'lucide-react';
import CommentThread from '@/components/community/CommentThread';
import {
    getPostById,
    createComment,
    deleteComment,
    deletePost,
    markPostResolved,
    getOrCreateConversation
} from '@/lib/actions/community';

interface CommentData {
    id: string;
    body: string;
    createdAt: Date | string;
    author: { id: string; name: string | null; image: string | null };
    replies?: CommentData[];
}

interface PostData {
    id: string;
    title: string;
    body: string;
    asset: string | null;
    marketType: string | null;
    postType: string;
    resolved: boolean;
    createdAt: Date | string;
    author: { id: string; name: string | null; image: string | null };
    comments: CommentData[];
    _count: { comments: number };
}

const postTypeConfig = {
    question: { icon: HelpCircle, label: 'Question', color: 'text-amber-400' },
    insight: { icon: Lightbulb, label: 'Insight', color: 'text-blue-400' },
    thesis: { icon: TrendingUp, label: 'Thesis', color: 'text-emerald-400' }
};

export default function PostDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const postId = params.postId as string;

    const [post, setPost] = useState<PostData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadPost = useCallback(async () => {
        try {
            const data = await getPostById(postId);
            setPost(data as PostData | null);
        } catch (error) {
            console.error('Failed to load post:', error);
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        if (postId) {
            loadPost();
        }
    }, [postId, loadPost]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    const handleAddComment = async (body: string, parentId?: string) => {
        if (!session?.user?.id || !post) return;

        await createComment(session.user.id, post.id, body, parentId);
        loadPost(); // Refresh to get updated comments
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!session?.user?.id) return;

        await deleteComment(session.user.id, commentId);
        loadPost();
    };

    const handleDeletePost = async () => {
        if (!session?.user?.id || !post) return;
        if (!confirm('Are you sure you want to delete this post?')) return;

        setIsDeleting(true);
        try {
            await deletePost(session.user.id, post.id);
            router.push('/community');
        } catch (error) {
            console.error('Failed to delete post:', error);
            setIsDeleting(false);
        }
    };

    const handleMarkResolved = async () => {
        if (!session?.user?.id || !post) return;

        await markPostResolved(session.user.id, post.id);
        setPost(prev => prev ? { ...prev, resolved: true } : null);
    };

    const handleMessageAuthor = async (authorId: string) => {
        if (!session?.user?.id) return;
        if (authorId === session.user.id) return;

        const conversation = await getOrCreateConversation(session.user.id, authorId);
        router.push(`/messages/${conversation.id}`);
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="text-zinc-500">Loading...</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-zinc-500 mb-4">Post not found</p>
                    <Link href="/community" className="text-[var(--accent-mint)] hover:underline">
                        Back to Community
                    </Link>
                </div>
            </div>
        );
    }

    const config = postTypeConfig[post.postType as keyof typeof postTypeConfig] || postTypeConfig.insight;
    const IconComponent = config.icon;
    const isAuthor = session?.user?.id === post.author.id;
    const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

    return (
        <div className="min-h-screen bg-[var(--void)] text-white">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Back Link */}
                <Link
                    href="/community"
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Community
                </Link>

                {/* Post Content */}
                <article className="border border-white/10 rounded-xl p-6 bg-[#0c0c10] mb-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                                {post.author.image ? (
                                    <img src={post.author.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} className="text-zinc-500" />
                                )}
                            </div>
                            <div>
                                <span className="font-medium text-white">{post.author.name || 'Anonymous'}</span>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span>{timeAgo}</span>
                                    {post.asset && (
                                        <>
                                            <span>·</span>
                                            <span className="px-1.5 py-0.5 bg-white/5 rounded font-mono text-zinc-400">
                                                {post.asset}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Post Type Badge */}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 ${config.color} text-xs`}>
                            <IconComponent size={12} />
                            <span>{config.label}</span>
                            {post.resolved && post.postType === 'question' && (
                                <CheckCircle size={12} className="ml-1 text-emerald-400" />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-xl font-semibold text-white mb-4">{post.title}</h1>

                    {/* Body */}
                    <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed mb-6">
                        {post.body}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                                <MessageSquare size={16} />
                                {post._count.comments} comments
                            </span>

                            {!isAuthor && (
                                <button
                                    onClick={() => handleMessageAuthor(post.author.id)}
                                    className="text-sm text-zinc-500 hover:text-[var(--accent-mint)] transition-colors"
                                >
                                    Message Author
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {isAuthor && post.postType === 'question' && !post.resolved && (
                                <button
                                    onClick={handleMarkResolved}
                                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                    <CheckCircle size={14} />
                                    Mark Resolved
                                </button>
                            )}

                            {isAuthor && (
                                <button
                                    onClick={handleDeletePost}
                                    disabled={isDeleting}
                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                        </div>
                    </div>
                </article>

                {/* Comments Section */}
                <section>
                    <h2 className="text-lg font-medium text-white mb-4">Comments</h2>
                    <CommentThread
                        comments={post.comments}
                        currentUserId={session?.user?.id}
                        onAddComment={handleAddComment}
                        onDeleteComment={handleDeleteComment}
                        onMessage={handleMessageAuthor}
                    />
                </section>
            </div>
        </div>
    );
}
