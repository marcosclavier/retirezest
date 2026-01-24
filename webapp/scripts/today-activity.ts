import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function getTodayActivity() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('                  TODAY\'S USER ACTIVITY');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Date: ${today.toDateString()}`);
    console.log(`Time: ${now.toLocaleTimeString()}`);
    console.log();

    // New registrations today
    const newUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: today,
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

    console.log('📝 NEW REGISTRATIONS TODAY');
    console.log('─'.repeat(70));
    console.log(`Total: ${newUsers.length}`);
    console.log();

    if (newUsers.length > 0) {
      newUsers.forEach((user, index) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
        const verified = user.emailVerified ? '✅ Verified' : '⏳ Unverified';
        const time = user.createdAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${name}`);
        console.log(`   Time: ${time}`);
        console.log(`   Status: ${verified}`);
        console.log();
      });
    } else {
      console.log('No new registrations today.\n');
    }

    // Simulations run today
    const simulations = await prisma.simulationRun.findMany({
      where: {
        createdAt: {
          gte: today,
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

    console.log('🔮 SIMULATIONS RUN TODAY');
    console.log('─'.repeat(70));
    console.log(`Total: ${simulations.length}`);
    console.log();

    if (simulations.length > 0) {
      // Group by user
      const simsByUser: { [email: string]: typeof simulations } = {};
      simulations.forEach(sim => {
        const email = sim.user.email;
        if (!simsByUser[email]) {
          simsByUser[email] = [];
        }
        simsByUser[email].push(sim);
      });

      console.log(`Active Users: ${Object.keys(simsByUser).length}`);
      console.log();

      console.log('By User:');
      Object.entries(simsByUser)
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([email, sims]) => {
          const user = sims[0].user;
          const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
          console.log(`  ${email} (${name}): ${sims.length} simulations`);
        });
      console.log();

      // Strategy breakdown
      const strategyCount: { [key: string]: number } = {};
      simulations.forEach(sim => {
        const strategy = sim.strategy || 'unknown';
        strategyCount[strategy] = (strategyCount[strategy] || 0) + 1;
      });

      console.log('Strategies Used:');
      Object.entries(strategyCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([strategy, count]) => {
          console.log(`  ${strategy}: ${count}`);
        });
      console.log();

      // Health score distribution
      const scores = simulations.filter(s => s.healthScore !== null).map(s => s.healthScore!);
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const excellent = scores.filter(s => s >= 80).length;
        const good = scores.filter(s => s >= 60 && s < 80).length;
        const fair = scores.filter(s => s >= 40 && s < 60).length;
        const poor = scores.filter(s => s < 40).length;

        console.log('Health Score Distribution:');
        console.log(`  Average: ${avgScore.toFixed(1)}`);
        console.log(`  Excellent (80-100): ${excellent}`);
        console.log(`  Good (60-79): ${good}`);
        console.log(`  Fair (40-59): ${fair}`);
        console.log(`  Poor (0-39): ${poor}`);
        console.log();
      }

      console.log('Recent Simulations (Last 10):');
      simulations.slice(0, 10).forEach((sim, index) => {
        const user = sim.user;
        const time = sim.createdAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const score = sim.healthScore !== null ? sim.healthScore : 'N/A';
        console.log(`  ${index + 1}. ${time} | ${user.email.substring(0, 25).padEnd(25)} | ${(sim.strategy || 'N/A').padEnd(20)} | Score: ${score}`);
      });
      console.log();
    } else {
      console.log('No simulations run today.\n');
    }

    // Assets added today
    const assetsAdded = await prisma.asset.findMany({
      where: {
        createdAt: {
          gte: today,
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

    console.log('💰 ASSETS ADDED TODAY');
    console.log('─'.repeat(70));
    console.log(`Total: ${assetsAdded.length}`);

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
      console.log();
    } else {
      console.log('\n');
    }

    // Income sources added today
    const incomeAdded = await prisma.incomeSource.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    console.log('💵 INCOME SOURCES ADDED TODAY');
    console.log('─'.repeat(70));
    console.log(`Total: ${incomeAdded.length}`);
    console.log();

    // Expenses added today
    const expensesAdded = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    console.log('🏷️  EXPENSES ADDED TODAY');
    console.log('─'.repeat(70));
    console.log(`Total: ${expensesAdded.length}`);
    console.log();

    // Email verifications today
    const verifiedToday = await prisma.user.findMany({
      where: {
        emailVerified: true,
        updatedAt: {
          gte: today,
        },
        createdAt: {
          lt: today,
        },
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
      },
    });

    console.log('✅ EMAIL VERIFICATIONS TODAY (Existing Users)');
    console.log('─'.repeat(70));
    console.log(`Total: ${verifiedToday.length}`);

    if (verifiedToday.length > 0) {
      console.log();
      verifiedToday.forEach((user, index) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
        const time = user.updatedAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`  ${index + 1}. ${user.email} (${name}) - ${time}`);
      });
      console.log();
    } else {
      console.log('\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('                         SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════');

    const activeUserEmails = new Set([
      ...simulations.map(s => s.user.email),
      ...assetsAdded.map(a => a.user.email),
    ]);

    console.log();
    console.log(`📊 Total Active Users Today: ${activeUserEmails.size}`);
    console.log(`📝 New Registrations: ${newUsers.length}`);
    console.log(`🔮 Simulations: ${simulations.length}`);
    console.log(`💰 Assets Added: ${assetsAdded.length}`);
    console.log(`💵 Income Sources Added: ${incomeAdded.length}`);
    console.log(`🏷️  Expenses Added: ${expensesAdded.length}`);
    console.log(`✅ Email Verifications: ${verifiedToday.length}`);
    console.log();
    console.log('═══════════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error generating today\'s activity report:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

getTodayActivity();
