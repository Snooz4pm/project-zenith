/**
 * ZenithChartPro - React Shell
 * 
 * RESPONSIBILITIES:
 * 1. Manage State (Viewport, Canvas Ref)
 * 2. Handle Events (Mouse/Touch -> Interactions.ts)
 * 3. Schedule Renders (Renderer.ts)
 * 4. NO MATH. NO DRAWING LOGIC.
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
import { OHLCV } from '@/lib/market-data/types';

interface ZenithChartProProps {
    data: OHLCV[]; // Canonical input
    suggestions?: Drawing[]; // Future: AI Zones
    height?: number;
}

export default function ZenithChartPro({
    data,
    suggestions = [],
    height = 500
}: ZenithChartProProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- STATE ---

    // Transform OHLCV to MarketCandle (identity for now, but strictly typed)
    const candles = useMemo(() => data as MarketCandle[], [data]);

    // Viewport State
    const [viewport, setViewport] = useState<Viewport>({
        offset: Math.max(0, candles.length - 50), // Start near end
        scale: 1, // Default scale
        candleWidth: 10 // Px per candle
    });

    // Chart Mode: Expert (candles) vs Overview (line)
    const [chartMode, setChartMode] = useState<'expert' | 'overview'>('expert');

    // Market State (Pure Calculation)
    const marketState = useMemo(() => computeMarketState(candles), [candles]);

    // Dimensions
    const [dims, setDims] = useState({ width: 800, height });

    // Interactions
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState<{ x: number, y: number } | null>(null);

    // --- RENDER LOOP ---

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Derived Rendering Params
        const { startIndex, endIndex } = getVisibleRange(viewport, { ...dims, chartWidth: dims.width, chartHeight: dims.height }, candles.length);

        // Find visible min/max price for auto-scaling
        let min = Infinity, max = -Infinity;
        for (let i = startIndex; i < endIndex; i++) {
            if (candles[i].low < min) min = candles[i].low;
            if (candles[i].high > max) max = candles[i].high;
        }
        // Safety padding
        if (min === Infinity) { min = 0; max = 100; }
        if (min === max) { min -= 1; max += 1; }
        const padding = (max - min) * 0.1;
        min -= padding;
        max += padding;

        const config: EngineConfig = {
            width: dims.width,
            height: dims.height,
            dpi: window.devicePixelRatio || 1,
            colors: DEFAULT_THEME,
            fonts: { axis: '10px monospace', crosshair: '10px monospace' },
            padding: { top: 20, right: 50, bottom: 20, left: 0 },
            mode: chartMode // Chart mode switch
        };

        // Render
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

    }, [candles, viewport, marketState, dims]);

    // Effect: Handle Resize
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            const dpr = window.devicePixelRatio || 1;

            // Update canvas buffer size
            canvasRef.current!.width = width * dpr;
            canvasRef.current!.height = height * dpr;

            // Normalize coordinate system
            const ctx = canvasRef.current!.getContext('2d');
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            setDims({ width, height });
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

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
        // const deltaY = e.clientY - lastMouse.y;

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

    const handleWheel = (e: React.WheelEvent) => {
        // Prevent page scroll if within chart
        // e.preventDefault(); // React synthetic events can't preventDefault easily on wheel sometimes check passive

        const newViewport = calculateZoom(
            viewport,
            e.deltaY,
            null, // Cursor ratio TODO
            candles.length,
            Math.ceil(dims.width / viewport.candleWidth)
        );

        setViewport(newViewport);
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
                onWheel={handleWheel}
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

            {/* Overlay Elements (Tooltip, etc) can go here */}
        </div>
    );
}
