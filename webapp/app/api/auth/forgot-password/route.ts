import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

    // Send password reset email
    const userName = user.firstName
      ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
      : undefined;

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      userName,
    });

    // Log the result
    if (emailResult.success) {
      console.log('Password reset email sent successfully to:', user.email);
    } else {
      console.error('Failed to send password reset email:', emailResult.error);
      // In development, return the URL if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode - Reset URL:', resetUrl);
      }
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      // In development, include the reset URL if email sending failed or if explicitly in dev mode
      resetUrl:
        process.env.NODE_ENV === 'development' && !emailResult.success
          ? resetUrl
          : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
