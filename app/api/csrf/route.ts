/**
 * CSRF Token Endpoint
 * Generates and returns CSRF tokens for client-side forms
 */

import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const token = await generateCsrfToken();

    return NextResponse.json({
      token,
      expiresIn: 86400 // 24 hours in seconds
    });
  } catch (error) {
    logger.error('Failed to generate CSRF token', error, {
      endpoint: '/api/csrf',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
