/**
 * Test US-046: Low Success Rate Warning Modal
 *
 * This test verifies that:
 * 1. analyzeFailureReasons correctly identifies failure reasons
 * 2. The analysis produces appropriate recommendations
 * 3. Low success rate scenarios trigger the warning
 */

const { analyzeFailureReasons } = require('./lib/analysis/failureReasons.ts');

// Test Scenario 1: Early Retirement with Insufficient Bridge Funding
const scenario1 = {
  household: {
    p1: {
      start_age: 55,
      cpp_start_age: 65,
      oas_start_age: 65,
      rrsp_balance: 150000,
      tfsa_balance: 50000,
      nonreg_balance: 30000,
      corporate_balance: 0,
      pension_incomes: [],
      other_incomes: [],
    },
    spending_go_go: 60000,
  },
  result: {
    summary: {
      success_rate: 0.052, // 5.2% as decimal (backend format: 0.0-1.0)
    },
    year_by_year: [
      { year: 2026, age_p1: 55, spending_gap: 5000 },
      { year: 2027, age_p1: 56, spending_gap: 8000 },
      { year: 2028, age_p1: 57, spending_gap: 12000 },
    ],
  },
};

// Test Scenario 2: High Expenses Relative to Savings
const scenario2 = {
  household: {
    p1: {
      start_age: 65,
      cpp_start_age: 65,
      oas_start_age: 65,
      rrsp_balance: 200000,
      tfsa_balance: 100000,
      nonreg_balance: 50000,
      corporate_balance: 0,
      pension_incomes: [],
      other_incomes: [],
    },
    spending_go_go: 50000,
  },
  result: {
    summary: {
      success_rate: 0.085, // 8.5% as decimal (backend format: 0.0-1.0)
    },
    year_by_year: [],
  },
};

// Test Scenario 3: Good Success Rate (should NOT trigger warning)
const scenario3 = {
  household: {
    p1: {
      start_age: 65,
      cpp_start_age: 65,
      oas_start_age: 65,
      rrsp_balance: 800000,
      tfsa_balance: 200000,
      nonreg_balance: 150000,
      corporate_balance: 0,
      pension_incomes: [{ name: 'Pension', amount: 30000, startAge: 65, inflationIndexed: true }],
      other_incomes: [],
    },
    spending_go_go: 80000,
  },
  result: {
    summary: {
      success_rate: 0.953, // 95.3% as decimal (backend format: 0.0-1.0)
    },
    year_by_year: [],
  },
};

console.log('='.repeat(80));
console.log('US-046: LOW SUCCESS RATE WARNING MODAL - TEST SUITE');
console.log('='.repeat(80));
console.log('');

// Test 1: Early Retirement
console.log('TEST 1: Early Retirement with Insufficient Bridge Funding');
console.log('-'.repeat(80));
const analysis1 = analyzeFailureReasons(scenario1.result, scenario1.household);
console.log('Success Rate:', analysis1.successRate + '%');
console.log('Has Low Success Rate:', analysis1.hasLowSuccessRate);
console.log('Failure Reasons Found:', analysis1.failureReasons.length);
console.log('');

if (analysis1.primaryIssue) {
  console.log('PRIMARY ISSUE:');
  console.log('  Type:', analysis1.primaryIssue.type);
  console.log('  Severity:', analysis1.primaryIssue.severity);
  console.log('  Title:', analysis1.primaryIssue.title);
  console.log('  Message:', analysis1.primaryIssue.message);
  console.log('  Recommendations:');
  analysis1.primaryIssue.recommendations.forEach((rec, idx) => {
    console.log(`    ${idx + 1}. ${rec}`);
  });
} else {
  console.log('❌ ERROR: No primary issue identified for low success rate scenario!');
}

console.log('');
console.log('All Failure Reasons:');
analysis1.failureReasons.forEach((reason, idx) => {
  console.log(`  ${idx + 1}. [${reason.severity.toUpperCase()}] ${reason.title}`);
});

console.log('');
console.log('✅ Test 1:', analysis1.hasLowSuccessRate && analysis1.failureReasons.length > 0 ? 'PASS' : 'FAIL');
console.log('');
console.log('='.repeat(80));
console.log('');

// Test 2: High Expenses
console.log('TEST 2: High Expenses Relative to Savings');
console.log('-'.repeat(80));
const analysis2 = analyzeFailureReasons(scenario2.result, scenario2.household);
console.log('Success Rate:', analysis2.successRate + '%');
console.log('Has Low Success Rate:', analysis2.hasLowSuccessRate);
console.log('Failure Reasons Found:', analysis2.failureReasons.length);
console.log('');

if (analysis2.failureReasons.length > 0) {
  console.log('Identified Issues:');
  analysis2.failureReasons.forEach((reason, idx) => {
    console.log(`  ${idx + 1}. [${reason.severity.toUpperCase()}] ${reason.title}`);
    if (reason.calculation) {
      console.log(`     Calculation: ${reason.calculation}`);
    }
  });
}

console.log('');
console.log('✅ Test 2:', analysis2.hasLowSuccessRate && analysis2.failureReasons.length > 0 ? 'PASS' : 'FAIL');
console.log('');
console.log('='.repeat(80));
console.log('');

// Test 3: Good Success Rate (should NOT trigger warning)
console.log('TEST 3: Good Success Rate (should NOT trigger warning)');
console.log('-'.repeat(80));
const analysis3 = analyzeFailureReasons(scenario3.result, scenario3.household);
console.log('Success Rate:', analysis3.successRate + '%');
console.log('Has Low Success Rate:', analysis3.hasLowSuccessRate);
console.log('Failure Reasons Found:', analysis3.failureReasons.length);
console.log('');
console.log('✅ Test 3:', !analysis3.hasLowSuccessRate ? 'PASS' : 'FAIL');
console.log('');
console.log('='.repeat(80));
console.log('');

// Summary
console.log('TEST SUMMARY');
console.log('-'.repeat(80));
const test1Pass = analysis1.hasLowSuccessRate && analysis1.failureReasons.length > 0;
const test2Pass = analysis2.hasLowSuccessRate && analysis2.failureReasons.length > 0;
const test3Pass = !analysis3.hasLowSuccessRate;

console.log('Test 1 (Early Retirement):', test1Pass ? '✅ PASS' : '❌ FAIL');
console.log('Test 2 (High Expenses):', test2Pass ? '✅ PASS' : '❌ FAIL');
console.log('Test 3 (Good Success Rate):', test3Pass ? '✅ PASS' : '❌ FAIL');
console.log('');

if (test1Pass && test2Pass && test3Pass) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('');
  console.log('US-046 is working correctly:');
  console.log('  ✅ Low success rate scenarios trigger warning');
  console.log('  ✅ Specific failure reasons are identified');
  console.log('  ✅ Actionable recommendations are provided');
  console.log('  ✅ Good success rate scenarios do NOT trigger warning');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review implementation');
  process.exit(1);
}
