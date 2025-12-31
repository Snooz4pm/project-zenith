/**
 * Decision Attempts Checker
 * Shows all decision lab attempts for debugging
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAttempts() {
    console.log('🔍 Checking Decision Lab attempts...\n');

    try {
        const attempts = await prisma.decisionAttempt.findMany({
            orderBy: { decidedAt: 'desc' },
            take: 10,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                scenario: {
                    select: {
                        title: true,
                        symbol: true
                    }
                }
            }
        });

        console.log(`Found ${attempts.length} recent attempt(s):\n`);

        attempts.forEach((attempt, idx) => {
            console.log(`${idx + 1}. ${attempt.user.name || attempt.user.email}`);
            console.log(`   Scenario: ${attempt.scenario.title} (${attempt.scenario.symbol})`);
            console.log(`   Choice: ${attempt.choice}`);
            const pnl = Number(attempt.pnl) || 0;
            console.log(`   PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
            console.log(`   Time: ${attempt.decidedAt.toLocaleString()}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

checkAttempts()
    .then(() => {
        console.log('✅ Check completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
