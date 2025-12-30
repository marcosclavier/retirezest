import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DELETE /api/account/delete
 *
 * Soft delete user account with 30-day recovery period.
 *
 * Security features:
 * - Requires authentication
 * - Password verification
 * - Confirmation text validation
 * - Audit logging
 *
 * Request body:
 * - password: string (user's current password)
 * - confirmationText: string (must be "DELETE")
 * - reason?: string (optional deletion reason)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { password, confirmationText, reason } = body;

    // 3. Validate required fields
    if (!password || !confirmationText) {
      return NextResponse.json(
        { success: false, error: 'Password and confirmation text are required' },
        { status: 400 }
      );
    }

    // 4. Validate confirmation text
    if (confirmationText !== 'DELETE') {
      return NextResponse.json(
        { success: false, error: 'Confirmation text must be "DELETE"' },
        { status: 400 }
      );
    }

    // 5. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 6. Check if account is already deleted
    if (user.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Account is already scheduled for deletion' },
        { status: 400 }
      );
    }

    // 7. Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // 8. Perform soft delete
    const deletedAt = new Date();
    const scheduledDeletionAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt,
        scheduledDeletionAt,
        deletionReason: reason || null,
      },
    });

    // 9. Log deletion event (for audit trail)
    console.log(`[ACCOUNT DELETION] User ${user.email} (ID: ${user.id}) marked for deletion. Scheduled for permanent deletion on ${scheduledDeletionAt.toISOString()}`);

    // 10. Return success response
    return NextResponse.json({
      success: true,
      message: 'Account marked for deletion. You have 30 days to recover your account.',
      deletedAt: deletedAt.toISOString(),
      scheduledDeletionAt: scheduledDeletionAt.toISOString(),
    });

  } catch (error) {
    console.error('[ACCOUNT DELETION ERROR]', error);

    return NextResponse.json(
      { success: false, error: 'Failed to delete account. Please try again.' },
      { status: 500 }
    );
  }
}
