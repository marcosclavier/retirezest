/**
 * Automated Test Script for Deleted Users Fixes
 * Tests all 4 fixes implemented based on DELETED_USERS_ANALYSIS.md
 *
 * Run with: node test_deleted_users_fixes.js
 */

const fs = require('fs');
const path = require('path');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function testResult(name, passed, details) {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    results.failed++;
    console.log(`❌ FAIL: ${name}`);
    console.log(`   ${details}`);
  }
}

console.log('🧪 Testing Deleted Users Fixes Implementation\n');
console.log('=' .repeat(80));

// ============================================================================
// Fix #1: Make Deletion Reason Required
// ============================================================================
console.log('\n📋 Fix #1: Deletion Reason Required Field');
console.log('-'.repeat(80));

try {
  const deleteModalPath = path.join(__dirname, 'components/account/DeleteAccountModal.tsx');
  const deleteModalContent = fs.readFileSync(deleteModalPath, 'utf8');

  // Test 1.1: Check validation exists
  const hasValidation = deleteModalContent.includes("if (!reason || reason.trim().length === 0)");
  testResult(
    'Fix #1.1: Validation for empty reason',
    hasValidation,
    hasValidation ? 'Validation found' : 'Validation not found in DeleteAccountModal.tsx'
  );

  // Test 1.2: Check error message
  const hasErrorMsg = deleteModalContent.includes("Please tell us why you") ||
                     deleteModalContent.includes("Please tell us why you're leaving");
  testResult(
    'Fix #1.2: Helpful error message',
    hasErrorMsg,
    hasErrorMsg ? 'Error message found' : 'Error message not found'
  );

  // Test 1.3: Check label shows required
  const hasRequiredLabel = deleteModalContent.includes('Why are you leaving?') &&
                          deleteModalContent.includes('<span className="text-red-600">*</span>');
  testResult(
    'Fix #1.3: Label shows required asterisk',
    hasRequiredLabel,
    hasRequiredLabel ? 'Required asterisk found' : 'Required indicator not found'
  );

  // Test 1.4: Check textarea has required attribute
  const hasRequiredAttr = deleteModalContent.includes('required');
  testResult(
    'Fix #1.4: Textarea has required attribute',
    hasRequiredAttr,
    hasRequiredAttr ? 'Required attribute found' : 'Required attribute not found'
  );

} catch (error) {
  testResult('Fix #1: Read DeleteAccountModal.tsx', false, error.message);
}

// ============================================================================
// Fix #2: Partner Removal UX Improvements
// ============================================================================
console.log('\n👫 Fix #2: Partner Removal UX');
console.log('-'.repeat(80));

try {
  const settingsPath = path.join(__dirname, 'app/(dashboard)/profile/settings/page.tsx');
  const settingsContent = fs.readFileSync(settingsPath, 'utf8');

  // Test 2.1: Check dynamic label with emojis
  const hasDynamicLabel = settingsContent.includes('👫 Couples Planning Active') &&
                         settingsContent.includes('👤 Single Person Planning');
  testResult(
    'Fix #2.1: Dynamic label with emojis',
    hasDynamicLabel,
    hasDynamicLabel ? 'Dynamic labels found' : 'Dynamic labels not found'
  );

  // Test 2.2: Check contextual help text
  const hasContextHelp = settingsContent.includes('Turn off to switch to single person retirement planning') &&
                        settingsContent.includes('Turn on to plan retirement with a partner or spouse');
  testResult(
    'Fix #2.2: Contextual help text',
    hasContextHelp,
    hasContextHelp ? 'Context-aware help text found' : 'Help text not found'
  );

  // Test 2.3: Check success message box
  const hasSuccessBox = settingsContent.includes('Single Person Mode') &&
                       settingsContent.includes('All calculations will be for one person only');
  testResult(
    'Fix #2.3: Success message for single mode',
    hasSuccessBox,
    hasSuccessBox ? 'Success message box found' : 'Success message not found'
  );

  // Test 2.4: Check green styling for success box
  const hasGreenStyling = settingsContent.includes('bg-green-50') &&
                         settingsContent.includes('border-green-200');
  testResult(
    'Fix #2.4: Green styling for success state',
    hasGreenStyling,
    hasGreenStyling ? 'Green styling found' : 'Green styling not found'
  );

} catch (error) {
  testResult('Fix #2: Read settings page', false, error.message);
}

// ============================================================================
// Fix #3: Pension Indexing Checkbox
// ============================================================================
console.log('\n💰 Fix #3: Pension Indexing Feature');
console.log('-'.repeat(80));

