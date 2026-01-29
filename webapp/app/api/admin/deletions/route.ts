import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/deletions
 * Get account deletion metrics for the admin dashboard
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
    const days = parseInt(searchParams.get('days') || '30');
    const format = searchParams.get('format'); // 'csv' or undefined

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get all deleted users
    const deletedUsers = await prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        deletedAt: true,
        scheduledDeletionAt: true,
        deletionReason: true,
        subscriptionTier: true,
        _count: {
          select: {
            simulationRuns: true,
            assets: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });

    // Calculate metrics
    const totalDeletions = deletedUsers.length;
    const deletionsInPeriod = deletedUsers.filter(
      (u) => u.deletedAt && u.deletedAt >= startDate
    ).length;

    // Same-day deletions (deleted within 24 hours of registration)
    const sameDayDeletions = deletedUsers.filter((u) => {
      if (!u.deletedAt) return false;
      const hoursSinceCreation =
        (u.deletedAt.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation <= 24;
    }).length;

    const sameDayRate =
      totalDeletions > 0
        ? ((sameDayDeletions / totalDeletions) * 100).toFixed(1)
        : '0.0';

    // Group by deletion reason
    const reasonBreakdown: Record<string, number> = {};
    deletedUsers.forEach((u) => {
      const reason = u.deletionReason || 'No reason provided';
      reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
    });

    // Sort reasons by count
    const topReasons = Object.entries(reasonBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));

    // Daily deletion trend
    const dailyTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const deletionsOnDay = deletedUsers.filter(
        (u) => u.deletedAt && u.deletedAt >= day && u.deletedAt < nextDay
      ).length;

      dailyTrend.push({
        date: day.toISOString().split('T')[0],
        label: day.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        deletions: deletionsOnDay,
      });
    }

    // Active users with usage (for deletion rate calculation)
    const totalUsers = await prisma.user.count({
      where: {
        deletedAt: null,
      },
    });

    const deletionRate =
      totalUsers > 0
        ? ((deletionsInPeriod / (totalUsers + deletionsInPeriod)) * 100).toFixed(2)
        : '0.00';

    // User engagement breakdown for deleted users
    const deletedUsersWithSimulations = deletedUsers.filter(
      (u) => u._count.simulationRuns > 0
    ).length;

    const deletedUsersWithAssets = deletedUsers.filter(
      (u) => u._count.assets > 0
    ).length;

    // CSV export
    if (format === 'csv') {
      const csvRows = [
        [
          'Email',
          'First Name',
          'Last Name',
          'Created At',
          'Deleted At',
          'Deletion Reason',
          'Subscription Tier',
          'Simulations',
          'Assets',
          'Days Active',
        ].join(','),
      ];

      deletedUsers.forEach((u) => {
        const daysActive = u.deletedAt
          ? Math.floor(
              (u.deletedAt.getTime() - u.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        csvRows.push(
          [
            u.email,
            u.firstName || '',
            u.lastName || '',
            u.createdAt.toISOString().split('T')[0],
            u.deletedAt?.toISOString().split('T')[0] || '',
            `"${(u.deletionReason || 'No reason provided').replace(/"/g, '""')}"`,
            u.subscriptionTier,
            u._count.simulationRuns,
            u._count.assets,
            daysActive,
          ].join(',')
        );
      });

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="deletions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // JSON response
    return NextResponse.json({
      success: true,
      stats: {
        totalDeletions,
        deletionsInPeriod,
        sameDayDeletions,
        sameDayRate: `${sameDayRate}%`,
        deletionRate: `${deletionRate}%`,
        deletedUsersWithSimulations,
        deletedUsersWithAssets,
        totalActiveUsers: totalUsers,
      },
      dailyTrend,
      topReasons,
      recentDeletions: deletedUsers.slice(0, 20).map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        createdAt: u.createdAt.toISOString(),
        deletedAt: u.deletedAt?.toISOString() || null,
        scheduledDeletionAt: u.scheduledDeletionAt?.toISOString() || null,
        deletionReason: u.deletionReason,
        subscriptionTier: u.subscriptionTier,
        simulationRuns: u._count.simulationRuns,
        assets: u._count.assets,
        daysActive: u.deletedAt
          ? Math.floor(
              (u.deletedAt.getTime() - u.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching deletion metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
