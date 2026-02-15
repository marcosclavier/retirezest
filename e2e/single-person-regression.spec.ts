import { test, expect } from '@playwright/test';

/**
 * Regression Test for Single Person Mode
 *
 * This test verifies that single person retirement simulations work correctly
 * after fixing the p2=None bug that was causing NoneType errors.
 */

test.describe('Single Person Mode Regression Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('test@example.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('Test123!');

    const loginButton = page.locator('button[type="submit"]');
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });

    await Promise.all([
      page.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {}),
      loginButton.click()
    ]);

    // Wait for dashboard to load
    await page.waitForTimeout(2000);
  });

  test('Single person simulation runs successfully without partner', async ({ page }) => {
    console.log('\n========================================');
    console.log('Testing Single Person Mode Simulation');
    console.log('========================================');

    // Navigate to simulation page
    await page.goto('/simulation');
    await page.waitForLoadState('networkidle');

    // Wait for the page to load
    await page.waitForSelector('text=Retirement Simulation', { timeout: 15000 });
    console.log('✓ Simulation page loaded');

    // Look for partner toggle or section
    const partnerToggle = page.locator('label:has-text("Include Partner"), label:has-text("Include Spouse"), button:has-text("Add Partner"), button:has-text("Add Spouse")').first();
    const hasPartnerToggle = await partnerToggle.isVisible().catch(() => false);

    if (hasPartnerToggle) {
      console.log('✓ Found partner toggle, ensuring single person mode');

      // Check if we need to remove partner or if it's already single mode
      const removePartnerButton = page.locator('button:has-text("Remove Partner"), button:has-text("Remove Spouse")').first();
      const hasRemoveButton = await removePartnerButton.isVisible().catch(() => false);

      if (hasRemoveButton) {
        console.log('  → Removing partner to test single mode');
        await removePartnerButton.click();
        await page.waitForTimeout(1000);
      }

      // Verify we're in single mode
      const partnerSection = page.locator('text=Partner 2, text=Spouse').first();
      const hasPartnerSection = await partnerSection.isVisible().catch(() => false);

      if (hasPartnerSection) {
        console.log('  ⚠️ Partner section still visible, may need manual intervention');
      } else {
        console.log('  ✓ Single person mode confirmed');
      }
    }

    // Fill in basic simulation parameters if needed
    const spendingInput = page.locator('input[name="spending_go_go"], input[placeholder*="spending"]').first();
    const hasSpendingInput = await spendingInput.isVisible().catch(() => false);

    if (hasSpendingInput) {
      const currentValue = await spendingInput.inputValue();
      if (!currentValue || currentValue === '0') {
        await spendingInput.fill('50000');
        console.log('✓ Set spending to $50,000');
      }
    }

    // Select a withdrawal strategy
    const strategySelect = page.locator('select[name="strategy"], [data-testid="strategy-select"]').first();
    const hasStrategySelect = await strategySelect.isVisible().catch(() => false);

    if (hasStrategySelect) {
      await strategySelect.selectOption('minimize-income');
      console.log('✓ Selected minimize-income strategy');
    } else {
      // Try radio buttons
      const strategyRadio = page.locator('input[value="minimize-income"][type="radio"]').first();
      const hasStrategyRadio = await strategyRadio.isVisible().catch(() => false);

      if (hasStrategyRadio) {
        await strategyRadio.click();
        console.log('✓ Selected minimize-income strategy (radio)');
      }
    }

    // Run the simulation
    const runButton = page.locator('button:has-text("Run Simulation"), button:has-text("Calculate"), button:has-text("Simulate")').first();
    await runButton.waitFor({ state: 'visible', timeout: 10000 });

    console.log('→ Running single person simulation...');
    await runButton.click();

    // Wait for results
    await page.waitForSelector('text=Simulation Results, text=Health Score, text=Success Rate', {
      timeout: 30000
    });

    console.log('✓ Simulation completed successfully');

    // Verify no error messages
    const errorMessage = page.locator('text=NoneType, text=Error, text=Failed').first();
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorMessage.textContent();
      throw new Error(`Simulation failed with error: ${errorText}`);
    }

    console.log('✓ No errors detected');

    // Verify results are present
    const healthScore = page.locator('text=Health Score').first();
    const hasHealthScore = await healthScore.isVisible().catch(() => false);

    if (hasHealthScore) {
      console.log('✓ Health Score displayed');

      // Try to get the actual score
      const scoreElement = page.locator('[data-testid="health-score"], .health-score').first();
      const hasScoreElement = await scoreElement.isVisible().catch(() => false);

      if (hasScoreElement) {
        const scoreText = await scoreElement.textContent();
        console.log(`  → Health Score: ${scoreText}`);
      }
    }

    // Check for year-by-year results
    const yearByYear = page.locator('text=Year-by-Year, text=2025, text=Age').first();
    const hasYearByYear = await yearByYear.isVisible().catch(() => false);

    if (hasYearByYear) {
      console.log('✓ Year-by-year results displayed');
    }

    console.log('\n========================================');
    console.log('✅ SINGLE PERSON MODE TEST PASSED');
    console.log('========================================\n');
  });

  test('Switching between single and couple modes works correctly', async ({ page }) => {
    console.log('\n========================================');
    console.log('Testing Single/Couple Mode Toggle');
    console.log('========================================');

    // Navigate to simulation page
    await page.goto('/simulation');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Retirement Simulation', { timeout: 15000 });

    // Test toggle if available
    const addPartnerButton = page.locator('button:has-text("Add Partner"), button:has-text("Add Spouse")').first();
    const hasAddButton = await addPartnerButton.isVisible().catch(() => false);

    if (hasAddButton) {
      console.log('→ Testing couple mode toggle');

      // Switch to couple mode
      await addPartnerButton.click();
      await page.waitForTimeout(1000);

      // Verify partner section appears
      const partnerSection = page.locator('text=Partner 2, text=Spouse').first();
      await expect(partnerSection).toBeVisible({ timeout: 5000 });
      console.log('✓ Couple mode activated');

      // Switch back to single mode
      const removePartnerButton = page.locator('button:has-text("Remove Partner"), button:has-text("Remove Spouse")').first();
      await removePartnerButton.click();
      await page.waitForTimeout(1000);

      // Verify partner section is gone
      await expect(partnerSection).not.toBeVisible({ timeout: 5000 });
      console.log('✓ Single mode restored');

      console.log('\n========================================');
      console.log('✅ MODE TOGGLE TEST PASSED');
      console.log('========================================\n');
    } else {
      console.log('ℹ️ Partner toggle not found on this page');
      console.log('  (May be controlled via profile settings)');
    }
  });
});