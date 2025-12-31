/**
 * Simulation Readiness Check and Email Notification
 *
 * This module checks if a user just became "simulation-ready" and sends
 * them an email notification to encourage running their first simulation.
 */

import { prisma } from '@/lib/prisma';
import { sendSimulationReadyEmail } from '@/lib/email-simulation-ready';

/**
 * Check if user is simulation-ready (has required data)
 * Required: At least 1 asset AND (at least 1 income OR 1 expense)
 */
export async function isUserSimulationReady(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          assets: true,
          incomeSources: true,
          expenses: true,
        },
      },
    },
  });

  if (!user) return false;

  const hasAssets = user._count.assets > 0;
  const hasIncomeOrExpenses = user._count.incomeSources > 0 || user._count.expenses > 0;

  return hasAssets && hasIncomeOrExpenses;
}

/**
 * Check if user just became simulation-ready and send notification email
 *
 * This should be called after adding income, assets, or expenses.
 * It will only send the email once when the user first becomes ready.
 *
 * @param userId - The user's ID
 * @param appUrl - Base URL of the application (e.g., 'https://retirezest.com')
 * @returns true if email was sent, false otherwise
 */
export async function checkAndNotifySimulationReady(
  userId: string,
  appUrl: string
): Promise<boolean> {
  try {
    // Get user with counts and email status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            assets: true,
            incomeSources: true,
            expenses: true,
          },
        },
      },
    });

    if (!user) {
      console.log('User not found:', userId);
      return false;
    }

    // Check if we've already sent the simulation-ready email
    if (user.simulationReadyEmailSentAt) {
      // Already sent - don't send again
      return false;
    }

    // Check if user is now simulation-ready
    const hasAssets = user._count.assets > 0;
    const hasIncomeOrExpenses = user._count.incomeSources > 0 || user._count.expenses > 0;
    const isReady = hasAssets && hasIncomeOrExpenses;

    if (!isReady) {
      // Not ready yet
      return false;
    }

    // User just became ready! Send the email
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;
    const simulationUrl = `${appUrl}/simulation`;

    const result = await sendSimulationReadyEmail({
      to: user.email,
      userName,
      simulationUrl,
      assetCount: user._count.assets,
      incomeCount: user._count.incomeSources,
      expenseCount: user._count.expenses,
    });

    if (result.success) {
      // Mark that we've sent the email
      await prisma.user.update({
        where: { id: userId },
        data: {
          simulationReadyEmailSentAt: new Date(),
        },
      });

      console.log(`✅ Simulation-ready email sent to ${user.email}`);
      return true;
    } else {
      console.error(`❌ Failed to send simulation-ready email to ${user.email}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error('Error in checkAndNotifySimulationReady:', error);
    return false;
  }
}
