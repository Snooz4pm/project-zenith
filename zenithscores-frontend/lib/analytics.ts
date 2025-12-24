/**
 * ZenithScore Analytics Library
 * Tracks user events for conversion optimization
 */

// Event types for tracking
export type AnalyticsEvent =
    // Conversion funnel events
    | 'page_view'
    | 'lock_impression'
    | 'lock_clicked'
    | 'login_modal_opened'
    | 'login_started'
    | 'login_completed'
    | 'signup_started'
    | 'signup_completed'
    // Calibration events
    | 'calibration_started'
    | 'calibration_step_completed'
    | 'calibration_completed'
    | 'calibration_abandoned'
    // Engagement events
    | 'asset_viewed'
    | 'signal_clicked'
    | 'trade_started'
    | 'trade_completed'
    // Personalization events
    | 'personalized_content_viewed'
    | 'generic_content_viewed';

interface EventMetadata {
    page?: string;
    feature?: string;
    assetType?: string;
    symbol?: string;
    step?: number;
    totalSteps?: number;
    value?: string | number;
    source?: string;
    [key: string]: any;
}

// Store for tracking session data
let sessionId: string | null = null;
let userId: string | null = null;
let isInitialized = false;

/**
 * Initialize analytics with user/session context
 */
export function initAnalytics(options?: { userId?: string }) {
    if (isInitialized) return;

    // Generate or get session ID
    if (typeof window !== 'undefined') {
        sessionId = sessionStorage.getItem('zenith_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('zenith_session_id', sessionId);
        }
    }

    if (options?.userId) {
        userId = options.userId;
    }

    isInitialized = true;
    console.debug('[Analytics] Initialized', { sessionId, userId });
}

/**
 * Track an analytics event
 */
export function trackEvent(event: AnalyticsEvent, metadata?: EventMetadata) {
    if (typeof window === 'undefined') return;

    // Auto-initialize if needed
    if (!isInitialized) {
        initAnalytics();
    }

    const eventData = {
        event,
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        referrer: document.referrer,
        ...metadata
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.debug('[Analytics]', event, metadata);
    }

    // Store event locally for batch sending
    storeEvent(eventData);

    // Send to backend (debounced)
    debouncedSendEvents();
}

// Local event storage
const EVENT_STORAGE_KEY = 'zenith_analytics_events';
const MAX_STORED_EVENTS = 100;

function storeEvent(event: any) {
    try {
        const stored = JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY) || '[]');
        stored.push(event);

        // Keep only last N events
        if (stored.length > MAX_STORED_EVENTS) {
            stored.splice(0, stored.length - MAX_STORED_EVENTS);
        }

        localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
        // Storage full or unavailable
        console.debug('[Analytics] Storage error:', e);
    }
}

// Debounced batch sending
let sendTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSendEvents() {
    if (sendTimeout) clearTimeout(sendTimeout);

    sendTimeout = setTimeout(() => {
        sendStoredEvents();
    }, 5000); // Send after 5 seconds of inactivity
}

async function sendStoredEvents() {
    try {
        const events = JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY) || '[]');
        if (events.length === 0) return;

        // Send to API (fire and forget, non-blocking)
        fetch('/api/analytics/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
            keepalive: true // Ensure request completes even on page unload
        }).then(response => {
            if (response.ok) {
                // Clear sent events
                localStorage.removeItem(EVENT_STORAGE_KEY);
            }
        }).catch(() => {
            // Silent fail - events will be retried next time
        });
    } catch (e) {
        // Silent fail
    }
}

// Conversion funnel tracking helpers
export const ConversionTracking = {
    /**
     * Track when a personalization lock is shown
     */
    lockImpression: (feature: string, page: string) => {
        trackEvent('lock_impression', { feature, page });
    },

    /**
     * Track when a user clicks on a locked feature
     */
    lockClicked: (feature: string, page: string) => {
        trackEvent('lock_clicked', { feature, page });
    },

    /**
     * Track login modal opening
     */
    loginModalOpened: (source: string) => {
        trackEvent('login_modal_opened', { source });
    },

    /**
     * Track successful login
     */
    loginCompleted: (method: 'google' | 'credentials') => {
        trackEvent('login_completed', { method });
    },

    /**
     * Track calibration progress
     */
    calibrationProgress: (step: number, totalSteps: number) => {
        trackEvent('calibration_step_completed', { step, totalSteps });
    },

    /**
     * Track calibration completion
     */
    calibrationCompleted: (archetype: string) => {
        trackEvent('calibration_completed', { archetype });
    }
};

/**
 * React hook for tracking page views
 */
export function usePageViewTracking(pageName: string) {
    if (typeof window === 'undefined') return;

    // Track on mount only
    trackEvent('page_view', { page: pageName });
}

// Send events on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        sendStoredEvents();
    });

    // Also send when visibility changes (user navigates away)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sendStoredEvents();
        }
    });
}
