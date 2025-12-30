'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, MessageSquare, Mail, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead
} from '@/lib/actions/community';

interface NotificationData {
    id: string;
    type: string;
    sourceEntityId: string;
    message: string | null;
    read: boolean;
    createdAt: Date | string;
    sourceUser: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

export default function NotificationBell() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        if (!session?.user?.id) return;

        const fetchUnreadCount = async () => {
            const count = await getUnreadNotificationCount(session.user.id);
            setUnreadCount(count);
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [session?.user?.id]);

    // Fetch notifications when dropdown opens
    const handleOpenDropdown = async () => {
        if (!session?.user?.id) return;

        setIsOpen(true);
        setIsLoading(true);

        try {
            const data = await getNotifications(session.user.id);
            setNotifications(data as NotificationData[]);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (notificationId: string) => {
        if (!session?.user?.id) return;

        await markNotificationRead(session.user.id, notificationId);
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = async () => {
        if (!session?.user?.id) return;

        await markAllNotificationsRead(session.user.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const getNotificationLink = (notification: NotificationData) => {
        switch (notification.type) {
            case 'COMMENT_ON_POST':
                return `/community/${notification.sourceEntityId}`;
            case 'DIRECT_MESSAGE':
                return `/inbox?conversation=${notification.sourceEntityId}`;
            default:
                return '#';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'COMMENT_ON_POST':
                return <MessageSquare size={14} className="text-blue-400" />;
            case 'DIRECT_MESSAGE':
                return <Mail size={14} className="text-emerald-400" />;
            default:
                return <Inbox size={14} className="text-zinc-400" />;
        }
    };

    if (!session?.user?.id) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => isOpen ? setIsOpen(false) : handleOpenDropdown()}
                className="relative p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
                <Inbox size={20} className="text-zinc-400 hover:text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-[#0c0c10] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <h3 className="text-sm font-medium text-white">Inbox</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-zinc-500 hover:text-[var(--accent-mint)] flex items-center gap-1 transition-colors"
                                >
                                    <Check size={12} />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[360px] overflow-y-auto">
                            {isLoading ? (
                                <div className="py-8 text-center text-zinc-500 text-sm">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center text-zinc-500 text-sm">
                                    No notifications yet
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map(notification => (
                                        <Link
                                            key={notification.id}
                                            href={getNotificationLink(notification)}
                                            onClick={() => {
                                                if (!notification.read) handleMarkAsRead(notification.id);
                                                setIsOpen(false);
                                            }}
                                            className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${!notification.read ? 'bg-white/[0.02]' : ''
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div className="mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${notification.read ? 'text-zinc-400' : 'text-white'}`}>
                                                    {notification.message || 'New notification'}
                                                </p>
                                                <span className="text-xs text-zinc-600">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {/* Unread Indicator */}
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-[var(--accent-mint)] mt-1.5" />
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-white/5">
                            <Link
                                href="/inbox"
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-zinc-500 hover:text-white transition-colors"
                            >
                                View all messages
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
