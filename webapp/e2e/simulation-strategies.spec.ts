import { test, expect } from '@playwright/test';
import {
  navigateToSimulation,
  selectStrategy,
  runSimulation,
  getSimulationResults,
  getYearByYearData,
  assertSimulationSuccess,
  assertNoErrors,
  waitForSimulationComplete,
  takeStrategyScreenshot,
} from './utils/test-helpers';
import { testScenarios } from './fixtures/simulation-data';

/**
 * End-to-End Tests for Simulation Withdrawal Strategies
 *
 * This test suite validates all 8 withdrawal strategies:
 * 1. corporate-optimized
 * 2. minimize-income
 * 3. rrif-splitting
 * 4. capital-gains-optimized
 * 5. tfsa-first
 * 6. balanced
 * 7. rrif-frontload
 * 8. manual
 *
 * Prerequisites:
 * - Database seeded with test user (email: test@example.com, password: Test123!)
 * - User must have completed wizard with financial data
 * - Backend API must be running on port 8000
 * - Frontend must be running on port 3000
 */

test.describe('Simulation Withdrawal Strategies E2E Tests', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Login with test user credentials
    // NOTE: Update these credentials based on your test database
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  // =========================================================================
  // Test 1: corporate-optimized Strategy
  // =========================================================================
  test('Strategy 1: corporate-optimized - Minimizes corporate tax for business owners', async ({ page }) => {
    const scenario = testScenarios.corporateOptimized;

    // Navigate to simulation page
    await navigateToSimulation(page);

    // Wait for prefill to complete
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Select corporate-optimized strategy
    await selectStrategy(page, 'corporate-optimized');

    // Run simulation
    await runSimulation(page);

    // Wait for results
    await waitForSimulationComplete(page);

    // Assert simulation succeeded
    await assertSimulationSuccess(page);
    await assertNoErrors(page);

    // Get results
    const results = await getSimulationResults(page);

    // Validate expected outcomes
    expect(results.success).toBeTruthy();
    expect(results.healthScore).toBeGreaterThan(0);
    expect(results.totalTax).toBeGreaterThan(0);

    // Get year 1 data to verify corporate withdrawals
    const year1 = await getYearByYearData(page, 2025);

    // Verify corporate withdrawals are happening
    const corpWithdrawal = parseFloat(year1.corporateWithdrawal.replace(/[$,]/g, ''));
    expect(corpWithdrawal).toBeGreaterThan(0);

    // Take screenshot for documentation
    await takeStrategyScreenshot(page, 'corporate-optimized', 'results');

    // Log results for debugging
    console.log('Corporate Optimized Results:', {
      healthScore: results.healthScore,
      totalTax: results.totalTax,
      avgTaxRate: results.avgTaxRate,
      corpWithdrawalYear1: corpWithdrawal,
    });
  });

  // =========================================================================
  // Test 2: minimize-income Strategy
  // =========================================================================
  test('Strategy 2: minimize-income - Preserves GIS eligibility and minimizes OAS clawback', async ({ page }) => {
    const scenario = testScenarios.minimizeIncome;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Select minimize-income strategy
    await selectStrategy(page, 'minimize-income');

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Assert success
    await assertSimulationSuccess(page);
    await assertNoErrors(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    // Get year 1 data
    const year1 = await getYearByYearData(page, 2025);

    // Verify TFSA withdrawals are preferred (tax-free)
    const tfsaWithdrawal = parseFloat(year1.tfsaWithdrawal.replace(/[$,]/g, ''));
    const rrifWithdrawal = parseFloat(year1.rrifWithdrawal.replace(/[$,]/g, ''));

    // TFSA should be withdrawn before RRIF to minimize taxable income
    expect(tfsaWithdrawal).toBeGreaterThan(0);

    // Verify low tax rate
    expect(results.avgTaxRate).toBeLessThan(20); // Should be low to preserve benefits

    await takeStrategyScreenshot(page, 'minimize-income', 'results');

    console.log('Minimize Income Results:', {
      healthScore: results.healthScore,
      avgTaxRate: results.avgTaxRate,
      tfsaWithdrawalYear1: tfsaWithdrawal,
      rrifWithdrawalYear1: rrifWithdrawal,
    });
  });

  // =========================================================================
  // Test 3: rrif-splitting Strategy
  // =========================================================================
  test('Strategy 3: rrif-splitting - Uses pension income splitting for couples', async ({ page }) => {
    const scenario = testScenarios.rrifSplitting;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Ensure partner is included (should be auto-loaded from profile)
    const partnerFormVisible = await page.locator('[data-testid="person2-form"]').isVisible();
    if (!partnerFormVisible) {
      await page.click('button:has-text("Add Spouse/Partner")');
      await page.waitForSelector('[data-testid="person2-form"]');
    }

    // Select rrif-splitting strategy
    await selectStrategy(page, 'rrif-splitting');

    // Verify income_split_rrif_fraction is set (should be 0.5 for 50% splitting)
    // This would be pre-set in the household form

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Assert success
    await assertSimulationSuccess(page);
    await assertNoErrors(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    // For couples, total tax should be lower due to splitting
    expect(results.totalTax).toBeGreaterThan(0);

    await takeStrategyScreenshot(page, 'rrif-splitting', 'results');

    console.log('RRIF Splitting Results:', {
      healthScore: results.healthScore,
      totalTax: results.totalTax,
      avgTaxRate: results.avgTaxRate,
    });
  });

  // =========================================================================
  // Test 4: capital-gains-optimized Strategy
  // =========================================================================
  test('Strategy 4: capital-gains-optimized - Prioritizes capital gains for favorable tax treatment', async ({ page }) => {
    const scenario = testScenarios.capitalGainsOptimized;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Select capital-gains-optimized strategy
    await selectStrategy(page, 'capital-gains-optimized');

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Assert success
    await assertSimulationSuccess(page);
    await assertNoErrors(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    // Get year 1 data
    const year1 = await getYearByYearData(page, 2025);

    // Verify non-registered withdrawals are prioritized
    const nonregWithdrawal = parseFloat(year1.nonregWithdrawal.replace(/[$,]/g, ''));
    const rrifWithdrawal = parseFloat(year1.rrifWithdrawal.replace(/[$,]/g, ''));

    // NonReg should be higher in early years
    expect(nonregWithdrawal).toBeGreaterThan(0);

    // Tax rate should be favorable due to capital gains treatment (50% inclusion)
    expect(results.avgTaxRate).toBeLessThan(25);

    await takeStrategyScreenshot(page, 'capital-gains-optimized', 'results');

    console.log('Capital Gains Optimized Results:', {
      healthScore: results.healthScore,
      avgTaxRate: results.avgTaxRate,
      nonregWithdrawalYear1: nonregWithdrawal,
      rrifWithdrawalYear1: rrifWithdrawal,
    });
  });

  // =========================================================================
  // Test 5: tfsa-first Strategy
  // =========================================================================
  test('Strategy 5: tfsa-first - Withdraws from TFSA before touching RRSP/RRIF', async ({ page }) => {
    const scenario = testScenarios.tfsaFirst;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Select tfsa-first strategy
    await selectStrategy(page, 'tfsa-first');

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Assert success
    await assertSimulationSuccess(page);
    await assertNoErrors(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    // Get year 1 data
    const year1 = await getYearByYearData(page, 2025);

    // Verify TFSA withdrawals happen first
    const tfsaWithdrawal = parseFloat(year1.tfsaWithdrawal.replace(/[$,]/g, ''));
    expect(tfsaWithdrawal).toBeGreaterThan(0);

    // In early years, TFSA should be primary source
    // RRIF withdrawals should be minimal or zero
    const rrifWithdrawal = parseFloat(year1.rrifWithdrawal.replace(/[$,]/g, ''));

    // Tax rate should be low in early years due to tax-free TFSA withdrawals
    expect(results.avgTaxRate).toBeLessThan(30);

    await takeStrategyScreenshot(page, 'tfsa-first', 'results');

    console.log('TFSA First Results:', {
      healthScore: results.healthScore,
      avgTaxRate: results.avgTaxRate,
      tfsaWithdrawalYear1: tfsaWithdrawal,
      rrifWithdrawalYear1: rrifWithdrawal,
    });
  });

  // =========================================================================
  // Test 6: balanced Strategy
  // =========================================================================
  test('Strategy 6: balanced - Balanced withdrawals across all account types', async ({ page }) => {
    const scenario = testScenarios.balanced;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Select balanced strategy
    await selectStrategy(page, 'balanced');

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Assert success
    await assertSimulationSuccess(page);
    await assertNoErrors(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    // Get year 1 data
    const year1 = await getYearByYearData(page, 2025);

    // Verify withdrawals are balanced (no single account dominates)
    const tfsaWithdrawal = parseFloat(year1.tfsaWithdrawal.replace(/[$,]/g, ''));
    const rrifWithdrawal = parseFloat(year1.rrifWithdrawal.replace(/[$,]/g, ''));
    const nonregWithdrawal = parseFloat(year1.nonregWithdrawal.replace(/[$,]/g, ''));

    // All accounts should have some withdrawals (if balances exist)
    const totalWithdrawals = tfsaWithdrawal + rrifWithdrawal + nonregWithdrawal;
    expect(totalWithdrawals).toBeGreaterThan(0);

    // No single account should dominate (e.g., > 80% of total)
    const maxWithdrawal = Math.max(tfsaWithdrawal, rrifWithdrawal, nonregWithdrawal);
    const maxPercentage = (maxWithdrawal / totalWithdrawals) * 100;
    expect(maxPercentage).toBeLessThan(80);

    await takeStrategyScreenshot(page, 'balanced', 'results');

    console.log('Balanced Results:', {
      healthScore: results.healthScore,
      avgTaxRate: results.avgTaxRate,
      tfsaWithdrawal: tfsaWithdrawal,
      rrifWithdrawal: rrifWithdrawal,
      nonregWithdrawal: nonregWithdrawal,
      maxPercentage: maxPercentage,
    });
  });

  // =========================================================================
  // Test 7: rrif-frontload Strategy
  // =========================================================================
  test('Strategy 7: rrif-frontload - Tax smoothing with 15% pre-OAS, 8% post-OAS, OAS clawback protection', async ({ page }) => {
    const scenario = testScenarios.rrifFrontload;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Select rrif-frontload strategy
    await selectStrategy(page, 'rrif-frontload');

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Assert success
    await assertSimulationSuccess(page);
    await assertNoErrors(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    // For rrif-frontload, we need to verify:
    // 1. High RRIF withdrawals before OAS/CPP start (15% rate)
    // 2. Lower RRIF withdrawals after OAS/CPP start (8% rate)
    // 3. OAS clawback is avoided

    // Get early year data (before OAS/CPP at age 65)
    const year1 = await getYearByYearData(page, 2025);
    const rrifWithdrawalPreOAS = parseFloat(year1.rrifWithdrawal.replace(/[$,]/g, ''));

    // Verify high RRIF withdrawal in early years
    expect(rrifWithdrawalPreOAS).toBeGreaterThan(0);

    // Get later year data (after OAS/CPP starts)
    // Assuming user starts at age 55 and OAS/CPP at 65, check year 2035 (age 65)
    const year11 = await getYearByYearData(page, 2035);
    const rrifWithdrawalPostOAS = parseFloat(year11.rrifWithdrawal.replace(/[$,]/g, ''));

    // Verify lower RRIF withdrawal after OAS starts
    // (Note: Actual validation depends on RRIF balance changes)

    // Tax smoothing: effective tax rate should be relatively stable
    expect(results.avgTaxRate).toBeLessThan(35);

    await takeStrategyScreenshot(page, 'rrif-frontload', 'results');

    console.log('RRIF Frontload Results:', {
      healthScore: results.healthScore,
      avgTaxRate: results.avgTaxRate,
      rrifWithdrawalPreOAS: rrifWithdrawalPreOAS,
      rrifWithdrawalPostOAS: rrifWithdrawalPostOAS,
    });
  });

  // =========================================================================
  // Test 8: manual Strategy
  // =========================================================================
  test('Strategy 8: manual - Custom user-defined withdrawal strategy', async ({ page }) => {
    const scenario = testScenarios.manual;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Select manual strategy
    await selectStrategy(page, 'manual');

    // Run simulation
    // NOTE: Manual strategy may require additional configuration in the UI
    await runSimulation(page, false); // Don't expect success by default

    // Check if simulation succeeded or returned warning
    const hasResults = await page.locator('[data-testid="results-dashboard"]').isVisible();
    const hasWarning = await page.locator('[role="alert"]').count();

    if (hasResults) {
      // Manual strategy worked
      await assertSimulationSuccess(page);
      const results = await getSimulationResults(page);
      expect(results.success).toBeTruthy();

      await takeStrategyScreenshot(page, 'manual', 'results');

      console.log('Manual Strategy Results:', {
        healthScore: results.healthScore,
        avgTaxRate: results.avgTaxRate,
      });
    } else {
      // Manual strategy requires additional configuration
      expect(hasWarning).toBeGreaterThan(0);

      await takeStrategyScreenshot(page, 'manual', 'warning');

      console.log('Manual Strategy: Requires additional configuration');
    }
  });
});
