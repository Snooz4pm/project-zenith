/**
 * useHistoryReplay Hook
 * 
 * Manages historical replay with event-based pausing.
 * When replay reaches an event date, it auto-pauses and shows the HistoryPanel.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { MarketEvent, getEventsForAsset, isEventDate } from '@/lib/history/events';
import { AssetType } from '@/lib/market-data/types';

interface UseHistoryReplayProps {
    symbol: string;
    assetType: AssetType;
    candles: Array<{ timestamp: number }>; // OHLCV with timestamp
    isPlaying: boolean;
    currentIndex: number;
    onPause: () => void;
    onResume: () => void;
}

interface HistoryReplayState {
    isHistoryMode: boolean;
    currentEvent: MarketEvent | null;
    events: MarketEvent[];
    seenEventIds: Set<string>;
    currentChapter: number;
    totalChapters: number;
}

export function useHistoryReplay({
    symbol,
    assetType,
    candles,
    isPlaying,
    currentIndex,
    onPause,
    onResume
}: UseHistoryReplayProps) {
    // Get all applicable events for this asset
    const events = useMemo(() =>
        getEventsForAsset(symbol, assetType),
        [symbol, assetType]
    );

    const [state, setState] = useState<HistoryReplayState>({
        isHistoryMode: false,
        currentEvent: null,
        events,
        seenEventIds: new Set(),
        currentChapter: 0,
        totalChapters: events.length
    });

    // Check if current candle is on an event date
    useEffect(() => {
        if (!isPlaying || !candles[currentIndex]) return;
        if (state.currentEvent) return; // Already showing an event

        const timestamp = candles[currentIndex].timestamp;
        const event = isEventDate(timestamp, events);

        if (event && !state.seenEventIds.has(event.id)) {
            // Found new event - pause and show
            onPause();

            const chapterIndex = events.findIndex(e => e.id === event.id);

            setState(prev => ({
                ...prev,
                isHistoryMode: true,
                currentEvent: event,
                currentChapter: chapterIndex + 1,
            }));
        }
    }, [currentIndex, isPlaying, candles, events, state.currentEvent, state.seenEventIds, onPause]);

    // Continue from event
    const continueReplay = useCallback(() => {
        if (!state.currentEvent) return;

        setState(prev => ({
            ...prev,
            isHistoryMode: false,
            currentEvent: null,
            seenEventIds: new Set([...prev.seenEventIds, prev.currentEvent!.id])
        }));

        onResume();
    }, [state.currentEvent, onResume]);

    // Close panel without resuming
    const closePanel = useCallback(() => {
        if (!state.currentEvent) return;

        setState(prev => ({
            ...prev,
            isHistoryMode: false,
            currentEvent: null,
            seenEventIds: new Set([...prev.seenEventIds, prev.currentEvent!.id])
        }));
    }, [state.currentEvent]);

    // Enter history mode manually
    const enterHistoryMode = useCallback(() => {
        setState(prev => ({
            ...prev,
            isHistoryMode: true,
            seenEventIds: new Set() // Reset seen events
        }));
    }, []);

    // Exit history mode
    const exitHistoryMode = useCallback(() => {
        setState(prev => ({
            ...prev,
            isHistoryMode: false,
            currentEvent: null
        }));
    }, []);

    // Reset for new asset
    useEffect(() => {
        setState({
            isHistoryMode: false,
            currentEvent: null,
            events,
            seenEventIds: new Set(),
            currentChapter: 0,
            totalChapters: events.length
        });
    }, [symbol, assetType, events]);

    return {
        // State
        isHistoryMode: state.isHistoryMode,
        currentEvent: state.currentEvent,
        events: state.events,
        currentChapter: state.currentChapter,
        totalChapters: state.totalChapters,

        // Actions
        continueReplay,
        closePanel,
        enterHistoryMode,
        exitHistoryMode,

        // Helpers
        hasEvents: events.length > 0,
        unseenEventsCount: events.length - state.seenEventIds.size
    };
}
