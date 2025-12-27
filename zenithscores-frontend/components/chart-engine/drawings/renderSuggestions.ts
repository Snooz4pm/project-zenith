/**
 * Zenith Chart Engine - Auto-Zone Renderer
 * Renders suggested zones.
 * VISUAL RULES:
 * - Dashed lines (implies "temporary/suggestion")
 * - 40% Opacity fill
 * - Distinct from user drawn zones
 */

import { Drawing } from '../engine/types';

export function renderSuggestions(
    ctx: CanvasRenderingContext2D,
    suggestions: Drawing[],
    world: { timeToX: (t: number) => number, priceToY: (p: number) => number }
) {
    if (!suggestions || suggestions.length === 0) return;

    ctx.save();

    // Style for Suggestions
    ctx.strokeStyle = '#22d3ee'; // Cyan-400
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)'; // Cyan-400 @ 10%
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]); // Dashed Line

    for (const zone of suggestions) {
        if (!zone.visible) continue;
        if (zone.points.length < 2) continue;

        const p1 = zone.points[0];
        const p2 = zone.points[1];

        const x1 = world.timeToX(p1.x);
        const y1 = world.priceToY(p1.y);
        const x2 = world.timeToX(p2.x);
        const y2 = world.priceToY(p2.y);

        const width = x2 - x1;
        const height = y2 - y1;

        // Draw Rect
        ctx.beginPath();
        ctx.rect(x1, y1, width, height);
        ctx.fill();
        ctx.stroke();

        // Optional Label
        if (zone.label) {
            ctx.fillStyle = '#22d3ee';
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(zone.label, x1 + 4, y1 - 4);
            // Reset fill
            ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
        }
    }

    ctx.restore();
}
