import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

// GET - Fetch all assets for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const assets = await prisma.asset.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assets);
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
    const { type, description, currentValue, contributionRoom } = body;

    // Validation
    if (!type || currentValue === undefined) {
      throw new ValidationError('Type and current value are required');
    }

    if (currentValue < 0) {
      throw new ValidationError('Current value cannot be negative', 'currentValue');
    }

    const asset = await prisma.asset.create({
      data: {
        userId: session.userId,
        type,
        description: description || null,
        currentValue: parseFloat(currentValue),
        contributionRoom: contributionRoom ? parseFloat(contributionRoom) : null,
      },
    });

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
    const { id, type, description, currentValue, contributionRoom } = body;

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

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        type,
        description: description || null,
        currentValue: parseFloat(currentValue),
        contributionRoom: contributionRoom ? parseFloat(contributionRoom) : null,
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
