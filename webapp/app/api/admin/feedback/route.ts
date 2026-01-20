import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/feedback
 * Get all feedback with filtering options
 */
export async function GET(request: Request) {
  // Verify admin access
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = { gte: parseInt(priority) };
    if (type) where.feedbackType = type;

    // Get feedback with user info
    const feedback = await prisma.userFeedback.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            subscriptionTier: true,
            createdAt: true
          }
        }
      }
    });

    // Get stats
    const [
      totalFeedback,
      highPriorityCount,
      unreadCount,
      byType,
      avgSatisfaction,
      avgNPS
    ] = await Promise.all([
      prisma.userFeedback.count(),
      prisma.userFeedback.count({ where: { priority: { gte: 4 } } }),
      prisma.userFeedback.count({ where: { status: 'new' } }),
      prisma.userFeedback.groupBy({
        by: ['feedbackType'],
        _count: { id: true }
      }),
      prisma.userFeedback.aggregate({
        _avg: { satisfactionScore: true },
        where: { satisfactionScore: { not: null } }
      }),
      prisma.userFeedback.aggregate({
        _avg: { npsScore: true },
        where: { npsScore: { not: null } }
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalFeedback,
        highPriority: highPriorityCount,
        unread: unreadCount,
        avgSatisfaction: avgSatisfaction._avg.satisfactionScore?.toFixed(2) || 'N/A',
        avgNPS: avgNPS._avg.npsScore?.toFixed(2) || 'N/A',
        byType: byType.reduce((acc, t) => {
          acc[t.feedbackType] = t._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      feedback
    });

  } catch (error) {
    console.error('Admin feedback fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback data' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/feedback
 * Update feedback status
 */
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { feedbackId, status, responseNotes } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (responseNotes !== undefined) {
      updateData.responseNotes = responseNotes;
      updateData.responded = true;
      updateData.respondedAt = new Date();
      updateData.respondedBy = admin.email;
    }

    const updated = await prisma.userFeedback.update({
      where: { id: feedbackId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      feedback: updated
    });

  } catch (error) {
    console.error('Admin feedback update error:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
