/**
 * ZenithChartPro - React Shell
 * 
 * RESPONSIBILITIES:
 * 1. Manage State (Viewport, Canvas Ref)
 * 2. Handle Events (Mouse/Touch -> Interactions.ts)
 * 3. Schedule Renders (Renderer.ts)
 * 4. Support Alert Creation (double-click to set price alert)
 */

'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    EngineConfig,
    DEFAULT_THEME,
    Viewport,
    MarketCandle,
    Drawing
} from './engine/types';
import { getVisibleRange, clampOffset } from './engine/viewport';
import { computeMarketState } from './engine/marketState';
import { renderChart } from './engine/renderer';
import { calculatePan, calculateZoom } from './engine/interactions';
import { OHLCV, AssetType } from '@/lib/market-data/types';
import AlertCreationModal from './AlertCreationModal';
import { usePriceAlert } from '@/hooks/usePriceAlert';
import { Bell } from 'lucide-react';

interface ZenithChartProProps {
    data: OHLCV[];
    suggestions?: Drawing[];
    height?: number;
    // Alert system props
    symbol?: string;
    assetType?: AssetType;
    currentPrice?: number;
}

export default function ZenithChartPro({
    data,
    suggestions = [],
    height = 500,
    symbol = 'ASSET',
    assetType = 'stock',
    currentPrice = 0
}: ZenithChartProProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- STATE ---
    const candles = useMemo(() => data as MarketCandle[], [data]);

    const [viewport, setViewport] = useState<Viewport>({
        offset: Math.max(0, candles.length - 50),
        scale: 1,
        candleWidth: 10
    });

    const [chartMode, setChartMode] = useState<'expert' | 'overview'>('expert');
    const marketState = useMemo(() => computeMarketState(candles), [candles]);
    const [dims, setDims] = useState({ width: 800, height });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState<{ x: number, y: number } | null>(null);

    // Alert system state
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        targetPrice: number;
    }>({ isOpen: false, targetPrice: 0 });

    const { createAlert, isCreating } = usePriceAlert();

    // --- RENDER LOOP ---
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { startIndex, endIndex } = getVisibleRange(viewport, { ...dims, chartWidth: dims.width, chartHeight: dims.height }, candles.length);

        let min = Infinity, max = -Infinity;
        for (let i = startIndex; i < endIndex; i++) {
            if (candles[i].low < min) min = candles[i].low;
            if (candles[i].high > max) max = candles[i].high;
        }
        if (min === Infinity) { min = 0; max = 100; }
        if (min === max) { min -= 1; max += 1; }
        const padding = (max - min) * 0.1;
        min -= padding;
        max += padding;

        // Store price range for click-to-price conversion
        setPriceRange({ min, max });

        const config: EngineConfig = {
            width: dims.width,
            height: dims.height,
            dpi: window.devicePixelRatio || 1,
            colors: DEFAULT_THEME,
            fonts: { axis: '10px monospace', crosshair: '10px monospace' },
            padding: { top: 20, right: 50, bottom: 20, left: 0 },
            mode: chartMode
        };

        renderChart(
            ctx,
            candles,
            viewport,
            marketState,
            config,
            { width: dims.width, height: dims.height, chartWidth: dims.width - config.padding.right, chartHeight: dims.height },
            min,
            max,
            startIndex,
            endIndex
        );

    }, [candles, viewport, marketState, dims, chartMode]);

    // Effect: Handle Resize
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            const dpr = window.devicePixelRatio || 1;

            canvasRef.current!.width = width * dpr;
            canvasRef.current!.height = height * dpr;

            const ctx = canvasRef.current!.getContext('2d');
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            setDims({ width, height });
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Effect: Prevent page scroll when zooming (native listener)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleNativeWheel = (e: WheelEvent) => {
            e.preventDefault();
            const newViewport = calculateZoom(
                viewport,
                e.deltaY,
                null,
                candles.length,
                Math.ceil(dims.width / viewport.candleWidth)
            );
            setViewport(newViewport);
        };

        canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', handleNativeWheel);
    }, [viewport, candles.length, dims.width]);

    // Effect: Draw on change
    useEffect(() => {
        requestAnimationFrame(draw);
    }, [draw]);

    // --- INTERACTION HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !lastMouse) return;
        const deltaX = e.clientX - lastMouse.x;
        const newViewport = calculatePan(
            viewport,
            deltaX,
            candles.length,
            Math.ceil(dims.width / viewport.candleWidth)
        );
        setViewport(newViewport);
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setLastMouse(null);
    };

    // Y position to price conversion
    const yToPrice = (y: number): number => {
        const padTop = 20;
        const padBottom = 20;
        const chartHeight = dims.height - padTop - padBottom;
        const normalizedY = (y - padTop) / chartHeight;
        // Y is inverted (top = high price, bottom = low price)
        return priceRange.max - (normalizedY * (priceRange.max - priceRange.min));
    };

    // Double-click to create alert
    const handleDoubleClick = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const y = e.clientY - rect.top;
        const targetPrice = yToPrice(y);

        setAlertModal({
            isOpen: true,
            targetPrice: Math.round(targetPrice * 100) / 100
        });
    };

    // Handle alert creation
    const handleAlertSubmit = async (alertData: {
        targetPrice: number;
        direction: 'above' | 'below';
        note: string;
        predictedDirection?: 'up' | 'down';
        predictedWithin?: number;
    }) => {
        const actualCurrentPrice = currentPrice || (candles[candles.length - 1]?.close ?? 0);

        await createAlert({
            symbol,
            assetType,
            targetPrice: alertData.targetPrice,
            direction: alertData.direction,
            note: alertData.note,
            predictedDirection: alertData.predictedDirection,
            predictedWithin: alertData.predictedWithin,
            priceAtCreation: actualCurrentPrice
        });
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden bg-[#0a0a12] cursor-crosshair"
            style={{ height }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
            />

            {/* Chart Mode Toggle */}
            <div className="absolute top-3 right-3 z-10 flex rounded-full bg-black/60 backdrop-blur border border-white/10 p-1">
                <button
                    onClick={() => setChartMode('expert')}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${chartMode === 'expert'
                        ? 'bg-white text-black font-medium'
                        : 'text-white/70 hover:text-white'
                        }`}
                >
                    Expert
                </button>
                <button
                    onClick={() => setChartMode('overview')}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${chartMode === 'overview'
                        ? 'bg-blue-500 text-white font-medium'
                        : 'text-white/70 hover:text-white'
                        }`}
                >
                    Overview
                </button>
            </div>

            {/* Set Price Alert Button */}
            <button
                onClick={() => setAlertModal({ isOpen: true, targetPrice: 0 })}
                className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 backdrop-blur text-white text-xs font-medium transition"
            >
                <Bell size={14} />
                Set Price Alert
            </button>

            {/* Alert Creation Modal */}
            <AlertCreationModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, targetPrice: 0 })}
                onSubmit={handleAlertSubmit}
                symbol={symbol}
                assetType={assetType}
                currentPrice={currentPrice || (candles[candles.length - 1]?.close ?? 0)}
            />
        </div>
    );
}
