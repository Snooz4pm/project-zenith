
/**
 * BEHAVIOR TRACKER
 * 
 * Responsible for tracking user actions in real-time (client-side) 
 * and syncing critical metrics to the server for Gate evaluation.
 */

export interface TrackingEvent {
    type: 'switched_asset' | 'attempted_trade' | 'closed_trade' | 'page_view';
    asset?: string;
    timestamp: number;
    metadata?: any;
}

export class BehaviorTracker {
    private events: TrackingEvent[] = [];
    private readonly WINDOW_MS = 2 * 60 * 1000; // 2 minutes for rapid switching
    private readonly SESSION_START = Date.now();

    public log(event: TrackingEvent) {
        this.events.push(event);
        this.prune();
    }

    private prune() {
        const cutoff = Date.now() - (60 * 60 * 1000); // Keep 1 hour of history in memory
        this.events = this.events.filter(e => e.timestamp > cutoff);
    }

    // --- Metrics for Engine ---

    public getSwitchesLast2Min(): number {
        const now = Date.now();
        const twoMinsAgo = now - (2 * 60 * 1000);
        return this.events.filter(e =>
            e.type === 'switched_asset' &&
            e.timestamp > twoMinsAgo
        ).length;
    }

    public getTradesLastHour(): number {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        return this.events.filter(e =>
            e.type === 'attempted_trade' &&
            e.timestamp > oneHourAgo
        ).length;
    }

    public getSessionDurationMinutes(): number {
        return Math.floor((Date.now() - this.SESSION_START) / 60000);
    }
}

// Singleton instance for client-side usage
export const tracker = new BehaviorTracker();