try {
  const incomePath = path.join(__dirname, 'app/(dashboard)/profile/income/page.tsx');
  const incomeContent = fs.readFileSync(incomePath, 'utf8');

  // Test 3.1: Check interface has inflationIndexed field
  const hasInterface = incomeContent.includes('inflationIndexed?: boolean');
  testResult(
    'Fix #3.1: IncomeSource interface updated',
    hasInterface,
    hasInterface ? 'inflationIndexed field in interface' : 'Field not found in interface'
  );

  // Test 3.2: Check default state
  const hasDefault = incomeContent.includes('inflationIndexed: true');
  testResult(
    'Fix #3.2: Default value set to true',
    hasDefault,
    hasDefault ? 'Default value found' : 'Default value not set'
  );

  // Test 3.3: Check checkbox UI
  const hasCheckbox = incomeContent.includes('Inflation Indexed') &&
                     incomeContent.includes('type="checkbox"');
  testResult(
    'Fix #3.3: Checkbox UI exists',
    hasCheckbox,
    hasCheckbox ? 'Checkbox UI found' : 'Checkbox not found'
  );

  // Test 3.4: Check contextual help for CPP
  const hasCppHelp = incomeContent.includes('CPP is automatically indexed to inflation each year');
  testResult(
    'Fix #3.4: CPP-specific help text',
    hasCppHelp,
    hasCppHelp ? 'CPP help text found' : 'CPP help text not found'
  );

  // Test 3.5: Check contextual help for OAS
  const hasOasHelp = incomeContent.includes('OAS is automatically indexed to inflation each year');
  testResult(
    'Fix #3.5: OAS-specific help text',
    hasOasHelp,
    hasOasHelp ? 'OAS help text found' : 'OAS help text not found'
  );

  // Test 3.6: Check contextual help for pension
  const hasPensionHelp = incomeContent.includes('Check this if your pension increases with inflation each year');
  testResult(
    'Fix #3.6: Pension-specific help text',
    hasPensionHelp,
    hasPensionHelp ? 'Pension help text found' : 'Pension help text not found'
  );

} catch (error) {
  testResult('Fix #3: Read income page', false, error.message);
}

// ============================================================================
// Fix #4: RRIF Strategy Naming
// ============================================================================
console.log('\n🎯 Fix #4: RRIF Strategy Naming');
console.log('-'.repeat(80));

try {
  // Test simulation types
  const typesPath = path.join(__dirname, 'lib/types/simulation.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  // Test 4.1: Check strategy label updated
  const hasNewLabel = typesContent.includes("label: 'Early RRIF Withdrawals (Income Splitting)'");
  testResult(
    'Fix #4.1: Strategy label updated in types',
    hasNewLabel,
    hasNewLabel ? 'New label found' : 'Old label still present'
  );

  // Test 4.2: Check description mentions income imbalance
  const hasDescription = typesContent.includes('Ideal for couples with income imbalance');
  testResult(
    'Fix #4.2: Description mentions income imbalance',
    hasDescription,
    hasDescription ? 'Description updated' : 'Description not updated'
  );

  // Test 4.3: Check rrif-frontload value still exists
  const hasValue = typesContent.includes("value: 'rrif-frontload'");
  testResult(
    'Fix #4.3: Strategy value unchanged',
    hasValue,
    hasValue ? 'Value preserved' : 'Value changed (breaking change!)'
  );

} catch (error) {
  testResult('Fix #4: Read simulation types', false, error.message);
}

try {
  // Test simulation page
  const simPagePath = path.join(__dirname, 'app/(dashboard)/simulation/page.tsx');
  const simPageContent = fs.readFileSync(simPagePath, 'utf8');

  // Test 4.4: Check strategyMap includes rrif-frontload
  const hasStrategyMap = simPageContent.includes("'rrif-frontload': 'Early RRIF Withdrawals (Income Splitting)'");
  testResult(
    'Fix #4.4: Strategy display map updated',
    hasStrategyMap,
    hasStrategyMap ? 'Display map updated' : 'Display map not updated'
  );

} catch (error) {
  testResult('Fix #4: Read simulation page', false, error.message);
}

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(80));

console.log(`\nTotal Tests: ${results.tests.length}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);

const passRate = ((results.passed / results.tests.length) * 100).toFixed(1);
console.log(`\nPass Rate: ${passRate}%`);

if (results.failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.tests
    .filter(t => !t.passed)
    .forEach(t => {
      console.log(`  • ${t.name}`);
      console.log(`    ${t.details}`);
    });
}

// Exit code
const exitCode = results.failed === 0 ? 0 : 1;

if (exitCode === 0) {
  console.log('\n✅ ALL TESTS PASSED! Ready for deployment.');
} else {
  console.log('\n❌ SOME TESTS FAILED. Please review the code.');
}

console.log('\n' + '='.repeat(80));

process.exit(exitCode);
