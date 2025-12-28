'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Hash, Users, Settings } from 'lucide-react';
import PostCard from '@/components/community/PostCard';
import CreatePostModal from '@/components/community/CreatePostModal';
import { getRoomPosts, createRoomPost, joinRoom, getPendingJoinRequests } from '@/lib/actions/rooms';
import { deletePost, getOrCreateConversation } from '@/lib/actions/community';

interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  marketType: string;
  isSystem: boolean;
  isPublic: boolean;
  requiresApproval: boolean;
  creatorId: string | null;
  creator: { id: string; name: string | null; image: string | null } | null;
  _count: { members: number; posts: number };
}

interface RoomFeedProps {
  room: Room;
  userId: string;
  isMember: boolean;
}

export default function RoomFeed({ room: initialRoom, userId, isMember: initialIsMember }: RoomFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const isCreator = initialRoom.creatorId === userId;

  useEffect(() => {
    if (isMember) {
      loadPosts();
    } else {
      setIsLoading(false);
    }

    if (isCreator && initialRoom.requiresApproval) {
      loadPendingRequests();
    }
  }, [isMember, isCreator]);

  async function loadPosts() {
    setIsLoading(true);
    const result = await getRoomPosts(initialRoom.id);
    setPosts(result.posts);
    setIsLoading(false);
  }

  async function loadPendingRequests() {
    if (!isCreator) return;
    const requests = await getPendingJoinRequests(userId, initialRoom.id);
    setPendingRequests(requests);
  }

  async function handleJoin() {
    setIsJoining(true);
    try {
      const result = await joinRoom(userId, initialRoom.id);
      if (result.requestPending) {
        alert('Join request sent! The room creator will review it.');
      } else {
        setIsMember(true);
      }
    } catch (error: any) {
      alert(error?.message || 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCreatePost(data: any) {
    const newPost = await createRoomPost(userId, initialRoom.id, data);
    setPosts(prev => [newPost, ...prev]);
    setIsModalOpen(false);
  }

  async function handleDeletePost(postId: string) {
    await deletePost(userId, postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  async function handleMessageAuthor(authorId: string) {
    if (authorId === userId) return;
    const conversation = await getOrCreateConversation(userId, authorId);
    router.push(`/inbox?conversation=${conversation.id}`);
  }

  function handleManageRoom() {
    router.push(`/community/rooms/${initialRoom.slug}/manage`);
  }

  // Not a member screen
  if (!isMember) {
    return (
      <div className="min-h-screen bg-[var(--void)] text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push('/community')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Community
          </button>

          <div className="border border-white/5 rounded-xl p-8 bg-[#0c0c10] text-center">
            <Hash size={48} className="mx-auto mb-4 text-zinc-700" />
            <h1 className="text-2xl font-bold mb-2">{initialRoom.name}</h1>
            <p className="text-zinc-400 mb-6">{initialRoom.description}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500 mb-6">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {initialRoom._count.members} members
              </span>
              <span>·</span>
              <span>{initialRoom._count.posts} posts</span>
            </div>
            {initialRoom.creator && (
              <p className="text-xs text-zinc-600 mb-6">
                Created by {initialRoom.creator.name}
              </p>
            )}
            {initialRoom.isPublic ? (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="px-6 py-3 bg-[var(--accent-mint)] text-[var(--void)] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isJoining
                  ? 'Joining...'
                  : initialRoom.requiresApproval
                  ? 'Request to Join'
                  : 'Join Room'
                }
              </button>
            ) : (
              <div className="text-zinc-500 text-sm">
                This is a private room. Contact the creator for an invitation.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Member view
  return (
    <div className="min-h-screen bg-[var(--void)] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/community')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          All Rooms
        </button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Hash size={24} className="text-zinc-500" />
                {initialRoom.name}
              </h1>
              {isCreator && (
                <button
                  onClick={handleManageRoom}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                  title="Manage Room"
                >
                  <Settings size={16} className="text-zinc-500" />
                </button>
              )}
            </div>
            <p className="text-sm text-zinc-500">{initialRoom.description}</p>
            {initialRoom.creator && !initialRoom.isSystem && (
              <p className="text-xs text-zinc-600 mt-1">
                Created by {initialRoom.creator.name}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-mint)] text-[var(--void)] font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Post
          </button>
        </div>

        {/* Pending join requests (for creators) */}
        {isCreator && pendingRequests.length > 0 && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-amber-400 mb-3">
              Pending Join Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-2">
              {pendingRequests.slice(0, 3).map(req => (
                <div key={req.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{req.user.name}</span>
                  <button
                    onClick={() => router.push(`/community/rooms/${initialRoom.slug}/manage`)}
                    className="text-[var(--accent-mint)] hover:underline text-xs"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="border border-white/5 rounded-xl p-8 bg-[#0c0c10] text-center">
            <p className="text-zinc-500 mb-4">No posts yet in this room.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[var(--accent-mint)] hover:underline"
            >
              Start the conversation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
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
                currentUserId={userId}
                onMessage={handleMessageAuthor}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}

        <CreatePostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreatePost}
        />
      </div>
    </div>
  );
}
