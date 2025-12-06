import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors';

/**
 * GET /api/projections
 * Get all projections for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;

    const projections = await prisma.projection.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        scenario: true,
      },
    });

    return NextResponse.json(projections);
  } catch (error) {
    logger.error('Error fetching projections', error, {
      endpoint: '/api/projections',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/projections
 * Create a new saved projection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;

    const body = await request.json();
    const { name, description, inputs, results } = body;

    if (!name || !inputs || !results) {
      throw new ValidationError('Missing required fields: name, inputs, results');
    }

    // Create a scenario first (to store the inputs)
    const scenario = await prisma.scenario.create({
      data: {
        userId,
        name,
        description: description || '',
        currentAge: inputs.currentAge,
        retirementAge: inputs.retirementAge,
        lifeExpectancy: inputs.lifeExpectancy,
        province: inputs.province,
        rrspBalance: inputs.rrspBalance,
        tfsaBalance: inputs.tfsaBalance,
        nonRegBalance: inputs.nonRegBalance,
        realEstateValue: inputs.realEstateValue || 0,
        employmentIncome: inputs.employmentIncome,
        pensionIncome: inputs.pensionIncome || 0,
        rentalIncome: inputs.rentalIncome || 0,
        otherIncome: inputs.otherIncome || 0,
        cppStartAge: inputs.cppStartAge,
        oasStartAge: inputs.oasStartAge,
        averageCareerIncome: inputs.averageCareerIncome,
        yearsOfCPPContributions: inputs.yearsOfCPPContributions,
        yearsInCanada: inputs.yearsInCanada,
        annualExpenses: inputs.annualExpenses,
        expenseInflationRate: inputs.expenseInflationRate,
        investmentReturnRate: inputs.investmentReturnRate,
        inflationRate: inputs.inflationRate,
        rrspToRrifAge: inputs.rrspToRrifAge,
        projectionResults: JSON.stringify(results),
        isBaseline: false,
      },
    });

    // Create the projection
    const projection = await prisma.projection.create({
      data: {
        userId,
        scenarioId: scenario.id,
        retirementAge: inputs.retirementAge,
        results: JSON.stringify(results),
        totalLifetimeIncome: results.totalGrossIncome || null,
        estateValue: results.remainingAssets || null,
      },
      include: {
        scenario: true,
      },
    });

    return NextResponse.json(projection, { status: 201 });
  } catch (error) {
    logger.error('Error creating projection', error, {
      endpoint: '/api/projections',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
