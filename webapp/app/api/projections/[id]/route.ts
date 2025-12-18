import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/errors';

/**
 * GET /api/projections/:id
 * Get a specific projection
 */
// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;
    const { id } = await params;

    const projection = await prisma.projection.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        scenario: true,
      },
    });

    if (!projection) {
      throw new NotFoundError('Projection');
    }

    return NextResponse.json(projection);
  } catch (error) {
    logger.error('Error fetching projection', error, {
      endpoint: '/api/projections/[id]',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * DELETE /api/projections/:id
 * Delete a projection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;
    const { id } = await params;

    // Check if projection exists and belongs to user
    const projection = await prisma.projection.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!projection) {
      throw new NotFoundError('Projection');
    }

    // Delete projection
    await prisma.projection.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Projection deleted successfully' });
  } catch (error) {
    logger.error('Error deleting projection', error, {
      endpoint: '/api/projections/[id]',
      method: 'DELETE'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
