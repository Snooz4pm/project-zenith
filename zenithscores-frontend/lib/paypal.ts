import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

// PayPal Environment
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (mode === 'live') {
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
  }
  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

// PayPal Client
export function paypalClient() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

// Subscription Plan ID (create this in PayPal Dashboard)
export const PREMIUM_PLAN_ID = process.env.PAYPAL_PLAN_ID || 'P-XXXXXXXXXXXXXXXXXXXX';

// Price
export const PREMIUM_PRICE = 19.99;
export const PREMIUM_CURRENCY = 'USD';

// Helper: Verify PayPal webhook signature
export async function verifyWebhookSignature(
  webhookId: string,
  headers: Record<string, string>,
  body: any
): Promise<boolean> {
  try {
    const baseURL = getPayPalBaseURL();
    const response = await fetch(`${baseURL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify({
        transmission_id: headers['paypal-transmission-id'],
        transmission_time: headers['paypal-transmission-time'],
        cert_url: headers['paypal-cert-url'],
        auth_algo: headers['paypal-auth-algo'],
        transmission_sig: headers['paypal-transmission-sig'],
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

// Helper: Get PayPal access token
async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const baseURL = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// Helper: Get PayPal API base URL
export function getPayPalBaseURL(): string {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

// Helper: Create subscription
export async function createSubscription(planId: string, userId: string) {
  const baseURL = getPayPalBaseURL();
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  // EXACT BODY AS SPECIFIED
  const body = {
    plan_id: planId,
    custom_id: userId, // REQUIRED: Links webhook events to user
    application_context: {
      brand_name: "ZenithScores",
      user_action: "SUBSCRIBE_NOW",
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/paypal/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/paypal/cancel`
    }
  };

  // LOG BEFORE SENDING - CHECK FOR UNDEFINED
  console.log("PAYPAL BODY:", JSON.stringify(body, null, 2));
  console.log("PLAN_ID VALUE:", planId);
  console.log("USER_ID VALUE:", userId);

  const response = await fetch(`${baseURL}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  // LOG RESPONSE
  console.log("PAYPAL RESPONSE STATUS:", response.status);
  console.log("PAYPAL RESPONSE:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    console.error("PAYPAL ERROR:", data);
    throw new Error(`PayPal subscription failed: ${JSON.stringify(data)}`);
  }

  return data;
}

// Helper: Cancel subscription
export async function cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation') {
  const accessToken = await getAccessToken();
  const baseURL = getPayPalBaseURL();

  const response = await fetch(`${baseURL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      reason,
    }),
  });

  return response.status === 204; // 204 No Content = success
}

// Helper: Get subscription details
export async function getSubscriptionDetails(subscriptionId: string) {
  const accessToken = await getAccessToken();
  const baseURL = getPayPalBaseURL();

  const response = await fetch(`${baseURL}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return await response.json();
}
