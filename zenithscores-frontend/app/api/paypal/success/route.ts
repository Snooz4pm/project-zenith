import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const baToken = searchParams.get('ba_token');

    console.log('[PayPal Success] Received:', { subscriptionId, baToken, userId: session?.user?.id });

    // Redirect to subscription page with success message
    return NextResponse.redirect(
      new URL('/profile/subscription?success=true', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
    );
  } catch (error) {
    console.error('[PayPal Success] Error:', error);
    return NextResponse.redirect(
      new URL('/profile/subscription?error=true', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
    );
  }
}
