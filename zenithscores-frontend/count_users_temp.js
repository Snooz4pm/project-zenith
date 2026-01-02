const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load .env.local manually since we are running a standalone script
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
        console.log('Loaded .env.local');
    } else {
        console.log('.env.local not found');
    }
} catch (e) {
    console.error('Error loading .env.local', e);
}

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.user.count();
        console.log('Total Users:', count);
    } catch (error) {
        console.error('Error counting users:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
