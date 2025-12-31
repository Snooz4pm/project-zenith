
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fallback prices for common assets
const FALLBACK_PRICES = {
    'BTC': 65000, 'ETH': 3500, 'SOL': 150, 'XRP': 0.50, 'DOGE': 0.15,
    'EUR/USD': 1.08, 'GBP/USD': 1.27, 'USD/JPY': 150, 'XAU/USD': 2000,
    'SPY': 500, 'QQQ': 430, 'SPX': 5000, 'DIA': 380, 'IWM': 200,
    'AAPL': 185, 'MSFT': 400, 'NVDA': 500, 'TSLA': 250, 'GME': 25, 'AMC': 5,
};

function resolveFromSymbol(symbol) {
    if (!symbol) return 1000;
    const norm = symbol.toUpperCase().replace(/\/USD$/, '');
    for (const [k, v] of Object.entries(FALLBACK_PRICES)) {
        if (norm.includes(k) || k.includes(norm)) return v;
    }
    return 1000;
}

async function main() {
    console.log('Starting batch price resolution...');

    // Find scenarios without basePrice
    const scenarios = await prisma.decisionScenario.findMany({
        where: { basePrice: null }
    });

    console.log(`Found ${scenarios.length} scenarios without basePrice.`);

    let updated = 0;
    for (const s of scenarios) {
        const price = resolveFromSymbol(s.symbol);
        await prisma.decisionScenario.update({
            where: { id: s.id },
            data: { basePrice: price }
        });
        updated++;
        process.stdout.write('.');
    }

    console.log(`\nUpdated ${updated} scenarios.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
