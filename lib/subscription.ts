/**
 * Subscription utility functions for freemium tier management
 */

import { prisma } from '@/lib/prisma';

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isPremium: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

/**
 * Check if a user has an active premium subscription
 */
export async function isPremiumUser(userEmail: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
    },
  });

  if (!user) {
    return false;
  }

  // User is premium if:
  // 1. Tier is "premium"
  // 2. Status is "active"
  // 3. If endDate exists, it's in the future
  const isPremium =
    user.subscriptionTier === 'premium' &&
    user.subscriptionStatus === 'active' &&
    (!user.subscriptionEndDate || user.subscriptionEndDate > new Date());

  return isPremium;
}

/**
 * Get full subscription details for a user
 */
export async function getUserSubscription(
  userEmail: string
): Promise<UserSubscription | null> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionStartDate: true,
      subscriptionEndDate: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) {
    return null;
  }

  const isPremium =
    user.subscriptionTier === 'premium' &&
    user.subscriptionStatus === 'active' &&
    (!user.subscriptionEndDate || user.subscriptionEndDate > new Date());

  return {
    tier: user.subscriptionTier as SubscriptionTier,
    status: user.subscriptionStatus as SubscriptionStatus,
    isPremium,
    startDate: user.subscriptionStartDate,
    endDate: user.subscriptionEndDate,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
  };
}

/**
 * Update user subscription tier
 */
export async function updateSubscriptionTier(
  userEmail: string,
  tier: SubscriptionTier,
  status: SubscriptionStatus = 'active',
  stripeData?: {
    customerId?: string;
    subscriptionId?: string;
    priceId?: string;
  }
): Promise<void> {
  const now = new Date();

  await prisma.user.update({
    where: { email: userEmail },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionStartDate: tier === 'premium' ? now : null,
      subscriptionEndDate: null, // Will be set by Stripe webhooks if applicable
      stripeCustomerId: stripeData?.customerId || undefined,
      stripeSubscriptionId: stripeData?.subscriptionId || undefined,
      stripePriceId: stripeData?.priceId || undefined,
    },
  });
}

/**
 * Cancel user subscription (downgrade to free at end of billing period)
 */
export async function cancelSubscription(
  userEmail: string,
  endDate?: Date
): Promise<void> {
  await prisma.user.update({
    where: { email: userEmail },
    data: {
      subscriptionStatus: 'cancelled',
      subscriptionEndDate: endDate || null,
    },
  });
}

/**
 * Expire a subscription immediately (for failed payments, etc.)
 */
export async function expireSubscription(userEmail: string): Promise<void> {
  await prisma.user.update({
    where: { email: userEmail },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'expired',
      subscriptionEndDate: new Date(),
    },
  });
}

/**
 * Check if user has reached their daily calculation limit (free tier only)
 */
export async function checkEarlyRetirementLimit(
  userEmail: string
): Promise<{ allowed: boolean; remaining: number }> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      earlyRetirementCalcsToday: true,
      earlyRetirementCalcsDate: true,
    },
  });

  if (!user) {
    return { allowed: false, remaining: 0 };
  }

  // Premium users have unlimited access
  if (
    user.subscriptionTier === 'premium' &&
    user.subscriptionStatus === 'active'
  ) {
    return { allowed: true, remaining: -1 }; // -1 = unlimited
  }

  // Free tier: 10 calculations per day
  const FREE_TIER_DAILY_LIMIT = 10;
  const today = new Date().toDateString();
  const lastCalcDate = user.earlyRetirementCalcsDate?.toDateString();

  // If last calculation was on a different day, reset the counter
  if (lastCalcDate !== today) {
    return { allowed: true, remaining: FREE_TIER_DAILY_LIMIT };
  }

  // Check if user has exceeded the limit
  const remaining = FREE_TIER_DAILY_LIMIT - (user.earlyRetirementCalcsToday || 0);
  const allowed = remaining > 0;

  return { allowed, remaining };
}

