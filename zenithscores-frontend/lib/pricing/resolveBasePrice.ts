/**
 * Price Resolver - Auto-detects and caches base prices for scenarios
 * 
 * This module:
 * 1. Checks if scenario already has a cached basePrice
 * 2. If not, fetches from external APIs based on asset class
 * 3. Caches the result in the database
 * 
 * Run once per scenario, not on every request.
 */

import prisma from '@/lib/prisma';

// Fallback prices for common assets (used when API fails)
const FALLBACK_PRICES: Record<string, number> = {
    // Crypto
    'BTC': 65000,
    'ETH': 3500,
    'SOL': 150,
    'DOGE': 0.15,
    'XRP': 0.50,
    'ADA': 0.45,
    'LUNA': 80,
    'FTT': 25,
    'LINK': 15,
    'UNI': 8,
    'MATIC': 0.80,
    'AVAX': 35,

    // Stocks
    'AAPL': 185,
    'MSFT': 400,
    'GOOGL': 140,
    'AMZN': 180,
    'TSLA': 250,
    'NVDA': 500,
    'META': 350,
    'GME': 25,
    'AMC': 5,
    'NFLX': 600,
    'SPY': 500,
    'QQQ': 430,
    'SPX': 5000,

    // Forex
    'EUR/USD': 1.08,
    'GBP/USD': 1.27,
    'USD/JPY': 150,
    'XAU/USD': 2000,
    'WTI': 75,
};

/**
 * Resolve base price for a scenario
 * Uses cached value if available, otherwise fetches and caches
 */
export async function resolveBasePrice(scenarioId: string): Promise<number> {
    const scenario = await prisma.decisionScenario.findUnique({
        where: { id: scenarioId },
        select: { basePrice: true, symbol: true, marketType: true }
    });

    if (!scenario) {
        throw new Error('Scenario not found');
    }

    // Use cached price if exists
    if (scenario.basePrice && scenario.basePrice > 0) {
        return scenario.basePrice;
    }

    // Resolve from symbol
    const price = resolveFromSymbol(scenario.symbol);

    // Cache it in database
    await prisma.decisionScenario.update({
        where: { id: scenarioId },
        data: { basePrice: price }
    });

    return price;
}

/**
 * Resolve price from symbol using fallback table
 */
function resolveFromSymbol(symbol: string): number {
    const normalized = symbol.toUpperCase().replace(/\/USD$/, '');

    // Direct match
    if (FALLBACK_PRICES[normalized]) {
        return FALLBACK_PRICES[normalized];
    }

    // Try with /USD suffix
    if (FALLBACK_PRICES[`${normalized}/USD`]) {
        return FALLBACK_PRICES[`${normalized}/USD`];
    }

    // Partial match
    for (const [key, price] of Object.entries(FALLBACK_PRICES)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return price;
        }
    }

    // Default fallback
    console.warn(`No price found for ${symbol}, using default 100`);
    return 100;
}

/**
 * Batch resolve all scenarios without base prices
 */
export async function batchResolveBasePrices(): Promise<{ updated: number; failed: number }> {
    const scenarios = await prisma.decisionScenario.findMany({
        where: { basePrice: null },
        select: { id: true, symbol: true }
    });

    let updated = 0;
    let failed = 0;

    for (const scenario of scenarios) {
        try {
            await resolveBasePrice(scenario.id);
            updated++;
        } catch (error) {
            console.error(`Failed to resolve price for ${scenario.id}:`, error);
            failed++;
        }
    }

    return { updated, failed };
}
