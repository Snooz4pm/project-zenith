'use client';

import { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, Reply, Send, Trash2, Smile } from 'lucide-react';

interface CommentAuthor {
    id: string;
    name: string | null;
    image: string | null;
}

interface CommentData {
    id: string;
    body: string;
    createdAt: Date | string;
    author: CommentAuthor;
    replies?: CommentData[];
}

interface CommentThreadProps {
    comments: CommentData[];
    currentUserId?: string;
    onAddComment: (body: string, parentId?: string) => Promise<void>;
    onDeleteComment?: (commentId: string) => Promise<void>;
    onMessage?: (authorId: string) => void;
}

// Quick emoji picker
const QUICK_EMOJIS = ['👍', '🎯', '💡', '📈', '🤔', '🔥'];

export default function CommentThread({
    comments,
    currentUserId,
    onAddComment,
    onDeleteComment,
    onMessage
}: CommentThreadProps) {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [showReplyEmojis, setShowReplyEmojis] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const replyInputRef = useRef<HTMLInputElement>(null);

    const handleAddEmoji = (emoji: string, isReply = false) => {
        if (isReply) {
            setReplyText(prev => prev + emoji);
            setShowReplyEmojis(false);
            replyInputRef.current?.focus();
        } else {
            setNewComment(prev => prev + emoji);
            setShowEmojis(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(newComment.trim());
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!replyText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(replyText.trim(), parentId);
            setReplyText('');
            setReplyingTo(null);
        } catch (error) {
            console.error('Failed to add reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderComment = (comment: CommentData, isReply = false) => {
        const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
        const isOwnComment = currentUserId === comment.author.id;

        return (
            <div
                key={comment.id}
                className={`${isReply ? 'ml-10 border-l border-white/5 pl-4' : ''}`}
            >
                <div className="flex items-start gap-3 py-4">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {comment.author.image ? (
                            <img src={comment.author.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User size={14} className="text-zinc-500" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                                {comment.author.name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-zinc-600">{timeAgo}</span>
                        </div>

                        {/* Body */}
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
                            {comment.body}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2">
                            {!isReply && (
                                <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <Reply size={12} />
                                    Reply
                                </button>
                            )}
                            {onMessage && !isOwnComment && (
                                <button
                                    onClick={() => onMessage(comment.author.id)}
                                    className="text-xs text-zinc-500 hover:text-[var(--accent-mint)] transition-colors"
                                >
                                    Message
                                </button>
                            )}
                            {isOwnComment && onDeleteComment && (
                                <button
                                    onClick={() => onDeleteComment(comment.id)}
                                    className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 size={12} />
                                    Delete
                                </button>
                            )}
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                            <div className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    maxLength={1000}
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/50"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmitReply(comment.id);
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={!replyText.trim() || isSubmitting}
                                    className="px-3 py-2 bg-[var(--accent-mint)] text-[var(--void)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div>
                        {comment.replies.map(reply => renderComment(reply, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-0">
            {/* New Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex gap-2 items-end">
                    {/* Emoji Picker */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowEmojis(!showEmojis)}
                            className="p-3 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white"
                        >
                            <Smile size={18} />
                        </button>
                        {showEmojis && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowEmojis(false)} />
                                <div className="absolute left-0 bottom-full mb-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-xl z-20 p-2 flex gap-1">
                                    {QUICK_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleAddEmoji(emoji)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-lg"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        maxLength={1000}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/50"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className="px-4 py-3 bg-[var(--accent-mint)] text-[var(--void)] font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                    No comments yet. Be the first to comment.
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                    {comments.map(comment => renderComment(comment))}
                </div>
            )}
        </div>
    );
}
