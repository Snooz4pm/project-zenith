
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    const total = await prisma.decisionScenario.count();
    const withChart = await prisma.decisionScenario.count({
        where: {
            chartData: { not: process.env.DATABASE_URL.includes('postgres') ? undefined : null }, // Prisma distinct check
        }
    });

    // Actually, explicit verify
    const all = await prisma.decisionScenario.findMany({ select: { id: true, chartData: true, basePrice: true } });
    const hasChart = all.filter(s => s.chartData && Array.isArray(s.chartData) && s.chartData.length > 0).length;
    const hasBasePrice = all.filter(s => s.basePrice !== null).length;

    console.log(`Total Scenarios: ${total}`);
    console.log(`With Chart Data: ${hasChart}`);
    console.log(`With Base Price: ${hasBasePrice}`);
}

checkData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
