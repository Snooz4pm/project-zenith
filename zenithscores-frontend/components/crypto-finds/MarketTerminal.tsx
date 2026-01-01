'use client';

import { useEffect, useState } from 'react';
import MarketHeader from './MarketHeader';
import MarketLog from './MarketLog';
import LiveMarketFlow from './LiveMarketFlow';
import { getPairCandles, getMarketLog } from '@/lib/actions/crypto-finds';
import { useFlowSystem } from '@/hooks/useFlowSystem';
import { FlowEvent } from '@/lib/flow/flow-types';

interface MarketTerminalProps {
    pair: {
        pairAddress: string;
        chainId: string;
        baseToken: { symbol: string; name: string };
        quoteToken: { symbol: string };
        priceUsd: number;
        priceChange: { h1?: number; h24?: number };
        volume: { h1?: number; h24?: number; m5?: number };
        liquidity: { usd?: number };
        txns?: {
            m5?: { buys: number; sells: number };
            h1?: { buys: number; sells: number };
        };
        url: string;
    } | null;
}

export default function MarketTerminal({ pair }: MarketTerminalProps) {
    const [chartUrl, setChartUrl] = useState<string | null>(null);
    const [logs, setLogs] = useState<{ time: string; type: string; message: string }[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Flow System Integration
    const { transactions, regime, flowEvents, isPolling } = useFlowSystem(pair);

    // Merge flow events into market log
    useEffect(() => {
        if (flowEvents.length > 0) {
            const formatted = flowEvents.slice(0, 5).map(e => ({
                time: new Date(e.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                type: e.type,
                message: e.message
            }));
            setLogs(prev => [...formatted, ...prev].slice(0, 20));
        }
    }, [flowEvents]);

    useEffect(() => {
        if (!pair) return;

        async function loadData() {
            // Load chart URL with correct chain
            const chartResult = await getPairCandles(pair!.pairAddress, pair!.chainId);
            if (chartResult.success && chartResult.chartUrl) {
                setChartUrl(chartResult.chartUrl);
            }

            // Load market logs with chain context
            setLoadingLogs(true);
            const logResult = await getMarketLog(pair!.pairAddress, pair!.chainId);
            if (logResult.success) {
                setLogs(logResult.logs);
            }
            setLoadingLogs(false);
        }

        loadData();
    }, [pair?.pairAddress, pair?.chainId]);

    if (!pair) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0a0a0d]">
                <div className="text-zinc-600 text-sm">Select a pair to view</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0a0a0d]">
            {/* Header with Flow Badge */}
            <MarketHeader pair={pair} flowRegime={regime} />

            {/* Chart - De-emphasized embed, Zenith overlays dominate */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
                {chartUrl ? (
                    <>
                        {/* Slightly de-emphasized iframe */}
                        <iframe
                            src={chartUrl}
                            className="w-full h-full border-0 brightness-[0.92] contrast-[0.97]"
                            title={`${pair.baseToken.symbol} Chart`}
                            allow="clipboard-write"
                        />
                        {/* Bottom fade overlay - hides attribution visually */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/80 to-transparent pointer-events-none" />
                        {/* Top subtle edge */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-[#0a0a0d] to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0c0c10]">
                        <div className="text-zinc-600 text-sm">Loading chart...</div>
                    </div>
                )}
            </div>

            {/* Data Source Bar - Professional attribution */}
            <div className="px-3 py-1.5 border-t border-white/[0.04] bg-[#08080a] flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 uppercase tracking-[0.08em]">
                    Data Source
                </span>
                <div className="flex items-center gap-3">
                    {isPolling && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    )}
                    <span className="text-[10px] text-zinc-600/70">
                        Dexscreener · TradingView
                    </span>
                </div>
            </div>

            {/* Market Log */}
            <div className="h-[150px] flex-shrink-0 border-t border-white/[0.06]">
                <MarketLog logs={logs} loading={loadingLogs} />
            </div>
        </div>
    );
}
