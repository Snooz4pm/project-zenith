'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, HelpCircle, Lightbulb, TrendingUp } from 'lucide-react';
import PostCard from '@/components/community/PostCard';
import CreatePostModal from '@/components/community/CreatePostModal';
import { getPosts, createPost, deletePost, getOrCreateConversation } from '@/lib/actions/community';

interface PostData {
    id: string;
    title: string;
    body: string;
    asset: string | null;
    marketType: string | null;
    postType: string;
    resolved: boolean;
    createdAt: Date;
    author: { id: string; name: string | null; image: string | null };
    _count: { comments: number };
}

const filterOptions = [
    { value: 'all', label: 'All Posts' },
    { value: 'question', label: 'Questions', icon: HelpCircle },
    { value: 'insight', label: 'Insights', icon: Lightbulb },
    { value: 'thesis', label: 'Theses', icon: TrendingUp }
];

export default function CommunityPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [posts, setPosts] = useState<PostData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const loadPosts = useCallback(async (cursor?: string) => {
        if (cursor) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }

        try {
            const result = await getPosts(cursor, 20);
            if (cursor) {
                setPosts(prev => [...prev, ...result.posts as PostData[]]);
            } else {
                setPosts(result.posts as PostData[]);
            }
            setNextCursor(result.nextCursor);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    const handleCreatePost = async (data: {
        title: string;
        body: string;
        postType: 'question' | 'insight' | 'thesis';
        asset?: string;
        marketType?: string;
    }) => {
        if (!session?.user?.id) return;

        const newPost = await createPost(session.user.id, data);
        setPosts(prev => [newPost as PostData, ...prev]);
    };

    const handleDeletePost = async (postId: string) => {
        if (!session?.user?.id) return;

        try {
            await deletePost(session.user.id, postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    const handleMessageAuthor = async (authorId: string) => {
        if (!session?.user?.id) return;
        if (authorId === session.user.id) return;

        const conversation = await getOrCreateConversation(session.user.id, authorId);
        router.push(`/inbox?conversation=${conversation.id}`);
    };

    const filteredPosts = filter === 'all'
        ? posts
        : posts.filter(p => p.postType === filter);

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="text-zinc-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--void)] text-white">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Community</h1>
                        <p className="text-sm text-zinc-500 mt-1">Exchange market insights with traders</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-mint)] text-[var(--void)] font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus size={18} />
                        New Post
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-6 pb-6 border-b border-white/5">
                    {filterOptions.map(option => {
                        const isActive = filter === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                            <p className="mb-4">No posts yet.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-[var(--accent-mint)] hover:underline"
                            >
                                Be the first to post
                            </button>
                        </div>
                    ) : (
                        <>
                            {filteredPosts.map(post => (
                                <PostCard
                                    key={post.id}
                                    id={post.id}
                                    author={post.author}
                                    title={post.title}
                                    body={post.body}
                                    asset={post.asset}
                                    marketType={post.marketType}
                                    postType={post.postType}
                                    resolved={post.resolved}
                                    commentCount={post._count.comments}
                                    createdAt={post.createdAt}
                                    currentUserId={session?.user?.id}
                                    onMessage={post.author.id !== session?.user?.id ? handleMessageAuthor : undefined}
                                    onDelete={handleDeletePost}
                                />
                            ))}

                            {/* Load More */}
                            {nextCursor && (
                                <div className="text-center pt-4">
                                    <button
                                        onClick={() => loadPosts(nextCursor)}
                                        disabled={isLoadingMore}
                                        className="text-sm text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        {isLoadingMore ? 'Loading...' : 'Load more'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreatePost}
            />
        </div>
    );
}
