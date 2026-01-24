import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getLast7DaysActivity() {
  const now = new Date();

  console.log('📊 RetireZest User Activity - Last 7 Days');
  console.log('Generated:', now.toLocaleString());
  console.log('='.repeat(80));

  // Daily breakdown for last 7 days
  const days = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    return {
      day,
      nextDay,
      label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  }).reverse();

  console.log('\n📅 DAILY ACTIVITY - LAST 7 DAYS');
  console.log('='.repeat(80));
  console.log('Day'.padEnd(20) + 'Sims'.padEnd(8) + 'Users'.padEnd(8) + 'New Reg'.padEnd(10) + 'Assets'.padEnd(10) + 'Activity');
  console.log('-'.repeat(80));

  const dailyData: any[] = [];

  for (const { day, nextDay, label } of days) {
    const simulations = await prisma.simulationRun.count({
      where: { createdAt: { gte: day, lt: nextDay } }
    });

    const uniqueUsers = await prisma.simulationRun.findMany({
      where: { createdAt: { gte: day, lt: nextDay } },
      select: { userId: true },
      distinct: ['userId']
    });

    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: day, lt: nextDay },
        deletedAt: null
      }
    });

    const assets = await prisma.asset.count({
      where: { createdAt: { gte: day, lt: nextDay } }
    });

    const activityBar = '█'.repeat(Math.min(simulations, 50));

    console.log(
      label.padEnd(20) +
      simulations.toString().padEnd(8) +
      uniqueUsers.length.toString().padEnd(8) +
      newUsers.toString().padEnd(10) +
      assets.toString().padEnd(10) +
      activityBar
    );

    dailyData.push({
      date: day,
      label,
      simulations,
      uniqueUsers: uniqueUsers.length,
      newUsers,
      assets
    });
  }

  // Identify concerning patterns
  console.log('\n\n⚠️  ACTIVITY ANALYSIS');
  console.log('='.repeat(80));

  const zeroDays = dailyData.filter(d => d.simulations === 0 && d.uniqueUsers === 0);
  const lowActivityDays = dailyData.filter(d => d.simulations > 0 && d.simulations < 5);
  const normalActivityDays = dailyData.filter(d => d.simulations >= 5);

  console.log(`Zero Activity Days: ${zeroDays.length} days`);
  if (zeroDays.length > 0) {
    zeroDays.forEach(d => {
      console.log(`  ❌ ${d.label} - NO USER ACTIVITY`);
    });
  }

  console.log(`\nLow Activity Days: ${lowActivityDays.length} days`);
  if (lowActivityDays.length > 0) {
    lowActivityDays.forEach(d => {
      console.log(`  ⚠️  ${d.label} - ${d.simulations} simulations, ${d.uniqueUsers} users`);
    });
  }

  console.log(`\nNormal Activity Days: ${normalActivityDays.length} days`);
  if (normalActivityDays.length > 0) {
    normalActivityDays.forEach(d => {
      console.log(`  ✅ ${d.label} - ${d.simulations} simulations, ${d.uniqueUsers} users`);
    });
  }

  // Check when activity stopped
  const lastActivityDay = dailyData.reverse().find(d => d.simulations > 0);
  if (lastActivityDay) {
    const daysSinceActivity = dailyData[dailyData.length - 1].date.getTime() - lastActivityDay.date.getTime();
    const daysDiff = Math.floor(daysSinceActivity / (1000 * 60 * 60 * 24));
    console.log(`\n🔴 ALERT: Last significant activity was on ${lastActivityDay.label}`);
    console.log(`   Days since last activity: ${daysDiff} days`);
  }

  // Overall 7-day totals
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalSims = await prisma.simulationRun.count({
    where: { createdAt: { gte: sevenDaysAgo } }
  });

  const totalUsers = await prisma.simulationRun.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { userId: true },
    distinct: ['userId']
  });

  const totalNewUsers = await prisma.user.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
      deletedAt: null
    }
  });

  console.log('\n\n📊 7-DAY TOTALS');
  console.log('='.repeat(80));
  console.log(`Total Simulations: ${totalSims}`);
  console.log(`Unique Active Users: ${totalUsers.length}`);
  console.log(`New Registrations: ${totalNewUsers}`);
  console.log(`Daily Average Simulations: ${(totalSims / 7).toFixed(1)}`);
  console.log(`Daily Average New Users: ${(totalNewUsers / 7).toFixed(1)}`);

  // Status determination
  console.log('\n\n🎯 STATUS ASSESSMENT');
  console.log('='.repeat(80));

  if (zeroDays.length >= 3) {
    console.log('🔴 CRITICAL: Application appears to have ZERO user activity for 3+ days');
    console.log('   This indicates a COMPLETE HALT in user engagement.');
    console.log('   Possible causes:');
    console.log('   1. Complete traffic loss (SEO, ads, or marketing stopped)');
    console.log('   2. Users unable to access the application');
    console.log('   3. Major user experience issue preventing usage');
    console.log('   4. Email/notification system failure (users not returning)');
  } else if (zeroDays.length >= 1) {
    console.log('⚠️  WARNING: Application has days with zero activity');
    console.log('   This is unusual for an active application.');
  } else if (totalSims < 20) {
    console.log('⚠️  WARNING: Very low activity levels (< 20 simulations in 7 days)');
  } else {
    console.log('✅ Activity levels appear normal');
  }

  await prisma.$disconnect();
}

getLast7DaysActivity().catch(console.error);
