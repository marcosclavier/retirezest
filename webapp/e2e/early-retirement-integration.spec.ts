import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!',
};

test.describe('Early Retirement Calculator - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Early Retirement link is present in navigation', async ({ page }) => {
    // Check desktop navigation
    const desktopNav = page.locator('nav.hidden.md\\:block a[href="/early-retirement"]');
    await expect(desktopNav).toBeVisible();
    await expect(desktopNav).toHaveText('Early Retirement');

    console.log('✓ Early Retirement link found in desktop navigation');
  });

  test('Early Retirement CTA appears on dashboard for young users', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if Early Retirement CTA is visible
    // Note: This will only show if user's age < 55
    const earlyRetirementCTA = page.locator('text=Planning Early Retirement?');
    const isVisible = await earlyRetirementCTA.isVisible().catch(() => false);

    if (isVisible) {
      console.log('✓ Early Retirement CTA is visible on dashboard');
      await expect(earlyRetirementCTA).toBeVisible();

      // Check for the link
      const ctaLink = page.locator('a[href="/early-retirement"]:has-text("Check Early Retirement")');
      await expect(ctaLink).toBeVisible();
      console.log('✓ Early Retirement CTA link is present');
    } else {
      console.log('ℹ Early Retirement CTA not visible (user may be 55+ years old)');
    }
  });

  test('Landing page shows integrated journey messaging', async ({ page }) => {
    // Logout first
    await page.goto('/dashboard');
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out")');
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
    }

    // Go to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for updated "How It Works" section
    const dreamToReality = page.locator('text=From Dream to Reality');
    await expect(dreamToReality).toBeVisible();
    console.log('✓ "From Dream to Reality" headline found on landing page');

    // Check for the 3-step journey
    const feasibilityCheck = page.locator('text=Quick Feasibility Check');
    await expect(feasibilityCheck).toBeVisible();
    console.log('✓ "Quick Feasibility Check" step found');

    const completeProfile = page.locator('text=Complete Your Profile');
    await expect(completeProfile).toBeVisible();
    console.log('✓ "Complete Your Profile" step found');

    const optimizedPlan = page.locator('text=Get Your Optimized Plan');
    await expect(optimizedPlan).toBeVisible();
    console.log('✓ "Get Your Optimized Plan" step found');
  });

  test('Early retirement calculator loads and works', async ({ page }) => {
    // Navigate to early retirement calculator
    await page.goto('/early-retirement');
    await page.waitForLoadState('networkidle');

    // Check main heading
    await expect(page.locator('h1:has-text("Early Retirement Calculator")')).toBeVisible();
    console.log('✓ Early Retirement Calculator page loaded');

    // Check for main components
    const hasLoading = await page.locator('text=Loading your profile').isVisible().catch(() => false);
    const hasResults = await page.locator('text=Early Retirement Readiness').isVisible().catch(() => false);
    const hasNoProfile = await page.locator('text=Setup Required').isVisible().catch(() => false);

    // One of these should be visible
    expect(hasLoading || hasResults || hasNoProfile).toBe(true);

    if (hasNoProfile) {
      console.log('ℹ User needs to complete profile first');

      // Check for profile link
      const profileLink = page.locator('a[href="/profile"]');
      await expect(profileLink).toBeVisible();
      console.log('✓ Profile setup link is present');
    } else if (hasResults) {
      console.log('✓ Early Retirement results are displayed');

      // Check for "Run Full Simulation" link (may have multiple instances)
      const simulationLink = page.locator('a[href="/simulation"]:has-text("Run Full Simulation")').first();
      await expect(simulationLink).toBeVisible();
      console.log('✓ Link to Full Simulation is present');
    } else {
      console.log('ℹ Profile is loading');
    }
  });

  test('Complete user journey from landing to early retirement', async ({ page }) => {
    // Start from landing page (logout first)
    await page.goto('/dashboard');
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out")');
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    }

    // Go to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify landing page messaging
    await expect(page.locator('text=From Dream to Reality')).toBeVisible();
    console.log('✓ Step 1: Landing page shows integrated journey');

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Step 2: User logged in');

    // Check dashboard for Early Retirement CTA
    const earlyRetirementCTA = page.locator('text=Planning Early Retirement?');
    const ctaVisible = await earlyRetirementCTA.isVisible().catch(() => false);

    if (ctaVisible) {
      console.log('✓ Step 3: Dashboard shows Early Retirement CTA');
    } else {
      console.log('ℹ Step 3: Early Retirement CTA not shown (user 55+)');
    }

    // Navigate to Early Retirement via nav
    await page.click('a[href="/early-retirement"]');
    await page.waitForURL('**/early-retirement', { timeout: 10000 });
    console.log('✓ Step 4: Navigated to Early Retirement Calculator');

    // Verify page loaded
    await expect(page.locator('h1:has-text("Early Retirement Calculator")')).toBeVisible();
    console.log('✓ Step 5: Early Retirement Calculator loaded successfully');
  });
});
