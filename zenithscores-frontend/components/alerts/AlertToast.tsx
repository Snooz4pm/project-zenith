/**
 * AlertToast Component
 * 
 * Shows triggered alert notifications as toasts
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trophy, TrendingUp } from 'lucide-react';

interface AlertNotification {
    id: string;
    symbol: string;
    message: string;
    wasCorrect: boolean | null;
    pointsEarned: number;
    timestamp: number;
}

interface AlertToastProps {
    notifications: AlertNotification[];
    onDismiss: (id: string) => void;
}

export default function AlertToast({ notifications, onDismiss }: AlertToastProps) {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            <AnimatePresence>
                {notifications.map(notification => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className={`
                            relative p-4 rounded-xl backdrop-blur-lg shadow-2xl border
                            ${notification.wasCorrect
                                ? 'bg-emerald-900/90 border-emerald-500/50'
                                : 'bg-zinc-900/90 border-zinc-700/50'
                            }
                        `}
                    >
                        {/* Dismiss button */}
                        <button
                            onClick={() => onDismiss(notification.id)}
                            className="absolute top-2 right-2 text-zinc-500 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>

                        {/* Content */}
                        <div className="flex items-start gap-3 pr-6">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                ${notification.wasCorrect
                                    ? 'bg-emerald-500/20'
                                    : 'bg-blue-500/20'
                                }
                            `}>
                                {notification.wasCorrect ? (
                                    <Trophy className="text-emerald-400" size={20} />
                                ) : (
                                    <Bell className="text-blue-400" size={20} />
                                )}
                            </div>

                            <div className="flex-1">
                                <p className="text-white font-medium text-sm">
                                    {notification.symbol} Alert
                                </p>
                                <p className="text-zinc-300 text-xs mt-1">
                                    {notification.message}
                                </p>

                                {notification.wasCorrect && (
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingUp size={12} className="text-emerald-400" />
                                        <span className="text-emerald-400 text-xs font-medium">
                                            +{notification.pointsEarned} prediction points
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
