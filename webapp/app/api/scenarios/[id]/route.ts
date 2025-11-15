import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { projectRetirement, ProjectionInput } from '@/lib/calculations/projection';

/**
 * GET /api/scenarios/:id
 * Get a specific scenario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
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
        projectionResults: JSON.stringify(projection),
        isBaseline: body.isBaseline ?? existingScenario.isBaseline,
      },
    });

    return NextResponse.json(updatedScenario);
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Delete scenario
    await prisma.scenario.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
