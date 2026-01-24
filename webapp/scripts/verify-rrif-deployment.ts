/**
 * RRIF Feature Deployment Verification Script
 *
 * This script verifies that the RRIF Early Withdrawal feature has been
 * properly deployed by checking:
 * 1. Component files exist and contain RRIF code
 * 2. Type definitions are present
 * 3. Database schema includes RRIF fields
 * 4. API routes handle RRIF data
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

const results: CheckResult[] = [];

function addResult(name: string, status: 'PASS' | 'FAIL' | 'WARN', details: string) {
  results.push({ name, status, details });
}

function checkFileContains(filePath: string, searchStrings: string[], checkName: string) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      addResult(checkName, 'FAIL', `File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const missingStrings = searchStrings.filter(str => !content.includes(str));

    if (missingStrings.length === 0) {
      addResult(checkName, 'PASS', `All expected strings found in ${filePath}`);
    } else {
      addResult(checkName, 'FAIL', `Missing in ${filePath}: ${missingStrings.join(', ')}`);
    }
  } catch (error) {
    addResult(checkName, 'FAIL', `Error reading ${filePath}: ${error}`);
  }
}

console.log('🔍 RRIF Early Withdrawal Feature - Deployment Verification\n');
console.log('=' .repeat(70));
console.log('\n');

// Check 1: TypeScript Type Definitions
console.log('📋 Checking TypeScript Type Definitions...');
checkFileContains(
  'lib/types/simulation.ts',
  [
    'enable_early_rrif_withdrawal',
    'early_rrif_withdrawal_start_age',
    'early_rrif_withdrawal_end_age',
    'early_rrif_withdrawal_annual',
    'early_rrif_withdrawal_percentage',
    'early_rrif_withdrawal_mode'
  ],
  'Type Definitions'
);

// Check 2: Database Schema
console.log('📋 Checking Database Schema...');
checkFileContains(
  'prisma/schema.prisma',
  [
    'enableEarlyRrifWithdrawal',
    'earlyRrifWithdrawalStartAge',
    'earlyRrifWithdrawalEndAge',
    'earlyRrifWithdrawalAnnual',
    'earlyRrifWithdrawalPercentage',
    'earlyRrifWithdrawalMode'
  ],
  'Prisma Schema'
);

// Check 3: RRIF Control Component
console.log('📋 Checking RRIF Control Component...');
checkFileContains(
  'components/simulation/EarlyRrifWithdrawalControl.tsx',
  [
    'EarlyRrifWithdrawalControl',
    'enable_early_rrif_withdrawal',
    'Fixed Amount',
    'Percentage'
  ],
  'RRIF Control Component'
);

// Check 4: PersonForm Integration
console.log('📋 Checking PersonForm Integration...');
checkFileContains(
  'components/simulation/PersonForm.tsx',
  [
    'EarlyRrifWithdrawalControl',
    'Early RRIF'
  ],
  'PersonForm Integration'
);

// Check 5: ResultsDashboard Premium Features
console.log('📋 Checking ResultsDashboard Premium Features...');
checkFileContains(
  'components/simulation/ResultsDashboard.tsx',
  [
    'isPremium',
    'onUpgradeClick'
  ],
  'ResultsDashboard Premium Props'
);

// Check 6: YearByYearTable Premium Features
console.log('📋 Checking YearByYearTable Premium Features...');
checkFileContains(
  'components/simulation/YearByYearTable.tsx',
  [
    'isPremium',
    'onUpgradeClick',
    'Export CSV'
  ],
  'YearByYearTable Premium Props'
);

// Check 7: Quick-Start Route
console.log('📋 Checking Quick-Start Route...');
checkFileContains(
  'app/api/simulation/quick-start/route.ts',
  [
    'enable_early_rrif_withdrawal',
    'early_rrif_withdrawal_start_age',
    'early_rrif_withdrawal_mode'
  ],
  'Quick-Start Route RRIF Fields'
);

// Check 8: Simulation Page
console.log('📋 Checking Simulation Page...');
checkFileContains(
  'app/(dashboard)/simulation/page.tsx',
  [
    'PersonForm',
    'ResultsDashboard',
    'isPremium'
  ],
  'Simulation Page Integration'
);

// Check 9: UpgradeModal Component
console.log('📋 Checking UpgradeModal Component...');
checkFileContains(
  'components/modals/UpgradeModal.tsx',
  [
    'UpgradeModal',
    'Premium',
    'Feature'
  ],
  'UpgradeModal Component'
);

// Check 10: Verify Git Commits
console.log('📋 Checking Git Commit History...');
const { execSync } = require('child_process');
try {
  const commits = execSync('git log --oneline -10').toString();
  const hasRrifCommit = commits.includes('RRIF') || commits.includes('rrif');

  if (hasRrifCommit) {
    addResult('Git Commits', 'PASS', 'RRIF-related commits found in recent history');
  } else {
    addResult('Git Commits', 'WARN', 'No RRIF commits in last 10 commits (may be older)');
  }
} catch (error) {
  addResult('Git Commits', 'WARN', 'Could not check git history');
}

// Print Results
console.log('\n');
console.log('=' .repeat(70));
console.log('📊 VERIFICATION RESULTS\n');

const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
const warnCount = results.filter(r => r.status === 'WARN').length;

results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${result.name}`);
  console.log(`   ${result.details}\n`);
});

console.log('=' .repeat(70));
console.log('\n📈 SUMMARY\n');
console.log(`   ✅ Passed: ${passCount}`);
console.log(`   ❌ Failed: ${failCount}`);
console.log(`   ⚠️  Warnings: ${warnCount}`);
console.log(`   📊 Total Checks: ${results.length}\n`);

if (failCount === 0) {
  console.log('🎉 SUCCESS! All critical checks passed!');
  console.log('   The RRIF Early Withdrawal feature appears to be fully deployed.\n');

  console.log('📋 Next Steps:');
  console.log('   1. Log in to https://retirezest.com/simulation');
  console.log('   2. Enter RRSP/RRIF balance for a person');
  console.log('   3. Look for "Early RRIF/RRSP Withdrawals" control');
  console.log('   4. Enable it and configure withdrawal settings');
  console.log('   5. Run simulation and verify results\n');
} else {
  console.log('⚠️  ATTENTION: Some checks failed!');
  console.log('   Please review the failed checks above.\n');
  process.exit(1);
}

console.log('=' .repeat(70));
