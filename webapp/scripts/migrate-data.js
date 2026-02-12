const { PrismaClient: ProdClient } = require('../node_modules/.prisma/client-prod');
const { PrismaClient: LocalClient } = require('@prisma/client');

// Initialize clients
const prodDb = new ProdClient();
const localDb = new LocalClient();

async function migrateData() {
  console.log('🚀 Starting data migration from production to local...\n');

  try {
    // Connect to databases
    console.log('📡 Connecting to databases...');
    await prodDb.$connect();
    await localDb.$connect();
    console.log('✅ Connected to both databases\n');

    // Get user count
    const userCount = await prodDb.user.count();
    console.log(`📊 Found ${userCount} users in production database\n`);

    if (userCount === 0) {
      console.log('⚠️  No users found in production database');
      return;
    }

    // Ask for confirmation
    console.log('⚠️  WARNING: This will DELETE all data in your local database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

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

    // Migrate Users
    console.log('👥 Migrating users...');
    const users = await prodDb.user.findMany();
    let migratedUserCount = 0;
    for (const user of users) {
      try {
        // Convert DateTime fields and handle type mismatches
        const userData = {
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
          // Convert emailVerified DateTime to Boolean for local schema
          emailVerified: user.emailVerified ? (user.emailVerified instanceof Date ? user.emailVerified.getTime() > 0 : new Date(user.emailVerified).getTime() > 0) : false,
          emailVerificationToken: user.emailVerificationToken,
          emailVerificationExpiry: user.emailVerificationExpiry ? new Date(user.emailVerificationExpiry) : null,
          verificationEmailSentAt: user.verificationEmailSentAt ? new Date(user.verificationEmailSentAt) : null,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          stripePrice: user.stripePriceId,
          stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd ? new Date(user.stripeCurrentPeriodEnd) : null,
          subscription: user.subscriptionTier || 'free',
          freeSimulationsUsed: user.freeSimulationsUsed || 0,
          lastFreeSimulationReset: user.lastFreeSimulationReset ? new Date(user.lastFreeSimulationReset) : new Date(),
          dailySimulationCount: user.simulationRunsToday || 0,
          lastSimulationDate: user.simulationRunsDate ? new Date(user.simulationRunsDate) : null,
          lifetimeSimulationCount: 0, // Not available in production
          acceptedTerms: user.acceptedTermsAt ? true : false,
          acceptedPrivacy: user.acceptedTermsAt ? true : false,
          acceptedTermsAt: user.acceptedTermsAt ? new Date(user.acceptedTermsAt) : null,
          emailNewsletters: user.marketingEmailsEnabled !== false,
          emailReports: true,
          emailReminders: true,
          emailSupport: user.feedbackEmailsEnabled !== false,
          reportShowAssumptions: true,
          reportShowAlerts: true,
          reportShowCharts: true,
          reportDateFormat: 'MMM dd, yyyy',
          // Add missing fields from production schema
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
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        };

        await localDb.user.create({ data: userData });
        migratedUserCount++;
      } catch (err) {
        console.error(`  ⚠️ Failed to migrate user ${user.email}:`, err.message);
      }
    }
    console.log(`✅ Migrated ${migratedUserCount}/${users.length} users\n`);

    // Migrate Income records
    console.log('💰 Migrating income records...');
    const incomes = await prodDb.income.findMany();
    let incomeCount = 0;
    for (const income of incomes) {
      try {
        const incomeData = {
          ...income,
          createdAt: new Date(income.createdAt),
          updatedAt: new Date(income.updatedAt)
        };
        await localDb.income.create({ data: incomeData });
        incomeCount++;
      } catch (err) {
        console.error(`  ⚠️ Failed to migrate income:`, err.message);
      }
    }
    console.log(`✅ Migrated ${incomeCount}/${incomes.length} income records\n`);

    // Migrate Assets
    console.log('🏦 Migrating asset records...');
    const assets = await prodDb.asset.findMany();
    let assetCount = 0;
    for (const asset of assets) {
      try {
        const assetData = {
          ...asset,
          createdAt: new Date(asset.createdAt),
          updatedAt: new Date(asset.updatedAt)
        };
        await localDb.asset.create({ data: assetData });
        assetCount++;
      } catch (err) {
        console.error(`  ⚠️ Failed to migrate asset:`, err.message);
      }
    }
    console.log(`✅ Migrated ${assetCount}/${assets.length} asset records\n`);

    // Migrate Expenses
    console.log('💳 Migrating expense records...');
    const expenses = await prodDb.expense.findMany();
    let expenseCount = 0;
    for (const expense of expenses) {
      try {
        const expenseData = {
          ...expense,
          createdAt: new Date(expense.createdAt),
          updatedAt: new Date(expense.updatedAt)
        };
        await localDb.expense.create({ data: expenseData });
        expenseCount++;
      } catch (err) {
        console.error(`  ⚠️ Failed to migrate expense:`, err.message);
      }
    }
    console.log(`✅ Migrated ${expenseCount}/${expenses.length} expense records\n`);

    // Migrate Debts
    console.log('📝 Migrating debt records...');
    const debts = await prodDb.debt.findMany();
    let debtCount = 0;
    for (const debt of debts) {
      try {
        const debtData = {
          ...debt,
          createdAt: new Date(debt.createdAt),
          updatedAt: new Date(debt.updatedAt)
        };
        await localDb.debt.create({ data: debtData });
        debtCount++;
      } catch (err) {
        console.error(`  ⚠️ Failed to migrate debt:`, err.message);
      }
    }
    console.log(`✅ Migrated ${debtCount}/${debts.length} debt records\n`);

    // Migrate Scenarios
    console.log('📊 Migrating scenarios...');
    const scenarios = await prodDb.scenario.findMany();
    let scenarioCount = 0;
    for (const scenario of scenarios) {
      try {
        const scenarioData = {
          ...scenario,
          createdAt: new Date(scenario.createdAt),
          updatedAt: new Date(scenario.updatedAt)
        };
        await localDb.scenario.create({ data: scenarioData });
        scenarioCount++;
      } catch (err) {
        console.error(`  ⚠️ Failed to migrate scenario:`, err.message);
      }
    }
    console.log(`✅ Migrated ${scenarioCount}/${scenarios.length} scenarios\n`);

    // Final summary
    console.log('='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('-'.repeat(50));
    console.log(`Users: ${migratedUserCount}/${users.length}`);
    console.log(`Income records: ${incomeCount}/${incomes.length}`);
    console.log(`Assets: ${assetCount}/${assets.length}`);
    console.log(`Expenses: ${expenseCount}/${expenses.length}`);
    console.log(`Debts: ${debtCount}/${debts.length}`);
    console.log(`Scenarios: ${scenarioCount}/${scenarios.length}`);
    console.log('='.repeat(50));

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

// Run the migration
console.log('Starting migration script...\n');
migrateData()
  .then(() => {
    console.log('\n🎉 Data migration finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  });