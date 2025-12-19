import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    const paths = [
        {
            id: "market-analyst",
            name: "Market Analyst",
            description: "Thinks deeply, patient, structured reasoning. Fits those with high analytical depth and consistency."
        },
        {
            id: "data-research",
            name: "Data / Research",
            description: "Detail-oriented, systematic, low emotional noise. Fits those with high analytical depth and consistency."
        },
        {
            id: "systematic-trading",
            name: "Systematic Trading",
            description: "Rule-based thinker, low discretion, process driven. Fits those with high consistency and risk discipline."
        },
        {
            id: "execution-trader",
            name: "Execution Trader",
            description: "Fast decisions, comfortable with pressure, high adaptability. Fits those with high adaptability and risk discipline."
        },
        {
            id: "macro-observer",
            name: "Macro Observer",
            description: "Big-picture thinker, narrative synthesis, lower execution pressure. Fits those with high analytical depth and emotional stability."
        }
    ]

    console.log('Start seeding paths...')

    for (const path of paths) {
        const result = await prisma.pathDefinition.upsert({
            where: { id: path.id },
            update: {},
            create: path,
        })
        console.log(`Upserted path: ${result.name}`)
    }

    console.log('Seeding finished.')
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
