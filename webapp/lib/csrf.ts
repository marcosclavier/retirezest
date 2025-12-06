/**
 * CSRF Protection
 * Protects against Cross-Site Request Forgery attacks
 */

import { cookies } from 'next/headers';
import { randomBytes, createHmac } from 'crypto';

const COOKIE_NAME = '__Host-csrf-token';
const HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

// Secret for HMAC - in production, use environment variable
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-secret-change-me';

/**
 * Generate a cryptographically secure CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  // Generate random token
  const randomToken = randomBytes(TOKEN_LENGTH).toString('hex');

  // Create HMAC signature
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(randomToken);
  const signature = hmac.digest('hex');

  // Combine token and signature
  const token = `${randomToken}.${signature}`;

  // Store in httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  try {
    // Get token from header
    const headerToken = request.headers.get(HEADER_NAME);
    if (!headerToken) {
      return false;
    }

    // Get token from cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
    if (!cookieToken) {
      return false;
    }

    // Tokens must match
    if (headerToken !== cookieToken) {
      return false;
    }

    // Validate token structure
    const parts = headerToken.split('.');
    if (parts.length !== 2) {
      return false;
    }

    const [randomToken, signature] = parts;

    // Verify signature
    const hmac = createHmac('sha256', CSRF_SECRET);
    hmac.update(randomToken);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    return false;
  }
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Clear CSRF token
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
