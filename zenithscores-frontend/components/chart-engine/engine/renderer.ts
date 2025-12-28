/**
 * Zenith Chart Engine - Pure Renderer
 * Paints pixels based on state. Stateless.
 */

import {
    EngineConfig,
    MarketCandle,
    Viewport,
    DerivedIndicators,
    ChartDimensions
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
    visibleEndIndex: number
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
    drawGrid(ctx, config, dimensions, minPrice, maxPrice);

    // 3. Draw Indicators (Behind candles)
    if (indicators.ema20) drawLine(ctx, indicators.ema20, visibleStartIndex, visibleEndIndex, viewport, minPrice, maxPrice, dimensions, config, '#0ea5e9', 1.5);
    if (indicators.ema50) drawLine(ctx, indicators.ema50, visibleStartIndex, visibleEndIndex, viewport, minPrice, maxPrice, dimensions, config, '#f97316', 1.5);

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

    // 5. Draw Price Line (Current Price)
    if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        drawPriceLine(ctx, lastCandle.close, minPrice, maxPrice, dimensions, config);
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
