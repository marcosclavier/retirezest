#!/usr/bin/env node

/**
 * GIS Assessment Improvements - Automated API Test Script
 *
 * Tests all 4 scenarios against the Python backend API to verify:
 * 1. Dynamic benefit calculation (not hardcoded)
 * 2. Feasibility checks (liquid assets validation)
 * 3. Age-appropriate recommendations (priority adjustment)
 * 4. Confidence intervals (statistical ranges)
 * 5. Caveats and disclaimers (comprehensive warnings)
 */

const PYTHON_API_URL = 'http://localhost:8000';

// Test Scenarios
const scenarios = {
  scenarioA: {
    name: "Young User with Low RRIF (Ideal Candidate)",
    description: "Age 58, low RRIF, plenty of time - should get HIGH priority, CONFIRMED feasibility",
    payload: {
      strategy: "minimize-income",
      profile: {
        start_age: 58,
        province: "ON",
        rrsp_balance: 0,
        rrif_balance: 120000,
        tfsa_balance: 95000,
        nonreg_balance: 200000,
        corp_balance: 0,
        cpp_annual: 12000,
        oas_annual: 8500,
        other_income: 0,
        cpp_start_age: 65,
        oas_start_age: 65,
      },
      spending: {
        go_go_spending: 48000,
        slow_go_spending: 38400,
        no_go_spending: 28800,
      },
      include_partner: false,
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
      strategy: "minimize-income",
      profile: {
        start_age: 66,
        province: "ON",
        rrsp_balance: 0,
        rrif_balance: 328000,
        tfsa_balance: 100000,
        nonreg_balance: 50000,
        corp_balance: 0,
        cpp_annual: 15000,
        oas_annual: 8500,
        other_income: 0,
        cpp_start_age: 65,
        oas_start_age: 65,
      },
      spending: {
        go_go_spending: 60000,
        slow_go_spending: 48000,
        no_go_spending: 36000,
      },
      include_partner: false,
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
      strategy: "minimize-income",
      profile: {
        start_age: 70,
        province: "ON",
        rrsp_balance: 0,
        rrif_balance: 650000,
        tfsa_balance: 150000,
        nonreg_balance: 100000,
        corp_balance: 0,
        cpp_annual: 17000,
        oas_annual: 8500,
        other_income: 0,
        cpp_start_age: 65,
        oas_start_age: 65,
      },
      spending: {
        go_go_spending: 70000,
        slow_go_spending: 56000,
        no_go_spending: 42000,
      },
      include_partner: false,
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
      strategy: "minimize-income",
      profile: {
        start_age: 64,
        province: "ON",
        rrsp_balance: 0,
        rrif_balance: 200000,
        tfsa_balance: 80000,
        nonreg_balance: 40000,
        corp_balance: 0,
        cpp_annual: 15000,
        oas_annual: 8500,
        other_income: 120000,
        cpp_start_age: 65,
        oas_start_age: 65,
      },
      spending: {
        go_go_spending: 80000,
        slow_go_spending: 64000,
        no_go_spending: 48000,
      },
      include_partner: false,
    },
    expectedResults: {
      status: "not_eligible",
      rating: 3,
      hasDisclaimer: true,
    }
  }
};

// Validation Functions
function validateRecommendation(rec, expectedPriority, expectedFeasibility, expectedTiming) {
  const results = {
    passed: [],
    failed: [],
  };

  // Check priority
  if (rec.priority === expectedPriority) {
    results.passed.push(`✓ Priority is ${expectedPriority}`);
  } else {
    results.failed.push(`✗ Priority expected ${expectedPriority}, got ${rec.priority}`);
  }

  // Check feasibility
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

  // Check timing
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

  // Check confidence
  if (rec.confidence) {
    results.passed.push(`✓ Confidence level: ${rec.confidence}`);
  } else {
    results.failed.push(`✗ Confidence field missing`);
  }

  // Check benefit range
  if (rec.benefit_range) {
    if (rec.benefit_range.lower && rec.benefit_range.upper && rec.benefit_range.estimate) {
      results.passed.push(`✓ Benefit range present: $${rec.benefit_range.estimate.toFixed(0)} (${rec.benefit_range.lower.toFixed(0)} - ${rec.benefit_range.upper.toFixed(0)})`);

      // Verify it's NOT hardcoded (check if range is dynamic)
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

  // Check caveats
  if (rec.caveats && rec.caveats.length > 0) {
    results.passed.push(`✓ Caveats present (${rec.caveats.length} items)`);
  } else {
    results.failed.push(`✗ Caveats missing or empty`);
  }

  // Check assumptions
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

  // Check disclaimer
  if (insights.disclaimer) {
    results.passed.push(`✓ General disclaimer present (${insights.disclaimer.length} chars)`);
  } else {
    results.failed.push(`✗ General disclaimer missing`);
  }

  // Check last_updated
  if (insights.last_updated) {
    results.passed.push(`✓ Last updated: ${insights.last_updated}`);
  } else {
    results.failed.push(`✗ Last updated missing`);
  }

  // Check data_sources
  if (insights.data_sources && insights.data_sources.length > 0) {
    results.passed.push(`✓ Data sources present (${insights.data_sources.length} items)`);
  } else {
    results.failed.push(`✗ Data sources missing or empty`);
  }

  // Check GIS feasibility status
  if (expected.status && insights.gis_feasibility) {
    if (insights.gis_feasibility.status === expected.status) {
      results.passed.push(`✓ GIS status is ${expected.status}`);
    } else {
      results.failed.push(`✗ GIS status expected ${expected.status}, got ${insights.gis_feasibility.status}`);
    }
  }

  // Check strategy rating
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
      // Make API request
      console.log(`   ⏳ Sending request to ${PYTHON_API_URL}/api/simulation/run...`);
      console.log(`   📊 Profile: Age ${scenario.payload.profile.start_age}, RRIF $${scenario.payload.profile.rrif_balance.toLocaleString()}`);

      const response = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenario.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`   ✓ Response received (${response.status})`);

      // Validate strategy_insights presence
      if (!data.strategy_insights) {
        console.log(`   ❌ CRITICAL: strategy_insights field missing in response\n`);
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

        // Test the first recommendation (typically the RRIF depletion one)
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

        // Store results
        allResults[key] = {
          passed: insightsValidation.passed.length + recValidation.passed.length,
          failed: insightsValidation.failed.length + recValidation.failed.length,
        };
      } else if (scenario.expectedResults.priority) {
        console.log(`   ⚠️  No recommendations found (expected for this scenario)\n`);
        totalFailed++;
      } else {
        // Scenario D - no recommendations expected
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
