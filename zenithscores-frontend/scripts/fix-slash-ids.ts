import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Fix scenario IDs that contain forward slashes
 * These cause routing issues in Next.js
 */
async function fixSlashIds() {
    console.log('🔧 Fixing scenarios with forward slashes in IDs...\n');

    const problematicScenarios = [
        {
            oldId: 'usd/jpy-intervention',
            newId: 'usdjpy-intervention',
            title: 'USD/JPY Intervention'
        },
        {
            oldId: 'eur/usd-parity-test',
            newId: 'eurusd-parity-test',
            title: 'EUR/USD Parity Test'
        }
    ];

    for (const scenario of problematicScenarios) {
        console.log(`📝 Fixing: ${scenario.title}`);
        console.log(`   Old ID: ${scenario.oldId}`);
        console.log(`   New ID: ${scenario.newId}`);

        try {
            // Check if scenario exists
            const exists = await prisma.decisionScenario.findUnique({
                where: { id: scenario.oldId }
            });

            if (!exists) {
                console.log(`   ⚠️  Scenario not found, skipping...\n`);
                continue;
            }

            // Update scenario ID in a transaction
            await prisma.$transaction(async (tx) => {
                // 1. Update any attempts that reference this scenario
                const updatedAttempts = await tx.decisionAttempt.updateMany({
                    where: { scenarioId: scenario.oldId },
                    data: { scenarioId: scenario.newId }
                });
                console.log(`   Updated ${updatedAttempts.count} attempts`);

                // 2. Create new scenario with new ID
                const oldScenario = await tx.decisionScenario.findUnique({
                    where: { id: scenario.oldId }
                });

                if (oldScenario) {
                    await tx.decisionScenario.create({
                        data: {
                            id: scenario.newId,
                            title: oldScenario.title,
                            description: oldScenario.description,
                            marketType: oldScenario.marketType,
                            symbol: oldScenario.symbol,
                            timeframe: oldScenario.timeframe,
                            difficulty: oldScenario.difficulty,
                            isPremium: oldScenario.isPremium,
                            source: oldScenario.source,
                            startTime: oldScenario.startTime,
                            pauseTime: oldScenario.pauseTime,
                            endTime: oldScenario.endTime,
                            decisionPrompt: oldScenario.decisionPrompt,
                            eventName: oldScenario.eventName,
                            basePrice: oldScenario.basePrice,
                            chartData: oldScenario.chartData as Prisma.InputJsonValue,
                            annotations: oldScenario.annotations as Prisma.InputJsonValue,
                            correctChoice: oldScenario.correctChoice,
                            explanationOutcome: oldScenario.explanationOutcome,
                            tags: oldScenario.tags as Prisma.InputJsonValue,
                            createdAt: oldScenario.createdAt,
                            updatedAt: new Date()
                        }
                    });

                    // 3. Delete old scenario
                    await tx.decisionScenario.delete({
                        where: { id: scenario.oldId }
                    });
                }
            });

            console.log(`   ✅ Successfully fixed!\n`);
        } catch (error) {
            console.error(`   ❌ Error: ${error}\n`);
        }
    }

    console.log('✨ All done!');
}

fixSlashIds()
    .then(() => {
        console.log('\n👋 Complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
