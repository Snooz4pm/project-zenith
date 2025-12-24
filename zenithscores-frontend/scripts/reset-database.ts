/**
 * Database Reset Script
 * Clears all user data while keeping tables intact
 * Resets all trading portfolios to $10,000
 * 
 * Run with: npx ts-node scripts/reset-database.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabase() {
    console.log('🔄 Starting database reset...\n')

    try {
        // ========================
        // PHASE 1: Delete User Data (in order due to FK constraints)
        // ========================
        console.log('📦 Phase 1: Clearing user data...')

        // Delete personalization data first (has FK to User)
        const deletedSignalInteractions = await prisma.userSignalInteraction.deleteMany({})
        console.log(`  ✓ UserSignalInteraction: ${deletedSignalInteractions.count} records deleted`)

        const deletedWatchlists = await prisma.userWatchlist.deleteMany({})
        console.log(`  ✓ UserWatchlist: ${deletedWatchlists.count} records deleted`)

        const deletedAssetViews = await prisma.userAssetView.deleteMany({})
        console.log(`  ✓ UserAssetView: ${deletedAssetViews.count} records deleted`)

        const deletedPreferences = await prisma.userPreferences.deleteMany({})
        console.log(`  ✓ UserPreferences: ${deletedPreferences.count} records deleted`)

        // Delete trading notes
        const deletedNotes = await prisma.tradingNote.deleteMany({})
        console.log(`  ✓ TradingNote: ${deletedNotes.count} records deleted`)

        // Delete NextAuth data (FK to User, with CASCADE)
        const deletedSessions = await prisma.session.deleteMany({})
        console.log(`  ✓ Session: ${deletedSessions.count} records deleted`)

        const deletedAccounts = await prisma.account.deleteMany({})
        console.log(`  ✓ Account: ${deletedAccounts.count} records deleted`)

        // Delete the main User table
        const deletedUsers = await prisma.user.deleteMany({})
        console.log(`  ✓ User: ${deletedUsers.count} records deleted`)

        // ========================
        // PHASE 2: Delete Community Data
        // ========================
        console.log('\n📦 Phase 2: Clearing community data...')

        const deletedComments = await prisma.community_comments.deleteMany({})
        console.log(`  ✓ community_comments: ${deletedComments.count} records deleted`)

        const deletedLikes = await prisma.community_likes.deleteMany({})
        console.log(`  ✓ community_likes: ${deletedLikes.count} records deleted`)

        const deletedPosts = await prisma.community_posts.deleteMany({})
        console.log(`  ✓ community_posts: ${deletedPosts.count} records deleted`)

        const deletedFollows = await prisma.community_follows.deleteMany({})
        console.log(`  ✓ community_follows: ${deletedFollows.count} records deleted`)

        const deletedSharedTrades = await prisma.shared_trades.deleteMany({})
        console.log(`  ✓ shared_trades: ${deletedSharedTrades.count} records deleted`)

        // ========================
        // PHASE 3: Delete Badge Data
        // ========================
        console.log('\n📦 Phase 3: Clearing badge data...')

        const deletedUserBadges = await prisma.user_badges.deleteMany({})
        console.log(`  ✓ user_badges: ${deletedUserBadges.count} records deleted`)

        const deletedProfiles = await prisma.user_profiles.deleteMany({})
        console.log(`  ✓ user_profiles: ${deletedProfiles.count} records deleted`)

        // ========================
        // PHASE 4: Delete Trading Data
        // ========================
        console.log('\n📦 Phase 4: Clearing trading data...')

        const deletedTrades = await prisma.trading_trades.deleteMany({})
        console.log(`  ✓ trading_trades: ${deletedTrades.count} records deleted`)

        const deletedHoldings = await prisma.trading_holdings.deleteMany({})
        console.log(`  ✓ trading_holdings: ${deletedHoldings.count} records deleted`)

        const deletedPendingOrders = await prisma.trading_pending_orders.deleteMany({})
        console.log(`  ✓ trading_pending_orders: ${deletedPendingOrders.count} records deleted`)

        const deletedPortfolioHistory = await prisma.trading_portfolio_history.deleteMany({})
        console.log(`  ✓ trading_portfolio_history: ${deletedPortfolioHistory.count} records deleted`)

        // Delete trading users (resets all portfolios)
        const deletedTradingUsers = await prisma.trading_users.deleteMany({})
        console.log(`  ✓ trading_users: ${deletedTradingUsers.count} records deleted`)

        const deletedUserSessions = await prisma.user_sessions.deleteMany({})
        console.log(`  ✓ user_sessions: ${deletedUserSessions.count} records deleted`)

        // ========================
        // PHASE 5: Delete Path/Trait Data
        // ========================
        console.log('\n📦 Phase 5: Clearing learning path data...')

        const deletedTraits = await prisma.userTrait.deleteMany({})
        console.log(`  ✓ UserTrait: ${deletedTraits.count} records deleted`)

        const deletedPathScores = await prisma.userPathScore.deleteMany({})
        console.log(`  ✓ UserPathScore: ${deletedPathScores.count} records deleted`)

        // ========================
        // PHASE 6: Delete legacy users table 
        // ========================
        console.log('\n📦 Phase 6: Clearing legacy users...')

        const deletedLegacyUsers = await prisma.users.deleteMany({})
        console.log(`  ✓ users (legacy): ${deletedLegacyUsers.count} records deleted`)

        // ========================
        // SUMMARY
        // ========================
        console.log('\n✅ Database reset complete!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 Summary:')
        console.log(`   • All user accounts deleted`)
        console.log(`   • All community posts/comments deleted`)
        console.log(`   • All trading portfolios reset`)
        console.log(`   • All badges and profiles cleared`)
        console.log(`   • New users will start with $10,000`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    } catch (error) {
        console.error('\n❌ Error during reset:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the reset
resetDatabase()
    .then(() => {
        console.log('\n🎉 Reset script completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n💀 Reset script failed:', error)
        process.exit(1)
    })
