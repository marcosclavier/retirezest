#!/usr/bin/env node

/**
 * GIS Assessment Improvements - Automated API Test Script (FIXED)
 *
 * Tests all 4 scenarios against the Python backend API to verify:
 * 1. Dynamic benefit calculation (not hardcoded)
 * 2. Feasibility checks (liquid assets validation)
 * 3. Age-appropriate recommendations (priority adjustment)
 * 4. Confidence intervals (statistical ranges)
 * 5. Caveats and disclaimers (comprehensive warnings)
 */

const PYTHON_API_URL = 'http://localhost:8000';

// Helper to create person object with defaults
function createPerson(overrides = {}) {
  return {
    name: "",
    start_age: 65,
    cpp_start_age: 65,
    cpp_annual_at_start: 12000,
    oas_start_age: 65,
    oas_annual_at_start: 8500,
    tfsa_balance: 95000,
    rrif_balance: 120000,
    rrsp_balance: 0,
    nonreg_balance: 200000,
    corporate_balance: 0,
    nonreg_acb: 150000,
    nr_cash: 0,
    nr_gic: 0,
    nr_invest: 0,
    y_nr_cash_interest: 2.0,
    y_nr_gic_interest: 3.5,
    y_nr_inv_total_return: 6.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 3.0,
    y_nr_inv_roc_pct: 0.5,
    nr_cash_pct: 10.0,
    nr_gic_pct: 20.0,
    nr_invest_pct: 70.0,
    corp_cash_bucket: 0,
    corp_gic_bucket: 0,
    corp_invest_bucket: 0,
    corp_rdtoh: 0,
    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 3.5,
    y_corp_inv_total_return: 6.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,
    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,
    corp_dividend_type: "eligible",
    tfsa_room_start: 7000,
    tfsa_room_annual_growth: 7000,
    rental_income_annual: 0,
    has_primary_residence: false,
    primary_residence_value: 0,
    primary_residence_purchase_price: 0,
    primary_residence_mortgage: 0,
    primary_residence_monthly_payment: 0,
    plan_to_downsize: false,
    downsize_year: null,
    downsize_new_home_cost: 0,
    downsize_is_principal_residence: true,
    ...overrides
  };
}

// Helper to create empty person 2 (for single-person households)
function createEmptyPerson2() {
  return createPerson({
    name: "",
    start_age: 65,
    tfsa_balance: 0,
    rrif_balance: 0,
    rrsp_balance: 0,
    nonreg_balance: 0,
    corporate_balance: 0,
    cpp_annual_at_start: 0,
    oas_annual_at_start: 0,
  });
}

