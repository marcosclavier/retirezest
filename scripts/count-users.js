#!/usr/bin/env node
/**
 * Quick script to count users in the database
 * Run with: node scripts/count-users.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Count all users
    const totalUsers = await prisma.user.count();

    // Count active users (not deleted)
    const activeUsers = await prisma.user.count({
      where: {
        deletedAt: null
      }
    });

    // Count verified users
    const verifiedUsers = await prisma.user.count({
      where: {
        emailVerified: true,
        deletedAt: null
      }
    });

    // Count users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        deletedAt: null
      }
    });

    // Count simulation runs
    const totalSimulations = await prisma.simulationRun.count();

    // Recent simulation runs (last 30 days)
    const recentSimulations = await prisma.simulationRun.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    console.log('\n📊 RetireZest User Statistics\n');
    console.log('════════════════════════════════════════');
    console.log(`Total users:              ${totalUsers}`);
    console.log(`Active users:             ${activeUsers}`);
    console.log(`Verified users:           ${verifiedUsers}`);
    console.log(`New users (last 30 days): ${recentUsers}`);
    console.log('────────────────────────────────────────');
    console.log(`Total simulations run:    ${totalSimulations}`);
    console.log(`Simulations (last 30d):   ${recentSimulations}`);
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
