/**
 * Set Marc's Premium Access to Exactly One Year (Until Feb 2027)
 *
 * This script sets Marc's premium access to exactly one year from today,
 * correcting the previous extension that gave him too much time.
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setMarcPremiumOneYear() {
  const userEmail = 'mrondeau205@gmail.com';

  try {
    console.log('🎁 Setting Marc\'s premium access to exactly one year...\n');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      }
    });

    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not set';

    console.log('Current status:');
    console.log(`  Name: ${fullName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current tier: ${user.subscriptionTier}`);
    console.log(`  Current status: ${user.subscriptionStatus}`);
    if (user.subscriptionEndDate) {
      console.log(`  Current end date: ${user.subscriptionEndDate.toLocaleDateString()}`);
    }

    // Set dates - exactly one year from today
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    console.log('\n📅 Setting new dates:');
    console.log(`  Start date: ${now.toLocaleDateString()}`);
    console.log(`  End date: ${oneYearFromNow.toLocaleDateString()} (Feb 2027)`);

    // Update the user's subscription
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionStartDate: now,
        subscriptionEndDate: oneYearFromNow,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      }
    });

    console.log('\n✅ Premium access set successfully!');
    console.log('\n📊 Updated subscription details:');
    console.log(`  Tier: ${updatedUser.subscriptionTier}`);
    console.log(`  Status: ${updatedUser.subscriptionStatus}`);
    console.log(`  Start date: ${updatedUser.subscriptionStartDate.toLocaleDateString()}`);
    console.log(`  End date: ${updatedUser.subscriptionEndDate.toLocaleDateString()}`);

    // Calculate exact days
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysOfAccess = Math.round((updatedUser.subscriptionEndDate - now) / msPerDay);

    console.log(`\n🎉 Marc now has exactly ${daysOfAccess} days of premium access (1 year)!`);

    console.log('\n📝 Audit log:');
    console.log(`  Action: Set premium access to exactly 1 year`);
    console.log(`  User: ${userEmail}`);
    console.log(`  Set by: Admin script`);
    console.log(`  Date: ${now.toISOString()}`);
    console.log(`  Reason: Compensation for simulation errors`);
    console.log(`  Duration: 365 days (until Feb 2027)`);

  } catch (error) {
    console.error('❌ Error setting premium access:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setMarcPremiumOneYear()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });