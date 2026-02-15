import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function countUsers() {
  try {
    const totalUsers = await prisma.user.count();

    console.log('='.repeat(60));
    console.log('RETIREZEST USER STATISTICS');
    console.log('='.repeat(60));
    console.log(`\nTotal registered users: ${totalUsers}`);

    // Get some additional stats
    const usersWithScenarios = await prisma.user.count({
      where: {
        scenarios: {
          some: {}
        }
      }
    });

    const usersWithAssets = await prisma.user.count({
      where: {
        assets: {
          some: {}
        }
      }
    });

    const usersWithIncome = await prisma.user.count({
      where: {
        incomeSources: {
          some: {}
        }
      }
    });

    console.log(`Users with scenarios: ${usersWithScenarios}`);
    console.log(`Users with assets: ${usersWithAssets}`);
    console.log(`Users with income sources: ${usersWithIncome}`);

    // Get recent user stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    console.log(`\nNew users in last 30 days: ${recentUsers}`);

    // List all users
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        _count: {
          select: {
            scenarios: true,
            assets: true,
            incomeSources: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('REGISTERED USERS');
    console.log('='.repeat(60));

    allUsers.forEach((user, index) => {
      const name = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : 'No name set';
      const signupDate = user.createdAt.toISOString().split('T')[0];
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Signed up: ${signupDate}`);
      console.log(`   Data: ${user._count.scenarios} scenarios, ${user._count.assets} assets, ${user._count.incomeSources} income sources`);
    });

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countUsers();
