/**
 * Zenith AI Zone Explanation Engine
 * Bridge between Math (Detection) and Language (Explanation).
 * 
 * RULES:
 * 1. AI explains WHY the zone exists (price memory, volume profile).
 * 2. AI explains WHAT invalidates it.
 * 3. AI NEVER gives price targets or "buy/sell" calls.
 */

import { ZoneCandidate } from '@/lib/analysis/zoneDetection';
import { RegimeType } from '@/components/chart-engine/engine/types';

export interface ExplanationRequest {
    symbol: string;
    timeframe: string;
    zone: ZoneCandidate;
    marketRegime: RegimeType;
}

export function generateZoneContextPrompt(req: ExplanationRequest): string {
    return `
You are Zenith, an institutional market analyst. 
Analyze this mathematically detected consolidation zone.

CONTEXT:
Symbol: ${req.symbol}
Timeframe: ${req.timeframe}
Market Regime: ${req.marketRegime}
Zone Range: ${req.zone.min.toFixed(2)} - ${req.zone.max.toFixed(2)}
Compression Strength: ${(req.zone.compressionRatio * 100).toFixed(1)}% (Lower is strictly better)
Duration: ${(req.zone.endTime - req.zone.startTime) / 1000 / 60} minutes

TASK:
Explain the significance of this structural zone in 2 sentences.
1. Why is price compressing here? (Relate to supply/demand balance)
2. What technically invalidates this zone? (Specific price/volume behavior)

RESTRICTIONS:
- NO trade advice (Buy/Sell/Long/Short).
- NO price targets.
- NO prediction of future direction.
- Tone: Institutional, objective, risk-focused.
`.trim();
}
