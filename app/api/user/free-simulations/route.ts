import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId || !session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        emailVerified: true,
        freeSimulationsUsed: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const FREE_LIMIT = 3;
    const remaining = user.emailVerified ? -1 : Math.max(0, FREE_LIMIT - (user.freeSimulationsUsed || 0));

    return NextResponse.json({
      emailVerified: user.emailVerified,
      freeSimulationsRemaining: remaining,
      freeSimulationsUsed: user.freeSimulationsUsed || 0,
    });
  } catch (error) {
    console.error('Error fetching free simulations status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulation status' },
      { status: 500 }
    );
  }
}
