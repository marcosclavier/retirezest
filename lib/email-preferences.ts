import { prisma } from '@/lib/prisma';

/**
 * Email preference types
 */
export type EmailType = 'marketing' | 'feedback' | 'transactional';

/**
 * Check if a user can receive a specific type of email
 *
 * @param email - User's email address
 * @param type - Type of email to check
 * @returns true if user can receive this type of email
 */
export async function canSendEmail(
  email: string,
  type: EmailType
): Promise<{ canSend: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        marketingEmailsEnabled: true,
        feedbackEmailsEnabled: true,
        unsubscribedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return { canSend: false, reason: 'User not found' };
    }

    // Account deleted
    if (user.deletedAt) {
      return { canSend: false, reason: 'Account deleted' };
    }

    // Transactional emails (password reset, verification, etc.) always send
    if (type === 'transactional') {
      return { canSend: true };
    }

    // Check specific preference
    if (type === 'marketing' && !user.marketingEmailsEnabled) {
      return { canSend: false, reason: 'User unsubscribed from marketing emails' };
    }

    if (type === 'feedback' && !user.feedbackEmailsEnabled) {
      return { canSend: false, reason: 'User unsubscribed from feedback emails' };
    }

    return { canSend: true };
  } catch (error) {
    console.error('Error checking email preferences:', error);
    // On error, default to not sending to be safe
    return { canSend: false, reason: 'Error checking preferences' };
  }
}

/**
 * Get unsubscribe URL for a user
 *
 * @param email - User's email address
 * @param type - Type of email (for unsubscribe link specificity)
 * @returns Unsubscribe URL or null if user not found
 */
export async function getUnsubscribeUrl(
  email: string,
  type: 'marketing' | 'feedback' | 'all' = 'all',
  baseUrl: string = 'https://retirezest.com'
): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { unsubscribeToken: true },
    });

    if (!user?.unsubscribeToken) {
      return null;
    }

    return `${baseUrl}/api/unsubscribe?token=${user.unsubscribeToken}&type=${type}`;
  } catch (error) {
    console.error('Error getting unsubscribe URL:', error);
    return null;
  }
}

/**
 * Get email preference summary for a user
 */
export async function getEmailPreferences(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        marketingEmailsEnabled: true,
        feedbackEmailsEnabled: true,
        unsubscribedAt: true,
      },
    });

    return user || null;
  } catch (error) {
    console.error('Error getting email preferences:', error);
    return null;
  }
}
