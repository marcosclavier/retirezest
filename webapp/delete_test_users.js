const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Delete Test Users - PRODUCTION CLEANUP
 *
 * This script deletes test users from the database
 * Run with --confirm to actually delete
 */

// EMPTY TEST USERS (3 users - SAFE TO DELETE)
const EMPTY_TEST_USERS = [
  { id: '4f0c1ab9-26fe-4180-baed-8e492e4effd2', email: 'pension-test@retirezest.com', reason: 'Empty test account' },
  { id: '75ced9a0-b2f9-4fbd-9e14-a14419649198', email: 'test-scenarios@example.com', reason: 'Empty test account' },
  { id: '8ce88819-f1bd-4333-8eb9-fc1a681a8244', email: 'test-resend@example.com', reason: 'Empty test account' },
];

// TEST USERS WITH DATA (10 users - REVIEW BEFORE DELETING)
const TEST_USERS_WITH_DATA = [
  { id: 'ba48ab08-5c40-45e5-9e94-69e8954cb7df', email: 'helen.highincome@test.com', assets: 3, simulations: 0, reason: 'Sprint 5 test user' },
  { id: '6f1b96c1-3c83-4ae7-b069-5f0c6f9b526e', email: 'sarah.struggling@test.com', assets: 2, simulations: 0, reason: 'Sprint 5 test user' },
  { id: '1f8050b6-ec00-48ce-b277-ecdb58a27f83', email: 'mike.moderate@test.com', assets: 4, simulations: 0, reason: 'Sprint 5 test user' },
  { id: 'ce4a1c2f-28c0-4447-906e-6f4a6f1e2ae2', email: 'alex.aggressive@test.com', assets: 3, simulations: 0, reason: 'Sprint 5 test user' },
  { id: '3ee9ef97-4f27-4ab2-b08d-f8ce56bc036e', email: 'claire.conservative@test.com', assets: 3, simulations: 0, reason: 'Sprint 5 test user' },
  { id: 'd947a34c-57c5-4981-aa50-7c871cd6b08d', email: 'sprint5-test@example.com', assets: 4, simulations: 0, reason: 'Sprint 5 test user' },
  { id: 'bdcf6b48-57a3-4e0e-b0b8-aa2023212c85', email: 'test@example.com', assets: 3, simulations: 181, reason: 'Main test account (181 simulations!)' },
  { id: '7aa500c4-9639-4846-b07a-ea99011c88e0', email: 'fresh.ship4097@mailforce.link', assets: 6, simulations: 0, reason: 'Mailforce temp email - Testy McTesterson' },
  { id: 'cd7e9efe-1047-4ea5-bfac-c5c6dd55311e', email: 'dull.line9747@mailforce.link', assets: 4, simulations: 0, reason: 'Mailforce temp email - Testy McTesterson' },
  { id: '4b1f76c0-6139-4378-a6e2-bcb6bdb55c85', email: 'test-verify3@example.com', assets: 0, simulations: 0, reason: 'Email verification test account' },
];

async function deleteTestUsers(confirm = false, includeDataUsers = false) {
  console.log('='.repeat(80));
  console.log('TEST USER DELETION');
  console.log('='.repeat(80));
  console.log('');

  if (!confirm) {
    console.log('⚠️  DRY RUN MODE - No users will be deleted');
    console.log('   Run with --confirm to actually delete users');
    console.log('');
  } else {
    console.log('🚨 LIVE MODE - Users WILL be deleted!');
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('DELETION PLAN');
  console.log('='.repeat(80));
  console.log('');

  console.log(`Empty Test Users (always deleted): ${EMPTY_TEST_USERS.length}`);
  EMPTY_TEST_USERS.forEach(u => {
    console.log(`  - ${u.email} (${u.reason})`);
  });
  console.log('');

  if (includeDataUsers) {
    console.log(`Test Users WITH Data (will be deleted): ${TEST_USERS_WITH_DATA.length}`);
    TEST_USERS_WITH_DATA.forEach(u => {
      console.log(`  - ${u.email} - ${u.assets} assets, ${u.simulations} simulations (${u.reason})`);
    });
    console.log('');
  } else {
    console.log(`Test Users WITH Data (will NOT be deleted): ${TEST_USERS_WITH_DATA.length}`);
    console.log('  Use --include-data flag to delete these as well');
    console.log('');
  }

  const totalToDelete = EMPTY_TEST_USERS.length + (includeDataUsers ? TEST_USERS_WITH_DATA.length : 0);
  console.log(`Total users to delete: ${totalToDelete}`);
  console.log('');

  // If dry run, stop here
  if (!confirm) {
    console.log('='.repeat(80));
    console.log('DRY RUN - No changes made');
    console.log('='.repeat(80));
    console.log('');
    console.log('To actually delete:');
    console.log('  1. Empty test users only:');
    console.log('     node delete_test_users.js --confirm');
    console.log('');
    console.log('  2. ALL test users (including those with data):');
    console.log('     node delete_test_users.js --confirm --include-data');
    console.log('');
    return;
  }

  // Confirm deletion
  console.log('='.repeat(80));
  console.log('DELETING USERS...');
  console.log('='.repeat(80));
  console.log('');

  let deletedCount = 0;
  const errors = [];

  // Delete empty test users
  console.log('--- Deleting Empty Test Users ---');
  console.log('');
  for (const user of EMPTY_TEST_USERS) {
    try {
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log(`✅ Deleted: ${user.email}`);
      deletedCount++;
    } catch (error) {
      console.log(`❌ Failed to delete ${user.email}: ${error.message}`);
      errors.push({ user: user.email, error: error.message });
    }
  }
  console.log('');

  // Delete test users with data (if requested)
  if (includeDataUsers) {
    console.log('--- Deleting Test Users WITH Data ---');
    console.log('');
    for (const user of TEST_USERS_WITH_DATA) {
      try {
        await prisma.user.delete({
          where: { id: user.id }
        });
        console.log(`✅ Deleted: ${user.email} (${user.assets} assets, ${user.simulations} simulations)`);
        deletedCount++;
      } catch (error) {
        console.log(`❌ Failed to delete ${user.email}: ${error.message}`);
        errors.push({ user: user.email, error: error.message });
      }
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('DELETION SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Users Deleted: ${deletedCount}`);
  console.log(`Errors: ${errors.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('Failed Deletions:');
    errors.forEach(e => console.log(`  - ${e.user}: ${e.error}`));
    console.log('');
  }

  // Verify remaining users
  const remainingUsers = await prisma.user.count({
    where: { deletedAt: null }
  });

  console.log(`Remaining Active Users: ${remainingUsers}`);
  console.log('');

  console.log('='.repeat(80));
  console.log('CLEANUP COMPLETE');
  console.log('='.repeat(80));
  console.log('');
}

// Parse command line arguments
const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const includeDataUsers = args.includes('--include-data');

// Run the deletion
deleteTestUsers(confirm, includeDataUsers)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
