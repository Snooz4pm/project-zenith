/**
 * Zenith Chart Engine - Interactions
 * Pure logic for interpreting user input.
 * Returns INTENT (new state candidates), does not execute side effects.
 */

import { Viewport, Drawing, DrawingTool, Point, ChartDimensions } from './types';
import { clampOffset } from './viewport';

/**
 * Calculate new viewport after a PAN operation
 */
export function calculatePan(
    currentViewport: Viewport,
    deltaX: number, // pixels moved
    totalCandles: number,
    visibleCandlesCount: number
): Viewport {
    // DeltaX > 0 means dragging RIGHT, so we want to see PAST (scrolling left) -> decrease offset
    // DeltaX < 0 means dragging LEFT, so we want to see FUTURE (scrolling right) -> increase offset

    // How many candles fit in the deltaX pixels?
    const candlesMoved = deltaX / currentViewport.candleWidth;

    const newOffset = currentViewport.offset - candlesMoved;
    const clampedOffset = clampOffset(newOffset, totalCandles, visibleCandlesCount);

    return {
        ...currentViewport,
        offset: clampedOffset
    };
}

/**
 * Calculate new viewport after a ZOOM operation
 */
export function calculateZoom(
    currentViewport: Viewport,
    deltaY: number, // scroll amount
    cursorXRatio: number | null, // 0 to 1 position of cursor relative to chart width (focal point)
    totalCandles: number,
    visibleCandlesCount: number
): Viewport {
    // Determine zoom factor
    const sensitivity = 0.001;
    const zoomFactor = Math.exp(-deltaY * sensitivity);

    // Apply limits to scale
    const minScale = 1; // max zoomed out (many candles)
    const maxScale = 50; // max zoomed in (few candles)

    // Current candleWidth
    let newCandleWidth = currentViewport.candleWidth * zoomFactor;

    // Clamp candle width (pixels per candle)
    // Min 1px per candle (zoomed out far)
    // Max 100px per candle (zoomed in close)
    newCandleWidth = Math.max(1, Math.min(100, newCandleWidth));

    const newScale = newCandleWidth / 10; // Normalized scale proxy if needed

    // Focal point zoom adjustment
    // If zooming in, the offset needs to shift to keep the cursor over the same candle
    // We'll simplisticly keep left side anchored or center if no cursor provided
    // For robust focal zoom:
    // 1. Calc index under cursor BEFORE zoom
    // 2. Calc index under cursor AFTER zoom (would be different if only width changed)
    // 3. Adjust offset to match

    // For now: Simple scaling, offset stays same (anchors left)
    // TODO: Implement focal point zoom if desired in next iteration.

    // Re-clamp offset in case zoom changed visible range significantly
    const clampedOffset = clampOffset(currentViewport.offset, totalCandles, visibleCandlesCount);

    return {
        offset: clampedOffset,
        scale: newScale,
        candleWidth: newCandleWidth
    };
}

/**
 * Convert screen X position to candle index
 */
function screenToCandle(
    x: number,
    viewport: Viewport,
    dims: { width: number; height: number; chartWidth: number; chartHeight: number },
    totalCandles: number
): number {
    const candleIndex = Math.floor(viewport.offset + x / viewport.candleWidth);
    return Math.max(0, Math.min(totalCandles - 1, candleIndex));
}

/**
 * Convert screen Y position to price
 */
function screenToPrice(
    y: number,
    priceRange: { min: number; max: number },
    dims: { width: number; height: number; chartWidth: number; chartHeight: number },
    padding: { top: number; bottom: number }
): number {
    const chartHeight = dims.height - padding.top - padding.bottom;
    const normalizedY = (y - padding.top) / chartHeight;
    return priceRange.max - (normalizedY * (priceRange.max - priceRange.min));
}

/**
 * Start a new drawing
 */
export function handleDrawingStart(
    tool: DrawingTool,
    x: number,
    y: number,
    viewport: Viewport,
    priceRange: { min: number; max: number },
    dims: { width: number; height: number; chartWidth: number; chartHeight: number }
): Drawing {
    const price = screenToPrice(y, priceRange, { ...dims, chartHeight: dims.height }, { top: 30, bottom: 80 });
    const candleIndex = screenToCandle(x, viewport, { ...dims, chartWidth: dims.width, chartHeight: dims.height }, 1000);

    return {
        id: `drawing-${Date.now()}`,
        type: (tool || 'trendline') as any,
        points: [{ x: candleIndex, y: price }],
        visible: true,
        locked: false,
        color: '#3B82F6'
    };
}

/**
 * Update drawing as mouse moves
 */
export function handleDrawingMove(
    drawing: Drawing,
    x: number,
    y: number,
    viewport: Viewport,
    priceRange: { min: number; max: number },
    dims: { width: number; height: number; chartWidth: number; chartHeight: number }
): Drawing {
    const price = screenToPrice(y, priceRange, { ...dims, chartHeight: dims.height }, { top: 30, bottom: 80 });
    const candleIndex = screenToCandle(x, viewport, { ...dims, chartWidth: dims.width, chartHeight: dims.height }, 1000);

    return {
        ...drawing,
        points: drawing.points.length === 1
            ? [...drawing.points, { x: candleIndex, y: price }]
            : [drawing.points[0], { x: candleIndex, y: price }]
    };
}

/**
 * Finalize drawing
 */
export function handleDrawingEnd(drawing: Drawing): Drawing {
    return {
        ...drawing,
        locked: false
    };
}
