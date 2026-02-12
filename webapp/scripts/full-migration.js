const { PrismaClient: ProdClient } = require('../node_modules/.prisma/client-prod');
const { PrismaClient: LocalClient } = require('@prisma/client');

// Initialize clients
const prodDb = new ProdClient();
const localDb = new LocalClient();

async function migrateData() {
  console.log('🚀 Starting full data migration from production to local...\n');

  try {
    // Connect to databases
    console.log('📡 Connecting to databases...');
    await prodDb.$connect();
    await localDb.$connect();
    console.log('✅ Connected to both databases\n');

    // Get counts from production
    const counts = {
      users: await prodDb.user.count(),
      incomes: await prodDb.income.count(),
      assets: await prodDb.asset.count(),
      expenses: await prodDb.expense.count(),
      debts: await prodDb.debt.count(),
      scenarios: await prodDb.scenario.count()
    };

    console.log('📊 Production database summary:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count} records`);
    });
    console.log('');

    // Ask for confirmation
    console.log('⚠️  WARNING: This will DELETE all data in your local database!');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Clear local database (in reverse dependency order)
    console.log('🗑️  Clearing local database...');
    try {
      await localDb.realEstateAsset.deleteMany({});
      await localDb.savedSimulationScenario.deleteMany({});
      await localDb.userFeedback.deleteMany({});
      await localDb.auditLog.deleteMany({});
      await localDb.simulationRun.deleteMany({});
      await localDb.projection.deleteMany({});
      await localDb.scenario.deleteMany({});
      await localDb.debt.deleteMany({});
      await localDb.expense.deleteMany({});
      await localDb.asset.deleteMany({});
      await localDb.income.deleteMany({});
      await localDb.user.deleteMany({});
      console.log('✅ Local database cleared\n');
    } catch (clearError) {
      console.log('⚠️  Some tables might not exist yet, continuing...\n');
    }

    // MIGRATE USERS
    console.log('👥 Migrating users...');
    const users = await prodDb.user.findMany();
    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        await localDb.user.create({
          data: {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
            province: user.province,
            maritalStatus: user.maritalStatus,
            includePartner: user.includePartner || false,
            partnerFirstName: user.partnerFirstName,
            partnerLastName: user.partnerLastName,
            partnerDateOfBirth: user.partnerDateOfBirth ? new Date(user.partnerDateOfBirth) : null,
            resetToken: user.resetToken,
            resetTokenExpiry: user.resetTokenExpiry ? new Date(user.resetTokenExpiry) : null,
            emailVerified: user.emailVerified || false,
            emailVerificationToken: user.emailVerificationToken,
            emailVerificationExpiry: user.emailVerificationExpiry ? new Date(user.emailVerificationExpiry) : null,
            verificationEmailSentAt: user.verificationEmailSentAt ? new Date(user.verificationEmailSentAt) : null,
            targetRetirementAge: user.targetRetirementAge,
            lifeExpectancy: user.lifeExpectancy || 95,
            cppCalculatorUsedAt: user.cppCalculatorUsedAt ? new Date(user.cppCalculatorUsedAt) : null,
            oasCalculatorUsedAt: user.oasCalculatorUsedAt ? new Date(user.oasCalculatorUsedAt) : null,
            simulationReadyEmailSentAt: user.simulationReadyEmailSentAt ? new Date(user.simulationReadyEmailSentAt) : null,
            hasSeenWelcome: user.hasSeenWelcome || false,
            userPath: user.userPath,
            onboardingCompleted: user.onboardingCompleted || false,
            onboardingStep: user.onboardingStep,
            completedGuideAt: user.completedGuideAt ? new Date(user.completedGuideAt) : null,
            companyName: user.companyName,
            companyLogo: user.companyLogo,
            role: user.role || 'user',
            subscriptionTier: user.subscriptionTier || 'free',
            subscriptionStatus: user.subscriptionStatus || 'active',
            subscriptionStartDate: user.subscriptionStartDate ? new Date(user.subscriptionStartDate) : null,
            subscriptionEndDate: user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null,
            stripeCustomerId: user.stripeCustomerId,
            stripeSubscriptionId: user.stripeSubscriptionId,
            stripePriceId: user.stripePriceId,
            earlyRetirementCalcsToday: user.earlyRetirementCalcsToday || 0,
            earlyRetirementCalcsDate: user.earlyRetirementCalcsDate ? new Date(user.earlyRetirementCalcsDate) : null,
            simulationRunsToday: user.simulationRunsToday || 0,
            simulationRunsDate: user.simulationRunsDate ? new Date(user.simulationRunsDate) : null,
            freeSimulationsUsed: user.freeSimulationsUsed || 0,
            marketingEmailsEnabled: user.marketingEmailsEnabled !== false,
            feedbackEmailsEnabled: user.feedbackEmailsEnabled !== false,
            unsubscribedAt: user.unsubscribedAt ? new Date(user.unsubscribedAt) : null,
            unsubscribeToken: user.unsubscribeToken,
            deletedAt: user.deletedAt ? new Date(user.deletedAt) : null,
            scheduledDeletionAt: user.scheduledDeletionAt ? new Date(user.scheduledDeletionAt) : null,
            deletionReason: user.deletionReason,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${users.length} users (${failCount} failed)`);
      } catch (err) {
        failCount++;
        console.error(`\n  ⚠️ Failed to migrate user ${user.email}: ${err.message}`);
      }
    }
    console.log(`\n✅ User migration complete: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE INCOMES
    console.log('💰 Migrating income records...');
    const incomes = await prodDb.income.findMany();
    successCount = 0;
    failCount = 0;

    for (const income of incomes) {
      try {
        // Map production fields to local schema
        await localDb.income.create({
          data: {
            id: income.id,
            userId: income.userId,
            name: income.description || 'Income',
            type: income.type || 'other',
            annualAmount: income.amount || 0,
            startAge: income.startAge,
            endAge: income.endAge,
            indexed: income.inflationIndexed !== false,
            indexRate: 2, // Default inflation rate
            notes: income.notes,
            includePartner: income.owner === 'person2',
            partnerAnnualAmount: income.owner === 'person2' ? income.amount : null,
            createdAt: new Date(income.createdAt),
            updatedAt: new Date(income.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${incomes.length} income records (${failCount} failed)`);
      } catch (err) {
        failCount++;
      }
    }
    console.log(`\n✅ Income migration complete: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE ASSETS
    console.log('🏦 Migrating asset records...');
    const assets = await prodDb.asset.findMany();
    successCount = 0;
    failCount = 0;

    for (const asset of assets) {
      try {
        await localDb.asset.create({
          data: {
            id: asset.id,
            userId: asset.userId,
            name: asset.name || asset.description || 'Asset',
            type: asset.type || 'other',
            currentValue: asset.balance || asset.currentValue || 0,
            annualReturn: asset.returnRate || 5,
            contribution: 0,
            contributionFreq: 'monthly',
            notes: asset.notes,
            includePartner: asset.owner === 'person2',
            partnerValue: asset.owner === 'person2' ? (asset.balance || 0) : null,
            createdAt: new Date(asset.createdAt),
            updatedAt: new Date(asset.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${assets.length} asset records (${failCount} failed)`);
      } catch (err) {
        failCount++;
      }
    }
    console.log(`\n✅ Asset migration complete: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE EXPENSES
    console.log('💳 Migrating expense records...');
    const expenses = await prodDb.expense.findMany();
    successCount = 0;
    failCount = 0;

    for (const expense of expenses) {
      try {
        await localDb.expense.create({
          data: {
            id: expense.id,
            userId: expense.userId,
            name: expense.description || 'Expense',
            category: expense.category || 'other',
            annualAmount: expense.amount || 0,
            essential: expense.essential !== false,
            indexed: expense.inflationIndexed !== false,
            indexRate: 2,
            notes: expense.notes,
            startAge: expense.startAge,
            endAge: expense.endAge,
            includePartner: expense.owner === 'person2',
            partnerAmount: expense.owner === 'person2' ? expense.amount : null,
            createdAt: new Date(expense.createdAt),
            updatedAt: new Date(expense.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${expenses.length} expense records (${failCount} failed)`);
      } catch (err) {
        failCount++;
      }
    }
    console.log(`\n✅ Expense migration complete: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE DEBTS
    console.log('📝 Migrating debt records...');
    const debts = await prodDb.debt.findMany();
    successCount = 0;
    failCount = 0;

    for (const debt of debts) {
      try {
        await localDb.debt.create({
          data: {
            id: debt.id,
            userId: debt.userId,
            name: debt.name || debt.description || 'Debt',
            type: debt.type || 'other',
            currentBalance: debt.balance || 0,
            interestRate: debt.interestRate || 0,
            minimumPayment: debt.monthlyPayment || 0,
            remainingYears: debt.remainingYears,
            notes: debt.notes,
            includePartner: debt.owner === 'person2',
            partnerBalance: debt.owner === 'person2' ? (debt.balance || 0) : null,
            createdAt: new Date(debt.createdAt),
            updatedAt: new Date(debt.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${debts.length} debt records (${failCount} failed)`);
      } catch (err) {
        failCount++;
      }
    }
    console.log(`\n✅ Debt migration complete: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE SCENARIOS
    console.log('📊 Migrating scenarios...');
    const scenarios = await prodDb.scenario.findMany();
    successCount = 0;
    failCount = 0;

    for (const scenario of scenarios) {
      try {
        await localDb.scenario.create({
          data: {
            id: scenario.id,
            userId: scenario.userId,
            name: scenario.name || 'Scenario',
            description: scenario.description,
            retirementAge: scenario.retirementAge || 65,
            lifeExpectancy: scenario.lifeExpectancy || 95,
            inflationRate: scenario.inflationRate || 2.5,
            configuration: scenario.configuration || {},
            isActive: scenario.isActive || false,
            createdAt: new Date(scenario.createdAt),
            updatedAt: new Date(scenario.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${scenarios.length} scenarios (${failCount} failed)`);
      } catch (err) {
        failCount++;
      }
    }
    console.log(`\n✅ Scenario migration complete: ${successCount} succeeded, ${failCount} failed\n`);

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('-'.repeat(50));
    console.log(`Total records migrated from production database`);
    console.log('='.repeat(50));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n🎉 Your local database has been seeded with production data!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

// Run the migration
console.log('Starting full migration...\n');
migrateData()
  .then(() => {
    console.log('\n🎉 Full migration finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  });