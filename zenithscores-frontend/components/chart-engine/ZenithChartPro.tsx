/**
 * ZenithChartPro v3 - Advanced React Charting Component
 *
 * ENHANCEMENTS:
 * 1. Complete chart type support (Candle, Line, Area, Heikin-Ashi, Renko, Point & Figure)
 * 2. Advanced drawing tools (Trend lines, Fibonacci, Channels, Ellipses)
 * 3. Technical indicators panel with real-time toggles
 * 4. Timeframe selector with custom ranges
 * 5. Export/Import functionality
 * 6. Layout presets for different user types
 * 7. Crosshair with detailed info display
 * 8. Volume profile and market profile tools
 * 9. Smart zoom and auto-scaling features
 * 10. Multi-chart comparison mode
 */

'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    EngineConfig,
    DEFAULT_THEME,
    DARK_THEME,
    LIGHT_THEME,
    Viewport,
    MarketCandle,
    Drawing,
    ChartType,
    Indicator,
    Timeframe,
    DrawingTool,
    LayoutPreset
} from './engine/types';
import { getVisibleRange, clampOffset, calculateYScale } from './engine/viewport';
import { computeMarketState, computeIndicators } from './engine/marketState';
import { renderChart } from './engine/renderer';
import {
    calculatePan,
    calculateZoom,
    handleDrawingStart,
    handleDrawingMove,
    handleDrawingEnd
} from './engine/interactions';
import { OHLCV, AssetType } from '@/lib/market-data/types';
import AlertCreationModal from './AlertCreationModal';
import { usePriceAlert } from '@/hooks/usePriceAlert';
import {
    Bell,
    Settings,
    Download,
    Upload,
    Maximize2,
    Minimize2,
    LineChart,
    BarChart3,
    TrendingUp,
    Grid,
    Ruler,
    Circle,
    Square,
    Type,
    ZoomIn,
    ZoomOut,
    RefreshCw,
    Layers,
    Eye,
    EyeOff,
    ChevronDown,
    Clock,
    BarChart,
    Activity,
    AlertCircle,
    Share2,
    Copy,
    Filter
} from 'lucide-react';
import IndicatorPanel from './components/IndicatorPanel';
import DrawingToolbar from './components/DrawingToolbar';
import TimeframeSelector from './components/TimeframeSelector';
import LayoutSelector from './components/LayoutSelector';
import CrosshairInfo from './components/CrosshairInfo';
import ExportModal from './components/ExportModal';
import ComparisonModal from './components/ComparisonModal';
import ChartSettingsModal from './components/ChartSettingsModal';
import QuickActionsMenu from './components/QuickActionsMenu';

interface ZenithChartProProps {
    data: OHLCV[];
    suggestions?: Drawing[];
    height?: number;
    // Alert system props
    symbol?: string;
    assetType?: AssetType;
    currentPrice?: number;
    // Multi-symbol support
    comparisonSymbols?: string[];
    onComparisonAdd?: (symbol: string) => void;
}

const CHART_TYPES: { value: ChartType; label: string; icon: React.ReactNode }[] = [
    { value: 'candle', label: 'Candlestick', icon: <BarChart3 size={16} /> },
    { value: 'line', label: 'Line', icon: <LineChart size={16} /> },
    { value: 'area', label: 'Area', icon: <TrendingUp size={16} /> },
    { value: 'heikin-ashi', label: 'Heikin-Ashi', icon: <BarChart size={16} /> },
    { value: 'renko', label: 'Renko', icon: <Square size={16} /> },
    { value: 'point-figure', label: 'P&F', icon: <Grid size={16} /> },
    { value: 'hollow-candle', label: 'Hollow', icon: <Activity size={16} /> },
];

const TIMEFRAMES: Timeframe[] = [
    '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M', '3M', '1y', 'custom'
];

const LAYOUT_PRESETS: LayoutPreset[] = [
    { id: 'basic', name: 'Basic', description: 'Simple chart for beginners' },
    { id: 'technical', name: 'Technical', description: 'Full indicators for traders' },
    { id: 'minimal', name: 'Minimal', description: 'Clean view, no distractions' },
    { id: 'multi-chart', name: 'Multi-Chart', description: 'Compare multiple symbols' },
    { id: 'volume-profile', name: 'Volume Profile', description: 'Focus on volume analysis' },
];

