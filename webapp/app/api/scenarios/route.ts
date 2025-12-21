import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { projectRetirement, ProjectionInput } from '@/lib/calculations/projection';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors';

/**
 * GET /api/scenarios
 * Get all scenarios for the authenticated user
 */
// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;

    // Pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Fetch scenarios and total count in parallel
    const [scenarios, total] = await Promise.all([
      prisma.scenario.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          userId: true,
          name: true,
          description: true,
          currentAge: true,
          retirementAge: true,
          lifeExpectancy: true,
          province: true,
          rrspBalance: true,
          tfsaBalance: true,
          nonRegBalance: true,
          realEstateValue: true,
          employmentIncome: true,
          pensionIncome: true,
          rentalIncome: true,
          otherIncome: true,
          cppStartAge: true,
          oasStartAge: true,
          averageCareerIncome: true,
          yearsOfCPPContributions: true,
          yearsInCanada: true,
          annualExpenses: true,
          expenseInflationRate: true,
          investmentReturnRate: true,
          inflationRate: true,
          rrspToRrifAge: true,
          withdrawalStrategy: true,
          isBaseline: true,
          createdAt: true,
          updatedAt: true,
          // Exclude projectionResults to reduce payload size in list view
          // (fetch it separately when viewing individual scenario)
        },
      }),
      prisma.scenario.count({ where: { userId } }),
    ]);

    return NextResponse.json(
      {
        scenarios,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + scenarios.length < total,
        },
      },
      {
        headers: {
          // Cache for 60 seconds (private cache for user-specific data)
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    logger.error('Error fetching scenarios', error, {
      endpoint: '/api/scenarios',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/scenarios
 * Create a new scenario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.currentAge || !body.retirementAge || body.annualExpenses === undefined) {
      throw new ValidationError('Missing required fields');
    }

    // Create projection input from scenario data
    const projectionInput: ProjectionInput = {
      currentAge: body.currentAge,
      retirementAge: body.retirementAge,
      lifeExpectancy: body.lifeExpectancy || 95,
      province: body.province || 'AB',
      rrspBalance: body.rrspBalance || 0,
      tfsaBalance: body.tfsaBalance || 0,
      nonRegBalance: body.nonRegBalance || 0,
      realEstateValue: body.realEstateValue || 0,
      employmentIncome: body.employmentIncome || 0,
      pensionIncome: body.pensionIncome || 0,
      rentalIncome: body.rentalIncome || 0,
      otherIncome: body.otherIncome || 0,
      cppStartAge: body.cppStartAge || 65,
      oasStartAge: body.oasStartAge || 65,
      averageCareerIncome: body.averageCareerIncome || 0,
      yearsOfCPPContributions: body.yearsOfCPPContributions || 40,
      yearsInCanada: body.yearsInCanada || 40,
      annualExpenses: body.annualExpenses,
      expenseInflationRate: body.expenseInflationRate || 2.0,
      investmentReturnRate: body.investmentReturnRate || 5.0,
      inflationRate: body.inflationRate || 2.0,
      rrspToRrifAge: body.rrspToRrifAge || 71,
      withdrawalStrategy: body.withdrawalStrategy || 'RRIF->Corp->NonReg->TFSA',
    };

    // Run projection
    const projection = projectRetirement(projectionInput);

    // Create scenario with cached results
    const scenario = await prisma.scenario.create({
      data: {
        userId,
        name: body.name,
        description: body.description,
        currentAge: body.currentAge,
        retirementAge: body.retirementAge,
        lifeExpectancy: body.lifeExpectancy || 95,
        province: body.province || 'AB',
        rrspBalance: body.rrspBalance || 0,
        tfsaBalance: body.tfsaBalance || 0,
        nonRegBalance: body.nonRegBalance || 0,
        realEstateValue: body.realEstateValue || 0,
        employmentIncome: body.employmentIncome || 0,
        pensionIncome: body.pensionIncome || 0,
        rentalIncome: body.rentalIncome || 0,
        otherIncome: body.otherIncome || 0,
        cppStartAge: body.cppStartAge || 65,
        oasStartAge: body.oasStartAge || 65,
        averageCareerIncome: body.averageCareerIncome || 0,
        yearsOfCPPContributions: body.yearsOfCPPContributions || 40,
        yearsInCanada: body.yearsInCanada || 40,
        annualExpenses: body.annualExpenses,
        expenseInflationRate: body.expenseInflationRate || 2.0,
        investmentReturnRate: body.investmentReturnRate || 5.0,
        inflationRate: body.inflationRate || 2.0,
        rrspToRrifAge: body.rrspToRrifAge || 71,
        withdrawalStrategy: body.withdrawalStrategy || 'RRIF->Corp->NonReg->TFSA',
        projectionResults: JSON.stringify(projection),
        isBaseline: body.isBaseline || false,
      },
    });

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    logger.error('Error creating scenario', error, {
      endpoint: '/api/scenarios',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