// Test Scenarios
const scenarios = {
  scenarioA: {
    name: "Young User with Low RRIF (Ideal Candidate)",
    description: "Age 58, low RRIF, plenty of time - should get HIGH priority, CONFIRMED feasibility",
    payload: {
      p1: createPerson({
        start_age: 58,
        rrif_balance: 120000,
        tfsa_balance: 95000,
        nonreg_balance: 200000,
        cpp_annual_at_start: 12000,
        oas_annual_at_start: 8500,
      }),
      p2: createEmptyPerson2(),
      province: "ON",
      start_year: 2025,
      end_age: 95,
      strategy: "minimize-income",
      spending_go_go: 48000,
      go_go_end_age: 75,
      spending_slow_go: 38400,
      slow_go_end_age: 85,
      spending_no_go: 28800,
      spending_inflation: 2.0,
      general_inflation: 2.0,
      gap_tolerance: 1000,
      tfsa_contribution_each: 0,
      reinvest_nonreg_dist: false,
      income_split_rrif_fraction: 0.0,
      hybrid_rrif_topup_per_person: 0,
      stop_on_fail: false,
    },
    expectedResults: {
      priority: "high",
      feasibility: "confirmed",
      timingAppropriate: true,
      confidenceLevel: ["high", "medium"],
      hasConfidenceInterval: true,
      hasCaveats: true,
      hasAssumptions: true,
      hasDisclaimer: true,
    }
  },

  scenarioB: {
    name: "Mid-Age User with Medium RRIF (Moderate Candidate)",
    description: "Age 66, medium RRIF, limited liquid assets - should get MEDIUM priority, LIMITED feasibility",
    payload: {
      p1: createPerson({
        start_age: 66,
        rrif_balance: 328000,
        tfsa_balance: 100000,
        nonreg_balance: 50000,
        cpp_annual_at_start: 15000,
        oas_annual_at_start: 8500,
      }),
      p2: createEmptyPerson2(),
      province: "ON",
      start_year: 2025,
      end_age: 95,
      strategy: "minimize-income",
      spending_go_go: 60000,
      go_go_end_age: 75,
      spending_slow_go: 48000,
      slow_go_end_age: 85,
      spending_no_go: 36000,
      spending_inflation: 2.0,
      general_inflation: 2.0,
      gap_tolerance: 1000,
      tfsa_contribution_each: 0,
      reinvest_nonreg_dist: false,
      income_split_rrif_fraction: 0.0,
      hybrid_rrif_topup_per_person: 0,
      stop_on_fail: false,
    },
    expectedResults: {
      priority: "medium",
      feasibility: ["limited", "confirmed"],
      timingAppropriate: true,
      confidenceLevel: ["medium", "low"],
      hasConfidenceInterval: true,
      hasCaveats: true,
      hasAssumptions: true,
      hasDisclaimer: true,
    }
  },

  scenarioC: {
    name: "Older User with High RRIF (Too Late)",
    description: "Age 70, high RRIF, only 1 year left - should get LOW priority, timing NOT appropriate",
    payload: {
      p1: createPerson({
        start_age: 70,
        rrif_balance: 650000,
        tfsa_balance: 150000,
        nonreg_balance: 100000,
        cpp_annual_at_start: 17000,
        oas_annual_at_start: 8500,
      }),
      p2: createEmptyPerson2(),
      province: "ON",
      start_year: 2025,
      end_age: 95,
      strategy: "minimize-income",
      spending_go_go: 70000,
      go_go_end_age: 75,
      spending_slow_go: 56000,
      slow_go_end_age: 85,
      spending_no_go: 42000,
      spending_inflation: 2.0,
      general_inflation: 2.0,
      gap_tolerance: 1000,
      tfsa_contribution_each: 0,
      reinvest_nonreg_dist: false,
      income_split_rrif_fraction: 0.0,
      hybrid_rrif_topup_per_person: 0,
      stop_on_fail: false,
    },
    expectedResults: {
      priority: "low",
      feasibility: ["uncertain", "limited"],
      timingAppropriate: false,
      confidenceLevel: ["low", "medium"],
      hasConfidenceInterval: true,
      hasCaveats: true,
      hasAssumptions: true,
      hasDisclaimer: true,
    }
  },

  scenarioD: {
    name: "High Other Income (Ineligible)",
    description: "Age 64, high pension income - should be NOT_ELIGIBLE for GIS",
    payload: {
      p1: createPerson({
        start_age: 64,
        rrif_balance: 200000,
        tfsa_balance: 80000,
        nonreg_balance: 40000,
        cpp_annual_at_start: 15000,
        oas_annual_at_start: 8500,
        rental_income_annual: 120000, // High other income
      }),
      p2: createEmptyPerson2(),
      province: "ON",
      start_year: 2025,
      end_age: 95,
      strategy: "minimize-income",
      spending_go_go: 80000,
      go_go_end_age: 75,
      spending_slow_go: 64000,
      slow_go_end_age: 85,
      spending_no_go: 48000,
      spending_inflation: 2.0,
      general_inflation: 2.0,
      gap_tolerance: 1000,
      tfsa_contribution_each: 0,
      reinvest_nonreg_dist: false,
      income_split_rrif_fraction: 0.0,
      hybrid_rrif_topup_per_person: 0,
      stop_on_fail: false,
    },
    expectedResults: {
      status: "not_eligible",
      rating: 3,
      hasDisclaimer: true,
    }
  }
};

