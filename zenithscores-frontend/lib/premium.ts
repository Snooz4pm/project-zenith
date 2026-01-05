/**
 * 🆓 FREE ACCESS UTILITIES
 * All features are now free - no premium restrictions
 * These functions are kept for backwards compatibility
 */

/**
 * Check if the user has accepted the latest legal terms
 */
export function hasAcceptedTerms(): boolean {
    if (typeof window === 'undefined') return false;
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
 * Check if current user has premium access
 * @returns Always true - all features are free
 */
export function isPremiumUser(): boolean {
    // All features are free now
    return true;
}

/**
 * Get days remaining on premium
 * @returns Always returns high number - no expiration
 */
export function getPremiumDaysRemaining(): number {
    return 999;
}

/**
 * Activate premium - no-op, always succeeds
 */
export function activatePremium(code: string): boolean {
    return true;
}

/**
 * Revoke premium - no-op
 */
export function revokePremium(): void {
    // No-op - premium is always active
}

/**
 * Save premium status - no-op
 */
export function savePremiumStatus(isPremium: boolean): void {
    // No-op - premium is always active
}

/**
 * Get premium details
 */
export function getPremiumDetails(): { isActive: boolean; code?: string; activatedAt?: string } {
    return { isActive: true };
}

// Constants for display (kept for backwards compatibility)
export const PREMIUM_PRICE = 'Free';
export const PREMIUM_PERIOD = '';
export const FREE_STOCK_LIMIT = Infinity;
