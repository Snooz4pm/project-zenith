import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    console.log('Unlocking paths for all users...')

    const users = await prisma.user.findMany()
    console.log(`Found ${users.length} users`)

    const paths = await prisma.pathDefinition.findMany()
    console.log(`Found ${paths.length} path definitions`)

    if (paths.length === 0) {
        console.error('No paths found! Seed them first.')
        return
    }

    for (const user of users) {
        console.log(`Processing user: ${user.email}`)

        // 1. Update/Create UserTrait with high confidence
        await prisma.userTrait.upsert({
            where: { user_id: user.email }, // Using email as ID mapping for now as established
            update: {
                calibration_confidence: 85,
                analytical_depth: 75,
                risk_discipline: 80,
                adaptability: 60,
                consistency: 90,
                emotional_stability: 70
            },
            create: {
                user_id: user.email,
                calibration_confidence: 85,
                analytical_depth: 75,
                risk_discipline: 80,
                adaptability: 60,
                consistency: 90,
                emotional_stability: 70
            }
        })

        // 2. Create UserPathScores
        // Assign arbitrary scores to make "Systematic Trading" #1 (or random)

        for (const path of paths) {
            let score = 50
            if (path.id === 'systematic-trading') score = 95
            if (path.id === 'data-research') score = 88
            if (path.id === 'market-analyst') score = 70
            if (path.id === 'execution-trader') score = 60
            if (path.id === 'macro-observer') score = 55

            await prisma.userPathScore.upsert({
                where: {
                    user_id_path_id: {
                        user_id: user.email,
                        path_id: path.id
                    }
                },
                update: { score: score, confidence: 80 },
                create: {
                    user_id: user.email,
                    path_id: path.id,
                    score: score,
                    confidence: 80
                }
            })
        }
        console.log(`Unlocked for ${user.email}`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
