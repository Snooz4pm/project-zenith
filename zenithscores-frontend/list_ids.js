/**
 * Quick script to list first 10 scenario IDs
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listIds() {
    const scenarios = await prisma.decisionScenario.findMany({
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    scenarios.forEach((s, i) => {
        console.log(`${s.id}`);
    });
}

listIds()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
