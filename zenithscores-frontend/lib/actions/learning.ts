'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Saves or updates user progress for a specific course.
 * Uses 'upsert' to handle both creation and updates in a single atomic operation.
 * 
 * @param userId - The unique identifier of the user
 * @param courseId - The unique identifier of the course
 * @param progress - Current progress percentage (0-100)
 * @param lastModuleId - The ID of the module last completed
 * @param completed - Whether the course is fully completed
 */
export async function saveCourseProgress(
    userId: string,
    courseId: string,
    progress: number,
    lastModuleId?: string,
    completed: boolean = false
) {
    try {
        // 🛡️ Atomic Upsert: Prevents race conditions and duplicate entries.
        // The 'where' clause uses a unique constraint (userId + courseId).
        await prisma.userCourseProgress.upsert({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            update: {
                progress,
                lastModuleCompleted: lastModuleId,
                completed,
                updatedAt: new Date(),
            },
            create: {
                userId,
                courseId,
                progress,
                lastModuleCompleted: lastModuleId,
                completed,
            },
        });

        // Revalidate the learning hub and the specific course page to ensure UI fresh data
        revalidatePath('/learning');
        revalidatePath(`/learn/${courseId}`);

        return { success: true };
    } catch (error) {
        console.error('Failed to save course progress:', error);
        return { success: false, error: 'Database synchronization failed' };
    }
}

/**
 * Fetches all course progress for a specific user.
 */
export async function getUserProgress(userId: string) {
    try {
        const progress = await prisma.userCourseProgress.findMany({
            where: { userId },
            select: {
                courseId: true,
                progress: true,
                completed: true,
                lastModuleCompleted: true,
            },
        });
        return progress;
    } catch (error) {
        console.error('Failed to fetch user progress:', error);
        return [];
    }
}

/**
 * Fetches progress for a single course.
 * Optimized to avoid fetching the entire user progress map when not needed.
 */
export async function getSingleCourseProgress(userId: string, courseId: string) {
    try {
        return await prisma.userCourseProgress.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
    } catch (error) {
        console.error('Failed to fetch single course progress:', error);
        return null;
    }
}
