/**
 * Data Migration Script: Move CPP/OAS/Pension data from Scenario table to Income table
 *
 * Purpose: Before removing cppStartAge, oasStartAge, pensionIncome from Scenario model,
 * this script migrates the data to Income table to preserve user configurations.
 *
 * Run with:
 * DATABASE_URL="..." npx ts-node scripts/migrate-scenario-income-to-income-table.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  totalUsers: number;
  usersProcessed: number;
  cppIncomeCreated: number;
  oasIncomeCreated: number;
  pensionIncomeCreated: number;
  skippedDueToExistingIncome: number;
  errors: string[];
}

async function migrateScenarioIncomeToIncomeTable() {
  console.log('🚀 Starting data migration: Scenario → Income table');
  console.log('='.repeat(80));

  const stats: MigrationStats = {
    totalUsers: 0,
    usersProcessed: 0,
    cppIncomeCreated: 0,
    oasIncomeCreated: 0,
    pensionIncomeCreated: 0,
    skippedDueToExistingIncome: 0,
    errors: [],
  };

  try {
    // Find all users with baseline scenarios containing income data
    const scenarios = await prisma.scenario.findMany({
      where: {
        isBaseline: true,
        OR: [
          { cppStartAge: { not: 65 } },  // Non-default CPP start age
          { oasStartAge: { not: 65 } },  // Non-default OAS start age
          { pensionIncome: { not: 0 } }, // Has pension income
        ],
      },
      select: {
        id: true,
        userId: true,
        cppStartAge: true,
        oasStartAge: true,
        pensionIncome: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    stats.totalUsers = scenarios.length;

    console.log(`\n📊 Found ${scenarios.length} baseline scenarios with income data\n`);

    for (const scenario of scenarios) {
      try {
        console.log(`\n👤 Processing user: ${scenario.userId}`);
        console.log(`   Scenario created: ${scenario.createdAt.toISOString()}`);
        console.log(`   CPP start age: ${scenario.cppStartAge}`);
        console.log(`   OAS start age: ${scenario.oasStartAge}`);
        console.log(`   Pension income: $${scenario.pensionIncome}/year`);

        // Check if user already has Income records
        const existingCppIncome = await prisma.income.findFirst({
          where: { userId: scenario.userId, type: 'cpp' },
        });

        const existingOasIncome = await prisma.income.findFirst({
          where: { userId: scenario.userId, type: 'oas' },
        });

        const existingPensionIncome = await prisma.income.findFirst({
          where: { userId: scenario.userId, type: 'pension' },
        });

        // Migrate CPP start age
        if (!existingCppIncome && scenario.cppStartAge !== 65) {
          console.log(`   ✅ Creating CPP income record (start age: ${scenario.cppStartAge})`);

          await prisma.income.create({
            data: {
              userId: scenario.userId,
              type: 'cpp',
              description: 'Canada Pension Plan',
              amount: 0, // Will be calculated by CPP calculator
              frequency: 'monthly',
              startAge: scenario.cppStartAge,
              owner: 'person1',
              isTaxable: true,
              inflationIndexed: true,
            },
          });

          stats.cppIncomeCreated++;
        } else if (existingCppIncome) {
          console.log(`   ⏭️  CPP income already exists, skipping`);
          stats.skippedDueToExistingIncome++;
        }

        // Migrate OAS start age
        if (!existingOasIncome && scenario.oasStartAge !== 65) {
          console.log(`   ✅ Creating OAS income record (start age: ${scenario.oasStartAge})`);

          await prisma.income.create({
            data: {
              userId: scenario.userId,
              type: 'oas',
              description: 'Old Age Security',
              amount: 0, // Will be calculated by OAS calculator
              frequency: 'monthly',
              startAge: scenario.oasStartAge,
              owner: 'person1',
              isTaxable: true,
              inflationIndexed: true,
            },
          });

          stats.oasIncomeCreated++;
        } else if (existingOasIncome) {
          console.log(`   ⏭️  OAS income already exists, skipping`);
          stats.skippedDueToExistingIncome++;
        }

        // Migrate pension income
        if (!existingPensionIncome && scenario.pensionIncome > 0) {
          // Convert annual to monthly
          const monthlyAmount = scenario.pensionIncome / 12;

          console.log(`   ✅ Creating pension income record ($${monthlyAmount}/month)`);

          await prisma.income.create({
            data: {
              userId: scenario.userId,
              type: 'pension',
              description: 'Employer Pension',
              amount: monthlyAmount,
              frequency: 'monthly',
              startAge: 65, // Default assumption (no startAge in old Scenario model)
              owner: 'person1',
              isTaxable: true,
              inflationIndexed: true, // Default to true for most pensions
            },
          });

          stats.pensionIncomeCreated++;
        } else if (existingPensionIncome) {
          console.log(`   ⏭️  Pension income already exists, skipping`);
          stats.skippedDueToExistingIncome++;
        }

        stats.usersProcessed++;

      } catch (error) {
        const errorMsg = `Error processing user ${scenario.userId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    // Print summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total baseline scenarios found:     ${stats.totalUsers}`);
    console.log(`Users processed successfully:       ${stats.usersProcessed}`);
    console.log(`CPP income records created:         ${stats.cppIncomeCreated}`);
    console.log(`OAS income records created:         ${stats.oasIncomeCreated}`);
    console.log(`Pension income records created:     ${stats.pensionIncomeCreated}`);
    console.log(`Skipped (existing Income):          ${stats.skippedDueToExistingIncome}`);
    console.log(`Errors:                             ${stats.errors.length}`);
    console.log('='.repeat(80));

    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:\n');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (stats.usersProcessed === stats.totalUsers && stats.errors.length === 0) {
      console.log('\n✅ Migration completed successfully!\n');
      console.log('Next steps:');
      console.log('1. Review the migration results above');
      console.log('2. Run: DATABASE_URL="..." npx prisma db push --accept-data-loss');
      console.log('3. This will remove cppStartAge, oasStartAge, pensionIncome from Scenario table');
      console.log('4. Test simulations to verify they now use Income table');
    } else {
      console.log('\n⚠️  Migration completed with errors. Review above before proceeding.\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateScenarioIncomeToIncomeTable()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
