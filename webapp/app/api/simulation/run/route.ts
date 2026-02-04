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

    // LIMIT CHECK 1: Email verification (3 free simulations for unverified users)
    console.log('🔍 Step 1: Checking email verification limit...');
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true },
    });

    console.log('✅ User found, emailVerified:', user?.emailVerified);

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

    // Forward request to Python API
    const pythonResponse = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await pythonResponse.json();

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
            inputData: JSON.stringify(responseData.household_input),
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
