const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Check email verification status of users with assets but no simulations
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            assets: {
              some: {} // Has at least one asset
            }
          },
          {
            simulationRuns: {
              none: {} // Has NO simulation runs
            }
          }
        ]
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        deletedAt: true,
        _count: {
          select: {
            assets: true,
            simulationRuns: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 25
    });

    console.log('='.repeat(80));
    console.log('EMAIL VERIFICATION STATUS - Users with Assets but No Simulations');
    console.log('='.repeat(80));
    console.log(`Total users: ${users.length}`);
    console.log('');

    const verified = users.filter(u => u.emailVerified);
    const unverified = users.filter(u => !u.emailVerified);
    const deleted = users.filter(u => u.deletedAt);
    const active = users.filter(u => !u.deletedAt);

    console.log('SUMMARY:');
    console.log(`  ✅ Email Verified: ${verified.length} (${((verified.length/users.length)*100).toFixed(1)}%)`);
    console.log(`  ❌ Email NOT Verified: ${unverified.length} (${((unverified.length/users.length)*100).toFixed(1)}%)`);
    console.log(`  🗑️  Deleted Accounts: ${deleted.length}`);
    console.log(`  ✅ Active Accounts: ${active.length}`);
    console.log('');

    if (unverified.length > 0) {
      console.log('='.repeat(80));
      console.log('❌ USERS WITH UNVERIFIED EMAILS (BLOCKED FROM SIMULATIONS!)');
      console.log('='.repeat(80));

      unverified.forEach((user, i) => {
        console.log(`\n${i + 1}. ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Deleted: ${user.deletedAt || 'Active'}`);
        console.log(`   Assets: ${user._count.assets}`);
        console.log(`   Simulation Runs: ${user._count.simulationRuns}`);
        console.log(`   ⚠️  BLOCKED: Email not verified → Cannot run simulations!`);
      });

      console.log('\n' + '='.repeat(80));
      console.log('⚡ ACTION REQUIRED:');
      console.log('='.repeat(80));
      console.log(`${unverified.filter(u => !u.deletedAt).length} active users are blocked from running simulations due to unverified emails.`);
      console.log('');
      console.log('Options:');
      console.log('1. Send verification reminder emails');
      console.log('2. Manually verify emails for high-value users (if email is valid)');
      console.log('3. Reduce verification requirement (allow simulations without verification)');
    }

    if (verified.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('✅ USERS WITH VERIFIED EMAILS (Should be able to run simulations)');
      console.log('='.repeat(80));

      verified.forEach((user, i) => {
        console.log(`\n${i + 1}. ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Deleted: ${user.deletedAt || 'Active'}`);
        console.log(`   Assets: ${user._count.assets}`);
        console.log(`   ✅ Email verified, but still no simulations - different blocking issue!`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