/**
 * Increment early retirement calculation count for rate limiting
 */
export async function incrementEarlyRetirementCount(
  userEmail: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      earlyRetirementCalcsDate: true,
      earlyRetirementCalcsToday: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const today = new Date();
  const lastCalcDate = user.earlyRetirementCalcsDate?.toDateString();
  const todayString = today.toDateString();

  // If last calculation was on a different day, reset counter to 1
  if (lastCalcDate !== todayString) {
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        earlyRetirementCalcsToday: 1,
        earlyRetirementCalcsDate: today,
      },
    });
  } else {
    // Same day, increment counter
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        earlyRetirementCalcsToday: { increment: 1 },
      },
    });
  }
}

/**
 * Reset early retirement calculation count (for testing or admin purposes)
 */
export async function resetEarlyRetirementCount(
  userEmail: string
): Promise<void> {
  await prisma.user.update({
    where: { email: userEmail },
    data: {
      earlyRetirementCalcsToday: 0,
      earlyRetirementCalcsDate: null,
    },
  });
}

/**
 * Check if unverified user can run a free simulation (3 limit before email verification)
 */
export async function checkFreeSimulationLimit(
  userEmail: string,
  isEmailVerified: boolean
): Promise<{ allowed: boolean; remaining: number; requiresVerification: boolean }> {
  // Verified users have unlimited access
  if (isEmailVerified) {
    return { allowed: true, remaining: -1, requiresVerification: false };
  }

  // Unverified users: check free simulation limit
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { freeSimulationsUsed: true },
  });

  const FREE_SIMULATION_LIMIT = 3;
  const used = user?.freeSimulationsUsed || 0;
  const remaining = FREE_SIMULATION_LIMIT - used;
  const allowed = remaining > 0;
  const requiresVerification = !allowed;

  return { allowed, remaining, requiresVerification };
}

/**
 * Increment free simulation count for unverified users
 */
export async function incrementFreeSimulationCount(userEmail: string): Promise<void> {
  await prisma.user.update({
    where: { email: userEmail },
    data: { freeSimulationsUsed: { increment: 1 } },
  });
}

/**
 * Check if user has reached their daily simulation limit (free tier: 10/day, premium: unlimited)
 */
export async function checkDailySimulationLimit(
  userEmail: string
): Promise<{ allowed: boolean; remaining: number; isPremium: boolean }> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      simulationRunsToday: true,
      simulationRunsDate: true,
    },
  });

  if (!user) {
    return { allowed: false, remaining: 0, isPremium: false };
  }

  // Premium users have unlimited access
  const isPremium =
    user.subscriptionTier === 'premium' && user.subscriptionStatus === 'active';

  if (isPremium) {
    return { allowed: true, remaining: -1, isPremium: true };
  }

  // Free tier: 10 simulations per day
  const FREE_TIER_DAILY_LIMIT = 10;
  const today = new Date().toDateString();
  const lastRunDate = user.simulationRunsDate?.toDateString();

  // If last run was on a different day, reset the counter
  if (lastRunDate !== today) {
    return { allowed: true, remaining: FREE_TIER_DAILY_LIMIT, isPremium: false };
  }

  // Check if user has exceeded the limit
  const remaining = FREE_TIER_DAILY_LIMIT - (user.simulationRunsToday || 0);
  const allowed = remaining > 0;

  return { allowed, remaining, isPremium: false };
}

/**
 * Increment daily simulation count for rate limiting
 */
export async function incrementDailySimulationCount(userEmail: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      simulationRunsDate: true,
      simulationRunsToday: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const today = new Date();
  const lastRunDate = user.simulationRunsDate?.toDateString();
  const todayString = today.toDateString();

  // If last run was on a different day, reset counter to 1
  if (lastRunDate !== todayString) {
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        simulationRunsToday: 1,
        simulationRunsDate: today,
      },
    });
  } else {
    // Same day, increment counter
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        simulationRunsToday: { increment: 1 },
      },
    });
  }
}
