import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[PayPal Cancel] User canceled subscription');

  // Redirect to subscription page with canceled message
  return NextResponse.redirect(
    new URL('/profile/subscription?canceled=true', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
  );
}
