'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowLeft, Activity, Clock } from 'lucide-react';
import Link from 'next/link';
import { useOHLCV } from '@/hooks/useOHLCV';
import { useLivePrice } from '@/lib/market/live';
import { useCryptoLive } from '@/lib/market/crypto/useCryptoLive';
// import IntelligencePanel from '@/components/terminal/IntelligencePanel'; // Removed
import MarketLog from '@/components/pulse/MarketLog';
import MarketMovers from '@/components/terminal/MarketMovers';
import type { Timeframe, DataRange, AssetType, OHLCV } from '@/lib/market-data/types';
import { calculateFactors } from '@/lib/intelligence/calculator';
import { generateScenarios, generateKeyLevels } from '@/lib/intelligence/scenarios';
import { detectConsolidationZones } from '@/lib/analysis/zoneDetection';
import { zoneToDrawing } from '@/lib/analysis/zoneToDrawing';
import { Drawing } from '@/components/chart-engine/engine/types';
import SuggestionsPanel from '@/components/terminal/SuggestionsPanel';
import { analyzeMarketState } from '@/lib/market/marketState';
import { backtestZoneReliability } from '@/lib/analysis/backtest';
import { useMarketContext } from '@/hooks/useMarketContext';
import DeepDiveModal from '@/components/terminal/DeepDiveModal';
import JournalModal from '@/components/journal/JournalModal';
import ChartPriceDisplay from '@/components/market/ChartPriceDisplay';
// import { MissionPanel } from '@/components/mission'; // Replaced
// import StudyWorkspace from '@/components/study/StudyWorkspace'; // Removed
import { generateMarketSignals } from '@/lib/pulse/signal-generator';
import { DisciplineBadge } from '@/components/gate/DisciplineBadge';
import { useDisciplineGate } from '@/hooks/useDisciplineGate';
import ProfessionalChart from '@/components/charts/ProfessionalChart';
import type { ChartMode } from '@/lib/charts/types';

// Dynamic import for chart to avoid SSR issues
const ZenithChartPro = dynamic(() => import('@/components/chart-engine/ZenithChartPro'), { ssr: false });

interface TerminalViewProps {
    symbol: string;
    name: string;
    assetType: AssetType;
    backLink: string;
    backLabel: string;
}

// Timeframe options
const TIMEFRAMES: { label: string; timeframe: Timeframe; range: DataRange }[] = [
    { label: '1D', timeframe: '15m', range: '1D' },
    { label: '1W', timeframe: '1H', range: '1W' },
    { label: '1M', timeframe: '1D', range: '1M' },
    { label: '3M', timeframe: '1D', range: '3M' },
    { label: '1Y', timeframe: '1D', range: '1Y' },
];

// Market movers configuration - fetch from API or show empty state
interface MarketMover {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    sparkline?: number[];
}

