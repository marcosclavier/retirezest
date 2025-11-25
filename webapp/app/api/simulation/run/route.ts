/**
 * Next.js API Route: /api/simulation/run
 *
 * Proxies requests to Python FastAPI backend
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
        { success: false, error: 'Unauthorized', message: 'You must be logged in to run simulations' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Log request (remove sensitive data for production)
    console.log(`[Simulation API] User: ${session.email}, Request started`);

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
    console.log(`[Simulation API] User: ${session.email}, Status: ${pythonResponse.status}, Duration: ${duration}ms`);

    // Check for Python API errors
    if (!pythonResponse.ok) {
      console.error(`[Simulation API] Python API error: ${pythonResponse.status}`, responseData);

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

    console.error('[Simulation API] Error:', error);
    console.error(`[Simulation API] Failed after ${duration}ms`);

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
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
    return NextResponse.json(
      {
        success: false,
        message: 'Simulation failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        error_details: 'Internal server error',
        warnings: [],
      },
      { status: 500 }
    );
  }
}
