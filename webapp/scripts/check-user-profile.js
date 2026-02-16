/**
 * Check user profile completeness
 * Usage: node scripts/check-user-profile.js <email>
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserProfile(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        province: true,
        dateOfBirth: true,
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📊 User Profile:');
    console.log('================');
    console.log(`Email: ${user.email}`);
    console.log(`Email Verified: ${user.emailVerified ? '✅' : '❌'}`);
    console.log(`Name: ${user.firstName || 'NOT SET'} ${user.lastName || 'NOT SET'}`);
    console.log(`Province: ${user.province || '❌ NOT SET (REQUIRED)'}`);
    console.log(`Date of Birth: ${user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '❌ NOT SET (REQUIRED)'}`);
    console.log(`Include Partner: ${user.includePartner}`);
    console.log(`Partner Name: ${user.partnerFirstName || ''} ${user.partnerLastName || ''}`);
    console.log(`Partner DOB: ${user.partnerDateOfBirth ? user.partnerDateOfBirth.toISOString().split('T')[0] : 'N/A'}`);
    console.log(`Subscription: ${user.subscriptionTier || 'free'}`);
    console.log(`Last Updated: ${user.updatedAt?.toISOString() || 'Never'}`);

    // Check for missing required fields
    const issues = [];
    if (!user.province) issues.push('Province is required for tax calculations');
    if (!user.dateOfBirth) issues.push('Date of Birth is required for benefit calculations');
    if (!user.emailVerified) issues.push('Email not verified (limited to 3 free simulations)');

    if (issues.length > 0) {
      console.log('\n⚠️ ISSUES FOUND:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ Profile is complete!');
    }

    // Check recent simulations
    const recentSims = await prisma.simulationRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        createdAt: true,
        strategy: true,
        healthScore: true,
        successRate: true,
      }
    });

    if (recentSims.length > 0) {
      console.log('\n📈 Recent Simulations:');
      recentSims.forEach(sim => {
        console.log(`  - ${sim.createdAt.toISOString()} | ${sim.strategy} | Score: ${sim.healthScore} | Success: ${sim.successRate}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line
const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/check-user-profile.js <email>');
  console.log('Example: node scripts/check-user-profile.js juanclavierb@gmail.com');
  process.exit(1);
}

checkUserProfile(email);