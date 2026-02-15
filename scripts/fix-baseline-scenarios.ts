/**
 * Fix Baseline Scenarios Migration Script
 *
 * US-047: Fix Baseline Scenario Auto-Population
 *
 * This script fixes existing baseline scenarios that were created with incorrect:
 * 1. User age (used year subtraction instead of proper age calculation)
 * 2. Province (defaulted to ON instead of user's actual province)
 *
 * Affected users: ~75 users with baseline scenarios created via onboarding
 *
 * USAGE:
 *   npx tsx scripts/fix-baseline-scenarios.ts           # Dry run (preview changes)
 *   npx tsx scripts/fix-baseline-scenarios.ts --confirm  # Apply changes
 */

import { PrismaClient } from '@prisma/client';
import { calculateAgeFromDOB } from '../lib/utils/age';

const prisma = new PrismaClient();

interface FixReport {
  userId: string;
  email: string;
  scenarioId: string;
  oldAge: number;
  newAge: number;
  ageDiff: number;
  oldProvince: string;
  newProvince: string;
  provinceChanged: boolean;
}

async function fixBaselineScenarios(confirm: boolean = false) {
  console.log('='.repeat(80));
  console.log('BASELINE SCENARIO MIGRATION - US-047');
  console.log('='.repeat(80));
  console.log('');

  if (!confirm) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Run with --confirm to apply changes');
    console.log('');
  } else {
    console.log('🚨 LIVE MODE - Scenarios WILL be updated!');
    console.log('');
  }

  // Get all users with baseline scenarios
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      dateOfBirth: { not: null },
    },
    select: {
      id: true,
      email: true,
      dateOfBirth: true,
      province: true,
      scenarios: {
        where: {
          isBaseline: true,
        },
        select: {
          id: true,
          currentAge: true,
          province: true,
        },
      },
    },
  });

  const usersWithBaseline = users.filter(u => u.scenarios.length > 0);

  console.log(`Total users with baseline scenarios: ${usersWithBaseline.length}`);
  console.log('');

  // Analyze each baseline scenario
  const fixes: FixReport[] = [];
  const noChangesNeeded: string[] = [];

  for (const user of usersWithBaseline) {
    const scenario = user.scenarios[0]; // Should only be one baseline per user
    const correctAge = calculateAgeFromDOB(user.dateOfBirth!);
    const correctProvince = user.province || 'ON';

    const ageDiff = Math.abs(scenario.currentAge - correctAge);
    const provinceChanged = scenario.province !== correctProvince;

    if (ageDiff > 0 || provinceChanged) {
      fixes.push({
        userId: user.id,
        email: user.email,
        scenarioId: scenario.id,
        oldAge: scenario.currentAge,
        newAge: correctAge,
        ageDiff,
        oldProvince: scenario.province,
        newProvince: correctProvince,
        provinceChanged,
      });
    } else {
      noChangesNeeded.push(user.email);
    }
  }

  console.log('='.repeat(80));
  console.log('ANALYSIS RESULTS');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Users needing fixes: ${fixes.length}`);
  console.log(`Users already correct: ${noChangesNeeded.length}`);
  console.log('');

  if (fixes.length === 0) {
    console.log('✅ All baseline scenarios are already correct!');
    console.log('');
    return;
  }

  // Show fixes by severity
  const criticalFixes = fixes.filter(f => f.ageDiff >= 5); // 5+ years wrong
  const moderateFixes = fixes.filter(f => f.ageDiff >= 2 && f.ageDiff < 5); // 2-4 years wrong
  const minorFixes = fixes.filter(f => f.ageDiff < 2 && f.ageDiff > 0); // 1 year wrong
  const provinceOnlyFixes = fixes.filter(f => f.ageDiff === 0 && f.provinceChanged);

  console.log('FIXES BY SEVERITY:');
  console.log(`  Critical (5+ years wrong): ${criticalFixes.length}`);
  console.log(`  Moderate (2-4 years wrong): ${moderateFixes.length}`);
  console.log(`  Minor (1 year wrong): ${minorFixes.length}`);
  console.log(`  Province only: ${provinceOnlyFixes.length}`);
  console.log('');

  // Show detailed fixes
  console.log('='.repeat(80));
  console.log('DETAILED FIX REPORT');
  console.log('='.repeat(80));
  console.log('');

  if (criticalFixes.length > 0) {
    console.log('--- CRITICAL FIXES (5+ years age difference) ---');
    console.log('');
    criticalFixes.forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.email}`);
      console.log(`   Age: ${fix.oldAge} → ${fix.newAge} (${fix.ageDiff} years difference)`);
      if (fix.provinceChanged) {
        console.log(`   Province: ${fix.oldProvince} → ${fix.newProvince}`);
      }
      console.log(`   Scenario ID: ${fix.scenarioId}`);
      console.log('');
    });
  }

  if (moderateFixes.length > 0) {
    console.log('--- MODERATE FIXES (2-4 years age difference) ---');
    console.log('');
    moderateFixes.forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.email}`);
      console.log(`   Age: ${fix.oldAge} → ${fix.newAge} (${fix.ageDiff} years difference)`);
      if (fix.provinceChanged) {
        console.log(`   Province: ${fix.oldProvince} → ${fix.newProvince}`);
      }
      console.log(`   Scenario ID: ${fix.scenarioId}`);
      console.log('');
    });
  }

  if (minorFixes.length > 0) {
    console.log('--- MINOR FIXES (1 year age difference) ---');
    console.log(`   ${minorFixes.length} users affected (showing first 5)`);
    console.log('');
    minorFixes.slice(0, 5).forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.email} - Age: ${fix.oldAge} → ${fix.newAge}`);
    });
    if (minorFixes.length > 5) {
      console.log(`   ... and ${minorFixes.length - 5} more`);
    }
    console.log('');
  }

  if (provinceOnlyFixes.length > 0) {
    console.log('--- PROVINCE ONLY FIXES ---');
    console.log('');
    provinceOnlyFixes.forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.email}`);
      console.log(`   Province: ${fix.oldProvince} → ${fix.newProvince}`);
      console.log('');
    });
  }

  // If dry run, stop here
  if (!confirm) {
    console.log('='.repeat(80));
    console.log('DRY RUN - No changes made');
    console.log('='.repeat(80));
    console.log('');
    console.log('To apply these fixes, run:');
    console.log('  npx tsx scripts/fix-baseline-scenarios.ts --confirm');
    console.log('');
    return;
  }

  // Apply fixes
  console.log('='.repeat(80));
  console.log('APPLYING FIXES...');
  console.log('='.repeat(80));
  console.log('');

  let successCount = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const fix of fixes) {
    try {
      await prisma.scenario.update({
        where: { id: fix.scenarioId },
        data: {
          currentAge: fix.newAge,
          province: fix.newProvince,
        },
      });
      console.log(`✅ Fixed: ${fix.email}`);
      successCount++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ Failed: ${fix.email} - ${errorMsg}`);
      errors.push({ email: fix.email, error: errorMsg });
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total fixes attempted: ${fixes.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errors.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('ERRORS:');
    errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`));
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('MIGRATION COMPLETE');
  console.log('='.repeat(80));
  console.log('');

  // Return summary
  return {
    total: fixes.length,
    success: successCount,
    failed: errors.length,
    critical: criticalFixes.length,
    moderate: moderateFixes.length,
    minor: minorFixes.length,
    provinceOnly: provinceOnlyFixes.length,
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
const confirm = args.includes('--confirm');

// Run migration
fixBaselineScenarios(confirm)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
