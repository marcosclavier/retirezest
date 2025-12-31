/**
 * Quick Start Simulation API
 *
 * Generates a quick retirement simulation estimate using smart defaults
 * based on the user's actual data plus reasonable assumptions.
 *
 * Purpose: Reduce time to first simulation from 16 days to 1-2 days by
 * removing data entry friction and providing instant gratification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { HouseholdInput, PersonInput, Province } from '@/lib/types/simulation';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Generate smart defaults for a quick simulation
 */
async function generateQuickStartDefaults(userId: string): Promise<HouseholdInput> {
  // Fetch user's actual data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assets: true,
      incomeSources: true,
      expenses: true,
    },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Calculate current age from date of birth (or default to 55)
  const currentAge = user.dateOfBirth
    ? new Date().getFullYear() - user.dateOfBirth.getFullYear()
    : 55;

  // Default retirement age
  const retirementAge = user.targetRetirementAge || 65;
  const lifeExpectancy = user.lifeExpectancy || 95;

  // Calculate actual asset balances from user data
  const actualRRSP = user.assets
    .filter(a => a.type === 'rrsp')
    .reduce((sum, a) => sum + a.balance, 0);

  const actualRRIF = user.assets
    .filter(a => a.type === 'rrif')
    .reduce((sum, a) => sum + a.balance, 0);

  const actualTFSA = user.assets
    .filter(a => a.type === 'tfsa')
    .reduce((sum, a) => sum + a.balance, 0);

  const actualNonReg = user.assets
    .filter(a => a.type === 'nonreg')
    .reduce((sum, a) => sum + a.balance, 0);

  const actualCorp = user.assets
    .filter(a => a.type === 'corporate')
    .reduce((sum, a) => sum + a.balance, 0);

  // Calculate annual income from income sources
  const annualIncome = user.incomeSources.reduce((sum, income) => {
    let annualAmount = income.amount;

    // Convert to annual based on frequency
    switch (income.frequency) {
      case 'monthly':
        annualAmount *= 12;
        break;
      case 'biweekly':
        annualAmount *= 26;
        break;
      case 'weekly':
        annualAmount *= 52;
        break;
      // 'annual' stays as is
    }

    return sum + annualAmount;
  }, 0);

  // Calculate annual expenses
  const annualExpenses = user.expenses
    .filter(e => e.isRecurring) // Only recurring expenses
    .reduce((sum, expense) => {
      let annualAmount = expense.amount;

      switch (expense.frequency) {
        case 'monthly':
          annualAmount *= 12;
          break;
        case 'quarterly':
          annualAmount *= 4;
          break;
        case 'weekly':
          annualAmount *= 52;
          break;
        // 'annual' stays as is
      }

      return sum + annualAmount;
    }, 0);

  // Smart defaults for spending (if no expenses entered)
  let spendingGoGo = annualExpenses > 0 ? annualExpenses : 60000;
  let spendingSlowGo = spendingGoGo * 0.8; // 80% of go-go
  let spendingNoGo = spendingGoGo * 0.6; // 60% of go-go

  // If they have income data but no expenses, estimate from income
  if (annualExpenses === 0 && annualIncome > 0) {
    spendingGoGo = annualIncome * 0.7; // Assume 70% of income for expenses
    spendingSlowGo = spendingGoGo * 0.8;
    spendingNoGo = spendingGoGo * 0.6;
  }

  // Smart defaults for CPP/OAS - use default values
  const cppStartAge = 65;
  const oasStartAge = 65;
  const cppAnnual = 15000; // Max CPP estimate
  const oasAnnual = 8500; // Max OAS estimate

  // Build person 1 input with all required fields
  const person1: PersonInput = {
    name: user.firstName || 'You',
    start_age: retirementAge,

    // Government benefits
    cpp_start_age: cppStartAge,
    cpp_annual_at_start: cppAnnual,
    oas_start_age: oasStartAge,
    oas_annual_at_start: oasAnnual,

    // Other income sources
    employer_pension_annual: 0,
    rental_income_annual: 0,
    other_income_annual: 0,

    // Account balances
    rrsp_balance: actualRRSP,
    rrif_balance: actualRRIF,
    tfsa_balance: actualTFSA,
    nonreg_balance: actualNonReg,
    corporate_balance: actualCorp,

    // Non-registered details - use smart defaults
    nonreg_acb: actualNonReg * 0.7, // Assume 70% ACB
    nr_cash: actualNonReg * 0.1,
    nr_gic: actualNonReg * 0.2,
    nr_invest: actualNonReg * 0.7,

    // Non-registered yields
    y_nr_cash_interest: 2.0,
    y_nr_gic_interest: 3.5,
    y_nr_inv_total_return: 6.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 3.0,
    y_nr_inv_roc_pct: 0.5,

    // Non-registered allocation percentages
    nr_cash_pct: 10.0,
    nr_gic_pct: 20.0,
    nr_invest_pct: 70.0,

    // Corporate details
    corp_cash_bucket: actualCorp * 0.05,
    corp_gic_bucket: actualCorp * 0.1,
    corp_invest_bucket: actualCorp * 0.85,
    corp_rdtoh: 0,

    // Corporate yields
    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 3.5,
    y_corp_inv_total_return: 6.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,

    // Corporate allocation percentages
    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,

    corp_dividend_type: 'eligible',

    // TFSA settings
    tfsa_room_start: 7000,
    tfsa_contribution_annual: 0,
  };

  // Partner defaults (if applicable) - use defaultPersonInput as base
  const person2: PersonInput = user.includePartner ? {
    name: user.partnerFirstName || 'Partner',
    start_age: retirementAge,

    cpp_start_age: 65,
    cpp_annual_at_start: 15000,
    oas_start_age: 65,
    oas_annual_at_start: 8500,

    employer_pension_annual: 0,
    rental_income_annual: 0,
    other_income_annual: 0,

    rrsp_balance: 0,
    rrif_balance: 0,
    tfsa_balance: 0,
    nonreg_balance: 0,
    corporate_balance: 0,

    nonreg_acb: 0,
    nr_cash: 0,
    nr_gic: 0,
    nr_invest: 0,

    y_nr_cash_interest: 2.0,
    y_nr_gic_interest: 3.5,
    y_nr_inv_total_return: 6.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 3.0,
    y_nr_inv_roc_pct: 0.5,

    nr_cash_pct: 10.0,
    nr_gic_pct: 20.0,
    nr_invest_pct: 70.0,

    corp_cash_bucket: 0,
    corp_gic_bucket: 0,
    corp_invest_bucket: 0,
    corp_rdtoh: 0,

    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 3.5,
    y_corp_inv_total_return: 6.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,

    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,

    corp_dividend_type: 'eligible',

    tfsa_room_start: 7000,
    tfsa_contribution_annual: 0,
  } : {
    name: '',
    start_age: 0,

    cpp_start_age: 0,
    cpp_annual_at_start: 0,
    oas_start_age: 0,
    oas_annual_at_start: 0,

    employer_pension_annual: 0,
    rental_income_annual: 0,
    other_income_annual: 0,

    rrsp_balance: 0,
    rrif_balance: 0,
    tfsa_balance: 0,
    nonreg_balance: 0,
    corporate_balance: 0,

    nonreg_acb: 0,
    nr_cash: 0,
    nr_gic: 0,
    nr_invest: 0,

    y_nr_cash_interest: 2.0,
    y_nr_gic_interest: 3.5,
    y_nr_inv_total_return: 6.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 3.0,
    y_nr_inv_roc_pct: 0.5,

    nr_cash_pct: 10.0,
    nr_gic_pct: 20.0,
    nr_invest_pct: 70.0,

    corp_cash_bucket: 0,
    corp_gic_bucket: 0,
    corp_invest_bucket: 0,
    corp_rdtoh: 0,

    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 3.5,
    y_corp_inv_total_return: 6.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,

    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,

    corp_dividend_type: 'eligible',

    tfsa_room_start: 7000,
    tfsa_contribution_annual: 0,
  };

  // Build household input with smart defaults
  const household: HouseholdInput = {
    p1: person1,
    p2: person2,
    province: (user.province as Province) || 'ON',
    start_year: new Date().getFullYear(),
    end_age: lifeExpectancy,
    strategy: 'corporate-optimized',

    // Spending phases
    spending_go_go: Math.round(spendingGoGo),
    go_go_end_age: 75,
    spending_slow_go: Math.round(spendingSlowGo),
    slow_go_end_age: 85,
    spending_no_go: Math.round(spendingNoGo),

    // Inflation rates
    spending_inflation: 2.0,
    general_inflation: 2.0,

    // TFSA settings
    tfsa_room_annual_growth: 7000,

    // Advanced options
    gap_tolerance: 1000,
    reinvest_nonreg_dist: false,
    income_split_rrif_fraction: 0.0,
    hybrid_rrif_topup_per_person: 0,
    stop_on_fail: false,
  };

  return household;
}

