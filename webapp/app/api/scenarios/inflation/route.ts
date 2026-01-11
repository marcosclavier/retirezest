import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError } from '@/lib/errors';

/**
 * PUT /api/scenarios/inflation
 * Update inflation rates in the baseline scenario
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { expenseInflationRate, inflationRate } = body;

    // Validate input
    if (typeof expenseInflationRate !== 'number' || typeof inflationRate !== 'number') {
      return NextResponse.json(
        { error: 'Invalid inflation rates provided' },
        { status: 400 }
      );
    }

    // Find or create baseline scenario
    let baselineScenario = await prisma.scenario.findFirst({
      where: {
        userId: session.userId,
        isBaseline: true,
      },
    });

    if (baselineScenario) {
      // Update existing baseline scenario
      baselineScenario = await prisma.scenario.update({
        where: { id: baselineScenario.id },
        data: {
          expenseInflationRate,
          inflationRate,
        },
      });
    } else {
      // Create baseline scenario if it doesn't exist
      baselineScenario = await prisma.scenario.create({
        data: {
          userId: session.userId,
          name: 'Baseline',
          description: 'Default retirement scenario',
          isBaseline: true,
          currentAge: 65,
          retirementAge: 65,
          lifeExpectancy: 95,
          annualExpenses: 60000,
          expenseInflationRate,
          inflationRate,
          investmentReturnRate: 5.0,
          rrspToRrifAge: 71,
        },
      });
    }

    logger.info('Inflation rates updated successfully', {
      userId: session.userId,
      expenseInflationRate,
      inflationRate,
    });

    return NextResponse.json({
      success: true,
      expenseInflationRate: baselineScenario.expenseInflationRate,
      inflationRate: baselineScenario.inflationRate,
    });
  } catch (error) {
    logger.error('Error updating inflation rates', error, {
      endpoint: '/api/scenarios/inflation',
      method: 'PUT',
    });
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
