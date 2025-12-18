'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://defioracleworkerapi.vercel.app';

interface WatchlistItem {
    symbol: string;
    asset_type: 'crypto' | 'stock' | 'forex';
    name?: string;
    added_at?: string;
}

export function useWatchlist() {
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [synced, setSynced] = useState(false);

    // Get session ID
    const getSessionId = () => {
        if (typeof window === 'undefined') return 'demo-user';
        return localStorage.getItem('zenith_session_id') || 'demo-user';
    };

    // Load watchlist on mount
    useEffect(() => {
        loadWatchlist();
    }, []);

    // Load from server, fallback to localStorage
    const loadWatchlist = useCallback(async () => {
        const sessionId = getSessionId();

        // First load from localStorage for instant display
        const localWatchlist = localStorage.getItem('zenith_watchlist');
        if (localWatchlist) {
            try {
                const parsed = JSON.parse(localWatchlist);
                setWatchlist(new Set(parsed));
            } catch (e) {
                console.error('Failed to parse local watchlist:', e);
            }
        }

        // Then sync with server
        if (sessionId !== 'demo-user') {
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/api/v1/watchlist/${sessionId}`);
                const data = await res.json();

                if (data.status === 'success' && data.data?.length > 0) {
                    const serverSymbols: Set<string> = new Set(data.data.map((item: WatchlistItem) => item.symbol));
                    setWatchlist(serverSymbols);
                    localStorage.setItem('zenith_watchlist', JSON.stringify(Array.from(serverSymbols)));
                    setSynced(true);
                }
            } catch (e) {
                console.error('Failed to load server watchlist:', e);
            } finally {
                setLoading(false);
            }
        }
    }, []);

    // Add to watchlist
    const addToWatchlist = useCallback(async (symbol: string, assetType: 'crypto' | 'stock' | 'forex' = 'crypto', name?: string) => {
        const sessionId = getSessionId();

        // Optimistic update
        setWatchlist(prev => {
            const newSet = new Set(prev);
            newSet.add(symbol);
            localStorage.setItem('zenith_watchlist', JSON.stringify(Array.from(newSet)));
            return newSet;
        });

        // Sync to server
        if (sessionId !== 'demo-user') {
            try {
                await fetch(`${API_URL}/api/v1/watchlist/${sessionId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol, asset_type: assetType, name })
                });
            } catch (e) {
                console.error('Failed to sync add to server:', e);
            }
        }
    }, []);

    // Remove from watchlist
    const removeFromWatchlist = useCallback(async (symbol: string) => {
        const sessionId = getSessionId();

        // Optimistic update
        setWatchlist(prev => {
            const newSet = new Set(prev);
            newSet.delete(symbol);
            localStorage.setItem('zenith_watchlist', JSON.stringify(Array.from(newSet)));
            return newSet;
        });

        // Sync to server
        if (sessionId !== 'demo-user') {
            try {
                await fetch(`${API_URL}/api/v1/watchlist/${sessionId}/${encodeURIComponent(symbol)}`, {
                    method: 'DELETE'
                });
            } catch (e) {
                console.error('Failed to sync remove to server:', e);
            }
        }
    }, []);

    // Toggle watchlist
    const toggleWatchlist = useCallback(async (symbol: string, assetType: 'crypto' | 'stock' | 'forex' = 'crypto', name?: string) => {
        if (watchlist.has(symbol)) {
            await removeFromWatchlist(symbol);
        } else {
            await addToWatchlist(symbol, assetType, name);
        }
    }, [watchlist, addToWatchlist, removeFromWatchlist]);

    // Check if in watchlist
    const isInWatchlist = useCallback((symbol: string) => {
        return watchlist.has(symbol);
    }, [watchlist]);

    // Sync local to server (for migration)
    const syncToServer = useCallback(async () => {
        const sessionId = getSessionId();
        if (sessionId === 'demo-user' || watchlist.size === 0) return;

        try {
            setLoading(true);
            await fetch(`${API_URL}/api/v1/watchlist/${sessionId}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Array.from(watchlist))
            });
            setSynced(true);
        } catch (e) {
            console.error('Failed to sync to server:', e);
        } finally {
            setLoading(false);
        }
    }, [watchlist]);

    return {
        watchlist,
        watchlistArray: Array.from(watchlist),
        watchlistSize: watchlist.size,
        loading,
        synced,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        isInWatchlist,
        syncToServer,
        refresh: loadWatchlist
    };
}
