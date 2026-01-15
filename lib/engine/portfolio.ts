export const SEED_PCT = 0.02;

export function computePortfolioUsd(wallet: any, solPrice: number = 0) {
    let total = 0;

    // Add SOL value if price is provided
    if (wallet.sol) {
        total += wallet.sol * solPrice;
    }

    // Add token values
    for (const t of wallet.tokens || []) {
        // Rely on pre-calculated usdValue or fallback to 0
        if (t.usdValue) {
            total += t.usdValue;
        }
    }

    return total;
}

export function computeSeedUsd(portfolioUsd: number) {
    return portfolioUsd * SEED_PCT;
}
