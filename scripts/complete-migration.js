const { PrismaClient: ProdClient } = require('../node_modules/.prisma/client-prod');
const { PrismaClient: LocalClient } = require('@prisma/client');

// Initialize clients
const prodDb = new ProdClient();
const localDb = new LocalClient();

async function migrateAllData() {
  console.log('🚀 Starting complete data migration from production to local...\n');

  try {
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
    console.log('='.repeat(50));
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    console.log('='.repeat(50) + '\n');

    // Clear local database
    console.log('🗑️  Clearing local database...');
    await localDb.scenario.deleteMany({});
    await localDb.debt.deleteMany({});
    await localDb.expense.deleteMany({});
    await localDb.asset.deleteMany({});
    await localDb.income.deleteMany({});
    await localDb.user.deleteMany({});
    console.log('✅ Local database cleared\n');

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
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${users.length} users`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) {
          console.error(`\n  ⚠️ Failed user ${user.email}: ${err.message}`);
        }
      }
    }
    console.log(`\n✅ User migration: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE INCOMES (using correct field names from fixed-migration.js)
    console.log('💰 Migrating income records...');
    const incomes = await prodDb.income.findMany();
    successCount = 0;
    failCount = 0;

    for (const income of incomes) {
      try {
        await localDb.income.create({
          data: {
            id: income.id,
            userId: income.userId,
            type: income.type || 'other',
            description: income.description,
            amount: income.amount || 0,
            frequency: income.frequency || 'annual',
            startAge: income.startAge,
            endAge: income.endAge,
            owner: income.owner || 'person1',
            notes: income.notes,
            isTaxable: income.isTaxable !== false,
            inflationIndexed: income.inflationIndexed !== false,
            createdAt: new Date(income.createdAt),
            updatedAt: new Date(income.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${incomes.length} income records`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) {
          console.error(`\n  ⚠️ Failed income: ${err.message}`);
        }
      }
    }
    console.log(`\n✅ Income migration: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE ASSETS (using correct field names from fixed-migration.js)
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
            type: asset.type || 'other',
            name: asset.name || 'Asset',
            description: asset.description,
            balance: asset.balance || 0,
            currentValue: asset.currentValue,
            contributionRoom: asset.contributionRoom,
            returnRate: asset.returnRate,
            owner: asset.owner || 'person1',
            notes: asset.notes,
            enableEarlyRrifWithdrawal: asset.enableEarlyRrifWithdrawal || false,
            earlyRrifMode: asset.earlyRrifMode,
            earlyRrifStartAge: asset.earlyRrifStartAge,
            earlyRrifEndAge: asset.earlyRrifEndAge,
            earlyRrifAnnualAmount: asset.earlyRrifAnnualAmount,
            earlyRrifPercentage: asset.earlyRrifPercentage,
            gicMaturityDate: asset.gicMaturityDate ? new Date(asset.gicMaturityDate) : null,
            gicTermMonths: asset.gicTermMonths,
            gicInterestRate: asset.gicInterestRate,
            gicCompoundingFrequency: asset.gicCompoundingFrequency,
            gicReinvestStrategy: asset.gicReinvestStrategy,
            gicIssuer: asset.gicIssuer,
            createdAt: new Date(asset.createdAt),
            updatedAt: new Date(asset.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${assets.length} asset records`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) {
          console.error(`\n  ⚠️ Failed asset: ${err.message}`);
        }
      }
    }
    console.log(`\n✅ Asset migration: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE EXPENSES (using fields that exist in both schemas)
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
            category: expense.category || 'other',
            description: expense.description,
            amount: expense.amount || 0,
            frequency: expense.frequency || 'annual',
            notes: expense.notes,
            essential: expense.essential !== false,
            isEssential: expense.isEssential,
            isRecurring: expense.isRecurring !== false,
            plannedYear: expense.plannedYear,
            createdAt: new Date(expense.createdAt),
            updatedAt: new Date(expense.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${expenses.length} expense records`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) {
          console.error(`\n  ⚠️ Failed expense: ${err.message}`);
        }
      }
    }
    console.log(`\n✅ Expense migration: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE DEBTS (using fields that exist in both schemas)
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
            type: debt.type || 'other',
            creditor: debt.creditor || 'Unknown',
            description: debt.description,
            balance: debt.balance || debt.currentBalance || 0,
            currentBalance: debt.currentBalance,
            minimumPayment: debt.minimumPayment || debt.monthlyPayment || 0,
            monthlyPayment: debt.monthlyPayment,
            interestRate: debt.interestRate || 0,
            paymentFrequency: debt.paymentFrequency || 'monthly',
            notes: debt.notes,
            createdAt: new Date(debt.createdAt),
            updatedAt: new Date(debt.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${debts.length} debt records`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) {
          console.error(`\n  ⚠️ Failed debt: ${err.message}`);
        }
      }
    }
    console.log(`\n✅ Debt migration: ${successCount} succeeded, ${failCount} failed\n`);

    // MIGRATE SCENARIOS (using all fields from production schema)
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
            currentAge: scenario.currentAge || 30,
            retirementAge: scenario.retirementAge || 65,
            lifeExpectancy: scenario.lifeExpectancy || 95,
            province: scenario.province || 'ON',
            rrspBalance: scenario.rrspBalance || 0,
            tfsaBalance: scenario.tfsaBalance || 0,
            nonRegBalance: scenario.nonRegBalance || 0,
            liraBalance: scenario.liraBalance || 0,
            realEstateValue: scenario.realEstateValue || 0,
            employmentIncome: scenario.employmentIncome || 0,
            pensionIncome: scenario.pensionIncome || 0,
            rentalIncome: scenario.rentalIncome || 0,
            otherIncome: scenario.otherIncome || 0,
            cppStartAge: scenario.cppStartAge || 65,
            oasStartAge: scenario.oasStartAge || 65,
            averageCareerIncome: scenario.averageCareerIncome || 0,
            yearsOfCPPContributions: scenario.yearsOfCPPContributions || 40,
            yearsInCanada: scenario.yearsInCanada || 40,
            annualExpenses: scenario.annualExpenses || 50000,
            expenseInflationRate: scenario.expenseInflationRate || 2.0,
            investmentReturnRate: scenario.investmentReturnRate || 5.0,
            inflationRate: scenario.inflationRate || 2.0,
            rrspToRrifAge: scenario.rrspToRrifAge || 71,
            withdrawalStrategy: scenario.withdrawalStrategy || 'RRIF->Corp->NonReg->TFSA',
            projectionResults: scenario.projectionResults,
            isBaseline: scenario.isBaseline || false,
            createdAt: new Date(scenario.createdAt),
            updatedAt: new Date(scenario.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${scenarios.length} scenarios`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) {
          console.error(`\n  ⚠️ Failed scenario: ${err.message}`);
        }
      }
    }
    console.log(`\n✅ Scenario migration: ${successCount} succeeded, ${failCount} failed\n`);

    // Final verification
    const finalCounts = {
      users: await localDb.user.count(),
      incomes: await localDb.income.count(),
      assets: await localDb.asset.count(),
      expenses: await localDb.expense.count(),
      debts: await localDb.debt.count(),
      scenarios: await localDb.scenario.count()
    };

    console.log('\n' + '='.repeat(50));
    console.log('📊 Final Migration Summary:');
    console.log('-'.repeat(50));
    console.log('Production → Local:');
    Object.entries(counts).forEach(([table, prodCount]) => {
      const localCount = finalCounts[table];
      const status = prodCount === localCount ? '✅' : '⚠️';
      console.log(`  ${status} ${table}: ${prodCount} → ${localCount}`);
    });
    console.log('='.repeat(50));

    const totalProd = Object.values(counts).reduce((a, b) => a + b, 0);
    const totalLocal = Object.values(finalCounts).reduce((a, b) => a + b, 0);
    console.log(`\n📈 Total records: ${totalProd} → ${totalLocal}`);

    if (totalProd === totalLocal) {
      console.log('\n🎉 Perfect migration! All records transferred successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${totalProd - totalLocal} missing records.`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

// Run the migration
console.log('🚀 Complete Migration Script v1.0');
console.log('This script will migrate ALL data from production to local database.');
console.log('Using field mappings from fixed-migration.js\n');

migrateAllData()
  .then(() => {
    console.log('\n✅ Migration completed!');
    console.log('\n📌 Next steps:');
    console.log('  1. Visit http://localhost:5555 to browse your data in Prisma Studio');
    console.log('  2. Visit http://localhost:3001 to use the application with migrated data');
    console.log('  3. Test login with one of the migrated user accounts\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  });