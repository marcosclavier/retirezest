import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { clearSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    await clearSession();

    // Return JSON success response instead of redirect
    // The client will handle the redirect
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
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
  // Allow GET method and redirect for convenience (e.g., when navigating directly to logout URL)
  try {
    await clearSession();
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  } catch (error) {
    logger.error('Logout failed', error, {
      endpoint: '/api/auth/logout',
      method: 'GET'
    });

    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
}
