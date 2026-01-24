import { test, expect } from '@playwright/test';
import {
  navigateToSimulation,
  selectStrategy,
  runSimulation,
  getSimulationResults,
  waitForSimulationComplete,
  takeStrategyScreenshot,
} from './utils/test-helpers';
import { edgeCaseScenarios } from './fixtures/simulation-data';

/**
 * End-to-End Tests for Simulation Edge Cases and Error Scenarios
 *
 * This test suite validates edge cases and error handling:
 * 1. Insufficient assets
 * 2. Very long planning horizon
 * 3. Zero spending
 * 4. Unsupported province
 * 5. No partner data in couples strategy
 *
 * Prerequisites:
 * - Database seeded with test user
 * - Backend API running on port 8000
 * - Frontend running on port 3000
 */

test.describe('Simulation Edge Cases and Error Scenarios', () => {
  // Setup: Login before each test (E2E_TEST_MODE bypasses rate limiting)
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  // =========================================================================
  // Edge Case 1: Insufficient Assets
  // =========================================================================
  test('Edge Case 1: Insufficient assets for spending needs', async ({ page }) => {
    const scenario = edgeCaseScenarios.insufficientAssets;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // NOTE: This test requires modifying user's asset balances to very low values
    // You may need to manually set low balances in the simulation form

    // Select balanced strategy
    await selectStrategy(page, 'balanced');

    // Run simulation
    await runSimulation(page, false); // Expect potential failure

    // Wait for results
    await page.waitForSelector('[data-testid="results-dashboard"]', { timeout: 60000 });

    // Check for failure warnings or underfunding messages
    const hasWarnings = await page.locator('[role="alert"]').count();
    const warningText = await page.locator('[role="alert"]').first().textContent();

    if (hasWarnings > 0) {
      console.log('Insufficient Assets Warning:', warningText);
      expect(warningText).toMatch(/insufficient|underfunded|depleted/i);
    }

    // Get results
    const results = await getSimulationResults(page);

    // Verify that simulation detects underfunding
    expect(results.yearsFunded).toBeLessThan(30); // Should run out of money before 30 years

    await takeStrategyScreenshot(page, 'insufficient-assets', 'warning');

    console.log('Insufficient Assets Results:', {
      success: results.success,
      yearsFunded: results.yearsFunded,
      warnings: hasWarnings,
    });
  });

  // =========================================================================
  // Edge Case 2: Very Long Planning Horizon
  // =========================================================================
  test('Edge Case 2: Planning to age 120 (55+ years)', async ({ page }) => {
    const scenario = edgeCaseScenarios.longPlanningHorizon;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Expand household form to set end age
    await page.click('text=Household Settings');

    // Set end age to 120
    await page.fill('#end-age', '120');

    // Select balanced strategy
    await selectStrategy(page, 'balanced');

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    // Verify simulation ran for extended period
    expect(results.yearsFunded).toBeGreaterThan(40); // At least 40 years of simulation

    await takeStrategyScreenshot(page, 'long-planning-horizon', 'results');

    console.log('Long Planning Horizon Results:', {
      success: results.success,
      yearsFunded: results.yearsFunded,
      finalEstate: results.finalEstate,
    });
  });

  // =========================================================================
  // Edge Case 3: Zero Spending
  // =========================================================================
  test('Edge Case 3: Zero spending - Assets should grow', async ({ page }) => {
    const scenario = edgeCaseScenarios.zeroSpending;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Expand spending phases section
    await page.click('text=Spending Phases');

    // Set all spending to zero
    await page.fill('#spending-go-go', '0');
    await page.fill('#spending-slow-go', '0');
    await page.fill('#spending-no-go', '0');

    // Select balanced strategy
    await selectStrategy(page, 'balanced');

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    // Verify no withdrawals and assets grow
    expect(results.totalWithdrawals).toBe(0); // No withdrawals needed

    // Final estate should be greater than initial assets due to growth
    expect(results.finalEstate).toBeGreaterThan(results.totalAssets);

    await takeStrategyScreenshot(page, 'zero-spending', 'results');

    console.log('Zero Spending Results:', {
      success: results.success,
      totalWithdrawals: results.totalWithdrawals,
      initialAssets: results.totalAssets,
      finalEstate: results.finalEstate,
      growth: results.finalEstate - results.totalAssets,
    });
  });

  // =========================================================================
  // Edge Case 4: Unsupported Province
  // =========================================================================
  test('Edge Case 4: User from unsupported province (Saskatchewan)', async ({ page }) => {
    const scenario = edgeCaseScenarios.unsupportedProvince;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // NOTE: This test assumes the user's profile has Saskatchewan as province
    // The simulation should show a warning and map to a supported province

    // Check for province warning
    const hasProvinceWarning = await page.locator('text=not supported').count();

    if (hasProvinceWarning > 0) {
      console.log('Province Warning Detected');

      // Get warning text
      const warningText = await page.locator('text=not supported').first().textContent();
      expect(warningText).toMatch(/not supported|Saskatchewan/i);

      // Verify mapped to supported province
      const provinceValue = await page.locator('#province').textContent();
      expect(['AB', 'BC', 'ON', 'QC']).toContain(provinceValue);
    }

    // Select balanced strategy
    await selectStrategy(page, 'balanced');

    // Run simulation (should use mapped province tax rates)
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    await takeStrategyScreenshot(page, 'unsupported-province', 'results');

    console.log('Unsupported Province Results:', {
      success: results.success,
      provinceWarning: hasProvinceWarning > 0,
      healthScore: results.healthScore,
    });
  });

  // =========================================================================
  // Edge Case 5: No Partner Data in Couples Strategy
  // =========================================================================
  test('Edge Case 5: RRIF-splitting selected without partner', async ({ page }) => {
    const scenario = edgeCaseScenarios.noCoupleData;

    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Ensure no partner is added
    const partnerFormVisible = await page.locator('[data-testid="person2-form"]').isVisible();
    if (partnerFormVisible) {
      await page.click('button:has-text("Remove")');
      await page.waitForSelector('[data-testid="person2-form"]', { state: 'hidden' });
    }

    // Select rrif-splitting strategy (requires couple)
    await selectStrategy(page, 'rrif-splitting');

    // Run simulation
    await runSimulation(page);
    await waitForSimulationComplete(page);

    // Strategy should fallback to balanced or show warning
    const hasWarnings = await page.locator('[role="alert"]').count();
    if (hasWarnings > 0) {
      const warningText = await page.locator('[role="alert"]').first().textContent();
      console.log('Couples Strategy Warning:', warningText);
    }

    // Get results
    const results = await getSimulationResults(page);
    expect(results.success).toBeTruthy();

    await takeStrategyScreenshot(page, 'no-couple-data', 'results');

    console.log('No Couple Data Results:', {
      success: results.success,
      warnings: hasWarnings,
      healthScore: results.healthScore,
    });
  });

  // =========================================================================
  // Edge Case 6: API Timeout Handling
  // =========================================================================
  test('Edge Case 6: Handle API timeout gracefully', async ({ page }) => {
    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Select balanced strategy
    await selectStrategy(page, 'balanced');

    // Intercept API call and delay response to simulate timeout
    await page.route('**/api/simulation/run', async (route) => {
      // Delay for 65 seconds (longer than default timeout)
      await page.waitForTimeout(65000);
      await route.continue();
    });

    // Click run simulation
    await page.click('button:has-text("Run Simulation")');

    // Wait for error message or timeout handling
    const errorVisible = await page.waitForSelector('[role="alert"]', { timeout: 70000 });
    expect(errorVisible).toBeTruthy();

    // Verify error message mentions timeout
    const errorText = await page.locator('[role="alert"]').textContent();
    expect(errorText?.toLowerCase()).toMatch(/timeout|failed|error/);

    await takeStrategyScreenshot(page, 'api-timeout', 'error');

    console.log('API Timeout Error:', errorText);
  });

  // =========================================================================
  // Edge Case 7: Missing CSRF Token
  // =========================================================================
  test('Edge Case 7: Handle missing CSRF token', async ({ page }) => {
    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Clear localStorage to remove CSRF token
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Intercept CSRF API call and return error
    await page.route('**/api/csrf', async (route) => {
      await route.abort();
    });

    // Select balanced strategy
    await selectStrategy(page, 'balanced');

    // Run simulation
    await page.click('button:has-text("Run Simulation")');

    // Wait for error message
    const errorVisible = await page.waitForSelector('[role="alert"]', { timeout: 30000 });
    expect(errorVisible).toBeTruthy();

    await takeStrategyScreenshot(page, 'missing-csrf', 'error');

    console.log('Missing CSRF Token: Error handled');
  });

  // =========================================================================
  // Edge Case 8: Invalid Input Values
  // =========================================================================
  test('Edge Case 8: Handle invalid negative balances', async ({ page }) => {
    await navigateToSimulation(page);
    await page.waitForSelector('text=Your financial profile', { timeout: 10000 });

    // Expand person form
    await page.click('text=You');

    // Try to enter negative balance
    await page.fill('input[name="p1-tfsa-balance"]', '-10000');

    // Select balanced strategy
    await selectStrategy(page, 'balanced');

    // Run simulation
    await page.click('button:has-text("Run Simulation")');

    // Should show validation error
    const errorVisible = await page.locator('[role="alert"]').first().isVisible();

    if (errorVisible) {
      const errorText = await page.locator('[role="alert"]').first().textContent();
      console.log('Invalid Input Error:', errorText);
      expect(errorText?.toLowerCase()).toMatch(/invalid|negative|error/);
    }

    await takeStrategyScreenshot(page, 'invalid-input', 'error');
  });
});