export default function TerminalView({
    symbol,
    name,
    assetType,
    backLink,
    backLabel,
}: TerminalViewProps) {
    const { trackAction } = useDisciplineGate();

    // Track page view on mount
    useEffect(() => {
        trackAction('page_view', symbol);
    }, [trackAction, symbol]);

    // Track asset switch
    useEffect(() => {
        trackAction('switched_asset', symbol);
    }, [trackAction, symbol]);

    const [selectedTimeframe, setSelectedTimeframe] = useState(2); // Default to 1M
    const { timeframe, range } = TIMEFRAMES[selectedTimeframe];

    // Mode is now LIVE-only (removed replay/history)
    const mode = 'LIVE' as const;

    // Professional Chart Mode
    const [chartMode, setChartMode] = useState<ChartMode>('line');

    const [suggestions, setSuggestions] = useState<Drawing[]>([]);
    const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeDrawings, setActiveDrawings] = useState<Drawing[]>([]);
    const [marketMovers, setMarketMovers] = useState<MarketMover[]>([]);

    // Fetch real market movers
    useEffect(() => {
        const fetchMovers = async () => {
            try {
                const res = await fetch('/api/market/movers');
                if (res.ok) {
                    const data = await res.json();
                    setMarketMovers(data.movers || []);
                }
            } catch (e) {
                console.error('Failed to fetch market movers:', e);
            }
        };
        fetchMovers();
    }, []);

    // --- 1. LIVE DATA FEED ---
    const {
        data: liveOHLCV,
        isLoading: liveLoading,
        error,
        provider,
        fetchedAt,
        refetch
    } = useOHLCV({
        symbol,
        timeframe,
        range,
        assetType,
        enabled: mode === 'LIVE'
    });

    // LIVE PRICE - SEPARATE FROM CHART DATA (never changes with timeframe)
    const stockForexPrice = useLivePrice({
        symbol,
        assetType: assetType === 'crypto' ? 'stock' : assetType,
        enabled: mode === 'LIVE' && assetType !== 'crypto'
    });
    const cryptoPrice = useCryptoLive({
        symbol,
        enabled: mode === 'LIVE' && assetType === 'crypto'
    });

    // Unified live price (timeframe-independent)
    const livePrice = assetType === 'crypto'
        ? (cryptoPrice.priceUsd || 0)
        : (stockForexPrice.price || 0);
    const liveChangePercent = assetType === 'crypto'
        ? (cryptoPrice.priceChange24h || 0)
        : (stockForexPrice.previousClose > 0
            ? ((stockForexPrice.price - stockForexPrice.previousClose) / stockForexPrice.previousClose) * 100
            : 0);

    // Convert existing OHLCV data to Professional Chart format
    const professionalChartData = useMemo(() => {
        if (!liveOHLCV || liveOHLCV.length === 0) return [];

        return liveOHLCV.map(candle => ({
            timestamp: (candle as any).timestamp || candle.time * 1000,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume || 0,
        }));
    }, [liveOHLCV]);

    // Calculate freshness based on latest data
    const latestDataPoint = professionalChartData[professionalChartData.length - 1] || null;
    const freshness = useMemo(() => {
        const now = Date.now();
        const lastPollTime = fetchedAt || now;
        const pollingInterval = assetType === 'crypto' ? 30000 : 60000;

        if (!latestDataPoint) {
            return {
                status: 'paused' as const,
                delaySeconds: 0,
                lastPollTime,
                nextPollTime: lastPollTime + pollingInterval,
            };
        }

        const dataAge = now - latestDataPoint.timestamp;
        const delaySeconds = Math.floor(dataAge / 1000);

        let status: 'live' | 'delayed' | 'paused' | 'error' = 'live';
        if (delaySeconds < 10) {
            status = 'live';
        } else if (delaySeconds < 300) {
            status = 'delayed';
        } else {
            status = 'paused';
        }

        return {
            status,
            delaySeconds,
            lastPollTime,
            nextPollTime: lastPollTime + pollingInterval,
        };
    }, [latestDataPoint, fetchedAt, assetType]);

    // --- 2. DATA FLOW (LIVE-ONLY, no replay) ---
    const activeData = liveOHLCV;

    // Prepare data for analysis (ensure timestamp exists)
    const analysisData = useMemo(() => {
        if (!activeData) return [];
        return activeData.map(d => ({
            ...d,
            timestamp: (d as any).timestamp || (d.time * 1000) // conversions
        }));
    }, [activeData]);

    // --- 4. INTELLIGENCE ---
    // Keep factors for raw scores
    const factors = useMemo(() => calculateFactors(analysisData as any), [analysisData]);

    // Use robust Market State for Regime
    const marketState = useMemo(() => analyzeMarketState(analysisData as any), [analysisData]);
    const regime = marketState.regime; // 'compression' | 'expansion' | 'trend' | 'chop' | 'neutral'

    const scenarios = useMemo(() => generateScenarios(analysisData as any), [analysisData]);
    const { entryZone, invalidation } = useMemo(() => generateKeyLevels(analysisData as any), [analysisData]);

    // AI CONTEXT HOOK
    const { analysis: aiAnalysis, isLoading: isLoadingAI } = useMarketContext({
        name,
        symbol,
        assetType,
        regime: marketState.regime,
        zones: suggestions, // Pass detected zones
        context: `Volatility: ${factors.volatility}, Momentum: ${factors.momentum}`,
        enabled: mode === 'LIVE' && analysisData.length > 50
    });

    // Pulse / Signal Generator (Shared)
    const generatedSignals = useMemo(() => {
        if (!analysisData || analysisData.length < 50) return [];
        return generateMarketSignals(analysisData, marketState.regime);
    }, [analysisData, marketState.regime]);

    // Run detection
    useEffect(() => {
        if (!analysisData || analysisData.length < 50) return;

        // 1. Detect current zones
        const candidates = detectConsolidationZones(analysisData as any);

        // 2. Backtest reliability
        const reliability = backtestZoneReliability(analysisData as any);

        const newSuggestions = candidates
            .map(c => {
                const d = zoneToDrawing(c);
                // Enrich with backtest data
                d.meta = { ...d.meta, reliabilityScore: reliability.score, respectRate: reliability.respectRate };
                d.label = `${d.label} • ${Math.round(reliability.score)}% Rel.`;
                return d;
            })
            .filter(d => !ignoredIds.has(d.id));

        setSuggestions(newSuggestions);
    }, [analysisData, ignoredIds]);

    const handleAcceptSuggestion = (id: string) => {
        const drawing = suggestions.find(s => s.id === id);
        if (!drawing) return;
        setActiveDrawings(prev => [...prev, { ...drawing, source: 'user' }]);
        setSuggestions(prev => prev.filter(s => s.id !== id));
    };

    const handleIgnoreSuggestion = (id: string) => {
        setIgnoredIds(prev => new Set(prev).add(id));
        setSuggestions(prev => prev.filter(s => s.id !== id));
    };

    // Regime & Scoring
    const isPositive = liveChangePercent >= 0;
    const convictionScore = Math.round((factors.momentum * 0.3) + (factors.trend * 0.4) + (factors.volume * 0.3));

    // Dynamic "What Breaks This Thesis" logic
    const whatBreaks = useMemo(() => {
        if (regime === 'trend') return `Review long bias if price drops below EMA 50 ($${entryZone.min.toFixed(2)}) on high volume.`;
        if (regime === 'breakout' || regime === 'breakdown') return `Failure to hold beyond breakout level ($${invalidation.price.toFixed(2)}) signals a fake-out.`;
        if (regime === 'range') return `Watch for false breakout. Wait for confirmed close outside bands.`;
        if (regime === 'chaos') return ` Avoid trading. Wait for ADX > 25 or Bandwidth expansion.`;
        return `Current market structure is undefined. Wait for volatility contraction or trend alignment.`;
    }, [regime, entryZone, invalidation]);

    // DISPLAY PRICE - Always live now (no replay mode)
    const displayPrice = livePrice;
    const displayChangePercent = liveChangePercent;

    // --- DEEP DIVE & JOURNAL STATE ---
    const [showDeepDive, setShowDeepDive] = useState(false);
    const [deepDiveContent, setDeepDiveContent] = useState<string | null>(null);
    const [loadingDeepDive, setLoadingDeepDive] = useState(false);
    const [showJournal, setShowJournal] = useState(false);

    const handleDeepDive = async () => {
        setShowDeepDive(true);
        if (deepDiveContent) return;

        setLoadingDeepDive(true);
        try {
            const res = await fetch('/api/ai/deep-dive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    symbol,
                    assetType,
                    regime: marketState.regime,
                    context: `Volatility: ${factors.volatility}, Momentum: ${factors.momentum}`
                })
            });
            const data = await res.json();
            if (data.report) setDeepDiveContent(data.report);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDeepDive(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white">
            {/* Deep Dive Modal */}
            <DeepDiveModal
                isOpen={showDeepDive}
                onClose={() => setShowDeepDive(false)}
                content={deepDiveContent}
                isLoading={loadingDeepDive}
                symbol={symbol}
            />
            {/* Journal Modal */}
            <JournalModal
                isOpen={showJournal}
                onClose={() => setShowJournal(false)}
                symbol={symbol}
                aiContext={aiAnalysis || deepDiveContent} // Allow importing either brief or deep dive
            />


            {/* Header */}
            <div className="border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={backLink} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                                <ArrowLeft size={20} className="text-gray-400" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold">{symbol}</h1>
                                <p className="text-sm text-gray-500">{name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <DisciplineBadge />
                            {/* Synced Price (One Truth) */}
                            <ChartPriceDisplay
                                symbol={symbol}
                                price={displayPrice}
                                changePercent={displayChangePercent}
                                isLoading={liveLoading}
                                onRefresh={refetch}
                                provider={provider}
                                fetchedAt={fetchedAt}
                                cooldownSeconds={assetType === 'crypto' ? 15 : 60}
                            />

                            {/* Timeframe Selector (Controls Chart Only) */}
                            <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1 h-fit self-center">
                                {TIMEFRAMES.map((tf, idx) => (
                                    <button
                                        key={tf.label}
                                        onClick={() => setSelectedTimeframe(idx)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${idx === selectedTimeframe ? 'bg-white/[0.1] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main 3-Panel Layout */}
            <div className="max-w-[1800px] mx-auto px-4 py-4">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 h-auto lg:h-[calc(100vh-120px)]">

                    {/* Left Panel: Market Movers */}
                    <div className="order-3 lg:order-1 lg:col-span-2 overflow-y-auto min-h-[300px] lg:min-h-0">
                        <div className="sticky top-0 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Market Pulse</h3>
                                {/* LIVE indicator */}
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500 text-black">LIVE</span>
                            </div>
                            {marketMovers.length > 0 ? (
                                <MarketMovers
                                    title=""
                                    movers={marketMovers}
                                    onSelect={(sym: string) => {
                                        if (sym !== symbol) {
                                            window.location.href = `/stocks/${sym}`;
                                        }
                                    }}
                                />
                            ) : (
                                <div className="text-center text-gray-500 py-4 text-xs">
                                    Loading market data...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center Panel: Chart */}
                    <div className="order-1 lg:order-2 lg:col-span-7 h-[500px] lg:h-full">
                        <div className="h-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col">
                            {/* Chart Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Activity size={16} className="text-gray-500" />
                                    <span className="text-sm text-gray-400">
                                        {assetType.charAt(0).toUpperCase() + assetType.slice(1)} Chart
                                    </span>
                                    {provider && (
                                        <span className="text-[10px] text-gray-600 px-2 py-0.5 bg-white/[0.03] rounded">
                                            via {provider}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="flex-1 min-h-[400px]">
                                {liveLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-gray-500">Loading chart data...</div>
                                    </div>
                                ) : error ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-red-400">{error}</div>
                                    </div>
                                ) : (
                                    <ProfessionalChart
                                        symbol={`${symbol} (${assetType.toUpperCase()})`}
                                        data={professionalChartData}
                                        mode={chartMode}
                                        freshness={freshness}
                                        onModeChange={setChartMode}
                                    />
                                )}
                            </div>
                            {/* Footer */}
                            {fetchedAt && (
                                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} />
                                        Updated {new Date(fetchedAt).toLocaleTimeString()}
                                    </span>
                                    <span>{activeData.length} candles</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Market Log */}
                    <div className="order-2 lg:order-3 lg:col-span-3 overflow-y-auto min-h-[400px] lg:min-h-0">
                        <div className="sticky top-0 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] h-full">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Market Log</h3>
                            <MarketLog signals={generatedSignals} maxVisible={20} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
