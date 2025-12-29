import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ progress: 0, currentCourse: 'Trading Fundamentals' });
        }

        // Get user's course progress
        const progress = await prisma.courseProgress.findFirst({
            where: {
                userId: session.user.id,
                completed: false
            },
            orderBy: { updatedAt: 'desc' }
        });

        if (progress) {
            // Calculate percentage based on modules completed
            const percentage = progress.lastModuleCompleted
                ? Math.min(100, 20) // Placeholder - would calculate from course modules
                : 0;

            return NextResponse.json({
                progress: percentage,
                currentCourse: progress.courseId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            });
        }

        // Check for any completed courses
        const completedCount = await prisma.courseProgress.count({
            where: {
                userId: session.user.id,
                completed: true
            }
        });

        return NextResponse.json({
            progress: completedCount > 0 ? 100 : 0,
            currentCourse: completedCount > 0 ? 'Completed!' : 'Start Learning'
        });

    } catch (error) {
        console.error('Failed to get learning progress:', error);
        return NextResponse.json({ progress: 0, currentCourse: 'Start Learning' });
    }
}
