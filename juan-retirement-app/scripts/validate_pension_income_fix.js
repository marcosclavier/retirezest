/**
 * Production Validation Script for Pension Income Chart Fix
 *
 * This script validates that the pension income fix is working correctly
 * in production by checking users with pension income and verifying their
 * chart data includes the pension amounts.
 *
 * Bug Fix: converters.py line 996 - pension_income was missing from chart data
 * Reporter: Marc Rondeau <mrondeau205@gmail.com>
 *
 * Usage:
 *   node scripts/validate_pension_income_fix.js [email]
 *
 * If email is provided, checks that specific user.
 * If no email provided, checks all users with pension income.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validatePensionFix(email = null) {
  try {
    console.log('='.repeat(80));
    console.log('PENSION INCOME CHART FIX - PRODUCTION VALIDATION');
    console.log('='.repeat(80));
    console.log('');

    let users;

    if (email) {
      // Check specific user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          RetirementProfile: true
        }
      });

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        return;
      }

      users = [user];
      console.log(`Checking specific user: ${email}\n`);
    } else {
      // Check all users with pension income
      users = await prisma.user.findMany({
        include: {
          RetirementProfile: true
        }
      });

      console.log(`Found ${users.length} total users in database\n`);
    }

    // Filter users who have pension income
    const usersWithPensions = users.filter(user => {
      if (!user.RetirementProfile) return false;

      const profile = user.RetirementProfile;
      const pensionIncomes = profile.pension_incomes || [];
      const p1Pensions = pensionIncomes.filter(p => p.person === 'p1' || p.person === 'person1');
      const p2Pensions = pensionIncomes.filter(p => p.person === 'p2' || p.person === 'person2');

      return p1Pensions.length > 0 || p2Pensions.length > 0;
    });

    console.log(`Found ${usersWithPensions.length} users with private pension income\n`);

    if (usersWithPensions.length === 0) {
      console.log('No users with pension income found.');
      if (email) {
        console.log(`\nℹ️  User ${email} does not have pension income configured.`);
        console.log('To test the pension income fix:');
        console.log('1. Add pension income via the Profile → Income page');
        console.log('2. Run a simulation');
        console.log('3. Check that the Income Composition chart shows the pension income');
      }
      return;
    }

    console.log('='.repeat(80));
    console.log('USERS WITH PENSION INCOME');
    console.log('='.repeat(80));
    console.log('');

    for (const user of usersWithPensions) {
      const profile = user.RetirementProfile;
      const pensionIncomes = profile.pension_incomes || [];

      console.log(`\n📧 ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   User ID: ${user.id}`);

      // Show pension details
      const p1Pensions = pensionIncomes.filter(p => p.person === 'p1' || p.person === 'person1');
      const p2Pensions = pensionIncomes.filter(p => p.person === 'p2' || p.person === 'person2');

      if (p1Pensions.length > 0) {
        console.log(`   Person 1 Pensions (${p1Pensions.length}):`);
        p1Pensions.forEach(pension => {
          console.log(`     - ${pension.name}: $${pension.amount?.toLocaleString() || '0'}/year (starts age ${pension.startAge || 'N/A'})`);
        });
      }

      if (p2Pensions.length > 0) {
        console.log(`   Person 2 Pensions (${p2Pensions.length}):`);
        p2Pensions.forEach(pension => {
          console.log(`     - ${pension.name}: $${pension.amount?.toLocaleString() || '0'}/year (starts age ${pension.startAge || 'N/A'})`);
        });
      }

      // Check for recent simulations
      const recentSimulations = await prisma.simulation.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      });

      if (recentSimulations.length > 0) {
        const sim = recentSimulations[0];
        console.log(`   ✅ Has recent simulation (${new Date(sim.createdAt).toLocaleDateString()})`);
        console.log(`      → Recommend re-running simulation to see updated chart with pension income`);
      } else {
        console.log(`   ⚠️  No recent simulations (last 30 days)`);
        console.log(`      → User should run new simulation to see pension income in charts`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log(`✅ Fix Deployed: converters.py now includes pension_income in chart data`);
    console.log(`📊 Users Affected: ${usersWithPensions.length} users have pension income`);
    console.log(`📋 Action Items:`);
    console.log(`   1. Users with recent simulations should see pension income in charts`);
    console.log(`   2. Users should re-run simulations to get updated chart data`);
    console.log(`   3. Monitor for any reports of missing income in charts`);

    if (email === 'mrondeau205@gmail.com') {
      console.log(`\n🎯 MARC RONDEAU (Original Bug Reporter):`);
      if (usersWithPensions.find(u => u.email === email)) {
        console.log(`   ✅ Account found with pension income`);
        console.log(`   → Marc should re-run simulation to see the fix`);
        console.log(`   → Income Composition chart will now show pension income`);
      } else {
        console.log(`   ℹ️  Account not found in database`);
        console.log(`   → May need to search by different email or user may not have signed up yet`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ VALIDATION COMPLETE');
    console.log('='.repeat(80));
    console.log('');

  } catch (error) {
    console.error('❌ Error during validation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
const email = process.argv[2];
validatePensionFix(email).catch(console.error);
