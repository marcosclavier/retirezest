/**
 * Next.js API Route: /api/simulation/what-if
 *
 * Run a What-If scenario simulation by applying adjustments to a base household input.
 * This enables users to explore how changes to spending, retirement age, CPP, and OAS
 * would impact their retirement plan using the full simulation engine.
 *
 * Features:
 * - Applies scenario adjustments to household input
 * - Runs full Python simulation with tax calculations
 * - Returns complete simulation results for comparison
 * - Authenticated endpoint (requires logged-in user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { AuthenticationError } from '@/lib/errors';
import type { HouseholdInput } from '@/lib/types/simulation';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * ScenarioAdjustments interface
 * Matches the interface exported from WhatIfSliders.tsx
 */
interface ScenarioAdjustments {
  spendingMultiplier: number;  // 0.5 to 1.5 (50% to 150%)
  retirementAgeShift: number;  // -5 to +5 years
  cppStartAgeShift: number;    // -5 to +5 years (but min 60, max 70)
  oasStartAgeShift: number;    // -5 to +5 years (but min 65, max 70)
}

/**
 * Apply scenario adjustments to household input
 * Creates a modified version of the household input with adjustments applied
 */
function applyAdjustments(
  base: HouseholdInput,
  adjustments: ScenarioAdjustments
): HouseholdInput {
  // Apply spending multiplier to all spending phases
  const spending_go_go = Math.round(base.spending_go_go * adjustments.spendingMultiplier);
  const spending_slow_go = Math.round(base.spending_slow_go * adjustments.spendingMultiplier);
  const spending_no_go = Math.round(base.spending_no_go * adjustments.spendingMultiplier);

  // Apply retirement age shift to person 1
  const p1_start_age = base.p1.start_age + adjustments.retirementAgeShift;

  // Apply CPP/OAS start age shifts with bounds enforcement
  const p1_cpp_start_age = Math.max(60, Math.min(70, base.p1.cpp_start_age + adjustments.cppStartAgeShift));
  const p1_oas_start_age = Math.max(65, Math.min(70, base.p1.oas_start_age + adjustments.oasStartAgeShift));

  // Apply adjustments to person 2 if they exist
  const hasPartner = base.p2?.name && base.p2.name.trim() !== '';
  let p2 = base.p2;

  if (hasPartner) {
    const p2_start_age = base.p2.start_age + adjustments.retirementAgeShift;
    const p2_cpp_start_age = Math.max(60, Math.min(70, base.p2.cpp_start_age + adjustments.cppStartAgeShift));
    const p2_oas_start_age = Math.max(65, Math.min(70, base.p2.oas_start_age + adjustments.oasStartAgeShift));

    p2 = {
      ...base.p2,
      start_age: p2_start_age,
      cpp_start_age: p2_cpp_start_age,
      oas_start_age: p2_oas_start_age,
    };
  }

  // Create modified household input
  const modified: HouseholdInput = {
    ...base,
    spending_go_go,
    spending_slow_go,
    spending_no_go,
    p1: {
      ...base.p1,
      start_age: p1_start_age,
      cpp_start_age: p1_cpp_start_age,
      oas_start_age: p1_oas_start_age,
    },
    p2,
  };

  return modified;
}

/**
 * POST /api/simulation/what-if
 *
 * Request body:
 * {
 *   household: HouseholdInput,  // Base household input
 *   adjustments: ScenarioAdjustments  // What-If adjustments to apply
 * }
 *
 * Response:
 * SimulationResponse (full simulation results with adjustments applied)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const session = await getSession();

    if (!session) {
      throw new AuthenticationError('You must be logged in to run What-If scenarios');
    }

    // Email verification check
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      logger.info('What-If scenario blocked - email not verified', {
        user: session.email,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Please verify your email to run What-If scenarios',
          error: 'Email verification required',
          error_details: 'You must verify your email address before running What-If scenarios.',
          requiresVerification: true,
          warnings: [],
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { household, adjustments } = body;

    if (!household || !adjustments) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request',
          error: 'Missing required fields: household and adjustments',
          warnings: [],
        },
        { status: 400 }
      );
    }

    // Validate adjustments
    if (
      typeof adjustments.spendingMultiplier !== 'number' ||
      typeof adjustments.retirementAgeShift !== 'number' ||
      typeof adjustments.cppStartAgeShift !== 'number' ||
      typeof adjustments.oasStartAgeShift !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid adjustments',
          error: 'All adjustment values must be numbers',
          warnings: [],
        },
        { status: 400 }
      );
    }

    // Validate spending multiplier range
    if (adjustments.spendingMultiplier < 0.5 || adjustments.spendingMultiplier > 1.5) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid spending multiplier',
          error: 'Spending multiplier must be between 0.5 and 1.5',
          warnings: [],
        },
        { status: 400 }
      );
    }

    // Log request
    logger.info('What-If scenario request started', {
      user: session.email,
      endpoint: '/api/simulation/what-if',
      adjustments: {
        spendingMultiplier: adjustments.spendingMultiplier,
        retirementAgeShift: adjustments.retirementAgeShift,
        cppStartAgeShift: adjustments.cppStartAgeShift,
        oasStartAgeShift: adjustments.oasStartAgeShift,
      },
    });

    // Apply adjustments to household input
    const modifiedHousehold = applyAdjustments(household, adjustments);

    // Forward modified household to Python API
    const pythonResponse = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modifiedHousehold),
    });

    const responseData = await pythonResponse.json();

    // Calculate processing time
    const duration = Date.now() - startTime;
    logger.info('What-If scenario response received', {
      user: session.email,
      status: pythonResponse.status,
      duration: `${duration}ms`,
    });

    // Check for Python API errors
    if (!pythonResponse.ok) {
      logger.error('Python API error (What-If)', undefined, {
        status: pythonResponse.status,
        response: responseData,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'What-If simulation failed',
          error: responseData.error || 'Python API returned an error',
          error_details: responseData.error_details || `HTTP ${pythonResponse.status}`,
          warnings: [],
        },
        { status: pythonResponse.status }
      );
    }

    // Return simulation results
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('What-If scenario error', error as Error);

    return NextResponse.json(
      {
        success: false,
        message: 'What-If simulation failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: [],
      },
      { status: 500 }
    );
  }
}
