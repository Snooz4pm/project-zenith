// useFlowSystem Hook
// Main orchestrator for live market flow polling and analysis

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    FlowRegime,
    FlowMetrics,
    FlowState,
    FlowEvent,
    NormalizedTx,
    TxType,
    FlowSystemState,
    FLOW_CONFIG
} from '@/lib/flow/flow-types';
import { classifyTransaction } from '@/lib/flow/intelligence-analyzer';
import { calculateFlowRegime } from '@/lib/flow/flow-regime';

interface PairData {
    pairAddress: string;
    chainId: string;
    baseToken: { symbol: string };
    txns: {
        m5?: { buys: number; sells: number };
        h1?: { buys: number; sells: number };
    };
    priceChange?: { h1?: number; h24?: number };
    volume?: { m5?: number; h1?: number };
}

export function useFlowSystem(pair: PairData | null): FlowSystemState {
    const [transactions, setTransactions] = useState<NormalizedTx[]>([]);
    const [flowState, setFlowState] = useState<FlowState | null>(null);
    const [flowEvents, setFlowEvents] = useState<FlowEvent[]>([]);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lastTxCountsRef = useRef<{ buys: number; sells: number } | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Generate synthetic transactions from count changes
    const generateTransactions = useCallback((
        pair: PairData,
        prevCounts: { buys: number; sells: number },
        newCounts: { buys: number; sells: number }
    ): Omit<NormalizedTx, 'classification' | 'summary' | 'impact'>[] => {
        const newTxs: Omit<NormalizedTx, 'classification' | 'summary' | 'impact'>[] = [];
        const now = Date.now();

        const newBuys = Math.max(0, newCounts.buys - prevCounts.buys);
        const newSells = Math.max(0, newCounts.sells - prevCounts.sells);

        // Estimate avg size from 5m volume
        const volume5m = pair.volume?.m5 || 10000;
        const totalTx5m = (pair.txns?.m5?.buys || 0) + (pair.txns?.m5?.sells || 0) || 1;
        const avgSize = volume5m / totalTx5m;

        // Generate buy transactions
        for (let i = 0; i < Math.min(newBuys, 5); i++) {
            const variance = 0.5 + Math.random();
            newTxs.push({
                id: `${now}-buy-${i}`,
                timestamp: now - (i * 500),
                type: TxType.BUY,
                sizeUsd: avgSize * variance,
                chainId: pair.chainId,
                pairSymbol: pair.baseToken.symbol
            });
        }

        // Generate sell transactions
        for (let i = 0; i < Math.min(newSells, 5); i++) {
            const variance = 0.5 + Math.random();
            newTxs.push({
                id: `${now}-sell-${i}`,
                timestamp: now - (i * 500),
                type: TxType.SELL,
                sizeUsd: avgSize * variance,
                chainId: pair.chainId,
                pairSymbol: pair.baseToken.symbol
            });
        }

        return newTxs;
    }, []);

    // Poll for new transactions
    const poll = useCallback(async () => {
        if (!pair) return;

        try {
            // Get current counts
            const currentCounts = {
                buys: pair.txns?.m5?.buys || 0,
                sells: pair.txns?.m5?.sells || 0
            };

            // Compare with previous
            if (lastTxCountsRef.current) {
                const rawTxs = generateTransactions(pair, lastTxCountsRef.current, currentCounts);

                if (rawTxs.length > 0) {
                    // Build analysis context
                    const context = {
                        recentTxs: transactions.slice(0, 20),
                        avgSizeUsd: transactions.length > 0
                            ? transactions.reduce((sum, t) => sum + t.sizeUsd, 0) / transactions.length
                            : 5000,
                        priceChange1h: pair.priceChange?.h1 || 0,
                        priceChange24h: pair.priceChange?.h24 || 0,
                        buyCount5m: currentCounts.buys,
                        sellCount5m: currentCounts.sells
                    };

                    // Classify each transaction
                    const classifiedTxs: NormalizedTx[] = rawTxs.map(tx => {
                        const { classification, summary, impact } = classifyTransaction(tx, context);
                        return { ...tx, classification, summary, impact };
                    });

                    // Add to state (newest first, max 50)
                    setTransactions(prev => {
                        const updated = [...classifiedTxs, ...prev].slice(0, FLOW_CONFIG.MAX_TRANSACTIONS);
                        return updated;
                    });
                }
            }

            lastTxCountsRef.current = currentCounts;
            setError(null);
        } catch (err) {
            console.error('Flow poll error:', err);
            setError('Flow polling error');
        }
    }, [pair, transactions, generateTransactions]);

    // Calculate regime after transactions update
    useEffect(() => {
        if (transactions.length === 0) return;

        const { state, newEvents } = calculateFlowRegime(transactions, flowState);
        setFlowState(state);

        if (newEvents.length > 0) {
            setFlowEvents(prev => [...newEvents, ...prev].slice(0, 20));
        }
    }, [transactions]);

    // Start/stop polling
    useEffect(() => {
        if (!pair) {
            setIsPolling(false);
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            return;
        }

        setIsPolling(true);
        poll(); // Initial poll

        pollIntervalRef.current = setInterval(poll, FLOW_CONFIG.POLL_INTERVAL_MS);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [pair?.pairAddress, poll]);

    // Reset on pair change
    useEffect(() => {
        setTransactions([]);
        setFlowEvents([]);
        setFlowState(null);
        lastTxCountsRef.current = null;
    }, [pair?.pairAddress]);

    return {
        transactions,
        regime: flowState?.regime || FlowRegime.QUIET,
        metrics: flowState?.metrics || {
            txFrequency: 0,
            avgSize: 0,
            buyRatio: 0.5,
            velocity: 0,
            whaleActivity: false
        },
        flowEvents,
        isPolling,
        error
    };
}
