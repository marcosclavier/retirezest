#!/usr/bin/env tsx
/**
 * Test script for simulation-ready email notification
 *
 * This script tests the email notification system by:
 * 1. Finding a user who is simulation-ready but hasn't received the email
 * 2. Sending them the notification email
 * 3. Marking the email as sent in the database
 */

import { sendSimulationReadyEmail } from './lib/email-simulation-ready';
import { checkAndNotifySimulationReady } from './lib/simulation-ready-check';
import { prisma } from './lib/prisma';

async function main() {
  console.log('🧪 Testing Simulation-Ready Email Notification System\n');

  // Find users who are simulation-ready but haven't received the email yet
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      simulationReadyEmailSentAt: null,
    },
    include: {
      _count: {
        select: {
          assets: true,
          incomeSources: true,
          expenses: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} users without simulation-ready email\n`);

  // Filter to find users who are actually ready
  const readyUsers = users.filter(user => {
    const hasAssets = user._count.assets > 0;
    const hasIncomeOrExpenses = user._count.incomeSources > 0 || user._count.expenses > 0;
    return hasAssets && hasIncomeOrExpenses;
  });

  console.log(`${readyUsers.length} of them are simulation-ready:\n`);

  if (readyUsers.length === 0) {
    console.log('❌ No simulation-ready users found to test with.');
    console.log('\nTo test:');
    console.log('1. Create a user account');
    console.log('2. Add at least 1 asset');
    console.log('3. Add at least 1 income source or expense');
    console.log('4. Run this script again');
    return;
  }

  // Display ready users
  readyUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Name: ${[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not set'}`);
    console.log(`   Assets: ${user._count.assets}, Income: ${user._count.incomeSources}, Expenses: ${user._count.expenses}`);
    console.log('');
  });

  // Test with the first ready user
  const testUser = readyUsers[0];
  console.log(`\n📧 Testing email notification for: ${testUser.email}\n`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const success = await checkAndNotifySimulationReady(testUser.id, appUrl);

  if (success) {
    console.log('✅ Email sent successfully!');
    console.log('\nCheck the email inbox for:', testUser.email);
    console.log('Subject: 🎯 You\'re Ready for Your Retirement Simulation!');
  } else {
    console.log('❌ Failed to send email. Check the logs above for errors.');
  }

  console.log('\n📊 Summary:');
  console.log(`- Total users: ${users.length}`);
  console.log(`- Simulation-ready users: ${readyUsers.length}`);
  console.log(`- Email sent: ${success ? 'Yes' : 'No'}`);

  await prisma.$disconnect();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
