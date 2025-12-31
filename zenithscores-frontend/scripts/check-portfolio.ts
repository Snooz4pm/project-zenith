/**
 * Portfolio Verification Script
 *
 * Checks portfolio status for all users and displays balances.
 * Run with: npx tsx scripts/check-portfolio.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPortfolios() {
    console.log('💼 Checking portfolio status...\n');

    try {
        // Get all users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (users.length === 0) {
            console.log('⚠️  No users found in database.');
            return;
        }

        console.log(`Found ${users.length} user(s):\n`);

        for (const user of users) {
            console.log(`👤 User: ${user.name || user.email}`);
            console.log(`   ID: ${user.id}`);

            // Check for portfolio
            const portfolio = await prisma.portfolio.findUnique({
                where: { userId: user.id },
                include: {
                    trades: {
                        orderBy: { timestamp: 'desc' },
                        take: 5
                    }
                }
            });

            if (!portfolio) {
                console.log('   ❌ No portfolio found');
            } else {
                console.log(`   ✅ Portfolio exists`);
                console.log(`   💰 Balance: $${portfolio.balance.toFixed(2)}`);
                console.log(`   📊 Total Realized P&L: $${portfolio.totalRealizedPnL.toFixed(2)}`);
                console.log(`   📅 Last Updated: ${portfolio.updatedAt.toISOString()}`);

                if (portfolio.trades.length > 0) {
                    console.log(`   📈 Recent Trades (last ${portfolio.trades.length}):`);
                    portfolio.trades.forEach((trade, idx) => {
                        const pnl = Number(trade.realizedPnL) || 0;
                        const sign = pnl >= 0 ? '+' : '';
                        console.log(`      ${idx + 1}. ${trade.symbol} ${trade.side} - ${sign}$${pnl.toFixed(2)} (${trade.timestamp.toLocaleString()})`);
                    });
                } else {
                    console.log('   📈 No trades yet');
                }
            }
            console.log('');
        }

        // Summary
        const allPortfolios = await prisma.portfolio.findMany({
            select: {
                balance: true,
                totalRealizedPnL: true
            }
        });

        if (allPortfolios.length > 0) {
            const totalBalance = allPortfolios.reduce((sum, p) => sum + Number(p.balance), 0);
            const totalPnL = allPortfolios.reduce((sum, p) => sum + Number(p.totalRealizedPnL), 0);

            console.log('📊 Platform Summary:');
            console.log(`   Total Portfolios: ${allPortfolios.length}`);
            console.log(`   Total Balance: $${totalBalance.toFixed(2)}`);
            console.log(`   Total P&L: $${totalPnL.toFixed(2)}`);
        }

    } catch (error) {
        console.error('❌ Error checking portfolios:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the check
checkPortfolios()
    .then(() => {
        console.log('\n✅ Portfolio check completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Check failed:', error);
        process.exit(1);
    });
