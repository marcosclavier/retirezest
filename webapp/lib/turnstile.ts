/**
 * Cloudflare Turnstile Verification Utility
 *
 * Provides server-side verification of Turnstile tokens
 * to protect authentication endpoints from bot attacks.
 *
 * Turnstile is a privacy-friendly alternative to reCAPTCHA
 * that doesn't track users and provides a better UX.
 */

import { logger } from './logger';

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTimestamp?: string;
  hostname?: string;
}

/**
 * Verifies a Turnstile token with Cloudflare's verification API
 *
 * @param token - The Turnstile token from the client
 * @param remoteIp - Optional: The user's IP address
 * @returns Promise<TurnstileVerificationResult>
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    logger.error('TURNSTILE_SECRET_KEY is not configured', null, {
      endpoint: 'verifyTurnstile',
    });
    throw new Error('Turnstile is not properly configured');
  }

  if (!token || typeof token !== 'string') {
    return {
      success: false,
      errorCodes: ['missing-input-response'],
    };
  }

  try {
    // Build the verification request body
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    // Add remote IP if provided (optional but recommended)
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    // Call Cloudflare's Turnstile verification API
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      logger.error('Turnstile verification API returned error', null, {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error('Turnstile verification service unavailable');
    }

    const data = await response.json();

    // Log verification results for security monitoring
    if (!data.success) {
      logger.warn('Turnstile verification failed', {
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
    logger.error('Turnstile verification failed', error, {
      endpoint: 'verifyTurnstile',
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
