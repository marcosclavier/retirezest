import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken, setSession } from '@/lib/auth';
import { registerRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { handleApiError, ValidationError } from '@/lib/errors';
import { sendAdminNewUserNotification } from '@/lib/email';
import { sendVerificationEmail } from '@/lib/email-verification';
import { verifyTurnstile, getClientIp } from '@/lib/turnstile';
import crypto from 'crypto';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Apply rate limiting - prevent abuse of registration endpoint
  const rateLimitResult = await registerRateLimit(request as any);

  if (!rateLimitResult.success) {
    const resetDate = new Date(rateLimitResult.resetTime || 0);
    const retryAfterSeconds = Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: 'Too many registration attempts. Please try again later.',
        resetAt: resetDate.toISOString(),
        retryAfter: retryAfterSeconds
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfterSeconds.toString(),
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate.toISOString()
        }
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password, firstName, lastName, turnstileToken } = body;

    // Validate Turnstile FIRST - before any database queries
    if (!turnstileToken || typeof turnstileToken !== 'string') {
      throw new ValidationError('Security verification is required', 'turnstile');
    }

    const clientIp = getClientIp(request);
    const turnstileResult = await verifyTurnstile(turnstileToken, clientIp);

    if (!turnstileResult.success) {
      logger.warn('Turnstile verification failed for registration', {
        errorCodes: turnstileResult.errorCodes,
        email: email || 'unknown',
        ip: clientIp,
      });
      throw new ValidationError('Security verification failed. Please try again.', 'turnstile');
    }

    // Validate input
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required', 'email');
    }
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required', 'password');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters', 'password');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ValidationError('An account with this email already exists', 'email');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        verificationEmailSentAt: new Date(),
      },
    });

    // Create token
    const token = await createToken({
      userId: user.id,
      email: user.email,
    });

    // Set session cookie
    await setSession(token);

    // Send verification email (non-blocking - don't wait for it)
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

    sendVerificationEmail({
      to: user.email,
      verificationUrl,
      userName,
    }).catch((error) => {
      // Log error but don't fail the registration
      logger.error('Failed to send verification email', error, {
        userId: user.id,
        userEmail: user.email,
      });
    });

    // Send admin notification email (non-blocking - don't wait for it)
    // This runs in the background and won't affect the user's registration experience
    sendAdminNewUserNotification({
      userEmail: user.email,
      userName: userName || 'No name provided',
      registrationDate: user.createdAt,
    }).catch((error) => {
      // Log error but don't fail the registration
      logger.error('Failed to send admin notification', error, {
        userId: user.id,
        userEmail: user.email,
      });
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    logger.error('Registration failed', error, {
      endpoint: '/api/auth/register',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
