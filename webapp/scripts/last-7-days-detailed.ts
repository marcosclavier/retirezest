import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function getLast7DaysActivity() {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('              USER ACTIVITY - LAST 7 DAYS');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Period: ${sevenDaysAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    console.log();

    // New registrations
    const newUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('📝 NEW REGISTRATIONS');
    console.log('─'.repeat(70));
    console.log(`Total: ${newUsers.length} new users`);
    console.log();

    if (newUsers.length > 0) {
      newUsers.forEach((user, index) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
        const verified = user.emailVerified ? '✅' : '⏳';
        const date = user.createdAt.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`${index + 1}. ${verified} ${user.email}`);
        console.log(`   Name: ${name}`);
        console.log(`   Registered: ${date}`);
        console.log();
      });
    }

    // Simulations run
    const simulations = await prisma.simulationRun.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('🔮 SIMULATIONS RUN');
    console.log('─'.repeat(70));
    console.log(`Total: ${simulations.length} simulations`);
    console.log();

    // Group by user
    const simsByUser: { [email: string]: typeof simulations } = {};
    simulations.forEach(sim => {
      const email = sim.user.email;
      if (!simsByUser[email]) {
        simsByUser[email] = [];
      }
      simsByUser[email].push(sim);
    });

    const uniqueSimUsers = Object.keys(simsByUser).length;
    console.log(`Active Users: ${uniqueSimUsers}`);
    console.log();

    if (simulations.length > 0) {
      console.log('By User:');
      Object.entries(simsByUser)
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([email, sims]) => {
          const user = sims[0].user;
          const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
          console.log(`  ${email} (${name}): ${sims.length} simulations`);
        });
      console.log();

      console.log('Latest 10 Simulations:');
      simulations.slice(0, 10).forEach((sim, index) => {
        const user = sim.user;
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
        const date = sim.createdAt.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const score = sim.healthScore || 'N/A';
        console.log(`  ${index + 1}. ${date} | ${user.email.substring(0, 20)}... | ${sim.strategy || 'N/A'} | Score: ${score}`);
      });
      console.log();
    }

    // Assets added
    const assetsAdded = await prisma.asset.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log('💰 ASSETS ADDED');
    console.log('─'.repeat(70));
    console.log(`Total: ${assetsAdded.length} new assets`);

    if (assetsAdded.length > 0) {
      const assetsByType = assetsAdded.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log();
      console.log('By Type:');
      Object.entries(assetsByType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
    }
    console.log();

    // Income sources added
    const incomeAdded = await prisma.incomeSource.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    console.log('💵 INCOME SOURCES ADDED');
    console.log('─'.repeat(70));
    console.log(`Total: ${incomeAdded.length} new income sources`);

    if (incomeAdded.length > 0) {
      const incomeByType = incomeAdded.reduce((acc, income) => {
        acc[income.type] = (acc[income.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log();
      console.log('By Type:');
      Object.entries(incomeByType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
    }
    console.log();

    // Expenses added
    const expensesAdded = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    console.log('🏷️  EXPENSES ADDED');
    console.log('─'.repeat(70));
    console.log(`Total: ${expensesAdded.length} new expenses`);
    console.log();

    // Scenarios created
    const scenariosCreated = await prisma.scenario.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log('🎬 SCENARIOS CREATED');
    console.log('─'.repeat(70));
    console.log(`Total: ${scenariosCreated.length} new scenarios`);
    console.log();

    // Email verifications
    const verifiedInPeriod = await prisma.user.findMany({
      where: {
        emailVerified: true,
        updatedAt: {
          gte: sevenDaysAgo,
        },
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
      },
    });

    console.log('✅ EMAIL VERIFICATIONS (Existing Users)');
    console.log('─'.repeat(70));
    console.log(`Total: ${verifiedInPeriod.length} users verified their email`);

    if (verifiedInPeriod.length > 0) {
      console.log();
      verifiedInPeriod.forEach((user, index) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
        const date = user.updatedAt.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`  ${index + 1}. ${user.email} (${name}) - Verified: ${date}`);
      });
    }
    console.log();

    // Overall engagement
    console.log('📊 ENGAGEMENT SUMMARY');
    console.log('─'.repeat(70));

    const activeUserEmails = new Set([
      ...simulations.map(s => s.user.email),
      ...assetsAdded.map(a => a.user.email),
      ...incomeAdded.map(i => i.userId).filter(Boolean),
      ...expensesAdded.map(e => e.userId).filter(Boolean),
    ]);

    console.log(`Total Active Users: ${activeUserEmails.size}`);
    console.log(`New Registrations: ${newUsers.length}`);
    console.log(`Simulations Run: ${simulations.length}`);
    console.log(`Assets Added: ${assetsAdded.length}`);
    console.log(`Income Sources Added: ${incomeAdded.length}`);
    console.log(`Expenses Added: ${expensesAdded.length}`);
    console.log(`Scenarios Created: ${scenariosCreated.length}`);
    console.log(`Email Verifications: ${verifiedInPeriod.length}`);
    console.log();

    console.log('═══════════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error generating 7-day activity report:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

getLast7DaysActivity();
