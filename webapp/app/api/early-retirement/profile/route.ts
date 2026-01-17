import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        assets: true,
        incomeSources: true,
        expenses: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate current age from date of birth
    const currentAge = user.dateOfBirth
      ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
      : 50; // Default age if not set

    // Aggregate assets by type
    const assets = user.assets || [];
    const rrsp = assets
      .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    const tfsa = assets
      .filter((a: any) => a.type === 'tfsa')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    const nonRegistered = assets
      .filter((a: any) => ['nonreg', 'savings', 'investment', 'corporate', 'other'].includes(a.type))
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    // Calculate annual income
    const incomeSources = user.incomeSources || [];
    const annualIncome = incomeSources.reduce((sum: number, i: any) => {
      const amount = Number(i.amount) || 0;
      const freq = (i.frequency || 'annual').toLowerCase();
      switch (freq) {
        case 'monthly':
          return sum + amount * 12;
        case 'annual':
        case 'annually':
        case 'yearly':
          return sum + amount;
        case 'weekly':
          return sum + amount * 52;
        case 'biweekly':
        case 'bi-weekly':
        case 'bi_weekly':
          return sum + amount * 26;
        default:
          return sum + amount; // Default to annual
      }
    }, 0);

    // Calculate annual expenses
    const expenses = user.expenses || [];
    const annualExpenses = expenses.reduce((sum: number, e: any) => {
      const amount = Number(e.amount) || 0;
      const freq = (e.frequency || 'annual').toLowerCase();
      switch (freq) {
        case 'monthly':
          return sum + amount * 12;
        case 'annual':
        case 'annually':
        case 'yearly':
          return sum + amount;
        case 'weekly':
          return sum + amount * 52;
        case 'biweekly':
        case 'bi-weekly':
        case 'bi_weekly':
          return sum + amount * 26;
        default:
          return sum + amount; // Default to annual
      }
    }, 0);

    // Estimate annual savings (20% of income by default if not tracked)
    const annualSavings = Math.max(
      annualIncome - annualExpenses,
      annualIncome * 0.20 // Assume 20% savings rate
    );

    // Build profile response
    const profileData = {
      currentAge,
      currentSavings: {
        rrsp: Math.round(rrsp),
        tfsa: Math.round(tfsa),
        nonRegistered: Math.round(nonRegistered),
      },
      annualIncome: Math.round(annualIncome),
      annualSavings: Math.round(annualSavings),
      targetRetirementAge: user.targetRetirementAge || 60,
      targetAnnualExpenses: Math.round(annualExpenses > 0 ? annualExpenses : annualIncome * 0.70),
      lifeExpectancy: user.lifeExpectancy || 95,
    };

    return NextResponse.json(profileData, { status: 200 });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}
