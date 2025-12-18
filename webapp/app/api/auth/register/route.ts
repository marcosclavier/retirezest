import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken, setSession } from '@/lib/auth';
import { registerRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { handleApiError, ValidationError } from '@/lib/errors';

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
    const { email, password, firstName, lastName } = body;

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
