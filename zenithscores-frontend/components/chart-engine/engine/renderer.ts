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
 * Overview Mode - Clean blue line chart (beginner friendly)
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
    const { width, height } = dimensions;

    // 1. Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0A1025');
    gradient.addColorStop(0.5, '#0A1525');
    gradient.addColorStop(1, '#0A1B20');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Build price path
    const closePrices = candles.map(c => c.close);

    // 3. Draw glow (thicker, blurred line)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.25)';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    drawPricePath(ctx, closePrices, startIndex, endIndex, viewport, minPrice, maxPrice, dimensions, config);
    ctx.stroke();

    // 4. Draw main line
    ctx.beginPath();
    ctx.strokeStyle = '#E5ECFF';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    drawPricePath(ctx, closePrices, startIndex, endIndex, viewport, minPrice, maxPrice, dimensions, config);
    ctx.stroke();
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
