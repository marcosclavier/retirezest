import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/activity
 * Get user activity metrics for the admin dashboard
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
    const days = parseInt(searchParams.get('days') || '7');

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get daily activity breakdown
    const dailyActivity = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const [simulations, users, registrations, assets] = await Promise.all([
        prisma.simulationRun.count({
          where: { createdAt: { gte: day, lt: nextDay } }
        }),
        prisma.simulationRun.findMany({
          where: { createdAt: { gte: day, lt: nextDay } },
          select: { userId: true },
          distinct: ['userId']
        }).then(u => u.length),
        prisma.user.count({
          where: {
            createdAt: { gte: day, lt: nextDay },
            deletedAt: null
          }
        }),
        prisma.asset.count({
          where: { createdAt: { gte: day, lt: nextDay } }
        })
      ]);

      dailyActivity.push({
        date: day.toISOString().split('T')[0],
        label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        simulations,
        activeUsers: users,
        newRegistrations: registrations,
        assetsCreated: assets,
      });
    }

    // Get overall stats
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalSimulations,
      recentUsers,
      topUsers
    ] = await Promise.all([
      // Total users
      prisma.user.count({ where: { deletedAt: null } }),

      // Active users (simulations in period)
      prisma.simulationRun.findMany({
        where: { createdAt: { gte: startDate } },
        select: { userId: true },
        distinct: ['userId']
      }).then(u => u.length),

      // Verified users
      prisma.user.count({
        where: {
          deletedAt: null,
          emailVerified: true
        }
      }),

      // Total simulations
      prisma.simulationRun.count(),

      // Recent users (last 10)
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          emailVerified: true,
          subscriptionTier: true,
          _count: {
            select: {
              simulationRuns: true,
              assets: true
            }
          }
        }
      }),

      // Top users by simulations
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: {
          simulationRuns: {
            _count: 'desc'
          }
        },
        take: 10,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          subscriptionTier: true,
          _count: {
            select: {
              simulationRuns: true
            }
          }
        }
      })
    ]);

    // Get strategy distribution
    const strategyStats = await prisma.simulationRun.groupBy({
      by: ['strategy'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      stats: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        totalSimulations,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0,
      },
      dailyActivity,
      recentUsers,
      topUsers,
      strategyStats: strategyStats.map(s => ({
        strategy: s.strategy,
        count: s._count.id
      }))
    });

  } catch (error) {
    console.error('Admin activity fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}
