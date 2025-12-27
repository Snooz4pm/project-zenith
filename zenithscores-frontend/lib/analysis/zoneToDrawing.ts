import { ZoneCandidate } from './zoneDetection'
import { Drawing } from '@/components/chart-engine/engine/types';

/**
 * Convert a detected zone into a strict Engine Drawing object
 */
export function zoneToDrawing(zone: ZoneCandidate): Drawing {
    return {
        id: crypto.randomUUID(),
        type: 'zone', // Matches DrawingType 'zone' in engine/types.ts
        points: [
            { x: zone.startTime, y: zone.min }, // Map startTime -> x, min -> y
            { x: zone.endTime, y: zone.max }    // Map endTime -> x, max -> y
        ],
        visible: true,
        locked: false,
        label: `Consolidation (Comp: ${zone.compressionRatio.toFixed(2)})`,
        meta: {
            source: 'ai_suggestion',
            compressionRatio: zone.compressionRatio,
            createdAt: Date.now()
        }
    }
}
