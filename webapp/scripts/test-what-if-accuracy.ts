/**
 * Proof-of-Concept Test: What-If Sliders Accuracy
 *
 * This script demonstrates the difference between:
 * 1. Current client-side estimates (from WhatIfSliders component)
 * 2. Real simulations (from Python backend via new What-If API)
 *
 * Purpose: Show concrete evidence of inaccuracy in current implementation
 * to justify migrating to real simulations.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScenarioAdjustments {
  spendingMultiplier: number;
  retirementAgeShift: number;
  cppStartAgeShift: number;
  oasStartAgeShift: number;
}

interface HouseholdInput {
  province: string;
  end_age: number;
  spending_go_go: number;
  go_go_end_age: number;
  spending_slow_go: number;
  slow_go_end_age: number;
  spending_no_go: number;
  spending_inflation: number;
  general_inflation: number;
  strategy: string;
  reinvest_nonreg_dist: boolean;
  p1: PersonInput;
  p2: PersonInput;
}

interface PersonInput {
  name: string;
  start_age: number;
  cpp_start_age: number;
  cpp_annual_at_start: number;
  oas_start_age: number;
  oas_annual_at_start: number;
  tfsa_balance: number;
  tfsa_room_start: number;
  rrsp_balance: number;
  rrif_balance: number;
  nonreg_balance: number;
  nonreg_acb: number;
  corporate_balance: number;
  nr_cash: number;
  nr_gic: number;
  nr_invest: number;
  y_nr_cash_interest: number;
  y_nr_gic_interest: number;
  y_nr_inv_total_return: number;
  y_nr_inv_elig_div: number;
  y_nr_inv_nonelig_div: number;
  y_nr_inv_capg: number;
  y_nr_inv_roc_pct: number;
  corp_cash_bucket: number;
  corp_gic_bucket: number;
  corp_invest_bucket: number;
  y_corp_cash_interest: number;
  y_corp_gic_interest: number;
  y_corp_inv_total_return: number;
  y_corp_inv_elig_div: number;
  y_corp_inv_capg: number;
}

/**
 * Client-side estimate logic (from current WhatIfSliders.tsx)
 */
function calculateClientSideEstimate(
  baseHealthScore: number,
  baseFinalEstate: number,
  adjustments: ScenarioAdjustments
): { healthScoreChange: number; estateChange: number } {
  let healthScoreChange = 0;
  let estateChange = 0;

  // Spending impact: reducing spending improves outcomes
  const spendingImpact = (1.0 - adjustments.spendingMultiplier) * 10; // ±10 points per 10% change
  healthScoreChange += spendingImpact;
  estateChange += (baseFinalEstate * (1.0 - adjustments.spendingMultiplier)) * 0.5;

  // Retirement age impact: delaying retirement helps
  const retirementImpact = adjustments.retirementAgeShift * 3; // +3 points per year delayed
  healthScoreChange += retirementImpact;
  estateChange += adjustments.retirementAgeShift * 25000; // Rough estimate

  // CPP delay impact: up to 42% more at 70 vs 65
  const cppDelayYears = Math.max(0, adjustments.cppStartAgeShift);
  const cppImpact = cppDelayYears * 1.5; // +1.5 points per year delayed
  healthScoreChange += cppImpact;
  estateChange += cppDelayYears * 10000;

  // OAS delay impact: up to 36% more at 70 vs 65
  const oasDelayYears = Math.max(0, adjustments.oasStartAgeShift);
  const oasImpact = oasDelayYears * 1.2; // +1.2 points per year delayed
  healthScoreChange += oasImpact;
  estateChange += oasDelayYears * 8000;

  return {
    healthScoreChange: Math.round(healthScoreChange),
    estateChange: Math.round(estateChange),
  };
}

/**
 * Run actual simulation via Python API
 */
