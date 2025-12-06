import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';

export async function POST() {
  try {
    await clearSession();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout failed', error, {
      endpoint: '/api/auth/logout',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function GET() {
  // Allow GET method as well for convenience
  return POST();
}
