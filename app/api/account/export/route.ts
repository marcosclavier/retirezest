import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest, AuditAction } from '@/lib/audit-log';
import { getUserSubscription } from '@/lib/subscription';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const session = await getSession();

    if (!session?.userId || !session?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check subscription status - data export is premium-only
    const subscription = await getUserSubscription(session.email);
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!subscription.isPremium) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data export is a Premium feature. Upgrade to Premium to export your complete data.',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // 3. Get complete user data with all relations
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
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

    // 4. Remove sensitive fields (password hash)
    const { passwordHash, resetToken, emailVerificationToken, ...userData } = user;

    // 5. Prepare export data
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

    // 6. Log export event to audit log
    await createAuditLogFromRequest(req, user.id, AuditAction.DATA_EXPORT, {
      description: `User exported their complete data (${Object.keys(exportData.financialData.assets).length} assets, ${Object.keys(exportData.financialData.incomeSources).length} income sources)`,
      metadata: {
        email: user.email,
        exportType: 'complete_user_data',
        assetsCount: exportData.financialData.assets.length,
        incomeCount: exportData.financialData.incomeSources.length,
        expensesCount: exportData.financialData.expenses.length,
        scenariosCount: exportData.scenarios.length,
      },
    });

    console.log(`[DATA EXPORT] User ${user.email} (ID: ${user.id}) exported their data`);

    // 7. Return data as JSON with download headers
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
