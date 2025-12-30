import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // FORCE PLAN ID FROM ENV ONLY
    const PLAN_ID = process.env.PAYPAL_PLAN_ID!;
    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
    const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
    const MODE = process.env.PAYPAL_MODE || 'sandbox';

    console.log("ENV PLAN ID:", PLAN_ID);
    console.log("ENV MODE:", MODE);

    // Hardcoded URLs (NO ENV VARS)
    const BASE_URL = "https://www.zenithscores.com";
    const baseURL = MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const body = {
      plan_id: PLAN_ID,
      custom_id: session.user.id,
      application_context: {
        brand_name: "ZenithScores",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${BASE_URL}/profile/subscription?success=true`,
        cancel_url: `${BASE_URL}/profile/subscription?canceled=true`
      }
    };

    console.log("FINAL PAYPAL BODY:", JSON.stringify(body, null, 2));

    const response = await fetch(`${baseURL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log("PAYPAL RESPONSE STATUS:", response.status);
    console.log("PAYPAL RESPONSE:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("PAYPAL ERROR:", data);
      return NextResponse.json(
        { error: 'PayPal subscription failed', details: data },
        { status: 500 }
      );
    }

    // Find approval URL
    const approvalLink = data.links.find((link: any) => link.rel === 'approve');

    return NextResponse.json({
      success: true,
      subscriptionId: data.id,
      approvalUrl: approvalLink?.href,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
