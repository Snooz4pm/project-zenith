// Data Refresh Manager - Controls polling intervals based on market status
// Slower updates when markets are closed to save resources

interface RefreshConfig {
    crypto: number;   // milliseconds
    forex: number;
    stock: number;
}

export class DataRefreshManager {
    private static instance: DataRefreshManager;

    // Base refresh intervals (when market is open)
    private baseIntervals: RefreshConfig = {
        crypto: 2000,  // 2 seconds (crypto is 24/7)
        forex: 3000,   // 3 seconds
        stock: 5000,   // 5 seconds
    };

    // Slower intervals when market is closed
    private closedIntervals: RefreshConfig = {
        crypto: 2000,   // Same (always open)
        forex: 10000,   // 10 seconds
        stock: 30000,   // 30 seconds
    };

    private lastUpdateTimestamps = new Map<string, number>();
    private staleThreshold = 60000; // 1 minute

    private constructor() { }

    static getInstance(): DataRefreshManager {
        if (!DataRefreshManager.instance) {
            DataRefreshManager.instance = new DataRefreshManager();
        }
        return DataRefreshManager.instance;
    }

    /**
     * Get refresh interval based on asset type and market status
     */
    getRefreshInterval(assetType: 'crypto' | 'forex' | 'stock', isMarketOpen: boolean): number {
        if (assetType === 'crypto') {
            return this.baseIntervals.crypto;
        }

        return isMarketOpen
            ? this.baseIntervals[assetType]
            : this.closedIntervals[assetType];
    }

    /**
     * Check if data should be refreshed
     */
    shouldRefresh(symbol: string, assetType: 'crypto' | 'forex' | 'stock', isMarketOpen: boolean): boolean {
        const lastUpdate = this.lastUpdateTimestamps.get(symbol);
        const now = Date.now();

        if (!lastUpdate) return true;

        const interval = this.getRefreshInterval(assetType, isMarketOpen);
        return now - lastUpdate >= interval;
    }

    /**
     * Mark asset as updated
     */
    markAsUpdated(symbol: string): void {
        this.lastUpdateTimestamps.set(symbol, Date.now());
    }

    /**
     * Check if data is stale
     */
    isDataStale(symbol: string): boolean {
        const lastUpdate = this.lastUpdateTimestamps.get(symbol);
        if (!lastUpdate) return true;

        return Date.now() - lastUpdate > this.staleThreshold;
    }

    /**
     * Clear update timestamp for symbol
     */
    clearTimestamp(symbol: string): void {
        this.lastUpdateTimestamps.delete(symbol);
    }

    /**
     * Get last update time
     */
    getLastUpdateTime(symbol: string): Date | null {
        const timestamp = this.lastUpdateTimestamps.get(symbol);
        return timestamp ? new Date(timestamp) : null;
    }

    /**
     * Get time since last update in seconds
     */
    getTimeSinceUpdate(symbol: string): number | null {
        const lastUpdate = this.lastUpdateTimestamps.get(symbol);
        if (!lastUpdate) return null;

        return Math.floor((Date.now() - lastUpdate) / 1000);
    }
}

// Export singleton instance
export const dataRefreshManager = DataRefreshManager.getInstance();
