/**
 * Grant Premium Access to Marc Rondeau for One Year
 *
 * This script grants complimentary premium access to Marc Rondeau
 * as a thank you for his valuable feedback and bug reports.
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function grantPremiumAccess() {
  const userEmail = 'mrondeau205@gmail.com';
  const premiumDurationDays = 365; // One year

  try {
    console.log('🎁 Granting premium access to Marc Rondeau...\n');

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
      console.log('\nMarc needs to create an account first at www.retirezest.com');
      return;
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not set';

    console.log('Found user:');
    console.log(`  Name: ${fullName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current tier: ${user.subscriptionTier}`);
    console.log(`  Current status: ${user.subscriptionStatus}`);

    if (user.subscriptionTier === 'premium' && user.subscriptionStatus === 'active') {
      console.log('\n⚠️  User already has active premium access');
      if (user.subscriptionEndDate) {
        console.log(`  Expires: ${user.subscriptionEndDate.toLocaleDateString()}`);
      }

      // Ask if we should extend it
      console.log('\nExtending premium access by one year...');
    }

    // Calculate dates
    const now = new Date();
    const startDate = user.subscriptionTier === 'premium' && user.subscriptionStartDate
      ? user.subscriptionStartDate
      : now;

    // If already premium, extend from current end date, otherwise start from now
    const currentEndDate = user.subscriptionEndDate || now;
    const newEndDate = new Date(
      user.subscriptionTier === 'premium' && user.subscriptionEndDate > now
        ? user.subscriptionEndDate
        : now
    );
    newEndDate.setDate(newEndDate.getDate() + premiumDurationDays);

    // Update the user's subscription
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionStartDate: startDate,
        subscriptionEndDate: newEndDate,
        // Note: Not setting Stripe IDs since this is complimentary
        // stripePriceId could be set to 'complimentary' or similar if needed
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

    console.log('\n✅ Premium access granted successfully!');
    console.log('\n📊 Updated subscription details:');
    console.log(`  Tier: ${updatedUser.subscriptionTier}`);
    console.log(`  Status: ${updatedUser.subscriptionStatus}`);
    console.log(`  Start date: ${updatedUser.subscriptionStartDate.toLocaleDateString()}`);
    console.log(`  End date: ${updatedUser.subscriptionEndDate.toLocaleDateString()}`);
    console.log(`  Duration: ${premiumDurationDays} days`);

    // Calculate days of premium access
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysOfAccess = Math.round((updatedUser.subscriptionEndDate - now) / msPerDay);

    console.log(`\n🎉 Marc now has ${daysOfAccess} days of premium access!`);
    console.log('\nPremium benefits include:');
    console.log('  ✓ Unlimited retirement simulations (vs 10/day)');
    console.log('  ✓ Advanced Monte Carlo analysis');
    console.log('  ✓ Strategy optimization features');
    console.log('  ✓ Detailed tax planning tools');
    console.log('  ✓ Export capabilities');
    console.log('  ✓ Priority support');

    console.log('\n📧 Next steps:');
    console.log('  1. Send Marc an email notifying him of the premium upgrade');
    console.log('  2. Include instructions on how to access premium features');
    console.log('  3. Thank him for his valuable feedback');

    // Log this action for audit purposes
    console.log('\n📝 Audit log:');
    console.log(`  Action: Granted complimentary premium access`);
    console.log(`  User: ${userEmail}`);
    console.log(`  Granted by: Script (manual admin action)`);
    console.log(`  Date: ${now.toISOString()}`);
    console.log(`  Reason: Valuable feedback and bug reporting`);
    console.log(`  Duration: ${premiumDurationDays} days`);

  } catch (error) {
    console.error('❌ Error granting premium access:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
grantPremiumAccess()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });