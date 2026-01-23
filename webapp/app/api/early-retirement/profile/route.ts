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

    // Couples planning: Calculate partner age if applicable
    const includePartner = user.includePartner || false;
    const partnerAge = includePartner && user.partnerDateOfBirth
      ? new Date().getFullYear() - new Date(user.partnerDateOfBirth).getFullYear()
      : null;

    // Get province for CRA-compliant rules
    const province = user.province || 'ON';

    // Aggregate assets by type and owner
    const assets = user.assets || [];

    // Person 1 (primary user) assets
    const person1Assets = assets.filter((a: any) => !a.owner || a.owner === 'person1');
    const rrsp = person1Assets
      .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    const tfsa = person1Assets
      .filter((a: any) => a.type === 'tfsa')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    // Separate corporate from non-registered for display purposes
    const corporate = person1Assets
      .filter((a: any) => a.type === 'corporate')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    const nonRegistered = person1Assets
      .filter((a: any) => ['nonreg', 'savings', 'investment', 'other'].includes(a.type))
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    // Joint assets (split 50/50 for calculations)
    const jointAssets = assets.filter((a: any) => a.owner === 'joint');
    const jointRrsp = jointAssets
      .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0) / 2;
    const jointTfsa = jointAssets
      .filter((a: any) => a.type === 'tfsa')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0) / 2;

    // Separate corporate from non-registered for joint assets
    const jointCorporate = jointAssets
      .filter((a: any) => a.type === 'corporate')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0) / 2;
    const jointNonReg = jointAssets
      .filter((a: any) => ['nonreg', 'savings', 'investment', 'other'].includes(a.type))
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0) / 2;

    // Person 2 (partner) assets
    let partnerRrsp = 0;
    let partnerTfsa = 0;
    let partnerCorporate = 0;
    let partnerNonReg = 0;

    if (includePartner) {
      const person2Assets = assets.filter((a: any) => a.owner === 'person2');
      partnerRrsp = person2Assets
        .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
        .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
      partnerTfsa = person2Assets
        .filter((a: any) => a.type === 'tfsa')
        .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

      // Separate corporate from non-registered for partner
      partnerCorporate = person2Assets
        .filter((a: any) => a.type === 'corporate')
        .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
      partnerNonReg = person2Assets
        .filter((a: any) => ['nonreg', 'savings', 'investment', 'other'].includes(a.type))
        .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    }

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
          return amount; // Default to annual
      }
    };

    // Calculate annual income (person 1 + joint + person 2 if applicable)
    const incomeSources = user.incomeSources || [];

    // Person 1 income
    const person1Income = incomeSources
      .filter((i: any) => !i.owner || i.owner === 'person1')
      .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0);

    // Joint income (split 50/50)
    const jointIncome = incomeSources
      .filter((i: any) => i.owner === 'joint')
      .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0) / 2;

    // Person 2 income
    const partnerIncome = includePartner
      ? incomeSources
          .filter((i: any) => i.owner === 'person2')
          .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0)
      : 0;

    const annualIncome = person1Income + jointIncome;
    const totalHouseholdIncome = annualIncome + partnerIncome;

    // Calculate annual expenses (household level)
    const expenses = user.expenses || [];
    const annualExpenses = expenses
      .filter((e: any) => !e.isRecurring || e.isRecurring === true) // Only recurring expenses
      .reduce((sum: number, e: any) => sum + annualize(Number(e.amount) || 0, e.frequency), 0);

    // Estimate annual savings (20% of income by default if not tracked)
    const annualSavings = Math.max(
      annualIncome - annualExpenses,
      annualIncome * 0.20 // Assume 20% savings rate
    );

    // Ensure target retirement age is valid (greater than current age)
    const dbTargetAge = user.targetRetirementAge || 60;
    const validTargetAge = dbTargetAge > currentAge ? dbTargetAge : Math.max(currentAge + 5, 60);

    // Build profile response
    const profileData = {
      // Person 1 (primary user) data
      currentAge,
      currentSavings: {
        // For couples planning, include partner assets + full joint amounts for household total
        // Note: Corporate is treated same as non-registered for calculation purposes (simplified)
        rrsp: Math.round(rrsp + jointRrsp + (includePartner ? partnerRrsp + jointRrsp : 0)),
        tfsa: Math.round(tfsa + jointTfsa + (includePartner ? partnerTfsa + jointTfsa : 0)),
        nonRegistered: Math.round(nonRegistered + jointNonReg + (includePartner ? partnerNonReg + jointNonReg : 0)),
        corporate: Math.round(corporate + jointCorporate + (includePartner ? partnerCorporate + jointCorporate : 0)),
      },
      annualIncome: Math.round(annualIncome),
      annualSavings: Math.round(annualSavings),
      targetRetirementAge: validTargetAge,
      targetAnnualExpenses: Math.round(annualExpenses > 0 ? annualExpenses : totalHouseholdIncome * 0.70),
      lifeExpectancy: user.lifeExpectancy || 95,

      // Province for CRA-compliant rules
      province,

      // Couples planning data
      includePartner,
      ...(includePartner && {
        partner: {
          age: partnerAge,
          currentSavings: {
            rrsp: Math.round(partnerRrsp + jointRrsp),
            tfsa: Math.round(partnerTfsa + jointTfsa),
            nonRegistered: Math.round(partnerNonReg + jointNonReg),
            corporate: Math.round(partnerCorporate + jointCorporate),
          },
          annualIncome: Math.round(partnerIncome + jointIncome),
          targetRetirementAge: validTargetAge, // Can be customized later
        },
        householdIncome: Math.round(totalHouseholdIncome),
        jointAssets: {
          rrsp: Math.round(jointRrsp * 2),
          tfsa: Math.round(jointTfsa * 2),
          nonRegistered: Math.round(jointNonReg * 2),
          corporate: Math.round(jointCorporate * 2),
        },
      }),
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