// Validation Functions (same as before)
function validateRecommendation(rec, expectedPriority, expectedFeasibility, expectedTiming) {
  const results = {
    passed: [],
    failed: [],
  };

  if (rec.priority === expectedPriority) {
    results.passed.push(`✓ Priority is ${expectedPriority}`);
  } else {
    results.failed.push(`✗ Priority expected ${expectedPriority}, got ${rec.priority}`);
  }

  if (rec.feasibility) {
    const feasibilityMatch = Array.isArray(expectedFeasibility)
      ? expectedFeasibility.includes(rec.feasibility)
      : rec.feasibility === expectedFeasibility;

    if (feasibilityMatch) {
      results.passed.push(`✓ Feasibility is ${rec.feasibility}`);
    } else {
      results.failed.push(`✗ Feasibility expected ${expectedFeasibility}, got ${rec.feasibility}`);
    }

    if (rec.feasibility_note) {
      results.passed.push(`✓ Feasibility note present: "${rec.feasibility_note.substring(0, 50)}..."`);
    } else {
      results.failed.push(`✗ Feasibility note missing`);
    }
  } else {
    results.failed.push(`✗ Feasibility field missing`);
  }

  if (rec.timing_appropriateness !== undefined) {
    if (rec.timing_appropriateness === expectedTiming) {
      results.passed.push(`✓ Timing appropriateness is ${expectedTiming}`);
    } else {
      results.failed.push(`✗ Timing expected ${expectedTiming}, got ${rec.timing_appropriateness}`);
    }

    if (rec.timing_note) {
      results.passed.push(`✓ Timing note present: "${rec.timing_note.substring(0, 50)}..."`);
    } else {
      results.failed.push(`✗ Timing note missing`);
    }
  } else {
    results.failed.push(`✗ Timing appropriateness field missing`);
  }

  if (rec.confidence) {
    results.passed.push(`✓ Confidence level: ${rec.confidence}`);
  } else {
    results.failed.push(`✗ Confidence field missing`);
  }

  if (rec.benefit_range) {
    if (rec.benefit_range.lower && rec.benefit_range.upper && rec.benefit_range.estimate) {
      results.passed.push(`✓ Benefit range present: $${rec.benefit_range.estimate.toFixed(0)} (${rec.benefit_range.lower.toFixed(0)} - ${rec.benefit_range.upper.toFixed(0)})`);

      const rangeSize = rec.benefit_range.upper - rec.benefit_range.lower;
      if (rangeSize > 0) {
        results.passed.push(`✓ Dynamic benefit range (not hardcoded)`);
      } else {
        results.failed.push(`✗ Benefit range appears static`);
      }
    } else {
      results.failed.push(`✗ Benefit range incomplete`);
    }
  } else {
    results.failed.push(`✗ Benefit range missing`);
  }

  if (rec.caveats && rec.caveats.length > 0) {
    results.passed.push(`✓ Caveats present (${rec.caveats.length} items)`);
  } else {
    results.failed.push(`✗ Caveats missing or empty`);
  }

  if (rec.assumptions && rec.assumptions.length > 0) {
    results.passed.push(`✓ Assumptions present (${rec.assumptions.length} items)`);
  } else {
    results.failed.push(`✗ Assumptions missing or empty`);
  }

  return results;
}

function validateInsights(insights, expected) {
  const results = {
    passed: [],
    failed: [],
  };

  if (insights.disclaimer) {
    results.passed.push(`✓ General disclaimer present (${insights.disclaimer.length} chars)`);
  } else {
    results.failed.push(`✗ General disclaimer missing`);
  }

  if (insights.last_updated) {
    results.passed.push(`✓ Last updated: ${insights.last_updated}`);
  } else {
    results.failed.push(`✗ Last updated missing`);
  }

  if (insights.data_sources && insights.data_sources.length > 0) {
    results.passed.push(`✓ Data sources present (${insights.data_sources.length} items)`);
  } else {
    results.failed.push(`✗ Data sources missing or empty`);
  }

  if (expected.status && insights.gis_feasibility) {
    if (insights.gis_feasibility.status === expected.status) {
      results.passed.push(`✓ GIS status is ${expected.status}`);
    } else {
      results.failed.push(`✗ GIS status expected ${expected.status}, got ${insights.gis_feasibility.status}`);
    }
  }

  if (expected.rating !== undefined && insights.strategy_effectiveness) {
    const rating = insights.strategy_effectiveness.rating;
    if (rating <= expected.rating) {
      results.passed.push(`✓ Strategy rating is ${rating}/10 (≤${expected.rating} as expected)`);
    } else {
      results.failed.push(`✗ Strategy rating ${rating}/10 too high (expected ≤${expected.rating})`);
    }
  }

  return results;
}