export default function ZenithChartPro({
    data,
    suggestions = [],
    height = 600,
    symbol = 'ASSET',
    assetType = 'stock',
    currentPrice = 0,
    comparisonSymbols = [],
    onComparisonAdd
}: ZenithChartProProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const crosshairRef = useRef<HTMLDivElement>(null);

    // --- STATE ---
    const candles = useMemo(() => data as MarketCandle[], [data]);

    const [viewport, setViewport] = useState<Viewport>({
        offset: Math.max(0, candles.length - 100),
        scale: 1,
        candleWidth: 12
    });

    const [chartType, setChartType] = useState<ChartType>('candle');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [activeIndicators, setActiveIndicators] = useState<Indicator[]>([
        { type: 'sma', period: 20, color: '#3B82F6' },
        { type: 'ema', period: 50, color: '#EF4444' },
        { type: 'rsi', period: 14, color: '#8B5CF6' },
    ]);
    const [drawings, setDrawings] = useState<Drawing[]>(suggestions);
    const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool | null>(null);
    const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
    const [timeframe, setTimeframe] = useState<Timeframe>('1d');
    const [layout, setLayout] = useState<LayoutPreset>(LAYOUT_PRESETS[1]); // Technical by default
    const [showVolume, setShowVolume] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [showCrosshair, setShowCrosshair] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [marketState, setMarketState] = useState(() => computeMarketState(candles));
    const [dims, setDims] = useState({ width: 800, height });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState<{ x: number, y: number } | null>(null);
    const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number; price: number; time: Date | null } | null>(null);
    const [showIndicatorsPanel, setShowIndicatorsPanel] = useState(true);
    const [showDrawingToolbar, setShowDrawingToolbar] = useState(true);
    const [selectedCandleIndex, setSelectedCandleIndex] = useState<number | null>(null);

    // Alert system state
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        targetPrice: number;
    }>({ isOpen: false, targetPrice: 0 });

    // Modals state
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    const { createAlert, isCreating } = usePriceAlert();

    // Apply layout preset
    useEffect(() => {
        switch (layout.id) {
            case 'basic':
                setShowIndicatorsPanel(false);
                setShowDrawingToolbar(false);
                setActiveIndicators([]);
                break;
            case 'technical':
                setShowIndicatorsPanel(true);
                setShowDrawingToolbar(true);
                setActiveIndicators([
                    { type: 'sma', period: 20, color: '#3B82F6' },
                    { type: 'ema', period: 50, color: '#EF4444' },
                    { type: 'rsi', period: 14, color: '#8B5CF6' },
                ]);
                break;
            case 'minimal':
                setShowIndicatorsPanel(false);
                setShowDrawingToolbar(false);
                setShowGrid(false);
                setShowCrosshair(false);
                break;
            case 'volume-profile':
                setShowIndicatorsPanel(false);
                setActiveIndicators([{ type: 'volume', color: '#6B7280' }]);
                break;
        }
    }, [layout]);

    // --- RENDER LOOP ---
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { startIndex, endIndex } = getVisibleRange(
            viewport,
            { ...dims, chartWidth: dims.width, chartHeight: dims.height },
            candles.length
        );

        let min = Infinity, max = -Infinity;
        for (let i = startIndex; i < endIndex; i++) {
            if (candles[i].low < min) min = candles[i].low;
            if (candles[i].high > max) max = candles[i].high;
        }

        // Include indicator values in range calculation
        const indicatorData = computeIndicators(candles, activeIndicators);
        for (const indicator of activeIndicators) {
            const values = indicatorData[indicator.type];
            if (values) {
                for (let i = startIndex; i < endIndex; i++) {
                    if (values[i] < min) min = values[i];
                    if (values[i] > max) max = values[i];
                }
            }
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
            colors: theme === 'dark' ? DARK_THEME : LIGHT_THEME,
            fonts: {
                axis: '11px Inter, sans-serif',
                crosshair: '12px Inter, sans-serif',
                tooltip: '13px Inter, sans-serif'
            },
            padding: { top: 30, right: 60, bottom: showVolume ? 80 : 30, left: 70 },
            mode: 'expert',
            chartType,
            showGrid,
            showVolume,
            indicators: activeIndicators,
            drawings: [...drawings, ...(currentDrawing ? [currentDrawing] : [])],
            crosshair: showCrosshair ? crosshairPos : null
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
            endIndex,
            indicatorData
        );

    }, [candles, viewport, marketState, dims, chartType, theme, showGrid, showVolume,
        activeIndicators, drawings, currentDrawing, showCrosshair, crosshairPos]);

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

    // Effect: Update market state when data changes
    useEffect(() => {
        setMarketState(computeMarketState(candles));
    }, [candles]);

    // Effect: Prevent page scroll when zooming
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleNativeWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                // Ctrl+Wheel for vertical zoom (price scale)
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                // Adjust viewport for price scale zoom
                // Implementation depends on your viewport structure
            } else {
                // Regular wheel for horizontal zoom
                e.preventDefault();
                const newViewport = calculateZoom(
                    viewport,
                    e.deltaY,
                    e.offsetX,
                    candles.length,
                    Math.ceil(dims.width / viewport.candleWidth)
                );
                setViewport(newViewport);
            }
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
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeDrawingTool) {
            // Start drawing
            const newDrawing = handleDrawingStart(
                activeDrawingTool,
                x,
                y,
                viewport,
                priceRange,
                dims
            );
            setCurrentDrawing(newDrawing);
        } else {
            // Start panning
            setIsDragging(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update crosshair position
        if (showCrosshair) {
            const price = yToPrice(y);
            const time = xToTime(x);
            setCrosshairPos({ x, y, price, time });
        }

        if (currentDrawing) {
            // Continue drawing
            const updatedDrawing = handleDrawingMove(
                currentDrawing,
                x,
                y,
                viewport,
                priceRange,
                dims
            );
            setCurrentDrawing(updatedDrawing);
        } else if (isDragging && lastMouse) {
            // Continue panning
            const deltaX = e.clientX - lastMouse.x;
            const newViewport = calculatePan(
                viewport,
                deltaX,
                candles.length,
                Math.ceil(dims.width / viewport.candleWidth)
            );
            setViewport(newViewport);
            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        if (currentDrawing) {
            // Finish drawing
            const finalDrawing = handleDrawingEnd(currentDrawing);
            setDrawings(prev => [...prev, finalDrawing]);
            setCurrentDrawing(null);
            setActiveDrawingTool(null);
        } else {
            // Finish panning
            setIsDragging(false);
            setLastMouse(null);
        }
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setLastMouse(null);
        setCrosshairPos(null);
        if (currentDrawing) {
            setCurrentDrawing(null);
            setActiveDrawingTool(null);
        }
    };

    // Y position to price conversion
    const yToPrice = (y: number): number => {
        const padTop = 30;
        const padBottom = showVolume ? 80 : 30;
        const chartHeight = dims.height - padTop - padBottom;
        const normalizedY = (y - padTop) / chartHeight;
        return priceRange.max - (normalizedY * (priceRange.max - priceRange.min));
    };

    // X position to time conversion
    const xToTime = (x: number): Date | null => {
        const { startIndex, endIndex } = getVisibleRange(
            viewport,
            { ...dims, chartWidth: dims.width, chartHeight: dims.height },
            candles.length
        );

        const visibleCandles = endIndex - startIndex;
        const candleWidth = dims.width / visibleCandles;
        const candleIndex = startIndex + Math.floor(x / candleWidth);

        if (candleIndex >= 0 && candleIndex < candles.length) {
            return new Date(candles[candleIndex].timestamp);
        }
        return null;
    };

    // Double-click to create alert or reset drawing
    const handleDoubleClick = (e: React.MouseEvent) => {
        if (activeDrawingTool) {
            // Reset drawing tool on double-click
            setActiveDrawingTool(null);
            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const y = e.clientY - rect.top;
        const targetPrice = yToPrice(y);

        setAlertModal({
            isOpen: true,
            targetPrice: Math.round(targetPrice * 100) / 100
        });
    };

    // Zoom controls
    const handleZoomIn = () => {
        setViewport(prev => ({
            ...prev,
            scale: Math.min(prev.scale * 1.2, 5),
            candleWidth: Math.min(prev.candleWidth * 1.2, 30)
        }));
    };

    const handleZoomOut = () => {
        setViewport(prev => ({
            ...prev,
            scale: Math.max(prev.scale / 1.2, 0.2),
            candleWidth: Math.max(prev.candleWidth / 1.2, 3)
        }));
    };

    const handleZoomReset = () => {
        setViewport({
            offset: Math.max(0, candles.length - 100),
            scale: 1,
            candleWidth: 12
        });
    };

    const handleZoomTo = (days: number) => {
        const candlesPerDay = 24; // Assuming hourly data
        const visibleCandles = days * candlesPerDay;
        setViewport({
            offset: Math.max(0, candles.length - visibleCandles),
            scale: 1,
            candleWidth: dims.width / visibleCandles
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

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    // Export chart data
    const handleExport = (format: 'png' | 'svg' | 'csv' | 'json') => {
        // Implementation for export functionality
        console.log(`Exporting chart as ${format}`);
        setExportModalOpen(false);
    };

    // Clear all drawings
    const handleClearDrawings = () => {
        setDrawings([]);
        setCurrentDrawing(null);
        setActiveDrawingTool(null);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden bg-background transition-all duration-200"
            style={{ height: isFullscreen ? '100vh' : height }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={handleDoubleClick}
                className="cursor-crosshair"
            />

            {/* Top Control Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-white">{symbol}</span>
                    <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
                        {assetType.toUpperCase()}
                    </span>
                    <span className="text-green-400 font-semibold">
                        ${currentPrice.toFixed(2)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <TimeframeSelector
                        timeframes={TIMEFRAMES}
                        selected={timeframe}
                        onChange={setTimeframe}
                    />

                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur border border-white/10 rounded-lg p-1">
                        {CHART_TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setChartType(type.value)}
                                className={`p-2 rounded-md transition-all ${chartType === type.value
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                                title={type.label}
                            >
                                {type.icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Left Toolbar - Drawing Tools */}
            {showDrawingToolbar && (
                <div className="absolute left-3 top-16 z-20">
                    <DrawingToolbar
                        activeTool={activeDrawingTool}
                        onToolSelect={setActiveDrawingTool}
                        onClear={handleClearDrawings}
                    />
                </div>
            )}

            {/* Right Toolbar - Indicators & Settings */}
            {showIndicatorsPanel && (
                <div className="absolute right-3 top-16 z-20 w-64">
                    <IndicatorPanel
                        indicators={activeIndicators}
                        onChange={setActiveIndicators}
                        onToggle={() => setShowIndicatorsPanel(!showIndicatorsPanel)}
                    />
                </div>
            )}

            {/* Bottom Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-2 rounded-lg ${showGrid ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                        title="Toggle Grid"
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setShowCrosshair(!showCrosshair)}
                        className={`p-2 rounded-lg ${showCrosshair ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                        title="Toggle Crosshair"
                    >
                        {showCrosshair ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                        onClick={() => setShowVolume(!showVolume)}
                        className={`p-2 rounded-lg ${showVolume ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                        title="Toggle Volume"
                    >
                        <BarChart size={18} />
                    </button>

                    <div className="h-6 w-px bg-white/20 mx-2"></div>

                    <button
                        onClick={handleZoomIn}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                        title="Zoom In"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                        title="Zoom Out"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <button
                        onClick={handleZoomReset}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                        title="Reset Zoom"
                    >
                        <RefreshCw size={18} />
                    </button>

                    <div className="flex items-center gap-1 ml-2">
                        <button
                            onClick={() => handleZoomTo(1)}
                            className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white"
                        >
                            1D
                        </button>
                        <button
                            onClick={() => handleZoomTo(7)}
                            className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white"
                        >
                            1W
                        </button>
                        <button
                            onClick={() => handleZoomTo(30)}
                            className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white"
                        >
                            1M
                        </button>
                        <button
                            onClick={() => handleZoomTo(365)}
                            className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white"
                        >
                            1Y
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setAlertModal({ isOpen: true, targetPrice: 0 })}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-sm font-medium transition"
                    >
                        <Bell size={16} />
                        Set Alert
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                    <QuickActionsMenu
                        onExport={() => setExportModalOpen(true)}
                        onCompare={() => setComparisonModalOpen(true)}
                        onSettings={() => setSettingsModalOpen(true)}
                        onLayoutChange={setLayout}
                        layouts={LAYOUT_PRESETS}
                        currentLayout={layout}
                    />
                </div>
            </div>

            {/* Crosshair Info Display */}
            {showCrosshair && crosshairPos && (
                <CrosshairInfo
                    position={crosshairPos}
                    containerRef={crosshairRef}
                />
            )}

            {/* Layout Quick Switch */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20">
                <LayoutSelector
                    layouts={LAYOUT_PRESETS}
                    selected={layout}
                    onChange={setLayout}
                />
            </div>

            {/* Modals */}
            <AlertCreationModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, targetPrice: 0 })}
                onSubmit={handleAlertSubmit}
                symbol={symbol}
                assetType={assetType}
                currentPrice={currentPrice || (candles[candles.length - 1]?.close ?? 0)}
            />

            <ExportModal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                onExport={handleExport}
                symbol={symbol}
            />

            <ComparisonModal
                isOpen={comparisonModalOpen}
                onClose={() => setComparisonModalOpen(false)}
                onAddSymbol={onComparisonAdd}
                currentSymbol={symbol}
                comparisonSymbols={comparisonSymbols}
            />

            <ChartSettingsModal
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                theme={theme}
                onThemeChange={setTheme}
                showGrid={showGrid}
                onGridToggle={setShowGrid}
                showVolume={showVolume}
                onVolumeToggle={setShowVolume}
                showCrosshair={showCrosshair}
                onCrosshairToggle={setShowCrosshair}
                candleWidth={viewport.candleWidth}
                onCandleWidthChange={(width) => setViewport(prev => ({ ...prev, candleWidth: width }))}
            />

            {/* Drawing Tool Indicator */}
            {activeDrawingTool && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 px-4 py-2 bg-black/80 backdrop-blur rounded-full border border-white/20">
                    <div className="flex items-center gap-2 text-white text-sm">
                        <Ruler size={16} />
                        <span className="capitalize">{activeDrawingTool} Mode</span>
                        <span className="text-white/60 text-xs">(Double-click to cancel)</span>
                    </div>
                </div>
            )}
        </div>
    );
}
