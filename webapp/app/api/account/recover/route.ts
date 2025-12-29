import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/account/recover
 *
 * Recover a soft-deleted account within the 30-day grace period.
 *
 * Security features:
 * - Requires authentication
 * - Validates grace period hasn't expired
 * - Audit logging
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Check if account is marked for deletion
    if (!user.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Account is not scheduled for deletion' },
        { status: 400 }
      );
    }

    // 4. Check if grace period has expired
    const now = new Date();
    if (user.scheduledDeletionAt && now > user.scheduledDeletionAt) {
      return NextResponse.json(
        { success: false, error: 'Recovery period has expired. Account cannot be recovered.' },
        { status: 400 }
      );
    }

    // 5. Recover account (remove deletion markers)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: null,
        scheduledDeletionAt: null,
        deletionReason: null,
      },
    });

    // 6. Log recovery event
    console.log(`[ACCOUNT RECOVERY] User ${user.email} (ID: ${user.id}) recovered their account`);

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: 'Account successfully recovered. Welcome back!',
    });

  } catch (error) {
    console.error('[ACCOUNT RECOVERY ERROR]', error);

    return NextResponse.json(
      { success: false, error: 'Failed to recover account. Please try again.' },
      { status: 500 }
    );
  }
}
