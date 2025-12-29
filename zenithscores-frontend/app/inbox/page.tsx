'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { User, Send, ArrowLeft, MessageSquare, Smile, Link2, Inbox } from 'lucide-react';
import {
    getConversations,
    getMessages,
    sendMessage,
    markConversationNotificationsRead
} from '@/lib/actions/community';

interface ConversationData {
    id: string;
    otherUser: { id: string; name: string | null; image: string | null };
    lastMessage: { body: string; sender: { id: string; name: string | null } } | null;
    lastMessageAt: Date | string;
    contextType: string | null;
    contextId: string | null;
    hasUnread?: boolean;
}

interface MessageData {
    id: string;
    body: string;
    createdAt: Date | string;
    sender: { id: string; name: string | null; image: string | null };
}

// Quick emoji picker
const QUICK_EMOJIS = ['👍', '🎯', '💡', '📈', '🤔', '🔥', '👏', '💪'];

export default function InboxPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeConversationId = searchParams.get('conversation');

    const [conversations, setConversations] = useState<ConversationData[]>([]);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [showMobileConversation, setShowMobileConversation] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load conversations
    const loadConversations = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const data = await getConversations(session.user.id);
            setConversations(data as ConversationData[]);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.id]);

    // Load messages for active conversation
    const loadMessages = useCallback(async () => {
        if (!session?.user?.id || !activeConversationId) return;

        try {
            const data = await getMessages(activeConversationId, session.user.id);
            setMessages(data as MessageData[]);
            // Mark notifications as read
            await markConversationNotificationsRead(session.user.id, activeConversationId);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }, [session?.user?.id, activeConversationId]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (activeConversationId) {
            loadMessages();
            setShowMobileConversation(true);
        }
    }, [activeConversationId, loadMessages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    // Polling for new messages (every 3 seconds)
    useEffect(() => {
        if (!activeConversationId || isSending) return;

        const interval = setInterval(() => {
            loadMessages();
        }, 3000);

        return () => clearInterval(interval);
    }, [activeConversationId, loadMessages, isSending]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id || !activeConversationId || !newMessage.trim() || isSending) return;

        // 1. Optimistic UI Update
        const optimisticId = crypto.randomUUID();
        const messageBody = newMessage.trim();

        const optimisticMessage: MessageData = {
            id: optimisticId,
            body: messageBody,
            createdAt: new Date().toISOString(),
            sender: {
                id: session.user.id,
                name: session.user.name || 'You',
                image: session.user.image || null
            }
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        // 2. Network Request
        setIsSending(true);
        try {
            await sendMessage(session.user.id, activeConversationId, messageBody);
            // Sync with server state immediately to replace optimistic ID with real ID
            await loadMessages();
            loadConversations(); // Refresh specific conv list to update lastMessage snippet
        } catch (error) {
            console.error('Failed to send message:', error);
            // Rollback on error
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            alert('Failed to send message. Please try again.');
            setNewMessage(messageBody); // Restore text
        } finally {
            setIsSending(false);
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojis(false);
        inputRef.current?.focus();
    };

    const handleBackToList = () => {
        setShowMobileConversation(false);
        router.push('/inbox');
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Format timestamp with more detail
    const formatMessageTime = (date: Date | string) => {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return format(d, 'h:mm a');
        } else if (diffDays === 1) {
            return `Yesterday ${format(d, 'h:mm a')}`;
        } else if (diffDays < 7) {
            return format(d, 'EEEE h:mm a');
        }
        return format(d, 'MMM d, h:mm a');
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="text-zinc-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--void)] text-white">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Inbox</h1>
                    {conversations.length > 0 && (
                        <span className="text-sm text-zinc-500">
                            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Conversations List */}
                    <div className={`md:col-span-1 border border-white/10 rounded-xl bg-[#0c0c10] overflow-hidden ${showMobileConversation ? 'hidden md:block' : ''}`}>
                        <div className="p-4 border-b border-white/5">
                            <h2 className="text-sm font-medium text-zinc-400">Conversations</h2>
                        </div>

                        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Inbox size={40} className="mx-auto mb-4 text-zinc-600" />
                                    <p className="text-zinc-500 text-sm mb-2">No conversations yet</p>
                                    <p className="text-zinc-600 text-xs">
                                        Start a conversation by messaging someone from a post
                                    </p>
                                </div>
                            ) : (
                                conversations.map(conv => {
                                    const isActive = conv.id === activeConversationId;
                                    const isUnread = conv.lastMessage && conv.lastMessage.sender.id !== session?.user?.id;

                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => router.push(`/inbox?conversation=${conv.id}`)}
                                            className={`w-full p-4 text-left hover:bg-white/5 transition-colors relative ${isActive ? 'bg-white/5 border-l-2 border-[var(--accent-mint)]' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Avatar with online indicator potential */}
                                                <div className="relative">
                                                    <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {conv.otherUser.image ? (
                                                            <img src={conv.otherUser.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} className="text-zinc-500" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-sm font-medium truncate ${isUnread ? 'text-white' : 'text-zinc-300'}`}>
                                                            {conv.otherUser.name || 'Anonymous'}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-600 flex-shrink-0 ml-2">
                                                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                                        </span>
                                                    </div>

                                                    {/* Context indicator */}
                                                    {conv.contextType && (
                                                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 mt-0.5">
                                                            <Link2 size={10} />
                                                            <span>From {conv.contextType}</span>
                                                        </div>
                                                    )}

                                                    {conv.lastMessage && (
                                                        <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-zinc-400 font-medium' : 'text-zinc-600'}`}>
                                                            {conv.lastMessage.sender.id === session?.user?.id ? 'You: ' : ''}
                                                            {conv.lastMessage.body}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Unread indicator */}
                                                {isUnread && !isActive && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-mint)] flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Messages Panel */}
                    <div className={`md:col-span-2 border border-white/10 rounded-xl bg-[#0c0c10] flex flex-col h-[600px] ${!showMobileConversation && activeConversationId ? '' : !activeConversationId ? '' : ''} ${!showMobileConversation ? 'hidden md:flex' : ''}`}>
                        {activeConversationId && activeConversation ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                                    <button
                                        onClick={handleBackToList}
                                        className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                                        {activeConversation.otherUser.image ? (
                                            <img src={activeConversation.otherUser.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={16} className="text-zinc-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-medium text-white">
                                            {activeConversation.otherUser.name || 'Anonymous'}
                                        </span>
                                        {activeConversation.contextType && (
                                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                <Link2 size={10} />
                                                Started from {activeConversation.contextType}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Safety Disclaimer - Always visible */}
                                <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/10">
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-500 text-xs mt-0.5">⚠️</span>
                                        <div>
                                            <p className="text-[10px] font-medium text-amber-400/80 uppercase tracking-wide">Safety Notice</p>
                                            <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                                                Never share bank details, passwords, or private financial information. ZenithScores users should never request funds or offer investment opportunities. Report suspicious behavior immediately.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                                            No messages yet. Say hello! 👋
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isOwn = msg.sender.id === session?.user?.id;
                                            const showTimestamp = index === 0 ||
                                                new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000; // 5 min gap

                                            return (
                                                <div key={msg.id}>
                                                    {showTimestamp && (
                                                        <div className="text-center text-[10px] text-zinc-600 my-3">
                                                            {formatMessageTime(msg.createdAt)}
                                                        </div>
                                                    )}
                                                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                        <div
                                                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn
                                                                ? 'bg-[var(--accent-mint)] text-[var(--void)] rounded-br-md'
                                                                : 'bg-white/5 text-white rounded-bl-md'
                                                                }`}
                                                        >
                                                            <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5">
                                    <div className="flex gap-2 items-end">
                                        {/* Emoji Picker */}
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowEmojis(!showEmojis)}
                                                className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white"
                                            >
                                                <Smile size={20} />
                                            </button>
                                            {showEmojis && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setShowEmojis(false)} />
                                                    <div className="absolute left-0 bottom-full mb-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-xl z-20 p-2 flex gap-1 flex-wrap max-w-[200px]">
                                                        {QUICK_EMOJIS.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                onClick={() => handleEmojiClick(emoji)}
                                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-xl"
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
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            maxLength={2000}
                                            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || isSending}
                                            className="px-4 py-2.5 bg-[var(--accent-mint)] text-[var(--void)] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-zinc-500">
                                <div className="text-center">
                                    <MessageSquare size={40} className="mx-auto mb-4 opacity-40" />
                                    <p className="text-sm mb-1">Select a conversation</p>
                                    <p className="text-xs text-zinc-600">
                                        Or message someone from a community post
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
