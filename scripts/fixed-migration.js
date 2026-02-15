const { PrismaClient: ProdClient } = require('../node_modules/.prisma/client-prod');
const { PrismaClient: LocalClient } = require('@prisma/client');

// Initialize clients
const prodDb = new ProdClient();
const localDb = new LocalClient();

async function migrateRelatedData() {
  console.log('🚀 Migrating related data (incomes, assets, expenses, debts, scenarios)...\n');

  try {
    await prodDb.$connect();
    await localDb.$connect();
    console.log('✅ Connected to both databases\n');

    // MIGRATE INCOMES
    console.log('💰 Migrating income records...');
    const incomes = await prodDb.income.findMany();
    let successCount = 0;
    let failCount = 0;

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
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${incomes.length} income records (${failCount} failed)`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) console.error(`\n  ⚠️ Failed income: ${err.message}`);
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
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${assets.length} asset records (${failCount} failed)`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) console.error(`\n  ⚠️ Failed asset: ${err.message}`);
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
            category: expense.category || 'other',
            description: expense.description,
            amount: expense.amount || 0,
            frequency: expense.frequency || 'annual',
            startAge: expense.startAge,
            endAge: expense.endAge,
            owner: expense.owner || 'person1',
            notes: expense.notes,
            essential: expense.essential !== false,
            inflationIndexed: expense.inflationIndexed !== false,
            oneTimeExpenses: expense.oneTimeExpenses || [],
            createdAt: new Date(expense.createdAt),
            updatedAt: new Date(expense.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${expenses.length} expense records (${failCount} failed)`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) console.error(`\n  ⚠️ Failed expense: ${err.message}`);
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
            type: debt.type || 'other',
            name: debt.name || 'Debt',
            description: debt.description,
            balance: debt.balance || 0,
            monthlyPayment: debt.monthlyPayment || 0,
            interestRate: debt.interestRate || 0,
            remainingYears: debt.remainingYears,
            owner: debt.owner || 'person1',
            notes: debt.notes,
            createdAt: new Date(debt.createdAt),
            updatedAt: new Date(debt.updatedAt)
          }
        });
        successCount++;
        process.stdout.write(`\r  ✅ Migrated ${successCount}/${debts.length} debt records (${failCount} failed)`);
      } catch (err) {
        failCount++;
        if (failCount <= 3) console.error(`\n  ⚠️ Failed debt: ${err.message}`);
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
        if (failCount <= 3) console.error(`\n  ⚠️ Failed scenario: ${err.message}`);
      }
    }
    console.log(`\n✅ Scenario migration complete: ${successCount} succeeded, ${failCount} failed\n`);

    // Final count
    const finalCounts = {
      users: await localDb.user.count(),
      incomes: await localDb.income.count(),
      assets: await localDb.asset.count(),
      expenses: await localDb.expense.count(),
      debts: await localDb.debt.count(),
      scenarios: await localDb.scenario.count()
    };

    console.log('\n' + '='.repeat(50));
    console.log('📊 Final Database Summary:');
    console.log('-'.repeat(50));
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    console.log('='.repeat(50));

    console.log('\n✅ All data migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

// Run the migration
console.log('Starting migration of related data...\n');
migrateRelatedData()
  .then(() => {
    console.log('\n🎉 Related data migration finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  });