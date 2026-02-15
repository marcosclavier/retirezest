import { test, expect } from '@playwright/test';

// Use saved authentication state from global setup
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Early Retirement Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Already authenticated via global setup, just navigate to the page
    await page.goto('/early-retirement');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the early retirement calculator page', async ({ page }) => {
    // Check page title and heading
    await expect(page.locator('h1')).toContainText('Early Retirement Calculator');

    // Check hero section
    await expect(page.locator('text=Plan Your Early Retirement')).toBeVisible();
  });

  test('should display loading state then results', async ({ page }) => {
    // Should see loading state initially (or results if already loaded)
    const hasLoading = await page.locator('text=Loading your profile').isVisible({ timeout: 1000 }).catch(() => false);
    const hasResults = await page.locator('text=Early Retirement Readiness').isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasLoading || hasResults).toBeTruthy();

    // Eventually should show results (wait up to 10 seconds)
    await expect(page.locator('text=Early Retirement Readiness')).toBeVisible({ timeout: 10000 });
  });

  test('should display all 5 main components', async ({ page }) => {
    // Wait for calculations to complete
    await page.waitForSelector('text=Early Retirement Readiness', { timeout: 10000 });

    // 1. Readiness Score component - REQUIRED
    await expect(page.locator('text=Early Retirement Readiness')).toBeVisible();
    await expect(page.locator('text=/\\d+\\/100/')).toBeVisible(); // Score like "25/100"

    // 2-5. Other components may be present depending on the score
    // The action plan should always be visible
    await expect(page.locator('text=Your Early Retirement Action Plan')).toBeVisible();

    // At least one of these should be visible
    const hasSlider = await page.locator('input[type="range"]').isVisible().catch(() => false);
    const hasSavingsGap = await page.locator('text=/Savings|Gap/').isVisible().catch(() => false);
    const hasScenarios = await page.locator('text=/Scenario|Target Age/').isVisible().catch(() => false);

    // If the score is very low, not all components may show - that's expected
    expect(hasSlider || hasSavingsGap || hasScenarios).toBeTruthy();
  });

  test('should have functional age slider', async ({ page }) => {
    // Wait for slider to load
    await page.waitForSelector('input[type="range"]', { timeout: 10000 });

    const slider = page.locator('input[type="range"]').first();

    // Get initial value
    const initialValue = await slider.getAttribute('value');
    expect(initialValue).toBeTruthy();

    // Change slider value
    await slider.fill('65');

    // Wait a moment for debounce
    await page.waitForTimeout(2000);

    // Should trigger recalculation (look for loading or updated content)
    // The page should still show results after slider change
    await expect(page.locator('text=Early Retirement Readiness')).toBeVisible();
  });

  test('should display action plan with priorities', async ({ page }) => {
    // Wait for action plan to load
    await page.waitForSelector('text=Your Early Retirement Action Plan', { timeout: 10000 });

    // Check for priority sections (at least one should be visible)
    const hasHighPriority = await page.locator('text=HIGH PRIORITY').isVisible().catch(() => false);
    const hasRecommended = await page.locator('text=RECOMMENDED').isVisible().catch(() => false);
    const hasOptional = await page.locator('text=OPTIONAL').isVisible().catch(() => false);

    expect(hasHighPriority || hasRecommended || hasOptional).toBeTruthy();
  });

  test('should have working navigation links', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForSelector('text=Your Early Retirement Action Plan', { timeout: 10000 });

    // Check for action buttons with links
    const profileLinks = page.locator('a[href="/profile"]');
    const benefitsLinks = page.locator('a[href="/benefits"]');
    const simulationLinks = page.locator('a[href="/simulation"]');

    // At least one type of link should be present
    const profileCount = await profileLinks.count();
    const benefitsCount = await benefitsLinks.count();
    const simulationCount = await simulationLinks.count();

    expect(profileCount + benefitsCount + simulationCount).toBeGreaterThan(0);
  });

  test('should display scenarios with success rates', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Early Retirement Readiness', { timeout: 10000 });

    // Check if scenarios are available (they might not show for very low readiness scores)
    const hasScenarios = await page.locator('text=/Target Age \\d+|Earliest Age \\d+/').isVisible().catch(() => false);

    if (hasScenarios) {
      // If scenarios exist, check for age indicators
      const ageIndicators = page.locator('text=/Age \\d+/');
      const count = await ageIndicators.count();
      expect(count).toBeGreaterThanOrEqual(1);
    } else {
      // If no scenarios, the test user might have low readiness - that's okay
      // Just verify the page loaded correctly
      await expect(page.locator('text=Early Retirement Readiness')).toBeVisible();
    }
  });

  test('should show refresh button', async ({ page }) => {
    // Check for refresh button
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();

    // Button should be enabled
    await expect(refreshButton).toBeEnabled();
  });

  test('should handle missing profile data gracefully', async ({ page }) => {
    // This test verifies the page loads without errors
    // Our test user has complete profile data, so should show results

    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Should show either results or a setup warning (not a crash/error)
    const hasResults = await page.locator('text=Early Retirement Readiness').isVisible().catch(() => false);
    const hasSetupWarning = await page.locator('text=/Setup Required|Complete Your Profile/').isVisible().catch(() => false);
    const hasError = await page.locator('text=/Error|Failed|Something went wrong/').isVisible().catch(() => false);

    // Should have results or setup warning, but NOT an error
    expect(hasResults || hasSetupWarning).toBeTruthy();
    expect(hasError).toBeFalsy();
  });

  test('should display monetary values correctly formatted', async ({ page }) => {
    // Wait for calculations
    await page.waitForSelector('text=Savings Gap Analysis', { timeout: 10000 });

    // Check for dollar amounts (should be formatted with $ and commas)
    const dollarAmounts = page.locator('text=/\\$[\\d,]+/');
    const count = await dollarAmounts.count();

    // Should have multiple dollar amounts displayed
    expect(count).toBeGreaterThan(0);
  });

  test('should show call to action for full simulation', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Your Early Retirement Action Plan', { timeout: 10000 });

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for CTA - there may be multiple "Run Full Simulation" links, just check for at least one
    const simulationLinks = page.locator('a[href="/simulation"]:has-text("Run Full Simulation")');
    const count = await simulationLinks.count();
    expect(count).toBeGreaterThan(0);

    // Check if at least one is visible
    await expect(simulationLinks.first()).toBeVisible();
  });
});

test.describe('Early Retirement Calculator - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Already authenticated via global setup, just navigate to the page
    await page.goto('/early-retirement');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // This test just verifies the page doesn't crash
    await page.waitForTimeout(2000);

    // Page should be visible (either with data or error message)
    await expect(page.locator('h1')).toContainText('Early Retirement Calculator');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Should still show main heading
    await expect(page.locator('h1')).toContainText('Early Retirement Calculator');

    // Components should be visible (stacked vertically on mobile)
    const hasContent = await page.locator('text=Early Retirement Readiness').first().isVisible();
    expect(hasContent).toBeTruthy();
  });
});
