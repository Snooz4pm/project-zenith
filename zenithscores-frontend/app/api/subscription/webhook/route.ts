import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/lib/paypal';
import { activatePremiumSubscription, cancelPremiumSubscription, renewSubscription, expirePremiumSubscription } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';

/**
 * PayPal Webhook Handler
 *
 * IMPORTANT: Configure this webhook URL in your PayPal Dashboard:
 * https://yourdomain.com/api/subscription/webhook
 *
 * Subscribe to these events:
 * - BILLING.SUBSCRIPTION.ACTIVATED
 * - BILLING.SUBSCRIPTION.CANCELLED
 * - BILLING.SUBSCRIPTION.EXPIRED
 * - BILLING.SUBSCRIPTION.PAYMENT.FAILED
 * - PAYMENT.SALE.COMPLETED
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headersList = headers();

    // Get webhook ID from environment
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Convert headers to object
    const headersObj: Record<string, string> = {};
    headersList.forEach((value, key) => {
      headersObj[key] = value;
    });

    // Verify webhook signature (REQUIRED FOR PRODUCTION)
    const isValid = await verifyWebhookSignature(webhookId, headersObj, body);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Log webhook event
    console.log('PayPal Webhook Event:', body.event_type);

    // Extract user ID from custom_id
    const userId = body.resource?.custom_id;
    const subscriptionId = body.resource?.id;

    if (!userId) {
      console.error('No user ID in webhook payload');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Handle different webhook events
    switch (body.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Subscription activated (first payment successful)
        console.log(`Activating subscription for user ${userId}`);
        await activatePremiumSubscription(
          userId,
          subscriptionId,
          body.resource?.subscriber?.payer_id || '',
          'monthly'
        );
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Recurring payment successful (renewal)
        console.log(`Renewing subscription for user ${userId}`);
        await renewSubscription(userId, 'monthly');
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // User canceled subscription
        console.log(`Canceling subscription for user ${userId}`);
        await cancelPremiumSubscription(userId);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // Subscription expired (payment failed or end of billing period)
        console.log(`Expiring subscription for user ${userId}`);
        await expirePremiumSubscription(userId);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        // Payment failed - give them 3 days grace period
        console.log(`Payment failed for user ${userId} - grace period started`);
        // Optionally: Send email notification
        // Note: PayPal will retry payment automatically
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Subscription suspended (multiple payment failures)
        console.log(`Suspending subscription for user ${userId}`);
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: 'suspended' },
        });
        break;

      default:
        console.log(`Unhandled webhook event: ${body.event_type}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 even on error to prevent PayPal from retrying
    return NextResponse.json({ error: 'Processing error' }, { status: 200 });
  }
}
