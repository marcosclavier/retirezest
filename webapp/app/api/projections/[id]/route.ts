import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * GET /api/projections/:id
 * Get a specific projection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Projection not found' }, { status: 404 });
    }

    return NextResponse.json(projection);
  } catch (error) {
    console.error('Error fetching projection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Projection not found' }, { status: 404 });
    }

    // Delete projection
    await prisma.projection.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Projection deleted successfully' });
  } catch (error) {
    console.error('Error deleting projection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
