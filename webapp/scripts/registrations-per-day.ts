/**
 * User Registrations Per Day with Activity
 *
 * Generates a table showing:
 * - Date
 * - Number of new registrations
 * - Number of verified users
 * - Activity (logins, simulations, etc.)
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also try .env

const prisma = new PrismaClient();

async function generateRegistrationsPerDay() {
  try {
    // Get all users with their registration date and activity
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        onboardingCompleted: true,
        simulationRuns: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group users by registration date
    const registrationsByDate = new Map<string, {
      total: number;
      verified: number;
      withSimulations: number;
      onboarded: number;
      userIds: string[];
    }>();

    for (const user of users) {
      const date = user.createdAt.toISOString().split('T')[0];

      if (!registrationsByDate.has(date)) {
        registrationsByDate.set(date, {
          total: 0,
          verified: 0,
          withSimulations: 0,
          onboarded: 0,
          userIds: [],
        });
      }

      const stats = registrationsByDate.get(date)!;
      stats.total++;
      stats.userIds.push(user.id);

      if (user.emailVerified) {
        stats.verified++;
      }

      if (user.simulationRuns.length > 0) {
        stats.withSimulations++;
      }

      if (user.onboardingCompleted) {
        stats.onboarded++;
      }
    }

    // Generate table
    console.log('\n' + '='.repeat(120));
    console.log('USER REGISTRATIONS PER DAY');
    console.log('='.repeat(120));
    console.log();

    // Header
    console.log(
      'Date'.padEnd(15) +
      'Registrations'.padEnd(15) +
      'Verified'.padEnd(12) +
      'Verify %'.padEnd(12) +
      'Onboarded'.padEnd(13) +
      'Simulations'.padEnd(15) +
      'Active %'
    );
    console.log('-'.repeat(120));

    // Sort by date (most recent first)
    const sortedDates = Array.from(registrationsByDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));

    let totalRegistrations = 0;
    let totalVerified = 0;
    let totalOnboarded = 0;
    let totalWithSimulations = 0;

    for (const [date, stats] of sortedDates) {
      totalRegistrations += stats.total;
      totalVerified += stats.verified;
      totalOnboarded += stats.onboarded;
      totalWithSimulations += stats.withSimulations;

      const verifyPercent = ((stats.verified / stats.total) * 100).toFixed(0);
      const activePercent = ((stats.withSimulations / stats.total) * 100).toFixed(0);

      console.log(
        date.padEnd(15) +
        stats.total.toString().padEnd(15) +
        stats.verified.toString().padEnd(12) +
        `${verifyPercent}%`.padEnd(12) +
        stats.onboarded.toString().padEnd(13) +
        stats.withSimulations.toString().padEnd(15) +
        `${activePercent}%`
      );
    }

    // Summary
    console.log('-'.repeat(120));
    console.log(
      'TOTAL'.padEnd(15) +
      totalRegistrations.toString().padEnd(15) +
      totalVerified.toString().padEnd(12) +
      `${((totalVerified / totalRegistrations) * 100).toFixed(0)}%`.padEnd(12) +
      totalOnboarded.toString().padEnd(13) +
      totalWithSimulations.toString().padEnd(15) +
      `${((totalWithSimulations / totalRegistrations) * 100).toFixed(0)}%`
    );
    console.log('='.repeat(120));

    // Additional statistics
    console.log('\nKEY METRICS:');
    console.log(`• Total Users: ${totalRegistrations}`);
    console.log(`• Verified Users: ${totalVerified} (${((totalVerified / totalRegistrations) * 100).toFixed(1)}%)`);
    console.log(`• Unverified Users: ${totalRegistrations - totalVerified} (${(((totalRegistrations - totalVerified) / totalRegistrations) * 100).toFixed(1)}%)`);
    console.log(`• Onboarded Users: ${totalOnboarded} (${((totalOnboarded / totalRegistrations) * 100).toFixed(1)}%)`);
    console.log(`• Users with Simulations: ${totalWithSimulations} (${((totalWithSimulations / totalRegistrations) * 100).toFixed(1)}%)`);
    console.log(`• Conversion Rate (Registration → Simulation): ${((totalWithSimulations / totalRegistrations) * 100).toFixed(1)}%`);

    // Recent activity (last 7 days)
    console.log('\n' + '='.repeat(120));
    console.log('LAST 7 DAYS ACTIVITY');
    console.log('='.repeat(120));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = sortedDates
      .filter(([date]) => new Date(date) >= sevenDaysAgo)
      .reduce((sum, [, stats]) => sum + stats.total, 0);

    const recentVerified = sortedDates
      .filter(([date]) => new Date(date) >= sevenDaysAgo)
      .reduce((sum, [, stats]) => sum + stats.verified, 0);

    console.log(`• Registrations (Last 7 Days): ${recentRegistrations}`);
    console.log(`• Verified (Last 7 Days): ${recentVerified}`);
    console.log(`• Average per Day: ${(recentRegistrations / 7).toFixed(1)}`);

  } catch (error) {
    console.error('Error generating registrations table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateRegistrationsPerDay();
