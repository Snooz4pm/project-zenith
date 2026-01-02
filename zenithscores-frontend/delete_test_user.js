const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load .env.local manually
try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.error('Error loading .env.local', e);
}

const prisma = new PrismaClient();

async function main() {
    const targetName = 'testuser testuser';

    // First find the user to confirm existence
    const users = await prisma.user.findMany({
        where: {
            name: {
                equals: targetName,
                mode: 'insensitive' // Case insensitive search
            }
        }
    });

    if (users.length === 0) {
        console.log(`No user found with name "${targetName}"`);
        // Fallback search for just "testuser" to be helpful
        const similar = await prisma.user.findMany({
            where: { name: { contains: 'testuser', mode: 'insensitive' } }
        });
        if (similar.length > 0) {
            console.log('Found similar users:', similar.map(u => `${u.name} (${u.email})`).join(', '));
        }
        return;
    }

    // Delete found users
    for (const user of users) {
        await prisma.user.delete({
            where: { id: user.id }
        });
        console.log(`✅ Deleted user: ${user.name} (${user.email}) - ID: ${user.id}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
