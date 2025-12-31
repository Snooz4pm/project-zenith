/**
 * Database Cleanup Script - Remove Invalid Decision Lab Scenarios
 *
 * This script removes scenarios that cannot be played because they lack
 * the required data (basePrice or chartData).
 *
 * Run with: npx tsx scripts/cleanup-invalid-scenarios.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupInvalidScenarios() {
    console.log('🧹 Starting cleanup of invalid Decision Lab scenarios...\n');

    try {
        // Find all scenarios and filter in-memory
        // (Prisma doesn't support complex JSON queries for empty arrays)
        const allScenarios = await prisma.decisionScenario.findMany({
            select: {
                id: true,
                title: true,
                symbol: true,
                createdAt: true,
                basePrice: true,
                chartData: true
            }
        });

        // Filter scenarios that have neither basePrice nor valid chartData
        const invalidScenarios = allScenarios.filter(scenario => {
            const hasNoBasePrice = !scenario.basePrice;
            const hasNoChartData = !scenario.chartData ||
                (Array.isArray(scenario.chartData) && scenario.chartData.length === 0);
            return hasNoBasePrice && hasNoChartData;
        });

        if (invalidScenarios.length === 0) {
            console.log('✅ No invalid scenarios found. Database is clean!');
            return;
        }

        console.log(`Found ${invalidScenarios.length} invalid scenario(s):\n`);

        invalidScenarios.forEach((scenario, index) => {
            console.log(`${index + 1}. ${scenario.title} (${scenario.symbol})`);
            console.log(`   ID: ${scenario.id}`);
            console.log(`   Created: ${scenario.createdAt.toISOString()}\n`);
        });

        // Delete the invalid scenarios by ID
        const invalidIds = invalidScenarios.map(s => s.id);
        const deleteResult = await prisma.decisionScenario.deleteMany({
            where: {
                id: {
                    in: invalidIds
                }
            }
        });

        console.log(`\n✅ Successfully deleted ${deleteResult.count} invalid scenario(s).`);
        console.log('   These scenarios will no longer appear in the UI or cause 404 errors.\n');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanupInvalidScenarios()
    .then(() => {
        console.log('🎉 Cleanup completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Cleanup failed:', error);
        process.exit(1);
    });
