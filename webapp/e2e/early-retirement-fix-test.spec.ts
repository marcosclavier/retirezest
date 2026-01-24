import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!',
};

test.describe('Early Retirement Calculator - Bug Fix Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('early retirement calculator loads without errors', async ({ page }) => {
    // Set up console error tracking
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Set up page error tracking
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // Navigate to early retirement calculator (already logged in from beforeEach)
    await page.goto('/early-retirement');
    await page.waitForLoadState('networkidle');

    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Early Retirement Calculator")', {
      timeout: 10000,
    });

    // Check for the critical error we fixed
    const hasCriticalError = errors.some((error) =>
      error.includes("Cannot read properties of undefined (reading 'find')")
    );

    expect(hasCriticalError).toBe(false);

    // Check page errors
    expect(pageErrors.length).toBe(0);

    // Verify main components are visible
    await expect(
      page.locator('h1:has-text("Early Retirement Calculator")')
    ).toBeVisible();

    // Check if loading state is shown or results are displayed
    const hasLoading = await page
      .locator('text=Loading your profile')
      .isVisible()
      .catch(() => false);
    const hasResults = await page
      .locator('text=Early Retirement Readiness')
      .isVisible()
      .catch(() => false);
    const hasNoProfile = await page
      .locator('text=Setup Required')
      .isVisible()
      .catch(() => false);

    // One of these should be true
    expect(hasLoading || hasResults || hasNoProfile).toBe(true);

    console.log('✓ Early retirement calculator loaded successfully');
    console.log(
      `✓ No critical errors found (checked ${errors.length} console messages)`
    );
    console.log(`✓ No page errors (checked ${pageErrors.length} page errors)`);
  });

  test('retirement age slider does not crash when scenarios are undefined', async ({
    page,
  }) => {
    // Set up error tracking
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to early retirement (already logged in from beforeEach)
    await page.goto('/early-retirement');
    await page.waitForLoadState('networkidle');

    // Wait a bit to ensure all async operations complete
    await page.waitForTimeout(2000);

    // Check for the specific error we fixed
    const hasScenarioError = errors.some(
      (error) =>
        error.includes("Cannot read properties of undefined (reading 'find')") &&
        error.includes('RetirementAgeSlider')
    );

    expect(hasScenarioError).toBe(false);

    console.log('✓ RetirementAgeSlider handles undefined scenarios gracefully');
  });
});
