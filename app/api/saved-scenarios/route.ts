/**
 * API endpoints for saved simulation scenarios
 * GET /api/saved-scenarios - List all saved scenarios
 * POST /api/saved-scenarios - Create a new saved scenario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/saved-scenarios
 * List all scenarios for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all scenarios for the user
    const scenarios = await prisma.savedSimulationScenario.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: [
        { isFavorite: 'desc' }, // Favorites first
        { createdAt: 'desc' },  // Most recent first
      ],
      select: {
        id: true,
        name: true,
        description: true,
        scenarioType: true,
        inputData: true,
        results: true,
        hasResults: true,
        isFavorite: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Parse JSON strings back to objects
    const parsedScenarios = scenarios.map((scenario) => ({
      ...scenario,
      inputData: JSON.parse(scenario.inputData),
      results: scenario.results ? JSON.parse(scenario.results) : null,
      tags: scenario.tags ? JSON.parse(scenario.tags) : null,
    }));

    return NextResponse.json({
      success: true,
      scenarios: parsedScenarios,
      count: scenarios.length,
    });
  } catch (error) {
    console.error('[LIST SAVED SCENARIOS ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saved-scenarios
 * Create a new saved scenario
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user to check premium status
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        subscriptionTier: true,
        savedSimulationScenarios: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check freemium limits (3 free scenarios, unlimited for premium)
    const scenarioCount = user.savedSimulationScenarios.length;
    const isPremium = user.subscriptionTier === 'premium';
    if (!isPremium && scenarioCount >= 3) {
      return NextResponse.json(
        {
          error: 'Free users can only save up to 3 scenarios. Upgrade to Premium for unlimited scenarios.',
          requiresPremium: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, scenarioType, inputData, results, hasResults, isFavorite, tags } = body;

    // Validate required fields
    if (!name || !inputData) {
      return NextResponse.json(
        { error: 'Name and inputData are required' },
        { status: 400 }
      );
    }

    // Save scenario
    const scenario = await prisma.savedSimulationScenario.create({
      data: {
        userId: session.userId,
        name,
        description: description || null,
        scenarioType: scenarioType || 'custom',
        inputData: JSON.stringify(inputData),
        results: results ? JSON.stringify(results) : null,
        hasResults: hasResults || false,
        isFavorite: isFavorite || false,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    return NextResponse.json({
      success: true,
      scenario: {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        scenarioType: scenario.scenarioType,
        hasResults: scenario.hasResults,
        isFavorite: scenario.isFavorite,
        tags: scenario.tags ? JSON.parse(scenario.tags) : null,
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
      },
    });
  } catch (error) {
    console.error('[CREATE SAVED SCENARIO ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to save scenario' },
      { status: 500 }
    );
  }
}
