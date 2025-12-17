/**
 * 💰 PREMIUM ACCESS UTILITIES
 * Simple localStorage-based premium system with legal guardrails
 */

const PREMIUM_DURATION_DAYS = 30;

// Valid premium activation codes
const PREMIUM_CODES = [
    'ZENITH-2024-UNLOCK',
    'ZENITH-PRO-ACCESS',
    'ZENITH-BETA-VIP',
];

/**
 * Check if the user has accepted the latest legal terms
 */
export function hasAcceptedTerms(): boolean {
    if (typeof window === 'undefined') return false;
    // We can version this: '2024-12-16'
    return localStorage.getItem('zenith_terms_accepted') === 'true';
}

/**
 * Accept the legal terms
 */
export function acceptTerms(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('zenith_terms_accepted', 'true');
    localStorage.setItem('zenith_terms_accepted_at', new Date().toISOString());
}

/**
 * Check if current user has active premium access
 */
export function isPremiumUser(): boolean {
    if (typeof window === 'undefined') return false;

    const isPremium = localStorage.getItem('zenith_premium_user') === 'true';
    if (!isPremium) return false;

    // Check expiration
    const activatedAt = localStorage.getItem('zenith_premium_activated_at');
    if (activatedAt) {
        const activationDate = new Date(activatedAt);
        const now = new Date();
        const diffInDays = (now.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffInDays > PREMIUM_DURATION_DAYS) {
            // Subscription expired
            revokePremium();
            return false;
        }
    }

    return true;
}

/**
 * Get days remaining on premium
 */
export function getPremiumDaysRemaining(): number {
    if (typeof window === 'undefined') return 0;
    const activatedAt = localStorage.getItem('zenith_premium_activated_at');
    if (!activatedAt) return 0;

    const activationDate = new Date(activatedAt);
    const expirationDate = new Date(activationDate);
    expirationDate.setDate(activationDate.getDate() + PREMIUM_DURATION_DAYS);

    const now = new Date();
    const diffInMs = expirationDate.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffInDays);
}

/**
 * Activate premium with an access code
 */
export function activatePremium(code: string): boolean {
    if (PREMIUM_CODES.includes(code.toUpperCase().trim())) {
        localStorage.setItem('zenith_premium_user', 'true');
        localStorage.setItem('zenith_premium_code', code.toUpperCase().trim());
        localStorage.setItem('zenith_premium_activated_at', new Date().toISOString());
        return true;
    }
    return false;
}

/**
 * Revoke premium access (for testing/admin)
 */
export function revokePremium(): void {
    localStorage.removeItem('zenith_premium_user');
    localStorage.removeItem('zenith_premium_code');
    localStorage.removeItem('zenith_premium_activated_at');
}

/**
 * Directly save premium status (for PayPal integration)
 */
export function savePremiumStatus(isPremium: boolean): void {
    if (typeof window === 'undefined') return;
    if (isPremium) {
        localStorage.setItem('zenith_premium_user', 'true');
        localStorage.setItem('zenith_premium_activated_at', new Date().toISOString());
    } else {
        revokePremium();
    }
}

/**
 * Get premium details
 */
export function getPremiumDetails(): { isActive: boolean; code?: string; activatedAt?: string } {
    if (typeof window === 'undefined') return { isActive: false };

    const isActive = localStorage.getItem('zenith_premium_user') === 'true';
    const code = localStorage.getItem('zenith_premium_code') || undefined;
    const activatedAt = localStorage.getItem('zenith_premium_activated_at') || undefined;

    return { isActive, code, activatedAt };
}

// Constants for display
export const PREMIUM_PRICE = '$19.99';
export const PREMIUM_PERIOD = '/month';
export const FREE_STOCK_LIMIT = 10;
