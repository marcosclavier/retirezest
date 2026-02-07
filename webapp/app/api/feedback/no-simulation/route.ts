import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reasons, otherText, additionalComments } = body;

    if (!reasons || !Array.isArray(reasons) || reasons.length === 0) {
      return NextResponse.json(
        { error: 'At least one reason is required' },
        { status: 400 }
      );
    }

    // Get user to find their ID
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save feedback to database
    // We'll use the AuditLog table as a flexible storage for this feedback
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'NO_SIMULATION_FEEDBACK',
        metadata: JSON.stringify({
          reasons,
          otherText: otherText || null,
          additionalComments: additionalComments || null,
          timestamp: new Date().toISOString(),
          userEmail: user.email,
        }),
      },
    });

    console.log(`✅ No-simulation feedback received from ${user.email}:`, reasons);

    return NextResponse.json({
      success: true,
      message: 'Feedback received',
    });
  } catch (error: any) {
    console.error('Error saving no-simulation feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
