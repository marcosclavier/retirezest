/**
 * API endpoints for individual saved simulation scenarios
 * GET /api/saved-scenarios/:id - Get a single scenario
 * PUT /api/saved-scenarios/:id - Update a scenario
 * DELETE /api/saved-scenarios/:id - Delete a scenario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/saved-scenarios/:id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const scenario = await prisma.savedSimulationScenario.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scenario: {
        ...scenario,
        inputData: JSON.parse(scenario.inputData),
        results: scenario.results ? JSON.parse(scenario.results) : null,
        tags: scenario.tags ? JSON.parse(scenario.tags) : null,
      },
    });
  } catch (error) {
    console.error('[GET SAVED SCENARIO ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/saved-scenarios/:id
 * Update a scenario
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingScenario = await prisma.savedSimulationScenario.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingScenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, results, hasResults, isFavorite, tags } = body;

    // Update scenario
    const scenario = await prisma.savedSimulationScenario.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(results !== undefined && { results: JSON.stringify(results) }),
        ...(hasResults !== undefined && { hasResults }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
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
    console.error('[UPDATE SAVED SCENARIO ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saved-scenarios/:id
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership before deleting
    const scenario = await prisma.savedSimulationScenario.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Delete the scenario
    await prisma.savedSimulationScenario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE SAVED SCENARIO ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}
