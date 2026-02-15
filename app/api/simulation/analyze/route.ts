/**
 * Next.js API Route: /api/simulation/analyze
 *
 * Proxies composition analysis requests to Python FastAPI backend
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
      throw new AuthenticationError('You must be logged in');
    }

    // Parse request body
    const body = await request.json();

    // Log request
    logger.info('Composition analysis request started', {
      user: session.email,
      endpoint: '/api/simulation/analyze'
    });

    // Forward request to Python API
    const pythonResponse = await fetch(`${PYTHON_API_URL}/api/analyze-composition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await pythonResponse.json();

    // Calculate processing time
    const duration = Date.now() - startTime;
    logger.info('Composition analysis response received', {
      user: session.email,
      status: pythonResponse.status,
      duration: `${duration}ms`
    });

    // Check for Python API errors
    if (!pythonResponse.ok) {
      logger.error('Python API error in composition analysis', undefined, {
        status: pythonResponse.status,
        response: responseData
      });

      return NextResponse.json(
        {
          success: false,
          error: responseData.error || 'Python API returned an error',
          message: 'Composition analysis failed',
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
        endpoint: '/api/simulation/analyze',
        duration: `${duration}ms`
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Python API is not responding',
          message: 'Unable to connect to simulation engine',
        },
        { status: 503 }
      );
    }

    // Generic error response
    logger.error('Composition analysis failed', error, {
      endpoint: '/api/simulation/analyze',
      method: 'POST',
      duration: `${duration}ms`
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json({
      success: false,
      error: body.error,
      message: 'Composition analysis failed',
    }, { status });
  }
}
