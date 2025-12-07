/**
 * CSRF Protection for Edge Runtime
 * Uses Web Crypto API instead of Node.js crypto for Edge Runtime compatibility
 */

// Use different cookie names for development vs production
const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-csrf-token' : 'csrf-token';
const HEADER_NAME = 'x-csrf-token';

// Secret for HMAC - in production, use environment variable
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-secret-change-me';

/**
 * Validate CSRF token from request (Edge Runtime compatible)
 */
export async function validateCsrfTokenEdge(request: Request): Promise<boolean> {
  try {
    // Get token from header
    const headerToken = request.headers.get(HEADER_NAME);
    console.log('[CSRF-EDGE] Header token:', headerToken ? `${headerToken.substring(0, 20)}...` : 'MISSING');

    if (!headerToken) {
      console.log('[CSRF-EDGE] Validation failed: No header token');
      return false;
    }

    // Get token from cookie
    const cookieHeader = request.headers.get('cookie');
    console.log('[CSRF-EDGE] Cookie header:', cookieHeader ? 'present' : 'MISSING');

    if (!cookieHeader) {
      console.log('[CSRF-EDGE] Validation failed: No cookie header');
      return false;
    }

    // Parse cookies manually since we're in edge runtime
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const cookieToken = cookies[COOKIE_NAME];
    console.log('[CSRF-EDGE] Cookie token:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'MISSING');
    console.log('[CSRF-EDGE] Cookie name:', COOKIE_NAME);

    if (!cookieToken) {
      console.log('[CSRF-EDGE] Validation failed: No cookie token');
      return false;
    }

    // Tokens must match
    if (headerToken !== cookieToken) {
      console.log('[CSRF-EDGE] Validation failed: Token mismatch');
      return false;
    }

    // Validate token structure
    const parts = headerToken.split('.');
    if (parts.length !== 2) {
      console.log('[CSRF-EDGE] Validation failed: Invalid token structure');
      return false;
    }

    const [randomToken, signature] = parts;

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(CSRF_SECRET);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const dataToSign = encoder.encode(randomToken);
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);

    // Convert signature to hex
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Use timing-safe comparison
    const isValid = timingSafeEqual(signature, expectedSignature);
    console.log('[CSRF-EDGE] Signature validation:', isValid ? 'PASSED' : 'FAILED');
    return isValid;
  } catch (error) {
    console.log('[CSRF-EDGE] Validation error:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison
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
