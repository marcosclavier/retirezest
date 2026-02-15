import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/settings/email-preferences
 * Update user's email preferences
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { marketingEnabled, feedbackEnabled } = body;

    // Validate input
    if (typeof marketingEnabled !== 'boolean' || typeof feedbackEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid input: marketingEnabled and feedbackEnabled must be boolean' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update preferences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        marketingEmailsEnabled: marketingEnabled,
        feedbackEmailsEnabled: feedbackEnabled,
        // If re-subscribing to any emails, clear unsubscribedAt
        unsubscribedAt: (marketingEnabled || feedbackEnabled) ? null : undefined,
      },
      select: {
        marketingEmailsEnabled: true,
        feedbackEmailsEnabled: true,
        unsubscribedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: updatedUser,
    });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settings/email-preferences
 * Get user's current email preferences
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user and get preferences
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: {
        marketingEmailsEnabled: true,
        feedbackEmailsEnabled: true,
        unsubscribedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: user,
    });
  } catch (error) {
    console.error('Error getting email preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
