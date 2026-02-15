const { PrismaClient: PrismaClientPG } = require('@prisma/client');
const { PrismaClient: PrismaClientSQLite } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Production PostgreSQL connection
const prodDbUrl = 'postgresql://neondb_owner:npg_KEgfJlvIM27u@ep-muddy-band-adte7s70.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Create Prisma clients for both databases
const prodDb = new PrismaClientPG({
  datasources: {
    db: {
      url: prodDbUrl
    }
  }
});

const localDb = new PrismaClientSQLite({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function migrateData() {
  console.log('🚀 Starting data migration from production to local...\n');

  try {
    // Test connection to production database
    console.log('📡 Connecting to production database...');
    await prodDb.$connect();
    console.log('✅ Connected to production database\n');

    // Test connection to local database
    console.log('📡 Connecting to local database...');
    await localDb.$connect();
    console.log('✅ Connected to local database\n');

    // Get counts from production
    const userCount = await prodDb.user.count();
    console.log(`📊 Found ${userCount} users in production database\n`);

    if (userCount === 0) {
      console.log('⚠️  No users found in production database');
      return;
    }

    // Clear local database
    console.log('🗑️  Clearing local database...');

    // Delete in order of dependencies
    await localDb.simulationRun.deleteMany({});
    await localDb.projection.deleteMany({});
    await localDb.savedSimulationScenario.deleteMany({});
    await localDb.scenario.deleteMany({});
    await localDb.realEstateAsset.deleteMany({});
    await localDb.debt.deleteMany({});
    await localDb.expense.deleteMany({});
    await localDb.asset.deleteMany({});
    await localDb.income.deleteMany({});
    await localDb.userFeedback.deleteMany({});
    await localDb.auditLog.deleteMany({});
    await localDb.user.deleteMany({});
    console.log('✅ Local database cleared\n');

    // Migrate Users
    console.log('👥 Migrating users...');
    const users = await prodDb.user.findMany();
    for (const user of users) {
      await localDb.user.create({
        data: user
      });
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // Migrate Income
    console.log('💰 Migrating income records...');
    const incomes = await prodDb.income.findMany();
    if (incomes.length > 0) {
      for (const income of incomes) {
        await localDb.income.create({
          data: income
        });
      }
      console.log(`✅ Migrated ${incomes.length} income records\n`);
    }

    // Migrate Assets
    console.log('🏦 Migrating asset records...');
    const assets = await prodDb.asset.findMany();
    if (assets.length > 0) {
      for (const asset of assets) {
        await localDb.asset.create({
          data: asset
        });
      }
      console.log(`✅ Migrated ${assets.length} asset records\n`);
    }

    // Migrate Expenses
    console.log('💳 Migrating expense records...');
    const expenses = await prodDb.expense.findMany();
    if (expenses.length > 0) {
      for (const expense of expenses) {
        await localDb.expense.create({
          data: expense
        });
      }
      console.log(`✅ Migrated ${expenses.length} expense records\n`);
    }

    // Migrate Debts
    console.log('📝 Migrating debt records...');
    const debts = await prodDb.debt.findMany();
    if (debts.length > 0) {
      for (const debt of debts) {
        await localDb.debt.create({
          data: debt
        });
      }
      console.log(`✅ Migrated ${debts.length} debt records\n`);
    }

    // Migrate Scenarios
    console.log('📊 Migrating scenarios...');
    const scenarios = await prodDb.scenario.findMany();
    if (scenarios.length > 0) {
      for (const scenario of scenarios) {
        await localDb.scenario.create({
          data: scenario
        });
      }
      console.log(`✅ Migrated ${scenarios.length} scenarios\n`);
    }

    // Migrate Real Estate Assets
    console.log('🏠 Migrating real estate assets...');
    const realEstateAssets = await prodDb.realEstateAsset.findMany();
    if (realEstateAssets.length > 0) {
      for (const asset of realEstateAssets) {
        await localDb.realEstateAsset.create({
          data: asset
        });
      }
      console.log(`✅ Migrated ${realEstateAssets.length} real estate assets\n`);
    }

    // Migrate Saved Simulation Scenarios
    console.log('💾 Migrating saved simulation scenarios...');
    const savedScenarios = await prodDb.savedSimulationScenario.findMany();
    if (savedScenarios.length > 0) {
      for (const savedScenario of savedScenarios) {
        await localDb.savedSimulationScenario.create({
          data: savedScenario
        });
      }
      console.log(`✅ Migrated ${savedScenarios.length} saved simulation scenarios\n`);
    }

    // Migrate User Feedback
    console.log('💬 Migrating user feedback...');
    const feedback = await prodDb.userFeedback.findMany();
    if (feedback.length > 0) {
      for (const fb of feedback) {
        await localDb.userFeedback.create({
          data: fb
        });
      }
      console.log(`✅ Migrated ${feedback.length} feedback records\n`);
    }

    // Final summary
    console.log('=' * 50);
    console.log('📊 Migration Summary:');
    console.log('-' * 50);
    console.log(`Users: ${users.length}`);
    console.log(`Income records: ${incomes.length}`);
    console.log(`Assets: ${assets.length}`);
    console.log(`Expenses: ${expenses.length}`);
    console.log(`Debts: ${debts.length}`);
    console.log(`Scenarios: ${scenarios.length}`);
    console.log(`Real Estate Assets: ${realEstateAssets.length}`);
    console.log(`Saved Simulations: ${savedScenarios.length}`);
    console.log(`User Feedback: ${feedback.length}`);
    console.log('=' * 50);

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
migrateData().catch(console.error);