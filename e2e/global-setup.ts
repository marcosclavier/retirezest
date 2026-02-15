import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

/**
 * Global Setup for E2E Tests
 * Authenticates once and saves the session state for all tests to reuse
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const storageStatePath = path.join(__dirname, '../playwright/.auth/user.json');

  console.log('🔐 Setting up authentication for E2E tests...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });

    // Wait for form to be fully loaded and ready
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 10000 });

    // Fill in login credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.clear();
    await emailInput.fill('test@example.com');
    await passwordInput.clear();
    await passwordInput.fill('Test123!');

    // Wait for E2E mode to activate (Turnstile should be hidden)
    await page.waitForTimeout(2000);

    // Submit the form (use force: true to bypass Turnstile state)
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click({ force: true });

    // Wait for login API response
    await page.waitForTimeout(5000);

    // Check for error messages
    const errorMessage = await page.locator('.bg-red-50').textContent().catch(() => null);
    if (errorMessage) {
      console.error('❌ Login error:', errorMessage);
      throw new Error(`Login failed: ${errorMessage}`);
    }

    // Wait for navigation after login
    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 30000 }),
      page.waitForURL('**/welcome-choice', { timeout: 30000 }),
    ]);

    // If redirected to welcome-choice, navigate directly to dashboard
    if (page.url().includes('/welcome-choice')) {
      await page.goto(`${baseURL}/dashboard`);
      await page.waitForLoadState('networkidle');
    }

    // Save authenticated state
    await context.storageState({ path: storageStatePath });
    console.log(`✅ Authentication state saved`);

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
