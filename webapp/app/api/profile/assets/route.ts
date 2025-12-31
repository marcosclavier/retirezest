import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';
import { checkAndNotifySimulationReady } from '@/lib/simulation-ready-check';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all assets for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const assets = await prisma.asset.findMany({
      where: { userId: session.userId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    logger.error('Error fetching assets', error, {
      endpoint: '/api/profile/assets',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST - Create new asset
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { type, name, description, balance, currentValue, contributionRoom, returnRate, owner, notes } = body;

    // Validation
    if (!type || !name) {
      throw new ValidationError('Type and name are required');
    }

    const balanceValue = balance !== undefined ? balance : currentValue;
    if (balanceValue === undefined) {
      throw new ValidationError('Balance is required');
    }

    if (balanceValue < 0) {
      throw new ValidationError('Balance cannot be negative', 'balance');
    }

    const asset = await prisma.asset.create({
      data: {
        userId: session.userId,
        type,
        name,
        description: description || null,
        balance: parseFloat(balanceValue),
        currentValue: parseFloat(balanceValue), // Keep for backwards compatibility
        contributionRoom: contributionRoom ? parseFloat(contributionRoom) : null,
        returnRate: returnRate ? parseFloat(returnRate) : null,
        owner: owner || 'person1',
        notes: notes || null,
      },
    });

    // Check if user just became simulation-ready and send email notification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    checkAndNotifySimulationReady(session.userId, appUrl).catch(err =>
      console.error('Failed to check simulation readiness:', err)
    );

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    logger.error('Error creating asset', error, {
      endpoint: '/api/profile/assets',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT - Update asset
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { id, type, name, description, balance, currentValue, contributionRoom, returnRate, owner, notes } = body;

    if (!id) {
      throw new ValidationError('Asset ID is required', 'id');
    }

    // Verify ownership
    const existingAsset = await prisma.asset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingAsset) {
      throw new NotFoundError('Asset');
    }

    const balanceValue = balance !== undefined ? balance : currentValue;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        type,
        name,
        description: description || null,
        balance: balanceValue !== undefined ? parseFloat(balanceValue) : undefined,
        currentValue: balanceValue !== undefined ? parseFloat(balanceValue) : undefined,
        contributionRoom: contributionRoom ? parseFloat(contributionRoom) : null,
        returnRate: returnRate ? parseFloat(returnRate) : null,
        owner: owner !== undefined ? owner : undefined,
        notes: notes || null,
      },
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    logger.error('Error updating asset', error, {
      endpoint: '/api/profile/assets',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE - Delete asset
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Asset ID is required', 'id');
    }

    // Verify ownership
    const existingAsset = await prisma.asset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingAsset) {
      throw new NotFoundError('Asset');
    }

    await prisma.asset.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    logger.error('Error deleting asset', error, {
      endpoint: '/api/profile/assets',
      method: 'DELETE'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
