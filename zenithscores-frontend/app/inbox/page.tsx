'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { User, Send, ArrowLeft, MessageSquare } from 'lucide-react';
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
}

interface MessageData {
    id: string;
    body: string;
    createdAt: Date | string;
    sender: { id: string; name: string | null; image: string | null };
}

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id || !activeConversationId || !newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const sentMessage = await sendMessage(session.user.id, activeConversationId, newMessage.trim());
            setMessages(prev => [...prev, sentMessage as MessageData]);
            setNewMessage('');
            loadConversations(); // Refresh to update lastMessage
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);

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
                <h1 className="text-2xl font-bold mb-6">Inbox</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Conversations List */}
                    <div className="md:col-span-1 border border-white/10 rounded-xl bg-[#0c0c10] overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <h2 className="text-sm font-medium text-zinc-400">Conversations</h2>
                        </div>

                        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-6 text-center text-zinc-500 text-sm">
                                    No conversations yet
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => router.push(`/inbox?conversation=${conv.id}`)}
                                        className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${conv.id === activeConversationId ? 'bg-white/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {conv.otherUser.image ? (
                                                    <img src={conv.otherUser.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={16} className="text-zinc-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-white truncate">
                                                        {conv.otherUser.name || 'Anonymous'}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600">
                                                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                                    </span>
                                                </div>
                                                {conv.lastMessage && (
                                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                                        {conv.lastMessage.sender.id === session?.user?.id ? 'You: ' : ''}
                                                        {conv.lastMessage.body}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Messages Panel */}
                    <div className="md:col-span-2 border border-white/10 rounded-xl bg-[#0c0c10] flex flex-col h-[600px]">
                        {activeConversationId && activeConversation ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                                    <button
                                        onClick={() => router.push('/inbox')}
                                        className="md:hidden p-1 hover:bg-white/5 rounded"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                                        {activeConversation.otherUser.image ? (
                                            <img src={activeConversation.otherUser.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} className="text-zinc-500" />
                                        )}
                                    </div>
                                    <div>
                                        <span className="font-medium text-white">
                                            {activeConversation.otherUser.name || 'Anonymous'}
                                        </span>
                                        {activeConversation.contextType && (
                                            <p className="text-xs text-zinc-500">
                                                From {activeConversation.contextType}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map(msg => {
                                        const isOwn = msg.sender.id === session?.user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isOwn
                                                            ? 'bg-[var(--accent-mint)] text-[var(--void)]'
                                                            : 'bg-white/5 text-white'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                                                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-black/50' : 'text-zinc-600'}`}>
                                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5">
                                    <div className="flex gap-2">
                                        <input
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
                                    <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">Select a conversation</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
