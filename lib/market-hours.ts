/**
 * Market Hours Utility
 * Determines if various markets are currently open for trading
 */

// Get current time in Eastern Time (NYSE timezone)
function getEasternTime(): Date {
    const now = new Date();
    const etOffset = -5; // EST (adjust for DST if needed)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * etOffset));
}

/**
 * Check if Forex market is open
 * Forex: Sunday 5PM ET → Friday 5PM ET (24/5)
 */
export function isForexOpen(): boolean {
    const et = getEasternTime();
    const day = et.getDay();
    const hour = et.getHours();

    // Closed Saturday all day
    if (day === 6) return false;

    // Closed Sunday before 5PM
    if (day === 0 && hour < 17) return false;

    // Closed Friday after 5PM
    if (day === 5 && hour >= 17) return false;

    return true;
}

/**
 * Check if US Stock Market is open
 * NYSE/NASDAQ: Mon-Fri 9:30 AM - 4:00 PM ET
 */
export function isStockMarketOpen(): boolean {
    const et = getEasternTime();
    const day = et.getDay();
    const hour = et.getHours();
    const minute = et.getMinutes();

    // Weekends closed
    if (day === 0 || day === 6) return false;

    // Before 9:30 AM
    if (hour < 9 || (hour === 9 && minute < 30)) return false;

    // After 4:00 PM
    if (hour >= 16) return false;

    return true;
}

/**
 * Check if Crypto markets are open
 * Crypto: 24/7/365
 */
export function isCryptoOpen(): boolean {
    return true;
}

/**
 * Check if Commodities market is open
 * CME Globex: Sunday 5PM - Friday 4PM CT (roughly)
 */
export function isCommoditiesOpen(): boolean {
    const et = getEasternTime();
    const day = et.getDay();
    const hour = et.getHours();

    // Saturday closed
    if (day === 6) return false;

    // Sunday before 6PM ET closed
    if (day === 0 && hour < 18) return false;

    // Friday after 5PM ET closed
    if (day === 5 && hour >= 17) return false;

    return true;
}

/**
 * Get market status for an asset type
 */
export function getMarketStatus(assetType: string): { isOpen: boolean; label: string; color: string } {
    let isOpen = false;

    switch (assetType.toLowerCase()) {
        case 'crypto':
            isOpen = isCryptoOpen();
            break;
        case 'stock':
        case 'stocks':
            isOpen = isStockMarketOpen();
            break;
        case 'forex':
            isOpen = isForexOpen();
            break;
        case 'commodity':
        case 'commodities':
            isOpen = isCommoditiesOpen();
            break;
        default:
            isOpen = false;
    }

    return {
        isOpen,
        label: isOpen ? 'LIVE' : 'CLOSED',
        color: isOpen ? 'text-emerald-400' : 'text-gray-500'
    };
}

/**
 * Get time until next market open/close
 */
export function getNextMarketEvent(assetType: string): string {
    const status = getMarketStatus(assetType);

    if (assetType === 'crypto') {
        return 'Always Open';
    }

    if (status.isOpen) {
        return 'Closes Soon';
    }

    return 'Opens Soon';
}
