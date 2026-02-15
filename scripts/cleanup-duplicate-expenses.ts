/**
 * Cleanup Script: Remove Duplicate "Total Monthly Expenses" Entries
 *
 * This script finds and removes duplicate "Total Monthly Expenses" entries,
 * keeping only the most recent one for each user.
 *
 * Usage: npx tsx scripts/cleanup-duplicate-expenses.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateExpenses() {
  console.log('🔍 Searching for duplicate "Total Monthly Expenses" entries...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
    });

    let totalDuplicatesFound = 0;
    let totalDuplicatesRemoved = 0;
    let usersAffected = 0;

    for (const user of users) {
      // Find all "Total Monthly Expenses" entries for this user
      const totalExpenses = await prisma.expense.findMany({
        where: {
          userId: user.id,
          description: 'Total Monthly Expenses',
          frequency: 'monthly',
        },
        orderBy: {
          createdAt: 'desc', // Most recent first
        },
      });

      if (totalExpenses.length > 1) {
        usersAffected++;
        const duplicateCount = totalExpenses.length - 1;
        totalDuplicatesFound += duplicateCount;

        console.log(`\n📧 User: ${user.email}`);
        console.log(`   Found ${totalExpenses.length} "Total Monthly Expenses" entries`);

        // Keep the most recent one (first in the sorted array)
        const toKeep = totalExpenses[0];
        const toDelete = totalExpenses.slice(1);

        console.log(`   ✅ Keeping: $${toKeep.amount}/month (created: ${toKeep.createdAt.toISOString()})`);

        for (const expense of toDelete) {
          console.log(`   ❌ Removing duplicate: $${expense.amount}/month (created: ${expense.createdAt.toISOString()})`);
          await prisma.expense.delete({
            where: { id: expense.id },
          });
          totalDuplicatesRemoved++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users checked: ${users.length}`);
    console.log(`Users with duplicates: ${usersAffected}`);
    console.log(`Duplicate entries found: ${totalDuplicatesFound}`);
    console.log(`Duplicate entries removed: ${totalDuplicatesRemoved}`);
    console.log('='.repeat(60) + '\n');

    if (totalDuplicatesRemoved > 0) {
      console.log('✅ Cleanup completed successfully!');
    } else {
      console.log('✨ No duplicates found. Database is clean!');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateExpenses()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
