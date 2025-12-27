'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import type { RegimeType } from '@/lib/types/market';
import { calculateEMA, calculateBB, calculateVolumeProfile } from '@/lib/chart/calculations';

// ═══════════════════════════════════════════════════════════════════════════════
// ZENITH CHART PRO - Bloomberg Terminal Edition
// 100% Custom Canvas-based, professional, no external chart libraries
// ═══════════════════════════════════════════════════════════════════════════════

interface OHLCV {
    time?: number;
    timestamp?: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface AlgorithmOverlay {
    type: 'entry_zone' | 'invalidation' | 'volatility_compression' | 'support' | 'resistance';
    price?: number;
    min?: number;
    max?: number;
    high?: number;
    low?: number;
    confidence?: number;
    description?: string;
}

interface ZenithChartProProps {
    data: OHLCV[];
    regime?: RegimeType;
    algorithmOverlays?: AlgorithmOverlay[];
    height?: number;
    showVolume?: boolean;
    showEMA?: boolean;
    showBB?: boolean;
    showVolumeProfile?: boolean;
    showRegimeTint?: boolean;
    enableZoom?: boolean;
    enablePan?: boolean;
    className?: string;
}

// Professional Bloomberg colors
const BLOOMBERG_COLORS = {
    up: '#00D6A3',      // Bloomberg green
    down: '#FF625C',    // Bloomberg red
    wick: '#4A5568',
    grid: 'rgba(255, 255, 255, 0.04)',
    background: '#0A0A12',
    text: '#A0AEC0',
    ema20: '#00B8FF',   // Cyan
    ema50: '#FF9500',   // Orange
    bbBand: 'rgba(59, 130, 246, 0.3)',
    volume: {
        up: 'rgba(0, 214, 163, 0.4)',
        down: 'rgba(255, 98, 92, 0.4)',
        high: 'rgba(255, 255, 255, 0.6)'
    }
};

// Regime-based background tints
const REGIME_TINTS: Record<string, string> = {
    trend: 'rgba(0, 214, 163, 0.02)',
    breakout: 'rgba(0, 184, 255, 0.02)',
    range: 'rgba(255, 149, 0, 0.02)',
    breakdown: 'rgba(255, 98, 92, 0.02)',
    chaos: 'rgba(168, 85, 247, 0.02)',
    default: 'transparent'
};

// Regime display colors for badge
const REGIME_BADGES: Record<string, string> = {
    trend: 'bg-emerald-500/20 text-emerald-400',
    breakout: 'bg-blue-500/20 text-blue-400',
    range: 'bg-amber-500/20 text-amber-400',
    breakdown: 'bg-red-500/20 text-red-400',
    chaos: 'bg-purple-500/20 text-purple-400',
};

// Helper functions
function formatPrice(price: number, range?: number): string {
    const r = range || price;
    if (r > 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 0 });
    if (r > 100) return price.toFixed(1);
    if (r > 1) return price.toFixed(2);
    if (r > 0.01) return price.toFixed(4);
    return price.toFixed(6);
}

function formatVolume(vol: number): string {
    if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
    return vol.toFixed(0);
}

