/**
 * Zenith Chart Engine - Pure Renderer
 * Paints pixels based on state. Stateless.
 */

import {
    EngineConfig,
    MarketCandle,
    Viewport,
    DerivedIndicators,
    ChartDimensions,
    Drawing
} from './types';
import { indexToX, priceToY } from './viewport';

// Helper to sharpen lines on canvas (avoid sub-pixel blurring)
function crisp(val: number): number {
    return Math.floor(val) + 0.5;
}

/**
 * Main Render Function
 */
export function renderChart(
    ctx: CanvasRenderingContext2D,
    candles: MarketCandle[],
    viewport: Viewport,
    indicators: DerivedIndicators,
    config: EngineConfig,
    dimensions: ChartDimensions,
    minPrice: number,
    maxPrice: number,
    visibleStartIndex: number,
    visibleEndIndex: number,
    indicatorData?: Record<string, number[]>
) {
    // 1. Clear
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // MODE SWITCH: Overview = clean blue line chart
    if (config.mode === 'overview') {
        renderOverviewChart(ctx, candles, viewport, config, dimensions, minPrice, maxPrice, visibleStartIndex, visibleEndIndex);
        return;
    }

    // EXPERT MODE: Full candlestick chart

    // Fill Background
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 2. Draw Grid
    if (config.showGrid) {
        drawGrid(ctx, config, dimensions, minPrice, maxPrice);
    }

    // 3. Draw Indicators (Behind candles)
    if (config.indicators && indicatorData) {
        for (const indicator of config.indicators) {
            if (indicator.visible === false) continue;
            const data = indicatorData[indicator.type];
            if (data) {
                drawLine(ctx, data, visibleStartIndex, visibleEndIndex, viewport, minPrice, maxPrice, dimensions, config, indicator.color, 1.5);
            }
        }
    }

    // 4. Draw Candles
    drawCandles(
        ctx,
        candles,
        visibleStartIndex,
        visibleEndIndex,
        viewport,
        minPrice,
        maxPrice,
        dimensions,
        config
    );

    // 5. Draw User Drawings
    if (config.drawings && config.drawings.length > 0) {
        drawDrawings(ctx, config.drawings, viewport, minPrice, maxPrice, dimensions, config, candles.length);
    }

    // 6. Draw Price Line (Current Price)
    if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        drawPriceLine(ctx, lastCandle.close, minPrice, maxPrice, dimensions, config);
    }

    // 7. Draw Crosshair
    if (config.crosshair) {
        drawCrosshair(ctx, config.crosshair, dimensions, config);
    }
}

/**
 * Overview Mode - Enhanced line chart (beginner friendly, premium feel)
 * Features: gradient fill, direction-aware color, last-price dot
 */
