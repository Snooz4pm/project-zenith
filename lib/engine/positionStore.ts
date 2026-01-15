export interface EnginePosition {
    id: string;
    baseMint: string;
    targetMint: string;
    investedUsd: number;
    entryPriceUsd: number;
    amount: number;
    phase: string;
    createdAt: number;
}

// In-memory store (clears on restart, as requested for "memory" persistence)
let positions: EnginePosition[] = [];

export function upsertPosition(pos: EnginePosition) {
    const index = positions.findIndex(p => p.id === pos.id);
    if (index > -1) {
        positions[index] = pos;
    } else {
        positions.push(pos);
    }
}

export function getPositions() {
    return [...positions];
}
