/**
 * Next.js API Route: /api/simulation/run
 *
 * Proxies requests to Python FastAPI backend
 * Adds authentication, logging, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError } from '@/lib/errors';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // CRITICAL DEBUG: Log that request was received
  console.log('🎯 /api/simulation/run RECEIVED REQUEST at', new Date().toISOString());

  try {
    // Authentication check
    console.log('🔍 Checking session...');
    const session = await getSession();

    if (!session) {
      console.log('❌ No session found');
      throw new AuthenticationError('You must be logged in to run simulations');
    }

    console.log('✅ Session found:', session.email);

    // VALIDATION: Check required profile fields (province and date of birth)
    console.log('🔍 Step 0: Validating required profile fields...');
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        emailVerified: true,
        province: true,
        dateOfBirth: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      throw new AuthenticationError('User not found');
    }

    // Check for missing required fields
    const missingFields: string[] = [];
    if (!user.province) missingFields.push('province');
    if (!user.dateOfBirth) missingFields.push('date of birth');

    if (missingFields.length > 0) {
      console.log('❌ Missing required profile fields:', missingFields.join(', '));
      logger.info('Simulation blocked - missing required profile fields', {
        user: session.email,
        missingFields,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Please complete your profile to run simulations',
          error: 'Missing required profile information',
          error_details: `We need your ${missingFields.join(' and ')} to calculate accurate retirement projections. Your province determines tax rates, and your date of birth is needed to calculate age-related tax credits (Basic Personal Amount, Age Credit) and government benefit eligibility (CPP, OAS). Please update your profile to continue.`,
          missingFields,
          requiresProfileUpdate: true,
          warnings: [],
        },
        { status: 400 }
      );
    }

    console.log('✅ User profile complete, province:', user.province, 'dateOfBirth:', user.dateOfBirth);

    // LIMIT CHECK 1: Email verification (3 free simulations for unverified users)
    console.log('🔍 Step 1: Checking email verification limit...');

    const { checkFreeSimulationLimit, checkDailySimulationLimit } = await import('@/lib/subscription');
    const emailLimitCheck = await checkFreeSimulationLimit(session.email, user?.emailVerified || false);

    if (!emailLimitCheck.allowed) {
      console.log('❌ Free simulation limit reached, email verification required');
      logger.info('Simulation blocked - email verification limit reached', {
        user: session.email,
        freeSimulationsUsed: 3,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Please verify your email to continue running simulations',
          error: 'Free simulation limit reached',
          error_details: 'You have used your 3 free simulations. Please verify your email address to unlock unlimited retirement simulations. Check your inbox for the verification link or request a new one from your dashboard.',
          requiresVerification: true,
          freeSimulationsRemaining: 0,
          warnings: [],
        },
        { status: 403 }
      );
    }

    // Log remaining free simulations for unverified users
    if (!user?.emailVerified && emailLimitCheck.remaining > 0) {
      console.log(`ℹ️ Free simulations remaining: ${emailLimitCheck.remaining}`);
    }

    // LIMIT CHECK 2: Daily simulation limit (10/day for free tier, unlimited for premium)
    console.log('🔍 Step 2: Checking daily simulation limit...');
    const dailyLimitCheck = await checkDailySimulationLimit(session.email);

    if (!dailyLimitCheck.allowed) {
      console.log('❌ Daily simulation limit reached for free tier');
      logger.info('Simulation blocked - daily limit reached', {
        user: session.email,
        dailySimulations: 10,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Daily simulation limit reached. Upgrade to Premium for unlimited simulations.',
          error: 'Daily limit reached',
          error_details: 'You have reached your daily limit of 10 simulations. Upgrade to Premium for unlimited simulations, advanced features, and priority support.',
          requiresUpgrade: true,
          dailySimulationsRemaining: 0,
          warnings: [],
        },
        { status: 429 }
      );
    }

    // Log remaining daily simulations for free tier users
    if (!dailyLimitCheck.isPremium && dailyLimitCheck.remaining > 0) {
      console.log(`ℹ️ Daily simulations remaining: ${dailyLimitCheck.remaining}`);
    }

    // Parse request body
    const body = await request.json();

    // Log request (sensitive data excluded for production)
    logger.info('Simulation request started', {
      user: session.email,
      endpoint: '/api/simulation/run'
    });

    // Transform data to match Python API format
    // If data comes wrapped in household_input, extract it
    // Otherwise use as-is for backward compatibility
    const pythonPayload = body.household_input ? {
      ...body.household_input,
      // CRITICAL: Set TFSA contributions to 0 unless explicitly provided
      // Python backend defaults to 7000 which causes spending gaps
      tfsa_contribution_each: body.household_input.tfsa_contribution_each ?? 0,
      // Pass includePartner flag explicitly
      include_partner: body.household_input.include_partner ?? (body.household_input.p2 && body.household_input.p2.name ? true : false),
      // Ensure p2 has valid default values when no partner
      p2: body.household_input.p2 && body.household_input.p2.name ? body.household_input.p2 : {
        name: "",
        birth_year: 1960,  // Provide valid year for calculations
        start_age: 60,  // Minimum age 50 required by Python API
        rrsp_balance: 0,
        tfsa_balance: 0,
        nonreg_balance: 0,
        rrif_balance: 0,
        corporate_balance: 0,
        cpp_start_age: 65,  // Minimum 60 required
        cpp_annual_at_start: 0,  // MUST be 0 for single person
        oas_start_age: 65,  // Minimum 65 required
        oas_annual_at_start: 0,  // MUST be 0 for single person
        avg_career_income: 0,
        years_of_cpp: 0,
        years_in_canada: 0,
        pension_income: 0,
        other_income: 0,
        pension_incomes: [],  // Empty for single person
        other_incomes: []     // Empty for single person
      }
    } : body;

    // Log RRSP withdrawal settings for debugging
    console.log('📊 RRSP/RRIF Withdrawal Settings for P1:');
    console.log('  - RRSP Balance:', pythonPayload.p1.rrsp_balance);
    console.log('  - RRIF Balance:', pythonPayload.p1.rrif_balance);
    console.log('  - Enable withdrawals:', pythonPayload.p1.enable_early_rrif_withdrawal);
    console.log('  - Start age:', pythonPayload.p1.early_rrif_withdrawal_start_age);
    console.log('  - End age:', pythonPayload.p1.early_rrif_withdrawal_end_age);
    console.log('  - Mode:', pythonPayload.p1.early_rrif_withdrawal_mode);
    console.log('  - Percentage:', pythonPayload.p1.early_rrif_withdrawal_percentage);
    console.log('  - Strategy:', pythonPayload.strategy);
    console.log('  - Start Year:', pythonPayload.start_year);
    console.log('  - P1 Start Age:', pythonPayload.p1.start_age);
    console.log('  - TFSA Contribution Each:', pythonPayload.tfsa_contribution_each);
    console.log('  - TFSA Contribution Rate:', pythonPayload.tfsa_contribution_rate);
    console.log('  - TFSA Contribution Phase Start:', pythonPayload.tfsa_contribution_phase_start_year);
    console.log('  - TFSA Contribution Phase End:', pythonPayload.tfsa_contribution_phase_end_year);

    // CRITICAL: Log full payload being sent to Python
    console.log('🚀 FULL PAYLOAD TO PYTHON:', JSON.stringify({
      strategy: pythonPayload.strategy,
      tfsa_contribution_each: pythonPayload.tfsa_contribution_each,
      tfsa_contribution_rate: pythonPayload.tfsa_contribution_rate,
      p1_rrsp: pythonPayload.p1.rrsp_balance,
      p1_tfsa: pythonPayload.p1.tfsa_balance,
      spending_go_go: pythonPayload.spending_go_go
    }, null, 2));

    // Forward request to Python API
    const pythonResponse = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pythonPayload),
    });

    const responseData = await pythonResponse.json();

    // Log first year results for debugging RRSP issue
    if (responseData.year_results && responseData.year_results.length > 0) {
      const firstYear = responseData.year_results[0];
      console.log('📊 First Year Results:');
      console.log('  - Year:', firstYear.year);
      console.log('  - RRSP/RRIF withdrawal:', firstYear.rrsp_rrif_withdrawal_p1);
      console.log('  - RRSP end balance:', firstYear.rrsp_end_p1);
      console.log('  - RRIF end balance:', firstYear.rrif_end_p1);
      console.log('  - TFSA contribution:', firstYear.tfsa_contribution_p1);
      console.log('  - TFSA end balance:', firstYear.tfsa_end_p1);
      console.log('  - NonReg end balance:', firstYear.nonreg_end_p1);
      console.log('  - Total withdrawals:', firstYear.total_withdrawals);
      console.log('  - Spending target:', firstYear.spending_target);
      console.log('  - Gross cash inflows:', firstYear.gross_cash_inflows);
      console.log('  - Total outflows:', firstYear.total_outflows);
      console.log('  - Net cash flow:', firstYear.net_cash_flow);
      console.log('  - Gap/Surplus:', firstYear.gap_surplus);
      console.log('  - Net worth:', firstYear.net_worth);
    }

    // Log what Python actually returned for TFSA settings
    console.log('🔍 PYTHON RESPONSE - TFSA SETTINGS:');
    console.log('  - TFSA Contribution Each (returned):', responseData.household_input?.tfsa_contribution_each);
    console.log('  - TFSA Contribution Rate (returned):', responseData.household_input?.tfsa_contribution_rate);

    // Calculate processing time
    const duration = Date.now() - startTime;
    logger.info('Simulation response received', {
      user: session.email,
      status: pythonResponse.status,
      duration: `${duration}ms`
    });

    // Check for Python API errors
    if (!pythonResponse.ok) {
      logger.error('Python API error', undefined, {
        status: pythonResponse.status,
        response: responseData
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Simulation failed',
          error: responseData.error || 'Python API returned an error',
          error_details: responseData.error_details || `HTTP ${pythonResponse.status}`,
          warnings: [],
        },
        { status: pythonResponse.status }
      );
    }

    // Save successful simulation to database for tracking and analytics
    if (responseData.success && responseData.summary && responseData.household_input) {
      try {
        const { prisma } = await import('@/lib/prisma');

        await prisma.simulationRun.create({
          data: {
            userId: session.userId,

            // Input parameters
            strategy: responseData.household_input.strategy || 'corporate-optimized',
            province: responseData.household_input.province || 'ON',
            startAge: responseData.household_input.p1.start_age || 65,
            endAge: responseData.household_input.end_age || 95,
            includePartner: !!(responseData.household_input.p2.name),
            partnerStartAge: responseData.household_input.p2.start_age > 0 ? responseData.household_input.p2.start_age : null,

            // Spending parameters
            spendingGoGo: responseData.household_input.spending_go_go,
            spendingSlowGo: responseData.household_input.spending_slow_go,
            spendingNoGo: responseData.household_input.spending_no_go,

            // Key output metrics
            healthScore: responseData.summary.health_score,
            healthRating: responseData.summary.health_rating,
            successRate: responseData.summary.success_rate,
            yearsFunded: responseData.summary.years_funded,
            yearsSimulated: responseData.summary.years_simulated,

            // Financial outcomes
            totalTaxPaid: responseData.summary.total_tax_paid,
            avgTaxRate: responseData.summary.avg_effective_tax_rate,
            finalEstate: responseData.summary.final_estate_after_tax,
            finalEstateGross: responseData.summary.final_estate_gross,

            // Government benefits
            totalCPP: responseData.summary.total_cpp,
            totalOAS: responseData.summary.total_oas,
            totalGIS: responseData.summary.total_gis,
            totalBenefits: responseData.summary.total_government_benefits,

            // Withdrawals by source
            totalRRIFWithdrawn: responseData.summary.total_rrif_withdrawn,
            totalNonRegWithdrawn: responseData.summary.total_nonreg_withdrawn,
            totalTFSAWithdrawn: responseData.summary.total_tfsa_withdrawn,
            totalCorpWithdrawn: responseData.summary.total_corporate_withdrawn,

            // Initial asset balances
            initialTFSA: responseData.household_input.p1.tfsa_balance + (responseData.household_input.p2.tfsa_balance || 0),
            initialRRSP: responseData.household_input.p1.rrsp_balance + (responseData.household_input.p2.rrsp_balance || 0),
            initialRRIF: responseData.household_input.p1.rrif_balance + (responseData.household_input.p2.rrif_balance || 0),
            initialNonReg: responseData.household_input.p1.nonreg_balance + (responseData.household_input.p2.nonreg_balance || 0),
            initialCorp: responseData.household_input.p1.corporate_balance + (responseData.household_input.p2.corporate_balance || 0),
            initialNetWorth: responseData.summary.initial_net_worth,

            // Store full data for "view last simulation" feature
            // CRITICAL FIX: Save original user input, not Python API's transformed structure
            inputData: JSON.stringify(body),  // Original user input from form (stringified for DB)
            fullResults: JSON.stringify(responseData),
          },
        });

        logger.info('Simulation saved to database', {
          user: session.email,
          healthScore: responseData.summary.health_score,
          strategy: responseData.household_input.strategy
        });

        // Increment counters after successful simulation
        const { incrementFreeSimulationCount, incrementDailySimulationCount } = await import('@/lib/subscription');

        // Increment free simulation counter for unverified users (lifetime limit: 3)
        if (!user?.emailVerified) {
          await incrementFreeSimulationCount(session.email);
          console.log('📊 Free simulation count incremented');
        }

        // Increment daily simulation counter for all users (daily limit tracking)
        await incrementDailySimulationCount(session.email);
        console.log('📊 Daily simulation count incremented');

      } catch (dbError) {
        // Log error but don't fail the request - simulation results are still returned
        logger.error('Failed to save simulation to database', dbError, {
          user: session.email
        });
      }
    }

    // Return successful response with metadata
    const responseWithMeta = {
      ...responseData,
      success: responseData.success !== false, // Ensure success field is included
      freeSimulationsRemaining: !user?.emailVerified ? Math.max(0, emailLimitCheck.remaining - 1) : -1,
      dailySimulationsRemaining: !dailyLimitCheck.isPremium ? Math.max(0, dailyLimitCheck.remaining - 1) : -1,
    };
    return NextResponse.json(responseWithMeta, { status: 200 });

  } catch (error) {
    const duration = Date.now() - startTime;

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error('Python API connection failed', error, {
        endpoint: '/api/simulation/run',
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

    // Generic error response
    logger.error('Simulation failed', error, {
      endpoint: '/api/simulation/run',
      method: 'POST',
      duration: `${duration}ms`
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json({
      success: false,
      message: 'Simulation failed',
      error: body.error,
      error_details: 'Internal server error',
      warnings: [],
    }, { status });
  }
}
