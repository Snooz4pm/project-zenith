'use client';

import { useEffect, useRef } from 'react';
import { NormalizedTx, TxType, TxClassification } from '@/lib/flow/flow-types';

interface LiveMarketFlowProps {
    transactions: NormalizedTx[];
    isPolling: boolean;
}

export default function LiveMarketFlow({ transactions, isPolling }: LiveMarketFlowProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Live Market Flow
                </h3>
                <div className="flex items-center gap-1.5">
                    {isPolling && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span className="text-[9px] text-zinc-600">
                        {transactions.length} tx
                    </span>
                </div>
            </div>

            {/* Transaction List */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto px-2 py-1 space-y-1"
            >
                {transactions.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                        Waiting for transactions...
                    </div>
                ) : (
                    transactions.map((tx, index) => (
                        <TransactionItem
                            key={tx.id}
                            tx={tx}
                            isNew={index === 0}
                            fadeLevel={Math.min(index / 10, 1)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// =============================================================================
// TRANSACTION ITEM
// =============================================================================

interface TransactionItemProps {
    tx: NormalizedTx;
    isNew: boolean;
    fadeLevel: number;
}

function TransactionItem({ tx, isNew, fadeLevel }: TransactionItemProps) {
    const isBuy = tx.type === TxType.BUY;
    const opacity = 1 - (fadeLevel * 0.6);

    return (
        <div
            className={`
                px-2 py-1.5 rounded-md transition-all duration-300
                ${isNew ? 'animate-pulse-once bg-white/[0.03]' : 'bg-transparent'}
            `}
            style={{ opacity }}
        >
            {/* Row 1: Time + Type + Size */}
            <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-600">
                        [{formatTime(tx.timestamp)}]
                    </span>
                    <span className={`text-[10px] font-bold ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type}
                    </span>
                    <span className="text-[11px] font-mono text-white">
                        {formatSize(tx.sizeUsd)}
                    </span>
                </div>
                <ClassificationBadge classification={tx.classification} />
            </div>

            {/* Row 2: Chain + Symbol */}
            <div className="text-[9px] text-zinc-500 mb-0.5">
                {tx.chainId.toUpperCase()} / {tx.pairSymbol}
            </div>

            {/* Row 3: Summary */}
            <div className="text-[10px] text-zinc-400 italic mb-1">
                "{tx.summary}"
            </div>

            {/* Row 4: Impact Bar */}
            <ImpactBar impact={tx.impact} isBuy={isBuy} />
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ClassificationBadge({ classification }: { classification: TxClassification }) {
    const config = getClassificationConfig(classification);
    if (classification === TxClassification.NORMAL) return null;

    return (
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${config.color}`}>
            {config.label}
        </span>
    );
}

function ImpactBar({ impact, isBuy }: { impact: number; isBuy: boolean }) {
    const filled = Math.round(impact / 10);
    const empty = 10 - filled;
    const color = isBuy ? 'text-emerald-500' : 'text-red-500';

    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-600">Impact</span>
            <span className={`text-[10px] font-mono ${color}`}>
                {'▓'.repeat(filled)}{'░'.repeat(empty)}
            </span>
            <span className="text-[9px] text-zinc-500">{impact}</span>
        </div>
    );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatSize(usd: number): string {
    if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
    if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}k`;
    return `$${usd.toFixed(0)}`;
}

function getClassificationConfig(c: TxClassification): { label: string; color: string } {
    switch (c) {
        case TxClassification.WHALE_MOVE:
            return { label: 'Whale', color: 'bg-blue-500/20 text-blue-400' };
        case TxClassification.NEW_WALLET:
            return { label: 'New', color: 'bg-purple-500/20 text-purple-400' };
        case TxClassification.BOT_LIKE:
            return { label: 'Bot', color: 'bg-orange-500/20 text-orange-400' };
        case TxClassification.DIP_BUY:
            return { label: 'Dip', color: 'bg-cyan-500/20 text-cyan-400' };
        case TxClassification.SELL_PRESSURE:
            return { label: 'Pressure', color: 'bg-red-500/20 text-red-400' };
        case TxClassification.ACCUMULATION:
            return { label: 'Accum', color: 'bg-emerald-500/20 text-emerald-400' };
        case TxClassification.DISTRIBUTION:
            return { label: 'Distrib', color: 'bg-amber-500/20 text-amber-400' };
        default:
            return { label: '', color: '' };
    }
}
