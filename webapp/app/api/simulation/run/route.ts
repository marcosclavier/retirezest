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

    // Email verification check
    console.log('🔍 Checking email verification...');
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true },
    });

    console.log('✅ User found, emailVerified:', user?.emailVerified);

    if (!user?.emailVerified) {
      console.log('❌ Email not verified');
      logger.info('Simulation blocked - email not verified', {
        user: session.email,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Please verify your email to run simulations',
          error: 'Email verification required',
          error_details: 'You must verify your email address before running retirement simulations. Check your inbox for the verification link or request a new one from your dashboard.',
          requiresVerification: true,
          warnings: [],
        },
        { status: 403 }
      );
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
      } catch (dbError) {
        // Log error but don't fail the request - simulation results are still returned
        logger.error('Failed to save simulation to database', dbError, {
          user: session.email
        });
      }
    }

    // Return successful response
    return NextResponse.json(responseData, { status: 200 });

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
