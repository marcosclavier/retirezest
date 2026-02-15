/**
 * Migration Script: Scenario CPP/OAS → IncomeSource Table
 *
 * Purpose: Migrate CPP/OAS data from Scenario table to IncomeSource table
 * to establish IncomeSource as single source of truth.
 *
 * Background:
 * - Users configure CPP/OAS via Scenario.cppStartAge / oasStartAge (e.g., in wizard)
 * - Prefill API only reads from IncomeSource table, ignoring Scenario
 * - Result: Users lose configured CPP/OAS start ages (Bug #1)
 *
 * This migration:
 * 1. Finds users with Scenario.cppStartAge but NO IncomeSource CPP record
 * 2. Creates IncomeSource records from Scenario data
 * 3. Same for OAS
 * 4. Preserves all existing data (no deletions)
 *
 * Run modes:
 * - DRY_RUN=true (default): Report only, no database writes
 * - DRY_RUN=false: Execute migration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry run
const DEFAULT_CPP_AMOUNT = 16000; // Average CPP at age 65 (2026)
const DEFAULT_OAS_AMOUNT = 7500;  // Average OAS at age 65 (2026)

interface MigrationStats {
  totalUsers: number;
  usersWithScenarioCPP: number;
  usersWithScenarioOAS: number;
  usersNeedingCPPMigration: number;
  usersNeedingOASMigration: number;
  cppRecordsCreated: number;
  oasRecordsCreated: number;
  errors: number;
}

async function migrateCPPOASData() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO CPP/OAS → INCOMESOURCE MIGRATION');
  console.log('='.repeat(80));
  console.log(`\nMode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE RUN (will modify database)'}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  const stats: MigrationStats = {
    totalUsers: 0,
    usersWithScenarioCPP: 0,
    usersWithScenarioOAS: 0,
    usersNeedingCPPMigration: 0,
    usersNeedingOASMigration: 0,
    cppRecordsCreated: 0,
    oasRecordsCreated: 0,
    errors: 0,
  };

  try {
    // Step 1: Get all users with scenarios
    console.log('📊 Step 1: Analyzing users and scenarios...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    stats.totalUsers = users.length;
    console.log(`   Found ${stats.totalUsers} total users\n`);

    // Step 2: For each user, check Scenario and IncomeSource
    console.log('📊 Step 2: Checking for CPP/OAS migration needs...\n');

    for (const user of users) {
      try {
        // Get user's scenario (use first/baseline scenario)
        const scenario = await prisma.scenario.findFirst({
          where: { userId: user.id },
          select: {
            id: true,
            name: true,
            cppStartAge: true,
            oasStartAge: true,
          },
          orderBy: { createdAt: 'asc' }, // Get earliest/baseline scenario
        });

        if (!scenario) {
          continue; // User has no scenario
        }

        // Check if user has configured CPP/OAS in Scenario
        const hasCPPInScenario = scenario.cppStartAge && scenario.cppStartAge !== 65; // Non-default value
        const hasOASInScenario = scenario.oasStartAge && scenario.oasStartAge !== 65; // Non-default value

        if (hasCPPInScenario) stats.usersWithScenarioCPP++;
        if (hasOASInScenario) stats.usersWithScenarioOAS++;

        // Check if user already has CPP/OAS in IncomeSource
        const existingCPP = await prisma.incomeSource.findFirst({
          where: {
            userId: user.id,
            type: 'cpp',
          },
        });

        const existingOAS = await prisma.incomeSource.findFirst({
          where: {
            userId: user.id,
            type: 'oas',
          },
        });

        // Determine what needs migration
        const needsCPPMigration = scenario.cppStartAge && !existingCPP;
        const needsOASMigration = scenario.oasStartAge && !existingOAS;

        if (needsCPPMigration) stats.usersNeedingCPPMigration++;
        if (needsOASMigration) stats.usersNeedingOASMigration++;

        // Perform migration (or report in dry run)
        if (needsCPPMigration) {
          const cppData = {
            userId: user.id,
            type: 'cpp',
            description: 'Canada Pension Plan',
            amount: DEFAULT_CPP_AMOUNT,
            frequency: 'annual',
            startAge: scenario.cppStartAge,
            owner: 'person1',
            notes: `Migrated from Scenario.cppStartAge on ${new Date().toISOString().split('T')[0]}`,
            isTaxable: true,
            inflationIndexed: true,
          };

          if (DRY_RUN) {
            console.log(`   [DRY RUN] Would create CPP IncomeSource for ${user.email}`);
            console.log(`             - Start Age: ${scenario.cppStartAge}`);
            console.log(`             - Amount: $${DEFAULT_CPP_AMOUNT}/year`);
          } else {
            await prisma.incomeSource.create({ data: cppData });
            stats.cppRecordsCreated++;
            console.log(`   ✅ Created CPP IncomeSource for ${user.email} (age ${scenario.cppStartAge})`);
          }
        }

        if (needsOASMigration) {
          const oasData = {
            userId: user.id,
            type: 'oas',
            description: 'Old Age Security',
            amount: DEFAULT_OAS_AMOUNT,
            frequency: 'annual',
            startAge: scenario.oasStartAge,
            owner: 'person1',
            notes: `Migrated from Scenario.oasStartAge on ${new Date().toISOString().split('T')[0]}`,
            isTaxable: true,
            inflationIndexed: true,
          };

          if (DRY_RUN) {
            console.log(`   [DRY RUN] Would create OAS IncomeSource for ${user.email}`);
            console.log(`             - Start Age: ${scenario.oasStartAge}`);
            console.log(`             - Amount: $${DEFAULT_OAS_AMOUNT}/year`);
          } else {
            await prisma.incomeSource.create({ data: oasData });
            stats.oasRecordsCreated++;
            console.log(`   ✅ Created OAS IncomeSource for ${user.email} (age ${scenario.oasStartAge})`);
          }
        }

      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error processing user ${user.email}:`, error);
      }
    }

    // Step 3: Print summary report
    console.log('\n' + '='.repeat(80));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log('📊 User Statistics:');
    console.log(`   Total users: ${stats.totalUsers}`);
    console.log(`   Users with Scenario CPP configured: ${stats.usersWithScenarioCPP}`);
    console.log(`   Users with Scenario OAS configured: ${stats.usersWithScenarioOAS}\n`);

    console.log('🔍 Migration Needs:');
    console.log(`   Users needing CPP migration: ${stats.usersNeedingCPPMigration}`);
    console.log(`   Users needing OAS migration: ${stats.usersNeedingOASMigration}\n`);

    if (DRY_RUN) {
      console.log('📋 Dry Run Results:');
      console.log(`   Would create ${stats.usersNeedingCPPMigration} CPP IncomeSource records`);
      console.log(`   Would create ${stats.usersNeedingOASMigration} OAS IncomeSource records\n`);
      console.log('ℹ️  To execute this migration, run:');
      console.log('   DRY_RUN=false npm run migrate:cpp-oas\n');
    } else {
      console.log('✅ Migration Results:');
      console.log(`   CPP records created: ${stats.cppRecordsCreated}`);
      console.log(`   OAS records created: ${stats.oasRecordsCreated}`);
      console.log(`   Errors: ${stats.errors}\n`);

      if (stats.errors === 0) {
        console.log('🎉 Migration completed successfully!\n');
      } else {
        console.log(`⚠️  Migration completed with ${stats.errors} error(s). Review logs above.\n`);
      }
    }

    // Step 4: Verification query suggestions
    console.log('='.repeat(80));
    console.log('VERIFICATION QUERIES');
    console.log('='.repeat(80) + '\n');

    console.log('Run these queries to verify migration:\n');
    console.log('1. Check users still missing CPP in IncomeSource:');
    console.log(`   SELECT u.email, s.cppStartAge`);
    console.log(`   FROM "User" u`);
    console.log(`   JOIN "Scenario" s ON s."userId" = u.id`);
    console.log(`   WHERE s."cppStartAge" IS NOT NULL`);
    console.log(`   AND NOT EXISTS (`);
    console.log(`     SELECT 1 FROM "IncomeSource" i`);
    console.log(`     WHERE i."userId" = u.id AND i.type = 'cpp'`);
    console.log(`   );\n`);

    console.log('2. Verify migrated CPP records:');
    console.log(`   SELECT u.email, i."startAge", i.amount, i.notes`);
    console.log(`   FROM "IncomeSource" i`);
    console.log(`   JOIN "User" u ON u.id = i."userId"`);
    console.log(`   WHERE i.type = 'cpp'`);
    console.log(`   AND i.notes LIKE '%Migrated from Scenario%';\n`);

    console.log('3. Count total CPP/OAS records:');
    console.log(`   SELECT type, COUNT(*) as count`);
    console.log(`   FROM "IncomeSource"`);
    console.log(`   WHERE type IN ('cpp', 'oas')`);
    console.log(`   GROUP BY type;\n`);

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

// Execute migration
migrateCPPOASData()
  .then((stats) => {
    console.log('✅ Migration script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
