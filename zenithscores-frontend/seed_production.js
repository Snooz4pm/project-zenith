/**
 * Quick Scenario Seeding Script for Production
 * Seeds basic scenarios to the Neon production database
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate synthetic chart data
function generateChartData(basePrice, volatility = 0.02, count = 100) {
    const data = [];
    let price = basePrice;
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.5) * volatility * price;
        const open = price;
        price += change;
        const high = Math.max(open, price) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, price) * (1 - Math.random() * volatility * 0.5);
        const close = price;

        data.push({
            time: Math.floor((now - (count - i) * 86400000) / 1000),
            open,
            high,
            low,
            close,
            volume: Math.floor(Math.random() * 1000000)
        });
    }
    return data;
}

const SCENARIOS = [
    {
        title: "BTC ETF Approval Rally",
        symbol: "BTC/USD",
        marketType: "crypto",
        timeframe: "1D",
        difficulty: "medium",
        basePrice: 45000,
        source: "synthetic",
        decisionPrompt: "Bitcoin just broke $45k on ETF approval news. Do you chase?",
        eventName: "BTC ETF Approval"
    },
    {
        title: "ETH Merge Anticipation",
        symbol: "ETH/USD",
        marketType: "crypto",
        timeframe: "4h",
        difficulty: "medium",
        basePrice: 1800,
        source: "synthetic",
        decisionPrompt: "ETH consolidating before the Merge. What's your play?",
        eventName: "The Merge"
    },
    {
        title: "LUNA Death Spiral",
        symbol: "LUNA/USD",
        marketType: "crypto",
        timeframe: "1h",
        difficulty: "hard",
        basePrice: 80,
        source: "synthetic",
        decisionPrompt: "LUNA is crashing. UST peg is slipping. Dip buy or run?",
        eventName: "LUNA Collapse"
    },
    {
        title: "GME Short Squeeze",
        symbol: "GME",
        marketType: "stocks",
        timeframe: "15m",
        difficulty: "hard",
        basePrice: 40,
        source: "synthetic",
        decisionPrompt: "GME is up 300% this week. Join the apes or short?",
        eventName: "Meme Stock Mania"
    },
    {
        title: "COVID Market Crash",
        symbol: "SPY",
        marketType: "stocks",
        timeframe: "1D",
        difficulty: "hard",
        basePrice: 280,
        source: "synthetic",
        decisionPrompt: "Markets tanking on COVID fears. Buy the dip or sell everything?",
        eventName: "COVID-19 Crash"
    },
    {
        title: "USD/JPY Intervention",
        symbol: "USD/JPY",
        marketType: "forex",
        timeframe: "1h",
        difficulty: "hard",
        basePrice: 150,
        source: "synthetic",
        decisionPrompt: "BOJ intervention rumors at 150.00. Long or short?",
        eventName: "BOJ Intervention"
    },
    {
        title: "EUR/USD Parity Test",
        symbol: "EUR/USD",
        marketType: "forex",
        timeframe: "1D",
        difficulty: "medium",
        basePrice: 1.00,
        source: "synthetic",
        decisionPrompt: "Euro at parity for first time in 20 years. Bounce or break?",
        eventName: "Euro Parity"
    },
    {
        title: "NVDA AI Breakout",
        symbol: "NVDA",
        marketType: "stocks",
        timeframe: "1D",
        difficulty: "medium",
        basePrice: 300,
        source: "synthetic",
        decisionPrompt: "NVDA reports massive AI demand. Chase the rally?",
        eventName: "AI Boom"
    }
];

async function seedScenarios() {
    console.log('🚀 Seeding Scenarios to Production Database...');
    console.log('='.repeat(50));

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let created = 0;
    let updated = 0;

    for (const scenario of SCENARIOS) {
        const chartData = generateChartData(scenario.basePrice);

        try {
            const result = await prisma.decisionScenario.upsert({
                where: { id: scenario.title.toLowerCase().replace(/\s+/g, '-') },
                update: {
                    chartData,
                    basePrice: scenario.basePrice
                },
                create: {
                    id: scenario.title.toLowerCase().replace(/\s+/g, '-'),
                    title: scenario.title,
                    symbol: scenario.symbol,
                    marketType: scenario.marketType,
                    timeframe: scenario.timeframe,
                    difficulty: scenario.difficulty,
                    basePrice: scenario.basePrice,
                    source: scenario.source,
                    startTime: oneMonthAgo,
                    pauseTime: twoWeeksAgo,
                    endTime: now,
                    chartData,
                    isPremium: false,
                    decisionPrompt: scenario.decisionPrompt,
                    eventName: scenario.eventName
                }
            });

            console.log(`  ✅ ${result.title} (${result.symbol})`);
            created++;
        } catch (err) {
            console.error(`  ❌ ${scenario.title}: ${err.message}`);
        }
    }

    console.log('='.repeat(50));
    console.log(`✅ Seeded ${created} scenarios`);

    // Count total
    const total = await prisma.decisionScenario.count();
    console.log(`📊 Total scenarios in database: ${total}`);
}

seedScenarios()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
