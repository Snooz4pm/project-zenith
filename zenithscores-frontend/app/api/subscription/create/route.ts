import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSubscription, PREMIUM_PLAN_ID } from '@/lib/paypal';

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

    // Create PayPal subscription
    const subscription = await createSubscription(PREMIUM_PLAN_ID, session.user.id);

    if (subscription.id) {
      // Find approval URL
      const approvalLink = subscription.links.find(
        (link: any) => link.rel === 'approve'
      );

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        approvalUrl: approvalLink?.href,
      });
    }

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
