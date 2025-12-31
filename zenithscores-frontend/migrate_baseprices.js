/**
 * BasePrice Migration Script
 * 
 * Updates all existing DecisionScenarios with appropriate basePrice values
 * based on their symbol and historical context.
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Historical base prices for common assets (approximate values for scenario context)
const BASE_PRICES = {
    // Crypto
    'BTC/USD': 65000,
    'ETH/USD': 3500,
    'SOL/USD': 150,
    'DOGE/USD': 0.15,
    'LUNA/USD': 80,  // Pre-collapse
    'XRP/USD': 0.50,
    'ADA/USD': 0.45,
    'AVAX/USD': 35,
    'MATIC/USD': 0.80,
    'DOT/USD': 7,
    'LINK/USD': 15,
    'UNI/USD': 8,
    'AAVE/USD': 100,
    'FTT': 25, // Pre-collapse

    // Forex
    'EUR/USD': 1.08,
    'GBP/USD': 1.27,
    'USD/JPY': 150,
    'USD/CHF': 0.88,
    'AUD/USD': 0.65,
    'USD/CAD': 1.36,
    'NZD/USD': 0.60,
    'Gold': 2000,
    'XAU/USD': 2000,
    'WTI': 75,
    'Crude': 75,

    // Stocks
    'AAPL': 185,
    'MSFT': 400,
    'GOOGL': 140,
    'AMZN': 180,
    'TSLA': 250,
    'NVDA': 500,
    'META': 350,
    'NFLX': 600,
    'AMD': 150,
    'GME': 25,
    'AMC': 5,
    'SPY': 500,
    'QQQ': 430,
    'SPX': 5000,
    'S&P': 5000,
    'Nasdaq': 17000,
    'DJI': 38000,
};

// Infer base price from symbol or chart data
function inferBasePrice(scenario) {
    const symbol = scenario.symbol?.toUpperCase() || '';

    // Direct match
    for (const [key, price] of Object.entries(BASE_PRICES)) {
        if (symbol.includes(key.toUpperCase())) {
            return price;
        }
    }

    // Try to extract from chart data
    if (scenario.chartData && Array.isArray(scenario.chartData) && scenario.chartData.length > 0) {
        const firstCandle = scenario.chartData[0];
        if (firstCandle && (firstCandle.open || firstCandle.close)) {
            return Number(firstCandle.open || firstCandle.close);
        }
    }

    // Default fallback
    console.warn(`  ⚠️ Could not infer basePrice for ${scenario.symbol}, using 100`);
    return 100;
}

async function migrateBasePrices() {
    console.log('🔧 BasePrice Migration Script');
    console.log('='.repeat(50));

    const scenarios = await prisma.decisionScenario.findMany({
        where: { basePrice: null },
        select: { id: true, symbol: true, title: true, chartData: true }
    });

    console.log(`Found ${scenarios.length} scenarios without basePrice`);

    let updated = 0;
    let failed = 0;

    for (const scenario of scenarios) {
        try {
            const basePrice = inferBasePrice(scenario);

            await prisma.decisionScenario.update({
                where: { id: scenario.id },
                data: { basePrice }
            });

            console.log(`  ✅ ${scenario.symbol}: $${basePrice.toLocaleString()}`);
            updated++;
        } catch (err) {
            console.error(`  ❌ Failed: ${scenario.symbol} - ${err.message}`);
            failed++;
        }
    }

    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
}

migrateBasePrices()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
