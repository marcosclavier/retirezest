#!/usr/bin/env node
/**
 * Extract baseline data for regression testing
 * Usage: node extract_user_baseline.js <email>
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function extractUserBaseline(email) {
  console.log('='.repeat(80));
  console.log(`EXTRACTING BASELINE DATA FOR: ${email}`);
  console.log('='.repeat(80));
  console.log('');

  try {
    // Get complete user profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        incomeSources: true,
        assets: true,
        expenses: true,
        debts: true,
        scenarios: true,
        simulationRuns: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Last 5 simulations for baseline comparison
        }
      }
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    // Remove sensitive data
    delete user.passwordHash;
    delete user.resetToken;
    delete user.emailVerificationToken;
    delete user.stripeCustomerId;
    delete user.stripeSubscriptionId;

    console.log('✅ User found');
    console.log(`   Name: ${user.firstName} ${user.lastName || ''}`);
    console.log(`   Tier: ${user.subscriptionTier}`);
    console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
    console.log('');

    console.log('📊 Profile Summary:');
    console.log(`   Assets: ${user.assets.length}`);
    console.log(`   Income Sources: ${user.incomeSources.length}`);
    console.log(`   Expenses: ${user.expenses.length}`);
    console.log(`   Debts: ${user.debts.length}`);
    console.log(`   Scenarios: ${user.scenarios.length}`);
    console.log(`   Simulations: ${user.simulationRuns.length} (showing last 5)`);
    console.log('');

    // Create baseline directory
    const baselineDir = path.join(__dirname, '../../juan-retirement-app/baselines');
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true });
    }

    // Save baseline data
    const filename = `baseline_${email.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    const filepath = path.join(baselineDir, filename);

    const baseline = {
      extracted_at: new Date().toISOString(),
      email: user.email,
      user_profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        province: user.province,
        subscriptionTier: user.subscriptionTier,
        emailVerified: user.emailVerified
      },
      financial_data: {
        assets: user.assets,
        incomeSources: user.incomeSources,
        expenses: user.expenses,
        debts: user.debts
      },
      scenarios: user.scenarios,
      recent_simulations: user.simulationRuns.map(sim => ({
        id: sim.id,
        createdAt: sim.createdAt,
        inputData: sim.inputData,
        outputData: sim.outputData,
        successRate: sim.successRate,
        status: sim.status
      }))
    };

    fs.writeFileSync(filepath, JSON.stringify(baseline, null, 2));

    console.log('💾 Baseline data saved:');
    console.log(`   File: ${filename}`);
    console.log(`   Path: ${filepath}`);
    console.log(`   Size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);
    console.log('');

    console.log('✅ Baseline extraction complete');
    console.log('='.repeat(80));

    return baseline;

  } catch (error) {
    console.error('❌ Error extracting baseline:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const email = process.argv[2];

if (!email) {
  console.error('Usage: node extract_user_baseline.js <email>');
  process.exit(1);
}

extractUserBaseline(email)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
