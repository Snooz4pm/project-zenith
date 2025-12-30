import { prisma } from './prisma';

/**
 * Check if a user has an active premium subscription
 * @param userId - The user's ID
 * @returns true if user is premium, false otherwise
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tier: true,
        subscriptionStatus: true,
        subscriptionEnd: true,
      },
    });

    if (!user || user.tier !== 'premium') {
      return false;
    }

    // Check if subscription is still active
    if (user.subscriptionStatus !== 'active') {
      return false;
    }

    // Check if subscription has expired
    if (user.subscriptionEnd && new Date() > user.subscriptionEnd) {
      // Auto-downgrade expired subscription
      await prisma.user.update({
        where: { id: userId },
        data: {
          tier: 'free',
          subscriptionStatus: 'expired',
        },
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      subscriptionId: true,
      subscriptionStatus: true,
      subscriptionStart: true,
      subscriptionEnd: true,
    },
  });

  if (!user) {
    return null;
  }

  const isPremium = await isPremiumUser(userId);
  const daysRemaining = user.subscriptionEnd
    ? Math.max(0, Math.ceil((user.subscriptionEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    isPremium,
    tier: user.tier,
    subscriptionId: user.subscriptionId,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionStart: user.subscriptionStart,
    subscriptionEnd: user.subscriptionEnd,
    daysRemaining,
  };
}

/**
 * Activate premium subscription
 */
export async function activatePremiumSubscription(
  userId: string,
  subscriptionId: string,
  paypalCustomerId: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
) {
  const subscriptionStart = new Date();
  const subscriptionEnd = new Date();

  // Calculate subscription end date
  if (billingCycle === 'monthly') {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
  } else {
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      tier: 'premium',
      subscriptionId,
      subscriptionStatus: 'active',
      subscriptionStart,
      subscriptionEnd,
      paypalCustomerId,
    },
  });
}

/**
 * Cancel premium subscription
 */
export async function cancelPremiumSubscription(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'canceled',
      // Note: Keep tier as 'premium' until subscriptionEnd
    },
  });
}

/**
 * Expire premium subscription (called by webhook or cron)
 */
export async function expirePremiumSubscription(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      tier: 'free',
      subscriptionStatus: 'expired',
    },
  });
}

/**
 * Update subscription end date (for renewals)
 */
export async function renewSubscription(
  userId: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionEnd: true },
  });

  const newEndDate = user?.subscriptionEnd && user.subscriptionEnd > new Date()
    ? new Date(user.subscriptionEnd) // Extend from current end date
    : new Date(); // Start fresh if expired

  if (billingCycle === 'monthly') {
    newEndDate.setMonth(newEndDate.getMonth() + 1);
  } else {
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'active',
      subscriptionEnd: newEndDate,
    },
  });
}
