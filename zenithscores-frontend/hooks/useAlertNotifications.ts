/**
 * useAlertNotifications Hook
 * 
 * Periodically checks if any alerts have been triggered
 * and shows toast notifications
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TriggeredAlert {
    id: string;
    symbol: string;
    targetPrice: number;
    triggeredPrice: number;
    wasCorrect: boolean | null;
    pointsEarned: number;
}

interface AlertNotification {
    id: string;
    symbol: string;
    message: string;
    wasCorrect: boolean | null;
    pointsEarned: number;
    timestamp: number;
}

interface PriceData {
    symbol: string;
    price: number;
}

export function useAlertNotifications(
    watchedPrices: PriceData[] = [],
    checkInterval: number = 30000 // 30 seconds
) {
    const [notifications, setNotifications] = useState<AlertNotification[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const lastCheckRef = useRef<number>(0);

    const checkAlerts = useCallback(async () => {
        if (watchedPrices.length === 0) return;
        if (Date.now() - lastCheckRef.current < 5000) return; // Debounce

        lastCheckRef.current = Date.now();
        setIsChecking(true);

        try {
            const res = await fetch('/api/alerts/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prices: watchedPrices })
            });

            if (!res.ok) return;

            const data = await res.json();
            const triggered: TriggeredAlert[] = data.triggered || [];

            if (triggered.length > 0) {
                const newNotifications: AlertNotification[] = triggered.map(alert => ({
                    id: alert.id,
                    symbol: alert.symbol,
                    message: alert.wasCorrect
                        ? `🎯 ${alert.symbol} hit $${alert.triggeredPrice.toFixed(2)} - You were RIGHT! +${alert.pointsEarned} pts`
                        : `🔔 ${alert.symbol} hit your target at $${alert.triggeredPrice.toFixed(2)}`,
                    wasCorrect: alert.wasCorrect,
                    pointsEarned: alert.pointsEarned,
                    timestamp: Date.now()
                }));

                setNotifications(prev => [...newNotifications, ...prev].slice(0, 10));

                // Also show browser notification if permitted
                if ('Notification' in window && Notification.permission === 'granted') {
                    for (const n of newNotifications) {
                        new Notification(`${n.symbol} Alert Triggered!`, {
                            body: n.message,
                            icon: '/icon.png'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to check alerts:', error);
        } finally {
            setIsChecking(false);
        }
    }, [watchedPrices]);

    // Initial permission request
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Periodic check
    useEffect(() => {
        const interval = setInterval(checkAlerts, checkInterval);
        return () => clearInterval(interval);
    }, [checkAlerts, checkInterval]);

    // Dismiss notification
    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        isChecking,
        checkAlerts,
        dismissNotification,
        clearAll
    };
}
