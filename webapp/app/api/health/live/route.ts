/**
 * Liveness Probe Endpoint
 *
 * Indicates whether the application is alive and should not be restarted
 * Used by Kubernetes and container orchestration systems
 *
 * Always returns 200 unless the application is completely broken
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
