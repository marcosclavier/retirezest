import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userPath, hasSeenWelcome, onboardingCompleted, onboardingStep } = body;

    // Update user's onboarding status
    const updatedUser = await prisma.user.update({
      where: {
        id: session.userId,
      },
      data: {
        ...(userPath && { userPath }),
        ...(typeof hasSeenWelcome === 'boolean' && { hasSeenWelcome }),
        ...(typeof onboardingCompleted === 'boolean' && { onboardingCompleted }),
        ...(typeof onboardingStep === 'number' && { onboardingStep }),
        ...(onboardingCompleted && { completedGuideAt: new Date() }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        userPath: updatedUser.userPath,
        hasSeenWelcome: updatedUser.hasSeenWelcome,
        onboardingCompleted: updatedUser.onboardingCompleted,
        onboardingStep: updatedUser.onboardingStep,
      },
    });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's current onboarding status
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        userPath: true,
        hasSeenWelcome: true,
        onboardingCompleted: true,
        onboardingStep: true,
        completedGuideAt: true,
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
      user,
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    );
  }
}
