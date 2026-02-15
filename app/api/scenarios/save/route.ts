/**
 * API endpoint to save a simulation scenario
 * POST /api/scenarios/save
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        tags: tags || null,
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
        tags: scenario.tags,
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
      },
    });
  } catch (error) {
    console.error('[SAVE SCENARIO ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to save scenario' },
      { status: 500 }
    );
  }
}
