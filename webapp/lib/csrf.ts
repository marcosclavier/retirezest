/**
 * CSRF Protection
 * Protects against Cross-Site Request Forgery attacks
 */

import { cookies } from 'next/headers';
import { randomBytes, createHmac } from 'crypto';

// Use __Host- prefix only in production (requires HTTPS)
// In development, use regular cookie name
const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-csrf-token' : 'csrf-token';
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
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
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
    console.log('[CSRF] Header token:', headerToken ? `${headerToken.substring(0, 20)}...` : 'MISSING');

    if (!headerToken) {
      console.log('[CSRF] Validation failed: No header token');
      return false;
    }

    // Get token from cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
    console.log('[CSRF] Cookie token:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'MISSING');
    console.log('[CSRF] Cookie name:', COOKIE_NAME);

    if (!cookieToken) {
      console.log('[CSRF] Validation failed: No cookie token');
      return false;
    }

    // Tokens must match
    if (headerToken !== cookieToken) {
      console.log('[CSRF] Validation failed: Token mismatch');
      console.log('[CSRF] Header:', headerToken);
      console.log('[CSRF] Cookie:', cookieToken);
      return false;
    }

    // Validate token structure
    const parts = headerToken.split('.');
    if (parts.length !== 2) {
      console.log('[CSRF] Validation failed: Invalid token structure');
      return false;
    }

    const [randomToken, signature] = parts;

    // Verify signature
    const hmac = createHmac('sha256', CSRF_SECRET);
    hmac.update(randomToken);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison
    const isValid = timingSafeEqual(signature, expectedSignature);
    console.log('[CSRF] Signature validation:', isValid ? 'PASSED' : 'FAILED');
    return isValid;
  } catch (error) {
    console.log('[CSRF] Validation error:', error);
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
