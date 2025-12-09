import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { clearSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    await clearSession();

    // Redirect to home page after logout
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  } catch (error) {
    logger.error('Logout failed', error, {
      endpoint: '/api/auth/logout',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function GET(request: NextRequest) {
  // Allow GET method as well for convenience
  return POST(request);
}
