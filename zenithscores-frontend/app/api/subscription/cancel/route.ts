import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cancelSubscription } from '@/lib/paypal';
import { cancelPremiumSubscription } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user's subscription ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionId: true, tier: true },
    });

    if (!user?.subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel with PayPal
    const canceled = await cancelSubscription(
      user.subscriptionId,
      'User requested cancellation via dashboard'
    );

    if (canceled) {
      // Update database
      await cancelPremiumSubscription(session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled successfully. You will retain access until the end of your billing period.',
      });
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription with PayPal' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
