import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { projectRetirement, ProjectionInput } from '@/lib/calculations/projection';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors';

/**
 * POST /api/scenarios/create-baseline
 * Create baseline scenario from user profile data
 *
 * This endpoint is called automatically after onboarding completion (US-042)
 * to create the user's first scenario based on their profile data.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;

    // Check if baseline scenario already exists
    const existingBaseline = await prisma.scenario.findFirst({
      where: {
        userId,
        isBaseline: true,
      },
    });

    if (existingBaseline) {
      // Return existing baseline instead of creating a new one
      return NextResponse.json(
        {
          message: 'Baseline scenario already exists',
          scenario: existingBaseline,
        },
        { status: 200 }
      );
    }

    // Fetch user profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assets: true,
        incomeSources: true,
        expenses: true,
        realEstateAssets: true,
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    // Calculate current age
    const currentAge = user.dateOfBirth
      ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
      : 50;

    // Aggregate assets by type (person 1 only for baseline)
    const assets = user.assets.filter((a: any) => !a.owner || a.owner === 'person1');
    const rrspBalance = assets
      .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    const tfsaBalance = assets
      .filter((a: any) => a.type === 'tfsa')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    const liraBalance = assets
      .filter((a: any) => a.type === 'lira')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    const nonRegBalance = assets
      .filter((a: any) => ['nonreg', 'savings', 'investment', 'corporate', 'other'].includes(a.type))
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    // Get real estate value (primary residence)
    const realEstateValue = user.realEstateAssets
      .filter((a: any) => a.isPrincipalResidence)
      .reduce((sum: number, a: any) => sum + Number(a.currentValue || 0), 0);

    // Helper to annualize income/expense
    const annualize = (amount: number, frequency: string): number => {
      const freq = (frequency || 'annual').toLowerCase();
      switch (freq) {
        case 'monthly':
          return amount * 12;
        case 'annual':
        case 'annually':
        case 'yearly':
          return amount;
        case 'weekly':
          return amount * 52;
        case 'biweekly':
        case 'bi-weekly':
        case 'bi_weekly':
          return amount * 26;
        default:
          return amount;
      }
    };

    // Aggregate income sources (person 1 only)
    const incomeSources = user.incomeSources.filter((i: any) => !i.owner || i.owner === 'person1');
    const employmentIncome = incomeSources
      .filter((i: any) => i.type === 'employment')
      .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0);
    const pensionIncome = incomeSources
      .filter((i: any) => i.type === 'pension')
      .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0);
    const rentalIncome = incomeSources
      .filter((i: any) => i.type === 'rental')
      .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0);
    const otherIncome = incomeSources
      .filter((i: any) => ['business', 'investment', 'other'].includes(i.type))
      .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0);

    // Get CPP/OAS start ages from Income table
    const cppIncome = incomeSources.find((i: any) => i.type === 'cpp');
    const oasIncome = incomeSources.find((i: any) => i.type === 'oas');
    const cppStartAge = cppIncome?.startAge || 65;
    const oasStartAge = oasIncome?.startAge || 65;

    // Calculate annual expenses
    const expenses = user.expenses.filter((e: any) => !e.isRecurring || e.isRecurring === true);
    const annualExpenses = expenses.reduce(
      (sum: number, e: any) => sum + annualize(Number(e.amount) || 0, e.frequency),
      0
    );

    // Determine retirement age (default to user's target or 65)
    const retirementAge = user.targetRetirementAge || Math.max(currentAge + 5, 65);

    // Create projection input
    const projectionInput: ProjectionInput = {
      currentAge,
      retirementAge,
      lifeExpectancy: user.lifeExpectancy || 95,
      province: user.province || 'ON',
      rrspBalance: rrspBalance + liraBalance, // Combine LIRA with RRSP for projection
      tfsaBalance,
      nonRegBalance,
      realEstateValue,
      employmentIncome,
      pensionIncome,
      rentalIncome,
      otherIncome,
      cppStartAge,
      oasStartAge,
      averageCareerIncome: employmentIncome, // Estimate from current employment income
      yearsOfCPPContributions: Math.max(currentAge - 18, 0), // Estimate
      yearsInCanada: Math.max(currentAge - 18, 0), // Estimate
      annualExpenses: annualExpenses > 0 ? annualExpenses : employmentIncome * 0.70, // 70% income replacement
      expenseInflationRate: 2.0,
      investmentReturnRate: 5.0,
      inflationRate: 2.0,
      rrspToRrifAge: 71,
      withdrawalStrategy: 'RRIF->Corp->NonReg->TFSA',
    };

    // Run projection
    const projection = projectRetirement(projectionInput);

    // Create baseline scenario
    const scenario = await prisma.scenario.create({
      data: {
        userId,
        name: 'Baseline',
        description: 'Your default retirement scenario based on your profile',
        currentAge,
        retirementAge,
        lifeExpectancy: user.lifeExpectancy || 95,
        province: user.province || 'ON',
        rrspBalance,
        tfsaBalance,
        nonRegBalance,
        liraBalance,
        realEstateValue,
        employmentIncome,
        pensionIncome,
        rentalIncome,
        otherIncome,
        cppStartAge,
        oasStartAge,
        averageCareerIncome: employmentIncome,
        yearsOfCPPContributions: Math.max(currentAge - 18, 0),
        yearsInCanada: Math.max(currentAge - 18, 0),
        annualExpenses: projectionInput.annualExpenses,
        expenseInflationRate: 2.0,
        investmentReturnRate: 5.0,
        inflationRate: 2.0,
        rrspToRrifAge: 71,
        withdrawalStrategy: 'RRIF->Corp->NonReg->TFSA',
        projectionResults: JSON.stringify(projection),
        isBaseline: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Baseline scenario created successfully',
        scenario,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating baseline scenario', error, {
      endpoint: '/api/scenarios/create-baseline',
      method: 'POST',
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
