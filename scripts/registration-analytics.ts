import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getRegistrationAnalytics() {
  const now = new Date();

  console.log('📋 User Registration Analytics');
  console.log('Generated:', now.toLocaleString());
  console.log('='.repeat(80));

  // Last 30 days of registrations by day
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);

  const recentUsers = await prisma.user.findMany({
    where: {
      createdAt: { gte: last30Days }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      emailVerified: true,
      emailVerificationToken: true,
      onboardingCompleted: true,
      province: true,
      includePartner: true,
      deletedAt: true,
      simulationRuns: {
        select: {
          id: true
        }
      },
      assets: {
        select: {
          id: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n📊 REGISTRATION SUMMARY (Last 30 Days)`);
  console.log('-'.repeat(80));
  console.log(`Total Registrations: ${recentUsers.length}`);
  console.log(`Active (Not Deleted): ${recentUsers.filter(u => !u.deletedAt).length}`);
  console.log(`Deleted: ${recentUsers.filter(u => u.deletedAt).length}`);
  console.log(`Email Verified: ${recentUsers.filter(u => u.emailVerified).length}`);
  console.log(`Pending Verification: ${recentUsers.filter(u => !u.emailVerified).length}`);
  console.log(`Completed Onboarding: ${recentUsers.filter(u => u.onboardingCompleted).length}`);

  // Registrations by day
  const byDay = new Map<string, number>();
  recentUsers.forEach(u => {
    const day = u.createdAt.toISOString().split('T')[0];
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });

  console.log(`\n📅 REGISTRATIONS BY DAY (Last 14 Days)`);
  console.log('-'.repeat(80));

  const last14Days = Array.from({length: 14}, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  last14Days.forEach(day => {
    const count = byDay.get(day) || 0;
    const bar = '█'.repeat(count);
    const dayName = new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    console.log(`${dayName.padEnd(15)} | ${bar} ${count}`);
  });

  // Last 3 days in detail
  const last3Days = new Date(now);
  last3Days.setDate(last3Days.getDate() - 3);

  const last3DaysUsers = recentUsers.filter(u => u.createdAt >= last3Days);

  console.log(`\n🔍 LAST 3 DAYS DETAIL`);
  console.log('-'.repeat(80));
  console.log(`Total Registrations: ${last3DaysUsers.length}`);

  if (last3DaysUsers.length === 0) {
    console.log('\n⚠️  WARNING: NO REGISTRATIONS IN THE LAST 3 DAYS');
    console.log('This could indicate:');
    console.log('  1. Application issue preventing registrations');
    console.log('  2. Email service issue');
    console.log('  3. CAPTCHA/Turnstile issue');
    console.log('  4. Marketing/traffic issue');
  } else {
    console.log('\nRecent Registrations:');
    last3DaysUsers.forEach((u, idx) => {
      const time = u.createdAt.toLocaleString();
      const name = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : 'N/A';
      const verified = u.emailVerified ? '✓' : '✗';
      const hasSimulations = u.simulationRuns.length > 0 ? `${u.simulationRuns.length} sims` : 'No sims';
      console.log(`  ${idx + 1}. ${time} | ${u.email} | ${name} | Verified: ${verified} | ${hasSimulations}`);
    });
  }

  // Check for verification email issues
  console.log(`\n📧 EMAIL VERIFICATION STATUS`);
  console.log('-'.repeat(80));

  const unverified = recentUsers.filter(u => !u.emailVerified && !u.deletedAt);
  console.log(`Unverified Users (Last 30 Days): ${unverified.length}`);

  if (unverified.length > 0) {
    console.log('\nTop 10 Unverified Users:');
    unverified.slice(0, 10).forEach((u, idx) => {
      const daysAgo = Math.floor((now.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const hasToken = u.emailVerificationToken ? 'Has token' : 'NO TOKEN';
      console.log(`  ${idx + 1}. ${u.email.padEnd(30)} | ${daysAgo} days ago | ${hasToken}`);
    });
  }

  // Conversion funnel
  const totalRegistered = recentUsers.filter(u => !u.deletedAt).length;
  const emailVerified = recentUsers.filter(u => u.emailVerified && !u.deletedAt).length;
  const hasAssets = recentUsers.filter(u => u.assets.length > 0 && !u.deletedAt).length;
  const hasSimulations = recentUsers.filter(u => u.simulationRuns.length > 0 && !u.deletedAt).length;
  const completedOnboarding = recentUsers.filter(u => u.onboardingCompleted && !u.deletedAt).length;

  console.log(`\n🎯 CONVERSION FUNNEL (Last 30 Days)`);
  console.log('-'.repeat(80));
  console.log(`Registered:           ${totalRegistered} (100%)`);
  console.log(`Email Verified:       ${emailVerified} (${((emailVerified/totalRegistered)*100).toFixed(1)}%)`);
  console.log(`Added Assets:         ${hasAssets} (${((hasAssets/totalRegistered)*100).toFixed(1)}%)`);
  console.log(`Ran Simulations:      ${hasSimulations} (${((hasSimulations/totalRegistered)*100).toFixed(1)}%)`);
  console.log(`Completed Onboarding: ${completedOnboarding} (${((completedOnboarding/totalRegistered)*100).toFixed(1)}%)`);

  // Most recent registration
  if (recentUsers.length > 0) {
    const mostRecent = recentUsers[0];
    const hoursAgo = Math.floor((now.getTime() - mostRecent.createdAt.getTime()) / (1000 * 60 * 60));
    const daysAgo = Math.floor(hoursAgo / 24);

    console.log(`\n⏰ LAST REGISTRATION`);
    console.log('-'.repeat(80));
    console.log(`Email: ${mostRecent.email}`);
    console.log(`Name: ${mostRecent.firstName || 'N/A'} ${mostRecent.lastName || 'N/A'}`);
    console.log(`Time: ${mostRecent.createdAt.toLocaleString()}`);
    console.log(`Ago: ${daysAgo} days, ${hoursAgo % 24} hours`);
    console.log(`Verified: ${mostRecent.emailVerified ? 'Yes' : 'No'}`);
  }

  await prisma.$disconnect();
}

getRegistrationAnalytics().catch(console.error);