/**
 * POST /api/simulation/quick-start
 *
 * Generates and runs a quick simulation with smart defaults
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError('You must be logged in to run simulations');
    }

    logger.info('Quick-start simulation requested', {
      user: session.email,
      endpoint: '/api/simulation/quick-start'
    });

    // Generate smart defaults based on user data
    const household = await generateQuickStartDefaults(session.userId);

    logger.info('Quick-start defaults generated', {
      user: session.email,
      hasAssets: household.p1.rrsp_balance + household.p1.tfsa_balance + household.p1.nonreg_balance > 0,
      spending: household.spending_go_go
    });

    // Run simulation via Python API
    const pythonResponse = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(household),
    });

    const responseData = await pythonResponse.json();

    const duration = Date.now() - startTime;
    logger.info('Quick-start simulation completed', {
      user: session.email,
      status: pythonResponse.status,
      duration: `${duration}ms`,
      success: pythonResponse.ok
    });

    // Check for errors
    if (!pythonResponse.ok) {
      logger.error('Python API error in quick-start', undefined, {
        status: pythonResponse.status,
        response: responseData
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Quick simulation failed',
          error: responseData.error || 'Python API returned an error',
          error_details: responseData.error_details || `HTTP ${pythonResponse.status}`,
          warnings: [],
        },
        { status: pythonResponse.status }
      );
    }

    // Save to database (similar to regular simulation but mark as quick-start)
    if (responseData.success && responseData.summary && responseData.household_input) {
      try {
        await prisma.simulationRun.create({
          data: {
            userId: session.userId,
            strategy: responseData.household_input.strategy || 'corporate-optimized',
            province: responseData.household_input.province || 'ON',
            startAge: responseData.household_input.p1.start_age || 65,
            endAge: responseData.household_input.end_age || 95,
            includePartner: !!(responseData.household_input.p2.name),
            partnerStartAge: responseData.household_input.p2.start_age > 0 ? responseData.household_input.p2.start_age : null,
            spendingGoGo: responseData.household_input.spending_go_go,
            spendingSlowGo: responseData.household_input.spending_slow_go,
            spendingNoGo: responseData.household_input.spending_no_go,
            healthScore: responseData.summary.health_score,
            healthRating: responseData.summary.health_rating,
            successRate: responseData.summary.success_rate,
            yearsFunded: responseData.summary.years_funded,
            yearsSimulated: responseData.summary.years_simulated,
            totalTaxPaid: responseData.summary.total_tax_paid,
            avgTaxRate: responseData.summary.avg_effective_tax_rate,
            finalEstate: responseData.summary.final_estate_after_tax,
            finalEstateGross: responseData.summary.final_estate_gross,
            totalCPP: responseData.summary.total_cpp,
            totalOAS: responseData.summary.total_oas,
            totalGIS: responseData.summary.total_gis,
            totalBenefits: responseData.summary.total_government_benefits,
            totalRRIFWithdrawn: responseData.summary.total_rrif_withdrawn,
            totalNonRegWithdrawn: responseData.summary.total_nonreg_withdrawn,
            totalTFSAWithdrawn: responseData.summary.total_tfsa_withdrawn,
            totalCorpWithdrawn: responseData.summary.total_corporate_withdrawn,
            initialTFSA: responseData.household_input.p1.tfsa_balance + (responseData.household_input.p2.tfsa_balance || 0),
            initialRRSP: responseData.household_input.p1.rrsp_balance + (responseData.household_input.p2.rrsp_balance || 0),
            initialRRIF: responseData.household_input.p1.rrif_balance + (responseData.household_input.p2.rrif_balance || 0),
            initialNonReg: responseData.household_input.p1.nonreg_balance + (responseData.household_input.p2.nonreg_balance || 0),
            initialCorp: responseData.household_input.p1.corporate_balance + (responseData.household_input.p2.corporate_balance || 0),
            initialNetWorth: responseData.summary.initial_net_worth,
            inputData: JSON.stringify(responseData.household_input),
            fullResults: JSON.stringify(responseData),
            isQuickStart: true, // Mark as quick-start simulation
          },
        });

        logger.info('Quick-start simulation saved', {
          user: session.email,
          healthScore: responseData.summary.health_score
        });
      } catch (dbError) {
        logger.error('Failed to save quick-start simulation', dbError, {
          user: session.email
        });
      }
    }

    // Return results with quick-start flag
    return NextResponse.json({
      ...responseData,
      isQuickStart: true,
      disclaimer: 'This is a quick estimate based on your current data and smart defaults. Add more details for a more accurate projection.'
    }, { status: 200 });

  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error('Python API connection failed', error, {
        endpoint: '/api/simulation/quick-start',
        duration: `${duration}ms`
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Unable to connect to simulation engine',
          error: 'Python API is not responding',
          error_details: 'Please ensure the Python backend is running on port 8000',
          warnings: [],
        },
        { status: 503 }
      );
    }

    logger.error('Quick-start simulation failed', error, {
      endpoint: '/api/simulation/quick-start',
      duration: `${duration}ms`
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json({
      success: false,
      message: 'Quick simulation failed',
      error: body.error,
      error_details: 'Internal server error',
      warnings: [],
    }, { status });
  }
}
