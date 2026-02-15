import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email-verification';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Rate limit: Only allow resending once every 60 seconds
    if (user.verificationEmailSentAt) {
      const timeSinceLastSent = Date.now() - user.verificationEmailSentAt.getTime();
      const oneMinute = 60 * 1000;

      if (timeSinceLastSent < oneMinute) {
        const secondsRemaining = Math.ceil((oneMinute - timeSinceLastSent) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${secondsRemaining} seconds before requesting another verification email`,
            retryAfter: secondsRemaining
          },
          { status: 429 }
        );
      }
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        verificationEmailSentAt: new Date(),
      },
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

    const result = await sendVerificationEmail({
      to: user.email,
      verificationUrl,
      userName: [user.firstName, user.lastName].filter(Boolean).join(' '),
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    logger.info('Verification email resent', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    logger.error('Failed to resend verification email', error);
    return NextResponse.json(
      { error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
}
