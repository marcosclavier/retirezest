/**
 * Google reCAPTCHA v2 Verification Utility
 *
 * Provides server-side verification of reCAPTCHA tokens
 * to protect authentication endpoints from bot attacks.
 */

import { logger } from './logger';

export interface RecaptchaVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTimestamp?: string;
  hostname?: string;
}

/**
 * Verifies a reCAPTCHA token with Google's verification API
 *
 * @param token - The reCAPTCHA token from the client
 * @param remoteIp - Optional: The user's IP address
 * @returns Promise<RecaptchaVerificationResult>
 */
export async function verifyRecaptcha(
  token: string,
  remoteIp?: string
): Promise<RecaptchaVerificationResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    logger.error('RECAPTCHA_SECRET_KEY is not configured', null, {
      endpoint: 'verifyRecaptcha',
    });
    throw new Error('reCAPTCHA is not properly configured');
  }

  if (!token || typeof token !== 'string') {
    return {
      success: false,
      errorCodes: ['missing-input-response'],
    };
  }

  try {
    // Build the verification request body
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    // Add remote IP if provided (optional but recommended)
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    // Call Google's reCAPTCHA verification API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      logger.error('reCAPTCHA verification API returned error', null, {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error('reCAPTCHA verification service unavailable');
    }

    const data = await response.json();

    // Log verification results for security monitoring
    if (!data.success) {
      logger.warn('reCAPTCHA verification failed', {
        errorCodes: data['error-codes'] || [],
        hostname: data.hostname,
      });
    }

    return {
      success: data.success,
      errorCodes: data['error-codes'] || [],
      challengeTimestamp: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (error) {
    logger.error('reCAPTCHA verification failed', error, {
      endpoint: 'verifyRecaptcha',
    });

    // Return failure but don't expose internal error details
    return {
      success: false,
      errorCodes: ['verification-failed'],
    };
  }
}

/**
 * Extracts the client's IP address from the request
 * Handles various headers set by proxies and CDNs
 *
 * @param request - The Next.js request object
 * @returns The client's IP address or undefined
 */
export function getClientIp(request: Request): string | undefined {
  // Try common headers used by proxies/CDNs
  const headers = request.headers;

  // Vercel/Cloudflare/common proxies
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Alternative headers
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return undefined;
}
