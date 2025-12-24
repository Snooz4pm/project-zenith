'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UseTrackViewOptions {
    assetType: 'crypto' | 'stocks' | 'forex';
    symbol: string;
    name?: string;
    enabled?: boolean;
}

/**
 * Track asset views for logged-in users (database) and anonymous users (localStorage)
 * Auto-debounces to avoid excessive API calls
 */
export function useTrackView({
    assetType,
    symbol,
    name,
    enabled = true
}: UseTrackViewOptions) {
    const { data: session } = useSession();

    useEffect(() => {
        if (!enabled || !assetType || !symbol) return;

        // Debounce to avoid too many calls
        const timer = setTimeout(() => {
            if (session?.user) {
                // Logged-in: Track in database
                fetch('/api/user/view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assetType, symbol, name })
                }).catch((error) => {
                    // Silent fail - don't break UI if tracking fails
                    console.debug('View tracking failed:', error);
                });
            } else {
                // Anonymous: Track in localStorage
                try {
                    const key = 'zenith_recent_views';
                    const stored = localStorage.getItem(key);
                    const recent = stored ? JSON.parse(stored) : [];

                    // Add or update this view
                    const existing = recent.findIndex(
                        (item: any) => item.assetType === assetType && item.symbol === symbol
                    );

                    const viewData = {
                        assetType,
                        symbol,
                        name,
                        lastViewed: new Date().toISOString(),
                        count: 1
                    };

                    if (existing >= 0) {
                        recent[existing] = {
                            ...recent[existing],
                            lastViewed: viewData.lastViewed,
                            count: recent[existing].count + 1
                        };
                    } else {
                        recent.unshift(viewData);
                    }

                    // Keep only last 20 views
                    const trimmed = recent.slice(0, 20);
                    localStorage.setItem(key, JSON.stringify(trimmed));
                } catch (error) {
                    console.debug('localStorage tracking failed:', error);
                }
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [assetType, symbol, name, enabled, session]);
}

/**
 * Get recently viewed assets (works for both logged-in and anonymous users)
 */
export async function getRecentlyViewed(limit: number = 10): Promise<any[]> {
    try {
        // Try fetching from API (logged-in users)
        const response = await fetch(`/api/user/recently-viewed?limit=${limit}`);
        if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                return data.items;
            }
        }

        // Fallback to localStorage (anonymous users)
        const stored = localStorage.getItem('zenith_recent_views');
        if (stored) {
            const recent = JSON.parse(stored);
            return recent.slice(0, limit);
        }

        return [];
    } catch (error) {
        console.debug('Failed to get recently viewed:', error);
        return [];
    }
}
