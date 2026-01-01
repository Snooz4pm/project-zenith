'use client';

import { useEffect, useState } from 'react';
import MarketHeader from './MarketHeader';
import MarketLog from './MarketLog';
import { getPairCandles, getMarketLog } from '@/lib/actions/crypto-finds';

interface MarketTerminalProps {
    pair: {
        pairAddress: string;
        chainId: string;
        baseToken: { symbol: string; name: string };
        quoteToken: { symbol: string };
        priceUsd: number;
        priceChange: { h1?: number; h24?: number };
        volume: { h1?: number; h24?: number };
        liquidity: { usd?: number };
        url: string;
    } | null;
}

export default function MarketTerminal({ pair }: MarketTerminalProps) {
    const [chartUrl, setChartUrl] = useState<string | null>(null);
    const [logs, setLogs] = useState<{ time: string; type: string; message: string }[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

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
            {/* Header */}
            <MarketHeader pair={pair} />

            {/* Chart */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
                {chartUrl ? (
                    <>
                        <iframe
                            src={chartUrl}
                            className="w-full h-full border-0"
                            title={`${pair.baseToken.symbol} Chart`}
                            allow="clipboard-write"
                        />
                        {/* Hide Dexscreener branding overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a0d] to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0c0c10]">
                        <div className="text-zinc-600 text-sm">Loading chart...</div>
                    </div>
                )}
            </div>

            {/* Market Log */}
            <div className="h-[180px] flex-shrink-0 border-t border-white/[0.06]">
                <MarketLog logs={logs} loading={loadingLogs} />
            </div>
        </div>
    );
}
