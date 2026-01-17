export type ActionType = "SEED" | "SCALE" | "HARVEST" | "RECYCLE";
export type LifecyclePhase = "OBS" | "SEE" | "SCA" | "HAR" | "REC";

export interface PositionState {
    mint: string;
    symbol: string;

    // Capital state (in raw base units/lamports of SOL equivalence)
    seededAmount: bigint;    // Initial SOL value invested (in lamports)
    currentAmount: bigint;   // Current SOL value of position (in lamports)
    pnlAmount: bigint;       // Profit/Loss in SOL value (in lamports)

    // Lifecycle flags
    hasPosition: boolean;
    canSeed: boolean;
    canScale: boolean;
    canHarvest: boolean;
    canExit: boolean;
    currentPhase: LifecyclePhase;

    // Safety
    dust: boolean;
}

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDT_MINT = 'Es9vMFrzaCERJbRyxj6zS1kq4p9GZ9erjRzCQXDpUe8';
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

export const EXIT_TARGETS = [
    { symbol: "SOL", mint: SOL_MINT },
    { symbol: "USDC", mint: USDC_MINT },
    { symbol: "wSOL", mint: WSOL_MINT },
    { symbol: "USDT", mint: USDT_MINT }
];

export const MIN_LAMPORTS = BigInt(50_000); // ~0.00005 SOL safety dust
export const MIN_EXIT_LAMPORTS = BigInt(10_000); // ~0.00001 SOL absolute minimum to swap

/**
 * resolveExitMints
 * Forces output to SOL for any exit style action.
 * Prevents Identity Swap Bug (GEM -> GEM).
 */
export function resolveExitMints(inputMint: string) {
    const outputMint =
        inputMint === SOL_MINT
            ? USDC_MINT // If we are liquidating SOL itself (rare), fallback to USDC
            : SOL_MINT;

    return { inputMint, outputMint };
}

/**
 * derivePositionState
 * The Truth Engine: Computes the canonical state of a position.
 * We use SOL-equivalence (Lamports) for PnL tracking.
 */
export function derivePositionState(
    mint: string,
    symbol: string,
    currentValueSOL: number, // Current position value in SOL
    enginePosition?: any     // Existing position metadata
): PositionState {
    const SOL_DECIMALS = 9;
    const currentAmount = BigInt(Math.floor(currentValueSOL * Math.pow(10, SOL_DECIMALS)));

    // seededAmount is the initial SOL we put in. 
    const seededAmount = enginePosition?.investedUsd && enginePosition?.solPriceAtEntry
        ? BigInt(Math.floor((enginePosition.investedUsd / enginePosition.solPriceAtEntry) * Math.pow(10, SOL_DECIMALS)))
        : BigInt(0);

    const pnlAmount = currentAmount - seededAmount;
    const dust = currentAmount > BigInt(0) && currentAmount < MIN_LAMPORTS;
    const hasPosition = currentAmount >= MIN_LAMPORTS;

    return {
        mint,
        symbol,
        seededAmount,
        currentAmount,
        pnlAmount,

        hasPosition,
        canSeed: true, // Always allow adding more seed/investing
        canScale: hasPosition && pnlAmount > BigInt(0),
        canHarvest: hasPosition && pnlAmount > MIN_LAMPORTS,
        canExit: currentAmount > BigInt(0),
        dust,
        currentPhase: deriveCurrentPhase(hasPosition, pnlAmount)
    };
}

/**
 * deriveCurrentPhase
 * Maps capital state to the canonical lifecycle phase.
 */
export function deriveCurrentPhase(hasPosition: boolean, pnlAmount: bigint): LifecyclePhase {
    if (!hasPosition) return "OBS";
    if (pnlAmount > BigInt(0)) {
        if (pnlAmount > MIN_LAMPORTS) return "HAR";
        return "SCA";
    }
    return "SEE";
}

/**
 * assertValidAmount
 * Prevents zero or dust-level transactions.
 */
export function assertValidAmount(amountRaw: string | bigint) {
    const val = BigInt(amountRaw);
    if (val <= BigInt(0)) {
        throw new Error("Invalid amount: zero or negative");
    }

    if (val < MIN_EXIT_LAMPORTS) {
        throw new Error(`Invalid amount: position too small to exit safely (min ${MIN_EXIT_LAMPORTS} units)`);
    }
}
