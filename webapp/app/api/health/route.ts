/**
 * Health Check Endpoint
 *
 * Returns the health status of the application and its dependencies
 * Used by monitoring systems, load balancers, and container orchestration
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    pythonApi: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    database: { status: 'down' },
    pythonApi: { status: 'down' },
  };

  // Check database connectivity
  const dbStartTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'up',
      responseTime: Date.now() - dbStartTime,
    };
  } catch (error) {
    checks.database = {
      status: 'down',
      responseTime: Date.now() - dbStartTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    logger.error('Database health check failed', error);
  }

  // Check Python API connectivity
  const pythonStartTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${PYTHON_API_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      checks.pythonApi = {
        status: 'up',
        responseTime: Date.now() - pythonStartTime,
      };
    } else {
      checks.pythonApi = {
        status: 'down',
        responseTime: Date.now() - pythonStartTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    checks.pythonApi = {
      status: 'down',
      responseTime: Date.now() - pythonStartTime,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
    // Don't log this as error - Python API may not be running in dev
    logger.debug('Python API health check failed', { error });
  }

  // Determine overall health status
  let overallStatus: HealthStatus['status'] = 'healthy';

  if (checks.database.status === 'down') {
    // Database is critical - mark as unhealthy
    overallStatus = 'unhealthy';
  } else if (checks.pythonApi.status === 'down') {
    // Python API is important but not critical - mark as degraded
    overallStatus = 'degraded';
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
