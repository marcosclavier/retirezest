import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { projectRetirement, ProjectionInput } from '@/lib/calculations/projection';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/errors';

/**
 * GET /api/scenarios/:id
 * Get a specific scenario
 */
// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;
    const { id } = await params;

    const scenario = await prisma.scenario.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scenario');
    }

    return NextResponse.json(scenario);
  } catch (error) {
    logger.error('Error fetching scenario', error, {
      endpoint: '/api/scenarios/[id]',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * PUT /api/scenarios/:id
 * Update a scenario
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;
    const { id } = await params;

    const body = await request.json();

    // Check if scenario exists and belongs to user
    const existingScenario = await prisma.scenario.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingScenario) {
      throw new NotFoundError('Scenario');
    }

    // Create projection input from scenario data
    const projectionInput: ProjectionInput = {
      currentAge: body.currentAge ?? existingScenario.currentAge,
      retirementAge: body.retirementAge ?? existingScenario.retirementAge,
      lifeExpectancy: body.lifeExpectancy ?? existingScenario.lifeExpectancy,
      province: body.province ?? existingScenario.province,
      rrspBalance: body.rrspBalance ?? existingScenario.rrspBalance,
      tfsaBalance: body.tfsaBalance ?? existingScenario.tfsaBalance,
      nonRegBalance: body.nonRegBalance ?? existingScenario.nonRegBalance,
      realEstateValue: body.realEstateValue ?? existingScenario.realEstateValue,
      employmentIncome: body.employmentIncome ?? existingScenario.employmentIncome,
      pensionIncome: body.pensionIncome ?? existingScenario.pensionIncome,
      rentalIncome: body.rentalIncome ?? existingScenario.rentalIncome,
      otherIncome: body.otherIncome ?? existingScenario.otherIncome,
      cppStartAge: body.cppStartAge ?? existingScenario.cppStartAge,
      oasStartAge: body.oasStartAge ?? existingScenario.oasStartAge,
      averageCareerIncome: body.averageCareerIncome ?? existingScenario.averageCareerIncome,
      yearsOfCPPContributions: body.yearsOfCPPContributions ?? existingScenario.yearsOfCPPContributions,
      yearsInCanada: body.yearsInCanada ?? existingScenario.yearsInCanada,
      annualExpenses: body.annualExpenses ?? existingScenario.annualExpenses,
      expenseInflationRate: body.expenseInflationRate ?? existingScenario.expenseInflationRate,
      investmentReturnRate: body.investmentReturnRate ?? existingScenario.investmentReturnRate,
      inflationRate: body.inflationRate ?? existingScenario.inflationRate,
      rrspToRrifAge: body.rrspToRrifAge ?? existingScenario.rrspToRrifAge,
      withdrawalStrategy: body.withdrawalStrategy ?? existingScenario.withdrawalStrategy,
    };

    // Run projection
    const projection = projectRetirement(projectionInput);

    // Update scenario
    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data: {
        name: body.name ?? existingScenario.name,
        description: body.description ?? existingScenario.description,
        currentAge: body.currentAge ?? existingScenario.currentAge,
        retirementAge: body.retirementAge ?? existingScenario.retirementAge,
        lifeExpectancy: body.lifeExpectancy ?? existingScenario.lifeExpectancy,
        province: body.province ?? existingScenario.province,
        rrspBalance: body.rrspBalance ?? existingScenario.rrspBalance,
        tfsaBalance: body.tfsaBalance ?? existingScenario.tfsaBalance,
        nonRegBalance: body.nonRegBalance ?? existingScenario.nonRegBalance,
        realEstateValue: body.realEstateValue ?? existingScenario.realEstateValue,
        employmentIncome: body.employmentIncome ?? existingScenario.employmentIncome,
        pensionIncome: body.pensionIncome ?? existingScenario.pensionIncome,
        rentalIncome: body.rentalIncome ?? existingScenario.rentalIncome,
        otherIncome: body.otherIncome ?? existingScenario.otherIncome,
        cppStartAge: body.cppStartAge ?? existingScenario.cppStartAge,
        oasStartAge: body.oasStartAge ?? existingScenario.oasStartAge,
        averageCareerIncome: body.averageCareerIncome ?? existingScenario.averageCareerIncome,
        yearsOfCPPContributions: body.yearsOfCPPContributions ?? existingScenario.yearsOfCPPContributions,
        yearsInCanada: body.yearsInCanada ?? existingScenario.yearsInCanada,
        annualExpenses: body.annualExpenses ?? existingScenario.annualExpenses,
        expenseInflationRate: body.expenseInflationRate ?? existingScenario.expenseInflationRate,
        investmentReturnRate: body.investmentReturnRate ?? existingScenario.investmentReturnRate,
        inflationRate: body.inflationRate ?? existingScenario.inflationRate,
        rrspToRrifAge: body.rrspToRrifAge ?? existingScenario.rrspToRrifAge,
        withdrawalStrategy: body.withdrawalStrategy ?? existingScenario.withdrawalStrategy,
        projectionResults: JSON.stringify(projection),
        isBaseline: body.isBaseline ?? existingScenario.isBaseline,
      },
    });

    return NextResponse.json(updatedScenario);
  } catch (error) {
    logger.error('Error updating scenario', error, {
      endpoint: '/api/scenarios/[id]',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * DELETE /api/scenarios/:id
 * Delete a scenario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;
    const { id } = await params;

    // Check if scenario exists and belongs to user
    const scenario = await prisma.scenario.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scenario');
    }

    // Delete scenario
    await prisma.scenario.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    logger.error('Error deleting scenario', error, {
      endpoint: '/api/scenarios/[id]',
      method: 'DELETE'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
