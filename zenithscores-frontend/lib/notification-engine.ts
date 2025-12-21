/**
 * 🔔 NOTIFICATION ENGINE
 * Push notifications for 3-hour pulse, alerts, and engagement
 */

export interface NotificationConfig {
    enabled: boolean;
    pulseReminders: boolean;
    arenaUpdates: boolean;
    predictionResults: boolean;
    streakWarnings: boolean;
}

export interface PushNotification {
    id: string;
    type: 'pulse' | 'arena' | 'prediction' | 'streak' | 'achievement' | 'signal';
    title: string;
    body: string;
    icon?: string;
    timestamp: Date;
    read: boolean;
    action?: string;
}

const STORAGE_KEY = 'zenith_notifications';
const CONFIG_KEY = 'zenith_notification_config';

// Default config
export function getDefaultConfig(): NotificationConfig {
    return {
        enabled: true,
        pulseReminders: true,
        arenaUpdates: true,
        predictionResults: true,
        streakWarnings: true,
    };
}

// Load/Save config
export function loadNotificationConfig(): NotificationConfig {
    if (typeof window === 'undefined') return getDefaultConfig();
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : getDefaultConfig();
}

export function saveNotificationConfig(config: NotificationConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// Notification storage
export function loadNotifications(): PushNotification[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
    }));
}

export function saveNotifications(notifications: PushNotification[]): void {
    if (typeof window === 'undefined') return;

    // Deduplicate by ID
    const unique = Array.from(new Map(notifications.map(n => [n.id, n])).values());

    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique.slice(0, 50))); // Keep last 50
}

// Create notifications
export function createNotification(
    type: PushNotification['type'],
    title: string,
    body: string,
    action?: string
): PushNotification {
    return {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        title,
        body,
        timestamp: new Date(),
        read: false,
        action,
    };
}

// Pre-built notification factories
export const NotificationFactory = {
    pulseReady: () => createNotification(
        'pulse',
        '🔥 3-Hour Pulse Ready!',
        'Market mood updated. Check hot assets & your edge now.',
        '/dashboard'
    ),

    streakWarning: (streak: number) => createNotification(
        'streak',
        '⚠️ Streak at Risk!',
        `Your ${streak}-day streak expires soon. Check in now!`,
        '/dashboard'
    ),

    predictionResult: (symbol: string, correct: boolean) => createNotification(
        'prediction',
        correct ? '✅ Prediction Correct!' : '❌ Prediction Missed',
        correct
            ? `Your ${symbol} prediction was correct! +20 XP earned.`
            : `Your ${symbol} prediction expired. Try again!`,
        '/dashboard'
    ),

    arenaUpdate: (rank: number) => createNotification(
        'arena',
        '🏆 Arena Update',
        `You moved to rank #${rank} on the weekly leaderboard!`,
        '/dashboard'
    ),


    achievementUnlocked: (title: string, icon: string) => createNotification(
        'achievement',
        `${icon} Achievement Unlocked!`,
        `You earned "${title}"! View your badges.`,
        '/dashboard'
    ),

    levelUp: (level: number) => createNotification(
        'achievement',
        '🎉 Level Up!',
        `You reached Level ${level}! New rewards unlocked.`,
        '/dashboard'
    ),

    highScoreSignal: (symbol: string, score: number) => createNotification(
        'signal',
        `🚀 High Score Alert: ${symbol}`,
        `${symbol} just hit a Zenith Score of ${score}! This is a strong signal.`,
        '/signals'
    ),
};

// Browser Push Notification (requires permission)
export async function requestPushPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    const result = await Notification.requestPermission();
    return result === 'granted';
}

export function showBrowserNotification(title: string, body: string, icon?: string): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    new Notification(title, {
        body,
        icon: icon || '/icon-192.png',
    });
}

/**
 * Send a high-score signal alert
 * Called when an asset crosses the 80-score threshold
 */
export function sendHighScoreAlert(symbol: string, score: number): void {
    const config = loadNotificationConfig();
    if (!config.enabled) return;

    const notif = NotificationFactory.highScoreSignal(symbol, score);

    // Check for duplicates in last 5 minutes (to avoid spamming same signal)
    const notifications = loadNotifications();
    const isDuplicate = notifications.some(n =>
        n.type === 'signal' &&
        n.title.includes(symbol) &&
        (Date.now() - new Date(n.timestamp).getTime() < 5 * 60 * 1000)
    );

    if (isDuplicate) return;

    notifications.unshift(notif);
    saveNotifications(notifications);

    // Show browser notification if permitted
    showBrowserNotification(
        `🚀 ${symbol} Signal Detected`,
        `Zenith Score: ${score} — Strong trading opportunity!`
    );
}

/**
 * Check if push notifications are supported and enabled
 */
export function isPushSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getPushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!isPushSupported()) return 'unsupported';
    return Notification.permission;
}

// 3-Hour Pulse Scheduler
let pulseTimer: NodeJS.Timeout | null = null;

export function scheduleNextPulseNotification(): void {
    if (typeof window === 'undefined') return;

    // Prevent multiple timers
    if ((window as any).__zenith_pulse_scheduled) return;
    (window as any).__zenith_pulse_scheduled = true;

    if (pulseTimer) clearTimeout(pulseTimer);

    const now = new Date();
    const currentHour = now.getHours();
    const nextPulseHour = Math.ceil((currentHour + 0.001) / 3) * 3;

    const nextPulse = new Date(now);
    nextPulse.setHours(nextPulseHour % 24, 0, 0, 0);
    if (nextPulseHour >= 24) nextPulse.setDate(nextPulse.getDate() + 1);

    const msUntilPulse = nextPulse.getTime() - now.getTime();

    // Schedule notification 5 minutes before pulse
    const notifyAt = msUntilPulse - (5 * 60 * 1000);

    if (notifyAt > 0) {
        pulseTimer = setTimeout(() => {
            (window as any).__zenith_pulse_scheduled = false;
            const config = loadNotificationConfig();
            if (config.enabled && config.pulseReminders) {
                const pulseId = `pulse_${nextPulse.getTime()}`;
                const notifications = loadNotifications();

                // Deduplicate pulse notifications
                if (!notifications.some(n => n.id === pulseId)) {
                    showBrowserNotification('🔥 3-Hour Pulse in 5 mins!', 'Get ready for market insights.');
                    const notif = NotificationFactory.pulseReady();
                    notif.id = pulseId;
                    notifications.unshift(notif);
                    saveNotifications(notifications);
                }
            }

            // Schedule next one
            scheduleNextPulseNotification();
        }, notifyAt);
    } else if (msUntilPulse > 0) {
        // If we are within the 5 minute window, check again in 1 minute
        pulseTimer = setTimeout(() => {
            (window as any).__zenith_pulse_scheduled = false;
            scheduleNextPulseNotification();
        }, 60000);
    }
}