async function runRealSimulation(household: HouseholdInput): Promise<any> {
  const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

  const response = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(household),
  });

  if (!response.ok) {
    throw new Error(`Simulation failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Apply adjustments to household input
 */
function applyAdjustments(
  base: HouseholdInput,
  adjustments: ScenarioAdjustments
): HouseholdInput {
  return {
    ...base,
    spending_go_go: Math.round(base.spending_go_go * adjustments.spendingMultiplier),
    spending_slow_go: Math.round(base.spending_slow_go * adjustments.spendingMultiplier),
    spending_no_go: Math.round(base.spending_no_go * adjustments.spendingMultiplier),
    p1: {
      ...base.p1,
      start_age: base.p1.start_age + adjustments.retirementAgeShift,
      cpp_start_age: Math.max(60, Math.min(70, base.p1.cpp_start_age + adjustments.cppStartAgeShift)),
      oas_start_age: Math.max(65, Math.min(70, base.p1.oas_start_age + adjustments.oasStartAgeShift)),
    },
    p2: base.p2.name ? {
      ...base.p2,
      start_age: base.p2.start_age + adjustments.retirementAgeShift,
      cpp_start_age: Math.max(60, Math.min(70, base.p2.cpp_start_age + adjustments.cppStartAgeShift)),
      oas_start_age: Math.max(65, Math.min(70, base.p2.oas_start_age + adjustments.oasStartAgeShift)),
    } : base.p2,
  };
}

/**
 * Create a test household with realistic data
 */
function createTestHousehold(): HouseholdInput {
  return {
    province: 'AB',
    end_age: 95,
    spending_go_go: 80000,
    go_go_end_age: 75,
    spending_slow_go: 64000,
    slow_go_end_age: 85,
    spending_no_go: 56000,
    spending_inflation: 0.02,
    general_inflation: 0.02,
    strategy: 'balanced',
    reinvest_nonreg_dist: true,
    p1: {
      name: 'Test User',
      start_age: 65,
      cpp_start_age: 65,
      cpp_annual_at_start: 15000,
      oas_start_age: 65,
      oas_annual_at_start: 8500,
      tfsa_balance: 100000,
      tfsa_room_start: 0,
      rrsp_balance: 400000,
      rrif_balance: 0,
      nonreg_balance: 200000,
      nonreg_acb: 160000,
      corporate_balance: 0,
      nr_cash: 20000,
      nr_gic: 80000,
      nr_invest: 100000,
      y_nr_cash_interest: 0.025,
      y_nr_gic_interest: 0.04,
      y_nr_inv_total_return: 0.06,
      y_nr_inv_elig_div: 0.02,
      y_nr_inv_nonelig_div: 0.005,
      y_nr_inv_capg: 0.03,
      y_nr_inv_roc_pct: 0.005,
      corp_cash_bucket: 0,
      corp_gic_bucket: 0,
      corp_invest_bucket: 0,
      y_corp_cash_interest: 0.025,
      y_corp_gic_interest: 0.04,
      y_corp_inv_total_return: 0.06,
      y_corp_inv_elig_div: 0.03,
      y_corp_inv_capg: 0.03,
    },
    p2: {
      name: '',
      start_age: 65,
      cpp_start_age: 65,
      cpp_annual_at_start: 0,
      oas_start_age: 65,
      oas_annual_at_start: 0,
      tfsa_balance: 0,
      tfsa_room_start: 0,
      rrsp_balance: 0,
      rrif_balance: 0,
      nonreg_balance: 0,
      nonreg_acb: 0,
      corporate_balance: 0,
      nr_cash: 0,
      nr_gic: 0,
      nr_invest: 0,
      y_nr_cash_interest: 0.025,
      y_nr_gic_interest: 0.04,
      y_nr_inv_total_return: 0.06,
      y_nr_inv_elig_div: 0.02,
      y_nr_inv_nonelig_div: 0.005,
      y_nr_inv_capg: 0.03,
      y_nr_inv_roc_pct: 0.005,
      corp_cash_bucket: 0,
      corp_gic_bucket: 0,
      corp_invest_bucket: 0,
      y_corp_cash_interest: 0.025,
      y_corp_gic_interest: 0.04,
      y_corp_inv_total_return: 0.06,
      y_corp_inv_elig_div: 0.03,
      y_corp_inv_capg: 0.03,
    },
  };
}

/**
 * Main test function
 */
async function runAccuracyTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  What-If Sliders Accuracy Test');
  console.log('  Comparing Client-Side Estimates vs Real Simulations');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testHousehold = createTestHousehold();

  // Test Scenario 1: Reduced Spending (80%)
  console.log('📊 TEST SCENARIO 1: Reduced Spending (80%)\n');

  const scenario1: ScenarioAdjustments = {
    spendingMultiplier: 0.8,
    retirementAgeShift: 0,
    cppStartAgeShift: 0,
    oasStartAgeShift: 0,
  };

  console.log('Running baseline simulation...');
  const baselineResult = await runRealSimulation(testHousehold);
  const baseHealthScore = Math.round((baselineResult.summary.success_rate || 0) * 100);
  const baseFinalEstate = baselineResult.summary.final_estate_after_tax;

  console.log(`✓ Baseline Health Score: ${baseHealthScore}`);
  console.log(`✓ Baseline Final Estate: $${baseFinalEstate.toLocaleString()}\n`);

  // Client-side estimate
  const estimate1 = calculateClientSideEstimate(baseHealthScore, baseFinalEstate, scenario1);
  const estimatedHealthScore1 = Math.min(100, Math.max(0, baseHealthScore + estimate1.healthScoreChange));
  const estimatedEstate1 = Math.max(0, baseFinalEstate + estimate1.estateChange);

  console.log('CLIENT-SIDE ESTIMATE:');
  console.log(`  Health Score: ${estimatedHealthScore1} (${estimate1.healthScoreChange >= 0 ? '+' : ''}${estimate1.healthScoreChange})`);
  console.log(`  Final Estate: $${estimatedEstate1.toLocaleString()} (${estimate1.estateChange >= 0 ? '+' : ''}$${estimate1.estateChange.toLocaleString()})\n`);

  // Real simulation
  console.log('Running real simulation with 80% spending...');
  const adjusted1 = applyAdjustments(testHousehold, scenario1);
  const realResult1 = await runRealSimulation(adjusted1);
  const realHealthScore1 = Math.round((realResult1.summary.success_rate || 0) * 100);
  const realFinalEstate1 = realResult1.summary.final_estate_after_tax;

  console.log('REAL SIMULATION:');
  console.log(`  Health Score: ${realHealthScore1} (${realHealthScore1 - baseHealthScore >= 0 ? '+' : ''}${realHealthScore1 - baseHealthScore})`);
  console.log(`  Final Estate: $${realFinalEstate1.toLocaleString()} (${realFinalEstate1 - baseFinalEstate >= 0 ? '+' : ''}$${(realFinalEstate1 - baseFinalEstate).toLocaleString()})\n`);

  // Calculate error
  const healthScoreError1 = Math.abs(estimatedHealthScore1 - realHealthScore1);
  const estateError1 = Math.abs(estimatedEstate1 - realFinalEstate1);
  const estateErrorPct1 = (estateError1 / realFinalEstate1) * 100;

  console.log('❌ ESTIMATION ERROR:');
  console.log(`  Health Score: ${healthScoreError1} points off`);
  console.log(`  Final Estate: $${estateError1.toLocaleString()} off (${estateErrorPct1.toFixed(1)}% error)\n`);

  // Test Scenario 2: Delayed CPP (Age 70 vs 65)
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📊 TEST SCENARIO 2: Delayed CPP (Age 70 vs 65)\n');

  const scenario2: ScenarioAdjustments = {
    spendingMultiplier: 1.0,
    retirementAgeShift: 0,
    cppStartAgeShift: 5, // 65 → 70
    oasStartAgeShift: 0,
  };

  // Client-side estimate
  const estimate2 = calculateClientSideEstimate(baseHealthScore, baseFinalEstate, scenario2);
  const estimatedHealthScore2 = Math.min(100, Math.max(0, baseHealthScore + estimate2.healthScoreChange));
  const estimatedEstate2 = Math.max(0, baseFinalEstate + estimate2.estateChange);

  console.log('CLIENT-SIDE ESTIMATE:');
  console.log(`  Health Score: ${estimatedHealthScore2} (${estimate2.healthScoreChange >= 0 ? '+' : ''}${estimate2.healthScoreChange})`);
  console.log(`  Final Estate: $${estimatedEstate2.toLocaleString()} (${estimate2.estateChange >= 0 ? '+' : ''}$${estimate2.estateChange.toLocaleString()})`);
  console.log(`  Note: Estimate assumes +$10,000/year impact\n`);

  // Real simulation
  console.log('Running real simulation with CPP at age 70...');
  const adjusted2 = applyAdjustments(testHousehold, scenario2);
  const realResult2 = await runRealSimulation(adjusted2);
  const realHealthScore2 = Math.round((realResult2.summary.success_rate || 0) * 100);
  const realFinalEstate2 = realResult2.summary.final_estate_after_tax;

  console.log('REAL SIMULATION:');
  console.log(`  Health Score: ${realHealthScore2} (${realHealthScore2 - baseHealthScore >= 0 ? '+' : ''}${realHealthScore2 - baseHealthScore})`);
  console.log(`  Final Estate: $${realFinalEstate2.toLocaleString()} (${realFinalEstate2 - baseFinalEstate >= 0 ? '+' : ''}$${(realFinalEstate2 - baseFinalEstate).toLocaleString()})`);
  console.log(`  Note: Includes 42% higher CPP + tax implications\n`);

  // Calculate error
  const healthScoreError2 = Math.abs(estimatedHealthScore2 - realHealthScore2);
  const estateError2 = Math.abs(estimatedEstate2 - realFinalEstate2);
  const estateErrorPct2 = (estateError2 / realFinalEstate2) * 100;

  console.log('❌ ESTIMATION ERROR:');
  console.log(`  Health Score: ${healthScoreError2} points off`);
  console.log(`  Final Estate: $${estateError2.toLocaleString()} off (${estateErrorPct2.toFixed(1)}% error)\n`);

  // Summary
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📋 SUMMARY\n');
  console.log('The client-side estimates do NOT account for:');
  console.log('  ❌ Federal and provincial tax brackets');
  console.log('  ❌ OAS clawback based on income thresholds');
  console.log('  ❌ RRSP/RRIF minimum withdrawals');
  console.log('  ❌ Asset depletion and growth');
  console.log('  ❌ Complex withdrawal strategies');
  console.log('  ❌ Tax on different income types\n');
  console.log('RECOMMENDATION: Migrate to real simulations via What-If API');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run the test
runAccuracyTest()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
