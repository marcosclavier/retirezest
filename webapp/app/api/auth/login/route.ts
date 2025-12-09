import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createToken, setSession } from '@/lib/auth';
import { loginRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { handleApiError, ValidationError, AuthenticationError } from '@/lib/errors';

export async function POST(request: Request) {
  // Apply rate limiting FIRST - protect against brute force attacks
  const rateLimitResult = await loginRateLimit(request as any);

  if (!rateLimitResult.success) {
    const resetDate = new Date(rateLimitResult.resetTime || 0);
    const retryAfterSeconds = Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        resetAt: resetDate.toISOString(),
        retryAfter: retryAfterSeconds
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfterSeconds.toString(),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate.toISOString()
        }
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required', 'email');
    }
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required', 'password');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AuthenticationError('Email or password does not match. Please check your credentials or register.');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw new AuthenticationError('Email or password does not match. Please check your credentials or register.');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
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
    logger.error('Login failed', error, {
      endpoint: '/api/auth/login',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
