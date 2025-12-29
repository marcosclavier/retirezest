import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/account/export
 *
 * Export all user data in JSON format (GDPR requirement).
 *
 * Security features:
 * - Requires authentication
 * - Only exports authenticated user's data
 * - Audit logging
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get complete user data with all relations
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        incomeSources: true,
        assets: true,
        expenses: true,
        debts: true,
        scenarios: {
          include: {
            projections: true,
          },
        },
        projections: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Remove sensitive fields (password hash)
    const { passwordHash, resetToken, emailVerificationToken, ...userData } = user;

    // 4. Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: 'complete_user_data',
      user: {
        personal: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          province: userData.province,
          maritalStatus: userData.maritalStatus,
        },
        partner: {
          includePartner: userData.includePartner,
          partnerFirstName: userData.partnerFirstName,
          partnerLastName: userData.partnerLastName,
          partnerDateOfBirth: userData.partnerDateOfBirth,
        },
        retirement: {
          targetRetirementAge: userData.targetRetirementAge,
          lifeExpectancy: userData.lifeExpectancy,
        },
        account: {
          emailVerified: userData.emailVerified,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          hasSeenWelcome: userData.hasSeenWelcome,
          userPath: userData.userPath,
          onboardingCompleted: userData.onboardingCompleted,
          onboardingStep: userData.onboardingStep,
          completedGuideAt: userData.completedGuideAt,
        },
        settings: {
          companyName: userData.companyName,
          companyLogo: userData.companyLogo,
        },
      },
      financialData: {
        incomeSources: userData.incomeSources.map(income => ({
          id: income.id,
          type: income.type,
          description: income.description,
          amount: income.amount,
          frequency: income.frequency,
          startAge: income.startAge,
          owner: income.owner,
          notes: income.notes,
          isTaxable: income.isTaxable,
          createdAt: income.createdAt,
          updatedAt: income.updatedAt,
        })),
        assets: userData.assets.map(asset => ({
          id: asset.id,
          type: asset.type,
          name: asset.name,
          description: asset.description,
          balance: asset.balance,
          contributionRoom: asset.contributionRoom,
          returnRate: asset.returnRate,
          owner: asset.owner,
          notes: asset.notes,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
        })),
        expenses: userData.expenses.map(expense => ({
          id: expense.id,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          frequency: expense.frequency,
          essential: expense.essential,
          notes: expense.notes,
          isRecurring: expense.isRecurring,
          plannedYear: expense.plannedYear,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt,
        })),
        debts: userData.debts.map(debt => ({
          id: debt.id,
          type: debt.type,
          creditor: debt.creditor,
          description: debt.description,
          balance: debt.balance,
          interestRate: debt.interestRate,
          minimumPayment: debt.minimumPayment,
          paymentFrequency: debt.paymentFrequency,
          notes: debt.notes,
          createdAt: debt.createdAt,
          updatedAt: debt.updatedAt,
        })),
      },
      scenarios: userData.scenarios.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        currentAge: scenario.currentAge,
        retirementAge: scenario.retirementAge,
        lifeExpectancy: scenario.lifeExpectancy,
        province: scenario.province,
        assets: {
          rrspBalance: scenario.rrspBalance,
          tfsaBalance: scenario.tfsaBalance,
          nonRegBalance: scenario.nonRegBalance,
          realEstateValue: scenario.realEstateValue,
        },
        income: {
          employmentIncome: scenario.employmentIncome,
          pensionIncome: scenario.pensionIncome,
          rentalIncome: scenario.rentalIncome,
          otherIncome: scenario.otherIncome,
        },
        cppOas: {
          cppStartAge: scenario.cppStartAge,
          oasStartAge: scenario.oasStartAge,
          averageCareerIncome: scenario.averageCareerIncome,
          yearsOfCPPContributions: scenario.yearsOfCPPContributions,
          yearsInCanada: scenario.yearsInCanada,
        },
        expenses: {
          annualExpenses: scenario.annualExpenses,
          expenseInflationRate: scenario.expenseInflationRate,
        },
        investments: {
          investmentReturnRate: scenario.investmentReturnRate,
          inflationRate: scenario.inflationRate,
        },
        withdrawalStrategy: scenario.withdrawalStrategy,
        isBaseline: scenario.isBaseline,
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
        projections: scenario.projections,
      })),
      usage: {
        cppCalculatorUsedAt: userData.cppCalculatorUsedAt,
        oasCalculatorUsedAt: userData.oasCalculatorUsedAt,
      },
    };

    // 5. Log export event
    console.log(`[DATA EXPORT] User ${user.email} (ID: ${user.id}) exported their data`);

    // 6. Return data as JSON with download headers
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="retirezest-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (error) {
    console.error('[DATA EXPORT ERROR]', error);

    return NextResponse.json(
      { success: false, error: 'Failed to export data. Please try again.' },
      { status: 500 }
    );
  }
}
