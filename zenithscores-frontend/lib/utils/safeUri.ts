/**
 * URI Sanitizer for Token Metadata
 * 
 * Handles various URI formats (IPFS, HTTP, invalid) safely.
 * Prevents ERR_NAME_NOT_RESOLVED errors from junk URIs.
 */

/**
 * Convert potentially unsafe URIs to safe, renderable URLs
 * @param uri - Raw URI from token metadata
 * @returns Safe URL string or null if invalid
 */
export function safeUri(uri?: string | null): string | null {
    if (!uri || typeof uri !== 'string') {
        return null;
    }

    const trimmed = uri.trim();

    // Skip empty strings
    if (!trimmed) {
        return null;
    }

    // Handle IPFS protocol
    if (trimmed.startsWith('ipfs://')) {
        const hash = trimmed.replace('ipfs://', '');
        return `https://ipfs.io/ipfs/${hash}`;
    }

    // Handle direct IPFS hashes (bafk..., Qm...)
    if (trimmed.startsWith('bafk') || trimmed.startsWith('Qm')) {
        return `https://ipfs.io/ipfs/${trimmed}`;
    }

    // Handle Arweave
    if (trimmed.startsWith('ar://')) {
        const id = trimmed.replace('ar://', '');
        return `https://arweave.net/${id}`;
    }

    // Handle valid HTTP(S) URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    // Handle data URIs
    if (trimmed.startsWith('data:')) {
        return trimmed;
    }

    // Unknown/invalid format - return null
    return null;
}

/**
 * Check if a URI is likely valid for rendering
 */
export function isValidUri(uri?: string | null): boolean {
    return safeUri(uri) !== null;
}

/**
 * Get a fallback image URL for tokens without valid logos
 */
export function getTokenFallbackImage(symbol?: string): string {
    // Simple colored placeholder based on first letter
    const letter = symbol?.charAt(0)?.toUpperCase() || '?';
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23374151"/><text x="50" y="65" text-anchor="middle" font-size="40" fill="white">${letter}</text></svg>`;
}
