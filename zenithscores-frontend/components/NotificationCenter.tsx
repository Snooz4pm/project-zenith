'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, BellOff, Settings, X, Check, Zap, Trophy, Target,
    GraduationCap, Flame, Award, ChevronRight, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import {
    loadNotifications, saveNotifications, loadNotificationConfig,
    saveNotificationConfig, requestPushPermission, scheduleNextPulseNotification,
    type PushNotification, type NotificationConfig
} from '@/lib/notification-engine';
import { isPremiumUser } from '@/lib/premium';

export default function NotificationCenter() {
    const [premium, setPremium] = useState(false);
    const [open, setOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notifications, setNotifications] = useState<PushNotification[]>([]);
    const [config, setConfig] = useState<NotificationConfig | null>(null);
    const [pushEnabled, setPushEnabled] = useState(false);

    useEffect(() => {
        setPremium(isPremiumUser());
        setNotifications(loadNotifications());
        setConfig(loadNotificationConfig());

        // Check push permission
        if ('Notification' in window) {
            setPushEnabled(Notification.permission === 'granted');
        }

        // Schedule pulse notifications
        if (isPremiumUser()) {
            scheduleNextPulseNotification();
        }
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
        saveNotifications(updated);
    };

    const markAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        saveNotifications(updated);
    };

    const clearAll = () => {
        setNotifications([]);
        saveNotifications([]);
    };

    const toggleConfig = (key: keyof NotificationConfig) => {
        if (!config) return;
        const updated = { ...config, [key]: !config[key] };
        setConfig(updated);
        saveNotificationConfig(updated);
    };

    const enablePush = async () => {
        const granted = await requestPushPermission();
        setPushEnabled(granted);
    };

    const getIcon = (type: PushNotification['type']) => {
        switch (type) {
            case 'pulse': return <Zap size={14} className="text-cyan-400" />;
            case 'arena': return <Trophy size={14} className="text-yellow-400" />;
            case 'prediction': return <Target size={14} className="text-purple-400" />;
            case 'coach': return <GraduationCap size={14} className="text-green-400" />;
            case 'streak': return <Flame size={14} className="text-orange-400" />;
            case 'achievement': return <Award size={14} className="text-pink-400" />;
            case 'signal': return <Zap size={14} className="text-emerald-400" />;
        }
    };

    const formatTime = (date: Date) => {
        const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    // Free users see a limited notification center (unlocked but with upsell)
    if (!premium) {
        return (
            <div className="relative">
                <button
                    onClick={() => setOpen(!open)}
                    className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-cyan-500/30 transition-colors"
                >
                    <Bell size={18} />
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 top-12 w-72 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 p-4"
                        >
                            <div className="text-center">
                                <Bell size={32} className="mx-auto text-gray-600 mb-3" />
                                <h4 className="font-bold text-white mb-2">Enable Notifications</h4>
                                <p className="text-xs text-gray-500 mb-4">
                                    Get alerts when high-score signals are detected, new pulses drop, and more.
                                </p>
                                <button
                                    onClick={async () => {
                                        const granted = await requestPushPermission();
                                        setPushEnabled(granted);
                                        if (granted) setOpen(false);
                                    }}
                                    className="w-full py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors"
                                >
                                    Enable Notifications
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/30 transition-colors"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-12 w-80 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-white/5">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                <Bell size={14} className="text-cyan-400" />
                                Notifications
                            </h4>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="text-gray-500 hover:text-white"
                                >
                                    <Settings size={14} />
                                </button>
                                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <AnimatePresence>
                            {showSettings && config && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden border-b border-white/5"
                                >
                                    <div className="p-3 space-y-2">
                                        {/* Push Permission */}
                                        {!pushEnabled && (
                                            <button
                                                onClick={enablePush}
                                                className="w-full py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30"
                                            >
                                                Enable Browser Notifications
                                            </button>
                                        )}

                                        {/* Toggle Options */}
                                        {[
                                            { key: 'pulseReminders' as const, label: '3-Hour Pulse', icon: Zap },
                                            { key: 'arenaUpdates' as const, label: 'Arena Updates', icon: Trophy },
                                            { key: 'predictionResults' as const, label: 'Prediction Results', icon: Target },
                                            { key: 'coachAlerts' as const, label: 'Coach Alerts', icon: GraduationCap },
                                            { key: 'streakWarnings' as const, label: 'Streak Warnings', icon: Flame },
                                        ].map(({ key, label, icon: Icon }) => (
                                            <div key={key} className="flex items-center justify-between py-1">
                                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                                    <Icon size={12} />
                                                    {label}
                                                </span>
                                                <button
                                                    onClick={() => toggleConfig(key)}
                                                    className={`w-8 h-4 rounded-full transition-colors ${config[key] ? 'bg-cyan-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${config[key] ? 'translate-x-4' : 'translate-x-0.5'
                                                        }`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        {notifications.length > 0 && (
                            <div className="flex items-center gap-2 p-2 border-b border-white/5">
                                <button onClick={markAllRead} className="text-[10px] text-cyan-400 hover:text-cyan-300">
                                    Mark all read
                                </button>
                                <span className="text-gray-600">•</span>
                                <button onClick={clearAll} className="text-[10px] text-gray-500 hover:text-gray-400">
                                    Clear all
                                </button>
                            </div>
                        )}

                        {/* Notifications List */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notif) => (
                                    <Link
                                        key={notif.id}
                                        href={notif.action || '/dashboard'}
                                        onClick={() => {
                                            markAsRead(notif.id);
                                            setOpen(false);
                                        }}
                                        className={`flex items-start gap-3 p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-cyan-500/5' : ''
                                            }`}
                                    >
                                        <div className="p-1.5 rounded-lg bg-white/5 mt-0.5">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                                                {!notif.read && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-2">{notif.body}</p>
                                            <span className="text-[10px] text-gray-600">{formatTime(notif.timestamp)}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-600 mt-1" />
                                    </Link>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
