/**
 * Next.js API Route: /api/simulation/analyze
 *
 * Proxies composition analysis requests to Python FastAPI backend
 * Adds authentication, logging, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Log request
    console.log(`[Composition Analysis] User: ${session.email}, Request started`);

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
    console.log(`[Composition Analysis] User: ${session.email}, Status: ${pythonResponse.status}, Duration: ${duration}ms`);

    // Check for Python API errors
    if (!pythonResponse.ok) {
      console.error(`[Composition Analysis] Python API error: ${pythonResponse.status}`, responseData);

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

    console.error('[Composition Analysis] Error:', error);
    console.error(`[Composition Analysis] Failed after ${duration}ms`);

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Composition analysis failed',
      },
      { status: 500 }
    );
  }
}
