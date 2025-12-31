import prisma from '../lib/prisma';
import { resolveBasePrice } from '../lib/pricing/resolveBasePrice';

/**
 * Script to remove scenarios that cannot be played
 * A scenario is invalid if:
 * 1. It has no basePrice AND can't resolve one
 * 2. It has no chartData AND can't be played
 */
async function removeInvalidScenarios() {
    console.log('🔍 Scanning for invalid scenarios...\n');

    // Fetch all scenarios
    const allScenarios = await prisma.decisionScenario.findMany({
        select: {
            id: true,
            title: true,
            symbol: true,
            basePrice: true,
            chartData: true,
        }
    });

    console.log(`📊 Total scenarios in database: ${allScenarios.length}\n`);

    const invalidScenarios: string[] = [];

    for (const scenario of allScenarios) {
        const hasNoBasePrice = !scenario.basePrice;
        const hasNoChartData = !scenario.chartData ||
            (Array.isArray(scenario.chartData) && scenario.chartData.length === 0);

        // If it has both missing, it's definitely invalid
        if (hasNoBasePrice && hasNoChartData) {
            console.log(`❌ INVALID: ${scenario.title} (${scenario.id})`);
            console.log(`   Reason: Missing both basePrice and chartData\n`);
            invalidScenarios.push(scenario.id);
            continue;
        }

        // If it has no base price, try to resolve one
        if (hasNoBasePrice) {
            try {
                const resolvedPrice = await resolveBasePrice(scenario.id);
                if (!resolvedPrice) {
                    console.log(`❌ INVALID: ${scenario.title} (${scenario.id})`);
                    console.log(`   Reason: Could not resolve basePrice\n`);
                    invalidScenarios.push(scenario.id);
                    continue;
                }
            } catch (error) {
                console.log(`❌ INVALID: ${scenario.title} (${scenario.id})`);
                console.log(`   Reason: Error resolving basePrice - ${error}\n`);
                invalidScenarios.push(scenario.id);
                continue;
            }
        }

        // If we get here, the scenario is valid
        console.log(`✅ VALID: ${scenario.title} (${scenario.id})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📈 Summary:`);
    console.log(`   Valid scenarios: ${allScenarios.length - invalidScenarios.length}`);
    console.log(`   Invalid scenarios: ${invalidScenarios.length}`);

    if (invalidScenarios.length === 0) {
        console.log('\n✨ All scenarios are valid! Nothing to remove.');
        return;
    }

    console.log(`\n🗑️  Removing ${invalidScenarios.length} invalid scenarios...\n`);

    // First, remove related attempts (if any)
    const deletedAttempts = await prisma.decisionAttempt.deleteMany({
        where: {
            scenarioId: {
                in: invalidScenarios
            }
        }
    });

    console.log(`   Deleted ${deletedAttempts.count} related attempts`);

    // Then remove the scenarios
    const deletedScenarios = await prisma.decisionScenario.deleteMany({
        where: {
            id: {
                in: invalidScenarios
            }
        }
    });

    console.log(`   Deleted ${deletedScenarios.count} scenarios`);
    console.log('\n✅ Cleanup complete!');
}

removeInvalidScenarios()
    .then(() => {
        console.log('\n👋 Done');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
