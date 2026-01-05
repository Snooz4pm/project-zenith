/**
 * 🧹 DATABASE CLEANUP SCRIPT
 * 
 * This script removes all email/Google-based users and their related data,
 * preparing the database for wallet-only authentication.
 * 
 * Run with: npx tsx scripts/cleanup-google-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Starting Google/Email user cleanup...\n');

    // Step 1: Preview users to be deleted
    console.log('📋 STEP 1: Previewing users to delete...\n');
    
    const usersToDelete = await prisma.user.findMany({
        where: {
            OR: [
                { email: { not: null } },
                { provider: 'google' },
            ],
            walletAddress: null, // Only delete users without wallet
        },
        select: {
            id: true,
            email: true,
            name: true,
            provider: true,
            walletAddress: true,
            created_at: true,
        },
    });

    console.log(`Found ${usersToDelete.length} users to delete:\n`);
    usersToDelete.forEach((u, i) => {
        console.log(`  ${i + 1}. ID: ${u.id}`);
        console.log(`     Email: ${u.email}`);
        console.log(`     Provider: ${u.provider}`);
        console.log(`     Wallet: ${u.walletAddress || 'none'}`);
        console.log('');
    });

    if (usersToDelete.length === 0) {
        console.log('✅ No Google/email users to delete. Database is clean!');
        return;
    }

    const userIds = usersToDelete.map(u => u.id);

    // Step 2: Count related data
    console.log('📊 STEP 2: Counting related data...\n');

    const counts = {
        accounts: await prisma.account.count({ where: { userId: { in: userIds } } }),
        sessions: await prisma.session.count({ where: { userId: { in: userIds } } }),
        tradingNotes: await prisma.tradingNote.count({ where: { userId: { in: userIds } } }),
        activities: await prisma.activity.count({ where: { userId: { in: userIds } } }),
        posts: await prisma.communityPost.count({ where: { authorId: { in: userIds } } }),
        comments: await prisma.comment.count({ where: { authorId: { in: userIds } } }),
        notifications: await prisma.notification.count({ where: { userId: { in: userIds } } }),
        rooms: await prisma.room.count({ where: { creatorId: { in: userIds } } }),
        roomMemberships: await prisma.roomMembership.count({ where: { userId: { in: userIds } } }),
        conversations: await prisma.conversation.count({
            where: { OR: [{ userAId: { in: userIds } }, { userBId: { in: userIds } }] }
        }),
        messages: await prisma.directMessage.count({ where: { senderId: { in: userIds } } }),
        preferences: await prisma.userPreferences.count({ where: { userId: { in: userIds } } }),
        assetViews: await prisma.userAssetView.count({ where: { userId: { in: userIds } } }),
        watchlists: await prisma.userWatchlist.count({ where: { userId: { in: userIds } } }),
        courseProgress: await prisma.userCourseProgress.count({ where: { userId: { in: userIds } } }),
        journals: await prisma.tradeJournal.count({ where: { userId: { in: userIds } } }),
        decisionAttempts: await prisma.decisionAttempt.count({ where: { userId: { in: userIds } } }),
    };

    console.log('  Related data to be deleted:');
    Object.entries(counts).forEach(([key, count]) => {
        if (count > 0) console.log(`    - ${key}: ${count}`);
    });
    console.log('');

    // Step 3: Prompt for confirmation
    console.log('⚠️  STEP 3: CONFIRMATION REQUIRED\n');
    console.log('This will permanently delete:');
    console.log(`  - ${usersToDelete.length} users`);
    console.log(`  - All their related data (notes, posts, rooms, etc.)`);
    console.log('');
    console.log('To proceed, set CONFIRM_DELETE=true environment variable:');
    console.log('  CONFIRM_DELETE=true npx tsx scripts/cleanup-google-users.ts\n');

    if (process.env.CONFIRM_DELETE !== 'true') {
        console.log('❌ Deletion cancelled. Set CONFIRM_DELETE=true to proceed.');
        return;
    }

    // Step 4: Delete in correct order (respecting foreign keys)
    console.log('🗑️  STEP 4: Deleting data...\n');

    // Delete in order of dependencies
    const deletions = await prisma.$transaction([
        // First: Delete tables that reference User
        prisma.notification.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.notification.deleteMany({ where: { sourceUserId: { in: userIds } } }),
        prisma.directMessage.deleteMany({ where: { senderId: { in: userIds } } }),
        prisma.conversation.deleteMany({
            where: { OR: [{ userAId: { in: userIds } }, { userBId: { in: userIds } }] }
        }),
        prisma.comment.deleteMany({ where: { authorId: { in: userIds } } }),
        prisma.communityPost.deleteMany({ where: { authorId: { in: userIds } } }),
        prisma.roomJoinRequest.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.roomInvitation.deleteMany({
            where: { OR: [{ inviterId: { in: userIds } }, { inviteeId: { in: userIds } }] }
        }),
        prisma.roomMembership.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.room.deleteMany({ where: { creatorId: { in: userIds } } }),
        prisma.tradingNote.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.activity.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.userPreferences.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.userAssetView.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.userWatchlist.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.userSignalInteraction.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.userCourseProgress.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.tradeJournal.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.portfolio.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.newsResponse.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.userIntelProfile.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.decisionAttempt.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.disciplineState.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.arenaSwap.updateMany({ 
            where: { userId: { in: userIds } },
            data: { userId: null } // Keep swap records, just unlink user
        }),
        
        // NextAuth tables
        prisma.session.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.account.deleteMany({ where: { userId: { in: userIds } } }),
        
        // Finally: Delete users
        prisma.user.deleteMany({
            where: {
                OR: [
                    { email: { not: null } },
                    { provider: 'google' },
                ],
                walletAddress: null,
            }
        }),
    ]);

    console.log('✅ Deletion complete!\n');
    console.log(`Deleted ${deletions[deletions.length - 1].count} users and all related data.`);

    // Step 5: Verify cleanup
    console.log('\n📊 STEP 5: Verifying cleanup...\n');

    const remainingUsers = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            walletAddress: true,
            provider: true,
        },
    });

    console.log(`Remaining users: ${remainingUsers.length}`);
    remainingUsers.forEach((u, i) => {
        console.log(`  ${i + 1}. Wallet: ${u.walletAddress || 'none'}, Provider: ${u.provider}`);
    });

    const emailUsers = remainingUsers.filter(u => u.email && !u.walletAddress);
    if (emailUsers.length > 0) {
        console.log('\n⚠️  Warning: Some email-only users still exist!');
    } else {
        console.log('\n✅ All email-only users have been removed.');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
