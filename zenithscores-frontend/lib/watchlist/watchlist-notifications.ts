'use client';

/**
 * Watchlist Notification Engine
 * Tracks saved assets and notifies users on significant price movements
 */

export interface WatchlistItem {
    userId: string;
    assetId: string;
    symbol: string;
    assetType: 'stock' | 'crypto' | 'forex' | 'commodity';
    addedAt: Date;
    lastPrice: number;
    threshold: number; // Default 0.5%
    notificationsEnabled: boolean;
}

export interface PriceMovement {
    symbol: string;
    previousPrice: number;
    currentPrice: number;
    change: number;
    changePercent: number;
    direction: 'up' | 'down';
    timestamp: Date;
}

export interface WatchlistNotification {
    id: string;
    userId: string;
    assetId: string;
    symbol: string;
    type: 'price_alert' | 'significant_move' | 'target_reached';
    message: string;
    movement: PriceMovement;
    read: boolean;
    createdAt: Date;
}

// Store notifications in memory (would be database in production)
const pendingNotifications: Map<string, WatchlistNotification[]> = new Map();

/**
 * Check if asset has moved beyond threshold
 */
export function checkPriceThreshold(
    previousPrice: number,
    currentPrice: number,
    threshold: number = 0.5
): PriceMovement | null {
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;

    if (Math.abs(changePercent) >= threshold) {
        return {
            symbol: '', // Will be filled by caller
            previousPrice,
            currentPrice,
            change,
            changePercent,
            direction: change > 0 ? 'up' : 'down',
            timestamp: new Date()
        };
    }

    return null;
}

/**
 * Generate notification message for price movement
 */
export function generateNotificationMessage(
    symbol: string,
    movement: PriceMovement,
    timeframeDays: number = 1
): string {
    const direction = movement.direction === 'up' ? 'gained' : 'lost';
    const emoji = movement.direction === 'up' ? '📈' : '📉';
    const absPercent = Math.abs(movement.changePercent).toFixed(2);

    let timeframe = 'today';
    if (timeframeDays === 4) {
        timeframe = 'in the last 4 days';
    } else if (timeframeDays === 7) {
        timeframe = 'this week';
    } else if (timeframeDays > 1) {
        timeframe = `in the last ${timeframeDays} days`;
    }

    return `${emoji} Your saved ${symbol} ${direction} ${absPercent}% ${timeframe}`;
}

/**
 * Create a watchlist notification
 */
export function createWatchlistNotification(
    userId: string,
    item: WatchlistItem,
    movement: PriceMovement,
    type: WatchlistNotification['type'] = 'price_alert'
): WatchlistNotification {
    const notification: WatchlistNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        assetId: item.assetId,
        symbol: item.symbol,
        type,
        message: generateNotificationMessage(item.symbol, movement, 4),
        movement: { ...movement, symbol: item.symbol },
        read: false,
        createdAt: new Date()
    };

    // Store notification
    const userNotifications = pendingNotifications.get(userId) || [];
    userNotifications.push(notification);
    pendingNotifications.set(userId, userNotifications);

    return notification;
}

/**
 * Check watchlist for movements and generate notifications
 */
export async function notifyOnWatchlistMovement(
    userId: string,
    assetId: string,
    currentPrice: number,
    item: WatchlistItem
): Promise<WatchlistNotification | null> {
    if (!item.notificationsEnabled) {
        return null;
    }

    const movement = checkPriceThreshold(item.lastPrice, currentPrice, item.threshold);

    if (movement) {
        return createWatchlistNotification(userId, item, movement);
    }

    return null;
}

/**
 * Get pending notifications for a user
 */
export function getPendingNotifications(userId: string): WatchlistNotification[] {
    return pendingNotifications.get(userId) || [];
}

/**
 * Mark notification as read
 */
export function markNotificationRead(userId: string, notificationId: string): boolean {
    const userNotifications = pendingNotifications.get(userId);
    if (!userNotifications) return false;

    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        return true;
    }

    return false;
}

/**
 * Clear all read notifications for a user
 */
export function clearReadNotifications(userId: string): number {
    const userNotifications = pendingNotifications.get(userId);
    if (!userNotifications) return 0;

    const unread = userNotifications.filter(n => !n.read);
    const cleared = userNotifications.length - unread.length;
    pendingNotifications.set(userId, unread);

    return cleared;
}

/**
 * Enable notifications for a watchlist item
 */
export async function enableNotifications(
    userId: string,
    assetId: string,
    threshold: number = 0.5
): Promise<{ enabled: boolean; threshold: number }> {
    // In production, this would update the database
    console.log(`Enabling notifications for user ${userId}, asset ${assetId} at ${threshold}% threshold`);

    return {
        enabled: true,
        threshold
    };
}