// Main Test Runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   GIS ASSESSMENT IMPROVEMENTS - BACKEND VALIDATION TEST    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Testing Python API at: ${PYTHON_API_URL}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  const allResults = {};
  let totalPassed = 0;
  let totalFailed = 0;

  for (const [key, scenario] of Object.entries(scenarios)) {
    console.log('─'.repeat(80));
    console.log(`\n📋 ${scenario.name}`);
    console.log(`   ${scenario.description}\n`);

    try {
      console.log(`   ⏳ Sending request to ${PYTHON_API_URL}/api/run-simulation...`);
      console.log(`   📊 Profile: Age ${scenario.payload.p1.start_age}, RRIF $${scenario.payload.p1.rrif_balance.toLocaleString()}`);

      const response = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenario.payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`   ✓ Response received (${response.status})`);

      // Debug: Show what fields are present
      console.log(`   📝 Response keys: ${Object.keys(data).join(', ')}`);

      // Check if there was an error in the simulation
      if (data.error) {
        console.log(`   ❌ SIMULATION ERROR: ${data.error}`);
        console.log(`   Error details: ${data.error_details}`);
        console.log(`   Success: ${data.success}\n`);
        totalFailed++;
        continue;
      }

      if (!data.strategy_insights) {
        console.log(`   ❌ CRITICAL: strategy_insights field missing in response`);
        console.log(`   Strategy used: ${scenario.payload.strategy}`);
        console.log(`   Response message: ${data.message}\n`);
        totalFailed++;
        continue;
      }

      const insights = data.strategy_insights;
      console.log(`   ✓ strategy_insights found\n`);

      // Validate insights-level fields
      const insightsValidation = validateInsights(insights, scenario.expectedResults);

      console.log(`   📊 Insights-Level Validation:`);
      insightsValidation.passed.forEach(msg => console.log(`      ${msg}`));
      insightsValidation.failed.forEach(msg => console.log(`      ${msg}`));
      console.log();

      totalPassed += insightsValidation.passed.length;
      totalFailed += insightsValidation.failed.length;

      // Validate recommendations (if scenario expects them)
      if (scenario.expectedResults.priority && insights.recommendations && insights.recommendations.length > 0) {
        console.log(`   📊 Recommendations Validation (${insights.recommendations.length} found):\n`);

        const firstRec = insights.recommendations[0];
        console.log(`   Testing: "${firstRec.title}"`);

        const recValidation = validateRecommendation(
          firstRec,
          scenario.expectedResults.priority,
          scenario.expectedResults.feasibility,
          scenario.expectedResults.timingAppropriate
        );

        recValidation.passed.forEach(msg => console.log(`      ${msg}`));
        recValidation.failed.forEach(msg => console.log(`      ${msg}`));
        console.log();

        totalPassed += recValidation.passed.length;
        totalFailed += recValidation.failed.length;

        allResults[key] = {
          passed: insightsValidation.passed.length + recValidation.passed.length,
          failed: insightsValidation.failed.length + recValidation.failed.length,
        };
      } else if (scenario.expectedResults.priority) {
        console.log(`   ⚠️  No recommendations found (expected for this scenario)\n`);
        totalFailed++;
      } else {
        allResults[key] = {
          passed: insightsValidation.passed.length,
          failed: insightsValidation.failed.length,
        };
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
      totalFailed++;
    }
  }

  // Summary
  console.log('─'.repeat(80));
  console.log('\n📊 TEST SUMMARY:\n');

  for (const [key, result] of Object.entries(allResults)) {
    const scenario = scenarios[key];
    const totalChecks = result.passed + result.failed;
    const passRate = totalChecks > 0 ? ((result.passed / totalChecks) * 100).toFixed(1) : 0;
    const status = result.failed === 0 ? '✅ PASS' : result.failed <= 2 ? '⚠️  PARTIAL' : '❌ FAIL';

    console.log(`   ${status} ${scenario.name}`);
    console.log(`        Passed: ${result.passed}/${totalChecks} (${passRate}%)`);
    if (result.failed > 0) {
      console.log(`        Failed: ${result.failed}`);
    }
    console.log();
  }

  console.log('─'.repeat(80));
  console.log(`\n   TOTAL: ${totalPassed} passed, ${totalFailed} failed\n`);

  if (totalFailed === 0) {
    console.log('   🎉 ALL TESTS PASSED! GIS improvements are working correctly.\n');
  } else if (totalFailed <= 5) {
    console.log('   ⚠️  Most tests passed, but some improvements need attention.\n');
  } else {
    console.log('   ❌ Multiple tests failed. Review implementation.\n');
  }

  console.log('─'.repeat(80));
  console.log();
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  process.exit(1);
});