function renderOverviewChart(
    ctx: CanvasRenderingContext2D,
    candles: MarketCandle[],
    viewport: Viewport,
    config: EngineConfig,
    dimensions: ChartDimensions,
    minPrice: number,
    maxPrice: number,
    startIndex: number,
    endIndex: number
) {
    const { width, height, chartHeight } = dimensions;
    const { top: padTop, bottom: padBottom, left: padLeft, right: padRight } = config.padding;

    // 1. Gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0A1025');
    bgGradient.addColorStop(0.5, '#0A1525');
    bgGradient.addColorStop(1, '#0A1B20');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Micro-grid (very subtle, 3 lines only)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const y = padTop + (chartHeight * i / 4);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    if (candles.length === 0) return;

    // 3. Determine trend direction (for color)
    const safeStart = Math.max(0, startIndex);
    const safeEnd = Math.min(candles.length - 1, endIndex - 1);
    const startClose = candles[safeStart]?.close ?? 0;
    const endClose = candles[safeEnd]?.close ?? startClose;

    const trend = endClose > startClose ? 'up' : endClose < startClose ? 'down' : 'flat';
    const LINE_COLORS = {
        up: '#E5ECFF',    // Bright blue-white
        down: '#FCD34D',  // Amber
        flat: '#CBD5E1'   // Gray-blue
    };
    const GLOW_COLORS = {
        up: 'rgba(96, 165, 250, 0.25)',
        down: 'rgba(252, 211, 77, 0.25)',
        flat: 'rgba(148, 163, 184, 0.25)'
    };
    const lineColor = LINE_COLORS[trend];
    const glowColor = GLOW_COLORS[trend];

    // 4. Collect path points
    const closePrices = candles.map(c => c.close);
    const points: { x: number; y: number }[] = [];
    const drawStart = Math.max(0, startIndex - 1);
    const drawEnd = Math.min(closePrices.length - 1, endIndex + 1);

    for (let i = drawStart; i <= drawEnd; i++) {
        const val = closePrices[i];
        if (val === undefined || isNaN(val)) continue;
        const x = indexToX(i, viewport.offset, viewport.candleWidth, padLeft);
        const y = priceToY(val, minPrice, maxPrice, chartHeight, padTop, padBottom);
        points.push({ x, y });
    }

    if (points.length === 0) return;

    // 5. Draw gradient fill under line
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const lastY = points[points.length - 1].y;
    const chartBottom = height - padBottom;

    ctx.beginPath();
    ctx.moveTo(firstX, points[0].y);
    for (const p of points) {
        ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(lastX, chartBottom);
    ctx.lineTo(firstX, chartBottom);
    ctx.closePath();

    const areaGradient = ctx.createLinearGradient(0, padTop, 0, chartBottom);
    areaGradient.addColorStop(0, glowColor);
    areaGradient.addColorStop(1, 'rgba(96, 165, 250, 0.00)');
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // 6. Draw glow line (thicker, for depth)
    ctx.beginPath();
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // 7. Draw main line
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // 8. Last-price dot with glow
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = lineColor;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.restore();
}

function drawPricePath(
    ctx: CanvasRenderingContext2D,
    prices: number[],
    startIndex: number,
    endIndex: number,
    viewport: Viewport,
    minPrice: number,
    maxPrice: number,
    dimensions: ChartDimensions,
    config: EngineConfig
) {
    let started = false;
    const drawStart = Math.max(0, startIndex - 1);
    const drawEnd = Math.min(prices.length - 1, endIndex + 1);

    for (let i = drawStart; i <= drawEnd; i++) {
        const val = prices[i];
        if (val === undefined || isNaN(val)) continue;

        const x = indexToX(i, viewport.offset, viewport.candleWidth, config.padding.left);
        const y = priceToY(val, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);

        if (!started) {
            ctx.moveTo(x, y);
            started = true;
        } else {
            ctx.lineTo(x, y);
        }
    }
}

function drawGrid(
    ctx: CanvasRenderingContext2D,
    config: EngineConfig,
    dims: ChartDimensions,
    min: number,
    max: number
) {
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Horizontal grid lines (price)
    const range = max - min;
    const steps = 8;
    const stepSize = range / steps;

    for (let i = 1; i < steps; i++) {
        const price = min + (i * stepSize);
        const y = priceToY(price, min, max, dims.chartHeight, config.padding.top, config.padding.bottom);
        ctx.moveTo(0, crisp(y));
        ctx.lineTo(dims.width, crisp(y));
    }

    ctx.stroke();
}

function drawLine(
    ctx: CanvasRenderingContext2D,
    data: number[],
    startIndex: number,
    endIndex: number,
    vp: Viewport,
    min: number,
    max: number,
    dims: ChartDimensions,
    config: EngineConfig,
    color: string,
    width: number
) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();

    let started = false;

    // Draw slightly outside visible range to avoid gaps
    const drawStart = Math.max(0, startIndex - 1);
    const drawEnd = Math.min(data.length - 1, endIndex + 1);

    for (let i = drawStart; i <= drawEnd; i++) {
        const val = data[i];
        if (val === undefined || isNaN(val)) continue;

        const x = indexToX(i, vp.offset, vp.candleWidth, config.padding.left);
        const y = priceToY(val, min, max, dims.chartHeight, config.padding.top, config.padding.bottom);

        if (!started) {
            ctx.moveTo(x, y);
            started = true;
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

function drawCandles(
    ctx: CanvasRenderingContext2D,
    candles: MarketCandle[],
    start: number,
    end: number,
    vp: Viewport,
    min: number,
    max: number,
    dims: ChartDimensions,
    config: EngineConfig
) {
    const halfWick = 0.5; // pixel width correction
    const bodyWidth = Math.max(1, vp.candleWidth * 0.8); // 80% of slot
    const gap = vp.candleWidth * 0.1;
    const height = dims.chartHeight;
    const top = config.padding.top;
    const bottom = config.padding.bottom;

    for (let i = start; i < end; i++) {
        const c = candles[i];
        const x = indexToX(i, vp.offset, vp.candleWidth, config.padding.left);
        // Center alignment
        const cx = x + (vp.candleWidth / 2);

        const openY = priceToY(c.open, min, max, height, top, bottom);
        const closeY = priceToY(c.close, min, max, height, top, bottom);
        const highY = priceToY(c.high, min, max, height, top, bottom);
        const lowY = priceToY(c.low, min, max, height, top, bottom);

        const isUp = c.close >= c.open;
        const color = isUp ? config.colors.candleUp : config.colors.candleDown;

        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        // Wick
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(crisp(cx), Math.floor(highY));
        ctx.lineTo(crisp(cx), Math.floor(lowY));
        ctx.stroke();

        // Body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(1, Math.abs(closeY - openY));
        const bodyLeft = x + gap;

        ctx.fillRect(bodyLeft, bodyTop, bodyWidth, bodyHeight);
    }
}

function drawPriceLine(
    ctx: CanvasRenderingContext2D,
    price: number,
    min: number,
    max: number,
    dims: ChartDimensions,
    config: EngineConfig
) {
    const y = priceToY(price, min, max, dims.chartHeight, config.padding.top, config.padding.bottom);

    ctx.strokeStyle = config.colors.priceLine;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, crisp(y));
    ctx.lineTo(dims.width, crisp(y));
    ctx.stroke();
    ctx.setLineDash([]); // Reset
}

// Helper to convert candle index to X coordinate
function candleIndexToX(index: number, viewport: Viewport, padding: number): number {
    return indexToX(index, viewport.offset, viewport.candleWidth, padding);
}

// Draw all user drawings
function drawDrawings(
    ctx: CanvasRenderingContext2D,
    drawings: Drawing[],
    viewport: Viewport,
    minPrice: number,
    maxPrice: number,
    dimensions: ChartDimensions,
    config: EngineConfig,
    candleCount: number
) {
    for (const drawing of drawings) {
        if (!drawing.visible) continue;

        ctx.strokeStyle = drawing.color || '#3B82F6';
        ctx.fillStyle = drawing.color || '#3B82F6';
        ctx.lineWidth = 2;

        switch (drawing.type) {
            case 'trendline':
                drawTrendline(ctx, drawing, viewport, minPrice, maxPrice, dimensions, config);
                break;
            case 'horizontal':
                drawHorizontalLine(ctx, drawing, viewport, minPrice, maxPrice, dimensions, config);
                break;
            case 'vertical':
                drawVerticalLine(ctx, drawing, viewport, minPrice, maxPrice, dimensions, config);
                break;
            case 'rectangle':
                drawRectangle(ctx, drawing, viewport, minPrice, maxPrice, dimensions, config);
                break;
            case 'ellipse':
                drawEllipse(ctx, drawing, viewport, minPrice, maxPrice, dimensions, config);
                break;
            case 'ray':
                drawRay(ctx, drawing, viewport, minPrice, maxPrice, dimensions, config, candleCount);
                break;
        }
    }
}

function drawTrendline(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    viewport: Viewport,
    minPrice: number,
    maxPrice: number,
    dimensions: ChartDimensions,
    config: EngineConfig
) {
    if (drawing.points.length < 2) return;

    const p1 = drawing.points[0];
    const p2 = drawing.points[1];

    const x1 = candleIndexToX(p1.x, viewport, config.padding.left);
    const y1 = priceToY(p1.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);
    const x2 = candleIndexToX(p2.x, viewport, config.padding.left);
    const y2 = priceToY(p2.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawHorizontalLine(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    viewport: Viewport,
    minPrice: number,
    maxPrice: number,
    dimensions: ChartDimensions,
    config: EngineConfig
) {
    if (drawing.points.length < 1) return;

    const p = drawing.points[0];
    const y = priceToY(p.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(dimensions.width, y);
    ctx.stroke();
}

function drawVerticalLine(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    viewport: Viewport,
    minPrice: number,
    maxPrice: number,
    dimensions: ChartDimensions,
    config: EngineConfig
) {
    if (drawing.points.length < 1) return;

    const p = drawing.points[0];
    const x = candleIndexToX(p.x, viewport, config.padding.left);

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, dimensions.height);
    ctx.stroke();
}

function drawRectangle(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    viewport: Viewport,
    minPrice: number,
    maxPrice: number,
    dimensions: ChartDimensions,
    config: EngineConfig
) {
    if (drawing.points.length < 2) return;

    const p1 = drawing.points[0];
    const p2 = drawing.points[1];

    const x1 = candleIndexToX(p1.x, viewport, config.padding.left);
    const y1 = priceToY(p1.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);
    const x2 = candleIndexToX(p2.x, viewport, config.padding.left);
    const y2 = priceToY(p2.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);

    ctx.globalAlpha = 0.2;
    ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
}

function drawEllipse(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    viewport: Viewport,
    minPrice: number,
    maxPrice: number,
    dimensions: ChartDimensions,
    config: EngineConfig
) {
    if (drawing.points.length < 2) return;

    const p1 = drawing.points[0];
    const p2 = drawing.points[1];

    const x1 = candleIndexToX(p1.x, viewport, config.padding.left);
    const y1 = priceToY(p1.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);
    const x2 = candleIndexToX(p2.x, viewport, config.padding.left);
    const y2 = priceToY(p2.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.globalAlpha = 0.2;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.stroke();
}

function drawRay(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    viewport: Viewport,
    minPrice: number,
    maxPrice: number,
    dimensions: ChartDimensions,
    config: EngineConfig,
    candleCount: number
) {
    if (drawing.points.length < 2) return;

    const p1 = drawing.points[0];
    const p2 = drawing.points[1];

    const x1 = candleIndexToX(p1.x, viewport, config.padding.left);
    const y1 = priceToY(p1.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);
    const x2 = candleIndexToX(p2.x, viewport, config.padding.left);
    const y2 = priceToY(p2.y, minPrice, maxPrice, dimensions.chartHeight, config.padding.top, config.padding.bottom);

    // Calculate direction
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    // Extend to edge of screen
    const extendedX = x2 + Math.cos(angle) * dimensions.width * 2;
    const extendedY = y2 + Math.sin(angle) * dimensions.height * 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(extendedX, extendedY);
    ctx.stroke();
}

function drawCrosshair(
    ctx: CanvasRenderingContext2D,
    crosshair: { x: number; y: number; price: number; time: Date | null },
    dimensions: ChartDimensions,
    config: EngineConfig
) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(crosshair.x, 0);
    ctx.lineTo(crosshair.x, dimensions.height);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, crosshair.y);
    ctx.lineTo(dimensions.width, crosshair.y);
    ctx.stroke();

    ctx.setLineDash([]);
}
