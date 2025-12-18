/**
 * Readiness Probe Endpoint
 *
 * Indicates whether the application is ready to accept traffic
 * Used by Kubernetes and container orchestration systems
 *
 * Returns 200 if ready, 503 if not ready
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if database is accessible
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      { status: 'ready' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not ready',
        reason: 'Database unavailable',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
