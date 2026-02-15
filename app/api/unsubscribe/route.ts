import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/unsubscribe?token=xxx
 * One-click unsubscribe from feedback/marketing emails
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'all'; // 'all', 'feedback', 'marketing'

    if (!token) {
      return NextResponse.json(
        { error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    // Find user by unsubscribe token
    const user = await prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: {
        id: true,
        email: true,
        marketingEmailsEnabled: true,
        feedbackEmailsEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      );
    }

    // Update email preferences based on type
    const updateData: any = {};

    if (type === 'all') {
      updateData.marketingEmailsEnabled = false;
      updateData.feedbackEmailsEnabled = false;
      updateData.unsubscribedAt = new Date();
    } else if (type === 'feedback') {
      updateData.feedbackEmailsEnabled = false;
    } else if (type === 'marketing') {
      updateData.marketingEmailsEnabled = false;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    console.log(`✅ User ${user.email} unsubscribed from ${type} emails`);

    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(
      new URL(`/unsubscribe/success?type=${type}`, req.url)
    );
  } catch (error: any) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/unsubscribe
 * Unsubscribe via form submission (alternative to GET link)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, type = 'all' } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    // Find user by unsubscribe token
    const user = await prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      );
    }

    // Update email preferences
    const updateData: any = {};

    if (type === 'all') {
      updateData.marketingEmailsEnabled = false;
      updateData.feedbackEmailsEnabled = false;
      updateData.unsubscribedAt = new Date();
    } else if (type === 'feedback') {
      updateData.feedbackEmailsEnabled = false;
    } else if (type === 'marketing') {
      updateData.marketingEmailsEnabled = false;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    console.log(`✅ User ${user.email} unsubscribed from ${type} emails`);

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
      type,
    });
  } catch (error: any) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
