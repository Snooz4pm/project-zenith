import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_ROOMS = [
  {
    slug: 'crypto-intraday',
    name: 'Crypto — Intraday',
    description: 'Short-term crypto setups. Scalps, momentum, breakouts.',
    marketType: 'crypto',
    isSystem: true,
    isPublic: true,
    requiresApproval: false
  },
  {
    slug: 'crypto-swing',
    name: 'Crypto — Swing',
    description: 'Multi-day crypto positions. Thesis-driven plays.',
    marketType: 'crypto',
    isSystem: true,
    isPublic: true,
    requiresApproval: false
  },
  {
    slug: 'stocks-earnings',
    name: 'Stocks — Earnings',
    description: 'Earnings plays. Pre-announcements, reactions, volatility.',
    marketType: 'stock',
    isSystem: true,
    isPublic: true,
    requiresApproval: false
  },
  {
    slug: 'stocks-macro',
    name: 'Stocks — Macro',
    description: 'Market-wide themes. Fed policy, sector rotation, risk-on/off.',
    marketType: 'stock',
    isSystem: true,
    isPublic: true,
    requiresApproval: false
  },
  {
    slug: 'forex-london',
    name: 'Forex — London Session',
    description: 'European session trading. GBP, EUR pairs.',
    marketType: 'forex',
    isSystem: true,
    isPublic: true,
    requiresApproval: false
  },
  {
    slug: 'forex-newyork',
    name: 'Forex — New York Session',
    description: 'US session trading. USD pairs, cross-session overlaps.',
    marketType: 'forex',
    isSystem: true,
    isPublic: true,
    requiresApproval: false
  }
];

async function seedRooms() {
  console.log('🌱 Seeding initial trader rooms...');

  for (const room of INITIAL_ROOMS) {
    await prisma.room.upsert({
      where: { slug: room.slug },
      update: room,
      create: room
    });
    console.log(`   ✓ ${room.name}`);
  }

  console.log(`\n✅ Seeded ${INITIAL_ROOMS.length} rooms successfully!`);
}

seedRooms()
  .catch((error) => {
    console.error('❌ Error seeding rooms:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