function formatTime(timestamp: number, mode: 'date' | 'time'): string {
    const date = new Date(timestamp);
    if (mode === 'date') {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export default memo(function ZenithChartPro({
    data,
    regime,
    algorithmOverlays = [],
    height = 500,
    showVolume = true,
    showEMA = true,
    showBB = false,
    showVolumeProfile = false,
    showRegimeTint = true,
    enableZoom = true,
    enablePan = true,
    className = '',
}: ZenithChartProProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1200, height });
    const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [viewport, setViewport] = useState({ offset: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // Chart dimensions
    const padding = {
        top: 30,
        right: 80,
        bottom: showVolume ? 70 : 40,
        left: 10
    };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const volumeHeight = showVolume ? 50 : 0;
    const chartHeight = dimensions.height - padding.top - padding.bottom - volumeHeight;

    // Get visible data based on viewport
    const visibleData = useCallback(() => {
        if (data.length === 0) return [];
        const start = Math.max(0, Math.floor(data.length * viewport.offset));
        const count = Math.ceil(data.length * viewport.scale);
        const end = Math.min(data.length, start + count);
        return data.slice(start, end);
    }, [data, viewport]);

    // Calculate indicators for visible data
    const getIndicators = useCallback(() => {
        const visible = visibleData();
        if (visible.length === 0) return { ema20: [], ema50: [], bb: null, volumeProfile: null };

        const ema20 = showEMA ? calculateEMA(visible, 20) : [];
        const ema50 = showEMA ? calculateEMA(visible, 50) : [];
        const bb = showBB ? calculateBB(visible, 20, 2) : null;
        const volumeProfile = showVolumeProfile ? calculateVolumeProfile(visible) : null;

        return { ema20, ema50, bb, volumeProfile };
    }, [visibleData, showEMA, showBB, showVolumeProfile]);

    // Main render function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // HiDPI support
        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        ctx.scale(dpr, dpr);

        // Clear
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        const visible = visibleData();
        if (visible.length === 0) return;

        // Apply regime tint
        if (showRegimeTint && regime) {
            ctx.fillStyle = REGIME_TINTS[regime] || REGIME_TINTS.default;
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        }

        // Calculate price range
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let maxVolume = 0;

        for (const candle of visible) {
            minPrice = Math.min(minPrice, candle.low);
            maxPrice = Math.max(maxPrice, candle.high);
            maxVolume = Math.max(maxVolume, candle.volume);
        }

        // Add padding for indicators
        const priceRange = maxPrice - minPrice;
        minPrice -= priceRange * 0.05;
        maxPrice += priceRange * 0.05;

        // Coordinate mapping functions
        const priceToY = (price: number) => {
            return padding.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
        };

        const candleWidth = Math.max(2, (chartWidth / visible.length) * 0.7);
        const totalWidth = chartWidth / visible.length;

        const indexToX = (i: number) => {
            return padding.left + (i * totalWidth) + totalWidth / 2;
        };

        // ─────────────────────────────────────────────────────────────────────
        // 1. DRAW GRID (Bloomberg Style)
        // ─────────────────────────────────────────────────────────────────────
        ctx.strokeStyle = BLOOMBERG_COLORS.grid;
        ctx.lineWidth = 1;
        ctx.font = '10px "SF Mono", Monaco, Consolas, monospace';

        // Horizontal price lines
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const price = minPrice + ((maxPrice - minPrice) / gridLines) * i;
            const y = priceToY(price);

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(dimensions.width - padding.right, y);
            ctx.stroke();

            // Price labels
            ctx.fillStyle = BLOOMBERG_COLORS.text;
            ctx.textAlign = 'left';
            ctx.fillText(formatPrice(price, priceRange), dimensions.width - padding.right + 8, y + 3);
        }

        // Vertical time lines
        const timeLines = Math.min(8, Math.floor(visible.length / 10));
        for (let i = 0; i <= timeLines; i++) {
            const index = Math.floor((i / timeLines) * (visible.length - 1));
            const x = indexToX(index);

            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + chartHeight);
            ctx.stroke();

            // Time labels
            const candle = visible[index];
            if (candle) {
                const ts = candle.time ? candle.time * 1000 : candle.timestamp || 0;
                if (ts) {
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        formatTime(ts, visible.length > 100 ? 'date' : 'time'),
                        x,
                        dimensions.height - padding.bottom + volumeHeight + 15
                    );
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. DRAW ALGORITHM OVERLAYS
        // ─────────────────────────────────────────────────────────────────────
        algorithmOverlays.forEach(overlay => {
            switch (overlay.type) {
                case 'entry_zone':
                    if (overlay.min !== undefined && overlay.max !== undefined) {
                        ctx.fillStyle = 'rgba(0, 214, 163, 0.1)';
                        const y1 = priceToY(overlay.max);
                        const y2 = priceToY(overlay.min);
                        ctx.fillRect(padding.left, y1, chartWidth, y2 - y1);
                    }
                    break;

                case 'invalidation':
                    if (overlay.price !== undefined) {
                        ctx.strokeStyle = 'rgba(255, 98, 92, 0.6)';
                        ctx.setLineDash([5, 3]);
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        const y = priceToY(overlay.price);
                        ctx.moveTo(padding.left, y);
                        ctx.lineTo(dimensions.width - padding.right, y);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                    break;

                case 'support':
                case 'resistance':
                    if (overlay.price !== undefined) {
                        const color = overlay.type === 'support' ? 'rgba(0, 214, 163, 0.4)' : 'rgba(255, 98, 92, 0.4)';
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        const y = priceToY(overlay.price);
                        ctx.moveTo(padding.left, y);
                        ctx.lineTo(dimensions.width - padding.right, y);
                        ctx.stroke();
                    }
                    break;

                case 'volatility_compression':
                    if (overlay.high !== undefined && overlay.low !== undefined) {
                        ctx.fillStyle = 'rgba(255, 149, 0, 0.08)';
                        const y1 = priceToY(overlay.high);
                        const y2 = priceToY(overlay.low);
                        ctx.fillRect(padding.left, y1, chartWidth, y2 - y1);
                    }
                    break;
            }
        });

        // ─────────────────────────────────────────────────────────────────────
        // 3. DRAW BOLLINGER BANDS
        // ─────────────────────────────────────────────────────────────────────
        const { ema20, ema50, bb } = getIndicators();

        if (showBB && bb && bb.upper.length === visible.length) {
            // Fill between bands
            ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
            ctx.beginPath();
            for (let i = 0; i < visible.length; i++) {
                const x = indexToX(i);
                const y = priceToY(bb.upper[i]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            for (let i = visible.length - 1; i >= 0; i--) {
                const x = indexToX(i);
                const y = priceToY(bb.lower[i]);
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            // Upper band line
            ctx.strokeStyle = BLOOMBERG_COLORS.bbBand;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < visible.length; i++) {
                if (isNaN(bb.upper[i])) continue;
                const x = indexToX(i);
                const y = priceToY(bb.upper[i]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Lower band line
            ctx.beginPath();
            for (let i = 0; i < visible.length; i++) {
                if (isNaN(bb.lower[i])) continue;
                const x = indexToX(i);
                const y = priceToY(bb.lower[i]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // ─────────────────────────────────────────────────────────────────────
        // 4. DRAW CANDLES (Professional Style with Gradient)
        // ─────────────────────────────────────────────────────────────────────
        for (let i = 0; i < visible.length; i++) {
            const candle = visible[i];
            const x = indexToX(i);
            const isUp = candle.close >= candle.open;

            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(closeY - openY));

            // Wick
            ctx.strokeStyle = isUp ? BLOOMBERG_COLORS.up : BLOOMBERG_COLORS.down;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();

            // Body with gradient
            const gradient = ctx.createLinearGradient(
                x - candleWidth / 2, bodyTop,
                x + candleWidth / 2, bodyTop + bodyHeight
            );
            if (isUp) {
                gradient.addColorStop(0, '#00D6A3');
                gradient.addColorStop(1, '#00B894');
            } else {
                gradient.addColorStop(0, '#FF625C');
                gradient.addColorStop(1, '#FF3B30');
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

            // Highlight hovered candle
            if (hoveredCandle === i) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fillRect(x - totalWidth / 2, padding.top, totalWidth, chartHeight);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 5. DRAW EMA LINES
        // ─────────────────────────────────────────────────────────────────────
        if (showEMA) {
            // EMA 20 (Cyan)
            if (ema20.length === visible.length) {
                ctx.strokeStyle = BLOOMBERG_COLORS.ema20;
                ctx.lineWidth = 1.8;
                ctx.lineJoin = 'round';
                ctx.beginPath();
                let started = false;
                for (let i = 0; i < ema20.length; i++) {
                    if (isNaN(ema20[i])) continue;
                    const x = indexToX(i);
                    const y = priceToY(ema20[i]);
                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }

            // EMA 50 (Orange)
            if (ema50.length === visible.length) {
                ctx.strokeStyle = BLOOMBERG_COLORS.ema50;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                let started = false;
                for (let i = 0; i < ema50.length; i++) {
                    if (isNaN(ema50[i])) continue;
                    const x = indexToX(i);
                    const y = priceToY(ema50[i]);
                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 6. DRAW VOLUME BARS
        // ─────────────────────────────────────────────────────────────────────
        if (showVolume && maxVolume > 0) {
            const volumeTop = padding.top + chartHeight + 10;

            for (let i = 0; i < visible.length; i++) {
                const candle = visible[i];
                const x = indexToX(i);
                const isUp = candle.close >= candle.open;
                const isHighVolume = candle.volume > maxVolume * 0.8;

                const barHeight = (candle.volume / maxVolume) * volumeHeight;

                let fillStyle;
                if (isHighVolume) {
                    fillStyle = isUp ? 'rgba(0, 214, 163, 0.7)' : 'rgba(255, 98, 92, 0.7)';
                } else {
                    fillStyle = isUp ? 'rgba(0, 214, 163, 0.3)' : 'rgba(255, 98, 92, 0.3)';
                }

                ctx.fillStyle = fillStyle;
                ctx.fillRect(
                    x - candleWidth / 2,
                    volumeTop + volumeHeight - barHeight,
                    candleWidth,
                    barHeight
                );
            }

            // Volume label
            ctx.fillStyle = BLOOMBERG_COLORS.text;
            ctx.font = '9px "SF Mono", Monaco, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(formatVolume(maxVolume), dimensions.width - padding.right + 8, volumeTop + 15);
        }

        // ─────────────────────────────────────────────────────────────────────
        // 7. DRAW VOLUME PROFILE (Right side)
        // ─────────────────────────────────────────────────────────────────────
        const { volumeProfile } = getIndicators();
        if (showVolumeProfile && volumeProfile) {
            const profileWidth = 50;
            const maxProfileVolume = Math.max(...volumeProfile.volumes);

            volumeProfile.volumes.forEach((vol, i) => {
                const price = volumeProfile.prices[i];
                const y = priceToY(price);
                const barWidth = (vol / maxProfileVolume) * profileWidth;

                const isPOC = i === volumeProfile.pocIndex;

                ctx.fillStyle = isPOC ? 'rgba(255, 149, 0, 0.5)' : 'rgba(59, 130, 246, 0.3)';
                ctx.fillRect(
                    dimensions.width - padding.right - profileWidth - 5,
                    y - 2,
                    barWidth,
                    4
                );
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // 8. DRAW CROSSHAIR
        // ─────────────────────────────────────────────────────────────────────
        if (mousePos && hoveredCandle !== null) {
            // Vertical line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(mousePos.x, padding.top);
            ctx.lineTo(mousePos.x, padding.top + chartHeight);
            ctx.stroke();

            // Horizontal line
            ctx.beginPath();
            ctx.moveTo(padding.left, mousePos.y);
            ctx.lineTo(dimensions.width - padding.right, mousePos.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Price label on right
            const hoverPrice = minPrice + ((padding.top + chartHeight - mousePos.y) / chartHeight) * (maxPrice - minPrice);
            if (hoverPrice >= minPrice && hoverPrice <= maxPrice) {
                ctx.fillStyle = '#1a1a24';
                ctx.fillRect(dimensions.width - padding.right, mousePos.y - 10, 75, 20);
                ctx.fillStyle = '#fff';
                ctx.font = '10px "SF Mono", Monaco, monospace';
                ctx.textAlign = 'left';
                ctx.fillText(formatPrice(hoverPrice, priceRange), dimensions.width - padding.right + 5, mousePos.y + 3);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 9. DRAW TOOLTIP
        // ─────────────────────────────────────────────────────────────────────
        if (hoveredCandle !== null && visible[hoveredCandle]) {
            const candle = visible[hoveredCandle];
            const x = indexToX(hoveredCandle);

            const tooltipWidth = 160;
            const tooltipHeight = 100;
            let tooltipX = x + 20;
            const tooltipY = padding.top + 20;

            // Keep on screen
            if (tooltipX + tooltipWidth > dimensions.width - 20) {
                tooltipX = x - tooltipWidth - 20;
            }

            // Background
            ctx.fillStyle = 'rgba(10, 10, 18, 0.95)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
            ctx.fill();
            ctx.stroke();

            // Content
            const isUp = candle.close >= candle.open;
            const change = ((candle.close - candle.open) / candle.open) * 100;

            ctx.fillStyle = BLOOMBERG_COLORS.text;
            ctx.font = '10px "SF Mono", Monaco, monospace';
            ctx.textAlign = 'left';
            ctx.fillText('O  H  L  C', tooltipX + 12, tooltipY + 18);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '11px "SF Mono", Monaco, monospace';
            ctx.fillText(
                `${formatPrice(candle.open)} ${formatPrice(candle.high)} ${formatPrice(candle.low)} ${formatPrice(candle.close)}`,
                tooltipX + 12,
                tooltipY + 36
            );

            // Change
            ctx.fillStyle = isUp ? BLOOMBERG_COLORS.up : BLOOMBERG_COLORS.down;
            ctx.fillText(
                `${isUp ? '+' : ''}${change.toFixed(2)}%`,
                tooltipX + 12,
                tooltipY + 56
            );

            // Volume
            ctx.fillStyle = BLOOMBERG_COLORS.text;
            ctx.fillText(`Vol: ${formatVolume(candle.volume)}`, tooltipX + 12, tooltipY + 76);

            // Date
            const ts = candle.time ? candle.time * 1000 : candle.timestamp || 0;
            if (ts) {
                const date = new Date(ts);
                ctx.fillText(
                    date.toLocaleDateString(),
                    tooltipX + 12,
                    tooltipY + 92
                );
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 10. ZENITHSCORES WATERMARK (Subtle)
        // ─────────────────────────────────────────────────────────────────────
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.font = 'bold 28px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ZENITHSCORES', dimensions.width / 2, dimensions.height / 2);

    }, [data, dimensions, regime, hoveredCandle, mousePos, viewport, algorithmOverlays,
        showVolume, showEMA, showBB, showVolumeProfile, showRegimeTint, visibleData, getIndicators,
        chartHeight, chartWidth, padding, volumeHeight]);

    // Interaction handlers
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePos({ x, y });

        // Find hovered candle
        const visible = visibleData();
        const totalWidth = chartWidth / visible.length;
        const index = Math.floor((x - padding.left) / totalWidth);

        if (index >= 0 && index < visible.length) {
            setHoveredCandle(index);
        } else {
            setHoveredCandle(null);
        }

        // Panning
        if (isDragging && enablePan) {
            const dx = (x - lastMousePos.x) / chartWidth;
            setViewport(prev => ({
                ...prev,
                offset: Math.max(0, Math.min(1 - prev.scale, prev.offset - dx * 0.5))
            }));
        }

        setLastMousePos({ x, y });
    }, [isDragging, lastMousePos, enablePan, visibleData, chartWidth, padding.left]);

    const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
        if (!enableZoom) return;
        e.preventDefault();

        const delta = e.deltaY > 0 ? 0.05 : -0.05;
        setViewport(prev => ({
            scale: Math.max(0.1, Math.min(1, prev.scale + delta)),
            offset: prev.offset
        }));
    }, [enableZoom]);

    const handleMouseDown = useCallback(() => {
        if (enablePan) setIsDragging(true);
    }, [enablePan]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setMousePos(null);
        setHoveredCandle(null);
        setIsDragging(false);
    }, []);

    // Resize observer
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: height,
                });
            }
        };

        updateDimensions();
        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [height]);

    // Render on changes
    useEffect(() => {
        const raf = requestAnimationFrame(render);
        return () => cancelAnimationFrame(raf);
    }, [render]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full bg-[#0A0A12] ${className}`}
            style={{ height }}
        >
            <canvas
                ref={canvasRef}
                className="cursor-crosshair"
                style={{ width: '100%', height: '100%' }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
            />

            {/* Legend */}
            <div className="absolute top-3 left-3 flex items-center gap-4 text-xs font-mono">
                {showEMA && (
                    <>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-0.5 bg-[#00B8FF]" />
                            <span className="text-gray-400">EMA 20</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-0.5 bg-[#FF9500]" />
                            <span className="text-gray-400">EMA 50</span>
                        </div>
                    </>
                )}
                {showBB && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-0.5 bg-[#3B82F6]" />
                        <span className="text-gray-400">BB 20</span>
                    </div>
                )}
            </div>

            {/* Regime Badge */}
            {regime && (
                <div className="absolute top-3 right-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${REGIME_BADGES[regime] || 'bg-gray-500/20 text-gray-400'}`}>
                        {regime}
                    </div>
                </div>
            )}

            {/* Zoom Controls */}
            {enableZoom && (
                <div className="absolute bottom-3 right-3 flex gap-1">
                    <button
                        onClick={() => setViewport(prev => ({ ...prev, scale: Math.min(1, prev.scale + 0.1) }))}
                        className="w-6 h-6 flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 rounded text-xs text-white"
                    >
                        +
                    </button>
                    <button
                        onClick={() => setViewport(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }))}
                        className="w-6 h-6 flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 rounded text-xs text-white"
                    >
                        −
                    </button>
                    <button
                        onClick={() => setViewport({ offset: 0, scale: 1 })}
                        className="px-2 h-6 flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 rounded text-xs text-white"
                    >
                        Reset
                    </button>
                </div>
            )}
        </div>
    );
});
