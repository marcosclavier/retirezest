import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAllUserActivity() {
  const now = new Date();

  console.log('👥 Complete User Activity Report');
  console.log('Generated:', now.toLocaleString());
  console.log('='.repeat(80));

  // Get all users and their activity
  const allUsers = await prisma.user.findMany({
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      province: true,
      includePartner: true,
      onboardingCompleted: true,
      emailVerified: true,
      createdAt: true,
      simulationRuns: {
        select: {
          id: true,
          createdAt: true,
          strategy: true,
          healthScore: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1 // Just get the most recent
      },
      assets: {
        select: { id: true }
      },
      incomeSources: {
        select: { id: true }
      },
      expenses: {
        select: { id: true }
      },
      _count: {
        select: {
          simulationRuns: true,
          assets: true,
          incomeSources: true,
          expenses: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`\n📊 OVERVIEW`);
  console.log('-'.repeat(80));
  console.log(`Total Active Users: ${allUsers.length}`);
  console.log(`Users with Simulations: ${allUsers.filter(u => u._count.simulationRuns > 0).length}`);
  console.log(`Users with Assets: ${allUsers.filter(u => u._count.assets > 0).length}`);
  console.log(`Verified Users: ${allUsers.filter(u => u.emailVerified).length}`);
  console.log(`Completed Onboarding: ${allUsers.filter(u => u.onboardingCompleted).length}`);

  // Categorize users by activity level
  const powerUsers = allUsers.filter(u => u._count.simulationRuns >= 10);
  const activeUsers = allUsers.filter(u => u._count.simulationRuns >= 1 && u._count.simulationRuns < 10);
  const setupUsers = allUsers.filter(u => u._count.simulationRuns === 0 && (u._count.assets > 0 || u._count.incomeSources > 0));
  const inactiveUsers = allUsers.filter(u => u._count.simulationRuns === 0 && u._count.assets === 0 && u._count.incomeSources === 0);

  console.log(`\n📈 USER ACTIVITY BREAKDOWN`);
  console.log('-'.repeat(80));
  console.log(`Power Users (10+ simulations): ${powerUsers.length}`);
  console.log(`Active Users (1-9 simulations): ${activeUsers.length}`);
  console.log(`Setup Users (no sims, has data): ${setupUsers.length}`);
  console.log(`Inactive Users (no activity): ${inactiveUsers.length}`);

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentlyActive = allUsers.filter(u =>
    u.simulationRuns.length > 0 &&
    u.simulationRuns[0].createdAt >= sevenDaysAgo
  );

  console.log(`\n🔥 RECENT ACTIVITY (Last 7 Days)`);
  console.log('-'.repeat(80));
  console.log(`Users Active in Last 7 Days: ${recentlyActive.length}`);

  if (recentlyActive.length > 0) {
    console.log(`\nRecently Active Users:`);
    recentlyActive.forEach((u, idx) => {
      const lastActivity = u.simulationRuns[0];
      const daysAgo = Math.floor((now.getTime() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const hoursAgo = Math.floor((now.getTime() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60));

      const timeAgo = daysAgo > 0 ? `${daysAgo}d ago` : `${hoursAgo}h ago`;

      console.log(`  ${idx + 1}. ${u.email.padEnd(35)} | Last: ${timeAgo.padEnd(10)} | ${u._count.simulationRuns} sims | Score: ${lastActivity.healthScore || 'N/A'}`);
    });
  }

  // DETAILED USER LIST
  console.log(`\n\n👤 COMPLETE USER LIST (${allUsers.length} users)`);
  console.log('='.repeat(80));

  allUsers.forEach((user, idx) => {
    const name = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || 'No name';

    const accountAge = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Determine user status
    let status = '⚫ Inactive';
    let lastActivityStr = 'Never';

    if (user.simulationRuns.length > 0) {
      const lastActivity = user.simulationRuns[0];
      const daysAgo = Math.floor((now.getTime() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const hoursAgo = Math.floor((now.getTime() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60));

      lastActivityStr = daysAgo > 0
        ? `${daysAgo} days ago (${lastActivity.createdAt.toLocaleDateString()})`
        : `${hoursAgo} hours ago`;

      if (daysAgo <= 1) {
        status = '🟢 Active Today';
      } else if (daysAgo <= 7) {
        status = '🟡 Active This Week';
      } else if (daysAgo <= 30) {
        status = '🟠 Active This Month';
      } else {
        status = '🔴 Dormant';
      }
    } else if (user._count.assets > 0 || user._count.incomeSources > 0) {
      status = '🔵 Setup Started';
    }

    console.log(`\n${idx + 1}. ${user.email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Account Created: ${user.createdAt.toLocaleDateString()} (${accountAge} days ago)`);
    console.log(`   Province: ${user.province || 'Not set'}`);
    console.log(`   Partner: ${user.includePartner ? 'Yes' : 'No'} | Verified: ${user.emailVerified ? 'Yes' : 'No'} | Onboarding: ${user.onboardingCompleted ? 'Done' : 'Pending'}`);
    console.log(`   Activity:`);
    console.log(`     - Simulations: ${user._count.simulationRuns}`);
    console.log(`     - Assets: ${user._count.assets}`);
    console.log(`     - Income Sources: ${user._count.incomeSources}`);
    console.log(`     - Expenses: ${user._count.expenses}`);
    console.log(`   Last Activity: ${lastActivityStr}`);

    if (user.simulationRuns.length > 0) {
      const lastSim = user.simulationRuns[0];
      console.log(`   Last Simulation: ${lastSim.strategy} | Score: ${lastSim.healthScore || 'N/A'}`);
    }
  });

  // Activity timeline
  console.log(`\n\n📅 REGISTRATION TIMELINE (Last 30 Days)`);
  console.log('='.repeat(80));

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRegistrations = allUsers.filter(u => u.createdAt >= thirtyDaysAgo);

  // Group by date
  const byDate = new Map<string, typeof allUsers>();
  recentRegistrations.forEach(u => {
    const dateKey = u.createdAt.toISOString().split('T')[0];
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, []);
    }
    byDate.get(dateKey)!.push(u);
  });

  // Sort dates
  const sortedDates = Array.from(byDate.keys()).sort().reverse();

  sortedDates.forEach(date => {
    const users = byDate.get(date)!;
    const dateObj = new Date(date + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    console.log(`\n${dayName}:`);
    users.forEach(u => {
      const time = u.createdAt.toLocaleTimeString();
      const simCount = u._count.simulationRuns;
      const hasData = u._count.assets > 0 || u._count.incomeSources > 0;
      const activity = simCount > 0 ? `${simCount} sims` : hasData ? 'setup started' : 'no activity';
      console.log(`  ${time} | ${u.email.padEnd(35)} | ${activity}`);
    });
  });

  await prisma.$disconnect();
}

getAllUserActivity().catch(console.error);
