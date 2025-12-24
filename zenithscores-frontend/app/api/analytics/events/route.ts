import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { events } = await req.json();

        if (!events || !Array.isArray(events)) {
            return NextResponse.json(
                { error: 'Events array is required' },
                { status: 400 }
            );
        }

        // Add user context if authenticated
        const enrichedEvents = events.map((event: any) => ({
            ...event,
            userId: session?.user?.email || event.userId || 'anonymous',
            serverTimestamp: new Date().toISOString()
        }));

        // In production, you would:
        // 1. Store in database (Prisma)
        // 2. Send to analytics service (PostHog, Mixpanel, etc.)
        // 3. Forward to data warehouse (BigQuery, Snowflake)

        // For now, log for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('[Analytics API] Received events:', enrichedEvents.length);
            enrichedEvents.forEach((e: any) => {
                console.log(`  - ${e.event}: ${e.page || 'no-page'}`);
            });
        }

        // Optional: Store key conversion events in database
        const conversionEvents = enrichedEvents.filter((e: any) =>
            ['login_completed', 'signup_completed', 'calibration_completed', 'lock_clicked'].includes(e.event)
        );

        if (conversionEvents.length > 0) {
            // TODO: Store in AnalyticsEvent table when created
            console.log('[Analytics] Conversion events:', conversionEvents.length);
        }

        return NextResponse.json({
            success: true,
            received: enrichedEvents.length
        });

    } catch (error) {
        console.error('Error processing analytics:', error);
        return NextResponse.json(
            { error: 'Failed to process analytics' },
            { status: 500 }
        );
    }
}

// GET endpoint for retrieving analytics (admin only)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Simple admin check - enhance in production
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Return metrics summary
        // In production: query from database
        return NextResponse.json({
            message: 'Analytics API active',
            note: 'Full metrics available when database tables are created'
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
