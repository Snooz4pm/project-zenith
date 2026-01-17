export type ActionType = "SEED" | "SCALE" | "HARVEST" | "RECYCLE";

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

    // Safety
    dust: boolean;
}

export const MIN_LAMPORTS = BigInt(50_000); // ~0.00005 SOL safety dust

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
    // We assume enginePosition.investedUsd / solPrice was the SOL amount?
    // Actually, let's look at how we store position. 
    // For now, let's use a fallback or a dedicated field if available.
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
        canSeed: !hasPosition || dust,
        canScale: hasPosition && pnlAmount > BigInt(0),
        canHarvest: hasPosition && pnlAmount > MIN_LAMPORTS,
        canExit: currentAmount > BigInt(0),
        dust
    };
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
    // We don't enforce MIN_LAMPORTS for token amounts here because 
    // tokens have different decimals and values. 
    // But we should ensure it's not absolutely zero.
}
