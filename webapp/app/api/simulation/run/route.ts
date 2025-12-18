/**
 * Next.js API Route: /api/simulation/run
 *
 * Proxies requests to Python FastAPI backend
 * Adds authentication, logging, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError } from '@/lib/errors';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const session = await getSession();

    if (!session) {
      throw new AuthenticationError('You must be logged in to run simulations');
    }

    // Parse request body
    const body = await request.json();

    // Debug: Log account balances
    console.log('📊 API received balances:', {
      p1: {
        tfsa: body.p1?.tfsa_balance,
        rrif: body.p1?.rrif_balance,
        rrsp: body.p1?.rrsp_balance,
        nonreg: body.p1?.nonreg_balance,
        corporate: body.p1?.corporate_balance
      },
      p2: {
        tfsa: body.p2?.tfsa_balance,
        rrif: body.p2?.rrif_balance,
        rrsp: body.p2?.rrsp_balance,
        nonreg: body.p2?.nonreg_balance,
        corporate: body.p2?.corporate_balance
      }
    });

    // Log request (remove sensitive data for production)
    logger.info('Simulation request started', {
      user: session.email,
      endpoint: '/api/simulation/run'
    });

    // Forward request to Python API
    const pythonResponse = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await pythonResponse.json();

    // Calculate processing time
    const duration = Date.now() - startTime;
    logger.info('Simulation response received', {
      user: session.email,
      status: pythonResponse.status,
      duration: `${duration}ms`
    });

    // Check for Python API errors
    if (!pythonResponse.ok) {
      logger.error('Python API error', undefined, {
        status: pythonResponse.status,
        response: responseData
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Simulation failed',
          error: responseData.error || 'Python API returned an error',
          error_details: responseData.error_details || `HTTP ${pythonResponse.status}`,
          warnings: [],
        },
        { status: pythonResponse.status }
      );
    }

    // Return successful response
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    const duration = Date.now() - startTime;

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error('Python API connection failed', error, {
        endpoint: '/api/simulation/run',
        duration: `${duration}ms`
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Unable to connect to simulation engine',
          error: 'Python API is not responding',
          error_details: 'Please ensure the Python backend is running on port 8000',
          warnings: [],
        },
        { status: 503 }
      );
    }

    // Generic error response
    logger.error('Simulation failed', error, {
      endpoint: '/api/simulation/run',
      method: 'POST',
      duration: `${duration}ms`
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json({
      success: false,
      message: 'Simulation failed',
      error: body.error,
      error_details: 'Internal server error',
      warnings: [],
    }, { status });
  }
}
