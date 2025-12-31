import prisma from '../lib/prisma';

async function checkScenarioIds() {
  const scenarios = await prisma.decisionScenario.findMany({
    select: { id: true, title: true }
  });

  const withSlashes = scenarios.filter(s => s.id.includes('/'));

  console.log('Scenarios with forward slashes in ID:');
  console.log('='.repeat(60));
  withSlashes.forEach(s => {
    console.log(`ID: ${s.id}`);
    console.log(`Title: ${s.title}`);
    console.log(`URL: /decision-lab/${s.id}`);
    console.log(`URL Encoded: /decision-lab/${encodeURIComponent(s.id)}`);
    console.log('---');
  });

  console.log(`\nTotal scenarios with slashes: ${withSlashes.length}`);
  process.exit(0);
}

checkScenarioIds();
