/**
 * AlphaCandidate - Minimal AlphaScan token shape
 *
 * AlphaScan is ONLY a candidate generator.
 * We trust NOTHING except the mint address.
 *
 * Everything else (names, logos, ROI) is ignored.
 */

export type AlphaCandidate = {
    mint: string;
    source: 'alphascan';
    discoveredAt: number; // timestamp
};

/**
 * AlphaScan raw response shape (we only care about mint)
 */
export type AlphaScanRawToken = {
    address?: string;
    mint?: string;
    // We ignore everything else intentionally
};