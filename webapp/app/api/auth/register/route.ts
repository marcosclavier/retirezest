import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken, setSession } from '@/lib/auth';
import { registerRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { handleApiError, ValidationError } from '@/lib/errors';
import { sendAdminNewUserNotification } from '@/lib/email';
import { verifyRecaptcha, getClientIp } from '@/lib/recaptcha';

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
    const { email, password, firstName, lastName, recaptchaToken } = body;

    // Validate reCAPTCHA FIRST - before any database queries
    if (!recaptchaToken || typeof recaptchaToken !== 'string') {
      throw new ValidationError('reCAPTCHA verification is required', 'recaptcha');
    }

    const clientIp = getClientIp(request);
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIp);

    if (!recaptchaResult.success) {
      logger.warn('reCAPTCHA verification failed for registration', {
        errorCodes: recaptchaResult.errorCodes,
        email: email || 'unknown',
        ip: clientIp,
      });
      throw new ValidationError('reCAPTCHA verification failed. Please try again.', 'recaptcha');
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
      },
    });

    // Create token
    const token = await createToken({
      userId: user.id,
      email: user.email,
    });

    // Set session cookie
    await setSession(token);

    // Send admin notification email (non-blocking - don't wait for it)
    // This runs in the background and won't affect the user's registration experience
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name provided';
    sendAdminNewUserNotification({
      userEmail: user.email,
      userName: userName,
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
