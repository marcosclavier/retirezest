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
import { validateHouseholdInput, getValidationErrorMessage } from '@/lib/validation/simulation-validation';

/**
 * Convert new frontend structure to backend-compatible structure
 * Temporarily needed until backend is updated to new structure
 */
function convertToBackendFormat(input: HouseholdInput): any {
  const p1AnnualContribution = input.p1.tfsa_contribution_annual || 0;
  const p2AnnualContribution = input.p2.tfsa_contribution_annual || 0;
  const avgContribution = (p1AnnualContribution + p2AnnualContribution) / 2;

  return {
    ...input,
    p1: {
      ...input.p1,
      tfsa_room_annual_growth: input.tfsa_room_annual_growth,
    },
    p2: {
      ...input.p2,
      tfsa_room_annual_growth: input.tfsa_room_annual_growth,
    },
    tfsa_contribution_each: avgContribution,
  };
}

/**
 * Run full retirement simulation
 * Calls Next.js API route which proxies to Python backend
 */
export async function runSimulation(
  householdInput: HouseholdInput,
  csrfToken: string | null = null
): Promise<SimulationResponse> {
  try {
    // Validate input before sending to API
    const validationResult = validateHouseholdInput(householdInput);
    if (!validationResult.isValid) {
      const errorMessage = getValidationErrorMessage(validationResult);
      console.warn('⚠️ Validation errors detected:', validationResult.errors);
      return {
        success: false,
        message: errorMessage,
        warnings: [],
        error: 'Validation failed',
        errors: validationResult.errors.map(e => ({
          field: e.field,
          message: e.message,
          type: 'validation_error',
          input: undefined
        }))
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    // Convert to backend-compatible format
    const backendInput = convertToBackendFormat(householdInput);

    // Debug logging
    console.log('🚀 Sending simulation request:', {
      p1_balances: {
        tfsa: householdInput.p1.tfsa_balance,
        rrif: householdInput.p1.rrif_balance,
        rrsp: householdInput.p1.rrsp_balance,
        nonreg: householdInput.p1.nonreg_balance,
        corporate: householdInput.p1.corporate_balance
      },
      p2_balances: {
        tfsa: householdInput.p2.tfsa_balance,
        rrif: householdInput.p2.rrif_balance,
        rrsp: householdInput.p2.rrsp_balance,
        nonreg: householdInput.p2.nonreg_balance,
        corporate: householdInput.p2.corporate_balance
      }
    });

    console.log('🌐 Sending fetch request to /api/simulation/run...');
    const response = await fetch('/api/simulation/run', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        household_input: backendInput
      }),
    });

    console.log('✅ Fetch completed. Status:', response.status, response.statusText);
    console.log('📦 Parsing JSON response...');
    const data: SimulationResponse = await response.json();
    console.log('✅ JSON parsed successfully:', data.success ? 'SUCCESS' : 'FAILED');

    // Even if HTTP status is not ok, the response body may contain useful error info
    if (!response.ok) {
      console.error('❌ Simulation API error:', data);
      console.error('Response status:', response.status, response.statusText);

      // Format validation errors from the new backend format
      let errorMessage = data.message || 'Failed to run simulation';
      if (data.errors && Array.isArray(data.errors)) {
        const validationMessages = data.errors
          .map((err: any) => err.message || err.field)
          .join('; ');
        errorMessage = `${errorMessage}\n\nValidation errors:\n${validationMessages}`;
      }

      return {
        success: false,
        message: errorMessage,
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
  householdInput: HouseholdInput,
  csrfToken: string | null = null
): Promise<CompositionAnalysis | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    // Convert to backend-compatible format
    const backendInput = convertToBackendFormat(householdInput);

    const response = await fetch('/api/simulation/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(backendInput),
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
 * Checks through Next.js API to avoid CORS issues
 */
export async function healthCheck(): Promise<boolean> {
  try {
    // Check through Next.js health endpoint
    const response = await fetch('/api/health', {
      method: 'GET',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // Check if Python API is up (healthy or degraded means database works at minimum)
    return data.checks?.pythonApi?.status === 'up';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
