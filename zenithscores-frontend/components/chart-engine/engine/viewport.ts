/**
 * Zenith Chart Engine - Viewport Math
 * Use this module for ALL coordinate transformations.
 * Pure functions only.
 */

import { Viewport, ChartDimensions } from './types';

/**
 * Convert data index to X pixel coordinate
 */
export function indexToX(
    index: number,
    offset: number,
    candleWidth: number,
    paddingLeft: number
): number {
    return (index - offset) * candleWidth + paddingLeft;
}

/**
 * Convert X pixel coordinate to data index (float)
 */
export function xToIndex(
    x: number,
    offset: number,
    candleWidth: number,
    paddingLeft: number
): number {
    return offset + (x - paddingLeft) / candleWidth;
}

/**
 * Convert Price to Y pixel coordinate
 */
export function priceToY(
    price: number,
    minPrice: number,
    maxPrice: number,
    height: number,
    paddingTop: number,
    paddingBottom: number
): number {
    const range = maxPrice - minPrice;
    if (range === 0) return height / 2; // Flat line fallback

    // Y is inverted (0 is top)
    const availableHeight = height - (paddingTop + paddingBottom);
    const priceRatio = (price - minPrice) / range;
    return (height - paddingBottom) - (priceRatio * availableHeight);
}

/**
 * Convert Y pixel coordinate to Price
 */
export function yToPrice(
    y: number,
    minPrice: number,
    maxPrice: number,
    height: number,
    paddingTop: number,
    paddingBottom: number
): number {
    const range = maxPrice - minPrice;
    const availableHeight = height - (paddingTop + paddingBottom);

    // Invert Y logic
    // y = bottom - ratio * h
    // ratio * h = bottom - y
    // ratio = (bottom - y) / h
    const bottomY = height - paddingBottom;
    const ratio = (bottomY - y) / availableHeight;

    return minPrice + (ratio * range);
}

/**
 * Clamp viewport offset to prevent scrolling infinitely into void
 */
export function clampOffset(
    offset: number,
    totalCandles: number,
    visibleCandles: number
): number {
    // Allow scrolling a bit past the end (future)
    const maxOffset = totalCandles + 20; // 20 candles into future
    // Allow scrolling a bit past the start (past)
    const minOffset = -5; // 5 candles before start

    return Math.max(minOffset, Math.min(offset, maxOffset));
}

/**
 * Calculate visible candle range based on viewport
 */
export function getVisibleRange(
    viewport: Viewport,
    dimensions: ChartDimensions,
    totalCandles: number
): { startIndex: number; endIndex: number; count: number } {
    const visibleCount = Math.ceil(dimensions.chartWidth / viewport.candleWidth);
    const start = Math.floor(viewport.offset);
    const end = Math.min(totalCandles - 1, Math.ceil(viewport.offset + visibleCount));

    // Ensure safe bounds for array access
    const safeStart = Math.max(0, start);
    const safeEnd = Math.min(totalCandles, end + 1); // +1 because slice is exclusive

    return {
        startIndex: safeStart,
        endIndex: safeEnd,
        count: visibleCount
    };
}
