import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/profile/[userId]
 * Fetch comprehensive public profile for a specific user
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const userId = params.userId;
        console.log('[PROFILE API] Fetching profile for:', userId);

        // Fetch user basic info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                created_at: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch user profile info
        let profile = null;
        try {
            profile = await prisma.user_profiles.findUnique({
                where: { user_id: userId }
            });
        } catch (e) {
            console.log('[PROFILE API] user_profiles not available');
        }

        // Fetch badges with badge details
        let badges: any[] = [];
        try {
            const userBadges = await prisma.user_badges.findMany({
                where: { user_id: userId }
            });

            if (userBadges.length > 0) {
                const badgeIds = userBadges.map(b => b.badge_id);
                const badgeDetails = await prisma.badges.findMany({
                    where: { id: { in: badgeIds } }
                });

                badges = userBadges.map(ub => {
                    const detail = badgeDetails.find(b => b.id === ub.badge_id);
                    return {
                        id: ub.badge_id,
                        name: detail?.name || 'Badge',
                        icon: detail?.icon || '🏆',
                        category: detail?.category || 'achievement',
                        rarity: detail?.rarity || 'common',
                        earnedAt: ub.earned_at,
                        isPinned: ub.is_pinned
                    };
                });
            }
        } catch (e) {
            console.log('[PROFILE API] badges not available');
        }

        // Fetch trading stats from Portfolio
        let tradingStats = {
            totalTrades: 0,
            winningTrades: 0,
            winRate: 0,
            totalPnL: 0,
            portfolioValue: 50000
        };
        try {
            const portfolio = await prisma.portfolio.findUnique({
                where: { userId: userId },
                include: {
                    trades: true
                }
            });

            if (portfolio) {
                const trades = portfolio.trades || [];
                const sellTrades = trades.filter(t => t.side === 'SELL' && t.realizedPnL !== null);
                const winningTrades = sellTrades.filter(t => (t.realizedPnL || 0) > 0);

                tradingStats = {
                    totalTrades: trades.length,
                    winningTrades: winningTrades.length,
                    winRate: sellTrades.length > 0 ? Math.round((winningTrades.length / sellTrades.length) * 100) : 0,
                    totalPnL: portfolio.totalRealizedPnL || 0,
                    portfolioValue: portfolio.balance || 50000
                };
            }
        } catch (e) {
            console.log('[PROFILE API] Portfolio not available:', e);
        }

        // Fetch follower/following counts
        let socialStats = { followers: 0, following: 0 };
        try {
            const [followers, following] = await Promise.all([
                prisma.community_follows.count({ where: { following_id: userId } }),
                prisma.community_follows.count({ where: { follower_id: userId } })
            ]);
            socialStats = { followers, following };
        } catch (e) {
            console.log('[PROFILE API] community_follows not available');
        }

        // Fetch learning progress
        let learningStats = { coursesCompleted: 0, coursesInProgress: 0, totalProgress: 0 };
        try {
            const courses = await prisma.userCourseProgress.findMany({
                where: { userId: userId }
            });

            const completed = courses.filter(c => c.completed);
            const inProgress = courses.filter(c => !c.completed && c.progress > 0);
            const avgProgress = courses.length > 0
                ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
                : 0;

            learningStats = {
                coursesCompleted: completed.length,
                coursesInProgress: inProgress.length,
                totalProgress: avgProgress
            };
        } catch (e) {
            console.log('[PROFILE API] UserCourseProgress not available');
        }

        // Fetch shared trades (public trades)
        let sharedTrades: any[] = [];
        try {
            const trades = await prisma.shared_trades.findMany({
                where: { user_id: userId },
                orderBy: { shared_at: 'desc' },
                take: 5
            });

            sharedTrades = trades.map(t => ({
                id: t.id,
                symbol: t.symbol,
                type: t.trade_type,
                entryPrice: Number(t.entry_price),
                exitPrice: t.exit_price ? Number(t.exit_price) : null,
                pnl: t.pnl ? Number(t.pnl) : null,
                pnlPercent: t.pnl_percent ? Number(t.pnl_percent) : null,
                caption: t.caption,
                isOpen: t.is_open,
                sharedAt: t.shared_at
            }));
        } catch (e) {
            console.log('[PROFILE API] shared_trades not available');
        }

        // Fetch recent and pinned community posts
        let recentPosts: any[] = [];
        let pinnedPosts: any[] = [];
        try {
            const posts = await prisma.communityPost.findMany({
                where: { authorId: userId },
                orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: 'desc' }
                ],
                take: 10,
                include: {
                    _count: { select: { comments: true } }
                }
            });

            const formattedPosts = posts.map(p => ({
                id: p.id,
                title: p.title,
                body: p.body,
                postType: p.postType,
                asset: p.asset,
                commentsCount: p._count.comments,
                createdAt: p.createdAt,
                isPinned: p.isPinned
            }));

            recentPosts = formattedPosts.filter(p => !p.isPinned);
            pinnedPosts = formattedPosts.filter(p => p.isPinned);
        } catch (e) {
            console.log('[PROFILE API] CommunityPost not available');
        }

        const publicProfile = {
            id: user.id,
            name: user.name,
            image: user.image,
            joinedAt: user.created_at,
            bio: profile?.bio || null,
            careerPath: profile?.career_path || null,
            experienceLevel: profile?.experience_level || 'beginner',
            twitterHandle: profile?.twitter_handle || null,
            discordHandle: profile?.discord_handle || null,
            isPublic: profile?.is_public ?? true,
            showTrades: profile?.show_trades ?? true,
            showBadges: profile?.show_badges ?? true,

            // Trading Stats
            trading: tradingStats,

            // Social Stats
            social: socialStats,

            // Learning Stats  
            learning: learningStats,

            // Badges
            badges,

            // Shared Trades
            sharedTrades,

            // Posts
            recentPosts,
            pinnedPosts
        };


        console.log('[PROFILE API] Profile fetched successfully');
        return NextResponse.json(publicProfile);

    } catch (error) {
        console.error('[PROFILE API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
