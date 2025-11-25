/**
 * API Client for Retirement Simulation
 * Communicates with Next.js API routes, which proxy to Python FastAPI server
 * This ensures all requests go through authentication middleware
 */

import type {
  HouseholdInput,
  SimulationResponse,
  CompositionAnalysis,
} from '@/lib/types/simulation';

/**
 * Run full retirement simulation
 * Calls Next.js API route which proxies to Python backend
 */
export async function runSimulation(
  householdInput: HouseholdInput
): Promise<SimulationResponse> {
  try {
    const response = await fetch('/api/simulation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(householdInput),
    });

    const data: SimulationResponse = await response.json();

    // Even if HTTP status is not ok, the response body may contain useful error info
    if (!response.ok) {
      console.error('Simulation API error:', data);
      return {
        success: false,
        message: data.message || 'Failed to run simulation',
        warnings: data.warnings || [],
        error: data.error || `HTTP ${response.status}`,
        error_details: data.error_details || response.statusText,
      };
    }

    return data;
  } catch (error) {
    console.error('Simulation API error:', error);

    // Return error response
    return {
      success: false,
      message: 'Failed to run simulation',
      warnings: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      error_details: 'Network or client error',
    };
  }
}

/**
 * Analyze household asset composition and get strategy recommendation
 * Calls Next.js API route which proxies to Python backend
 */
export async function analyzeComposition(
  householdInput: HouseholdInput
): Promise<CompositionAnalysis | null> {
  try {
    const response = await fetch('/api/simulation/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(householdInput),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Composition analysis error:', errorData);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Composition analysis error:', error);
    return null;
  }
}

/**
 * Health check - verify Python API is running
 * For development: directly checks Python API
 * For production: could be proxied through Next.js
 */
export async function healthCheck(): Promise<boolean> {
  try {
    // In development, check Python API directly
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonApiUrl}/api/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
