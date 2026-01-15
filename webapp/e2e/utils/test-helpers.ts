import { Page, expect } from '@playwright/test';
import type { WithdrawalStrategy } from '@/lib/types/simulation';

/**
 * Test Helpers for Simulation E2E Tests
 * Provides reusable functions for common test operations
 */

// ============================================================================
// Authentication Helpers
// ============================================================================

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}

// ============================================================================
// Navigation Helpers
// ============================================================================

export async function navigateToSimulation(page: Page) {
  await page.goto('/simulation');
  // Wait for domcontentloaded instead of networkidle for better cross-browser compatibility
  await page.waitForLoadState('domcontentloaded');
  // Additionally wait for the page heading to ensure the page is loaded
  await page.waitForSelector('h1, h2', { timeout: 10000 });
}

export async function navigateToProfile(page: Page) {
  await page.goto('/profile');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('h1, h2', { timeout: 10000 });
}

export async function navigateToWizard(page: Page) {
  await page.goto('/onboarding/wizard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('h1, h2', { timeout: 10000 });
}

// ============================================================================
// Simulation Form Helpers
// ============================================================================

export async function selectStrategy(page: Page, strategy: WithdrawalStrategy) {
  // Map strategy values to display text (must match labels in lib/types/simulation.ts)
  const strategyLabels: Record<WithdrawalStrategy, string> = {
    'corporate-optimized': 'Corporate Optimized',
    'minimize-income': 'Minimize Income',
    'rrif-splitting': 'RRIF Splitting',
    'capital-gains-optimized': 'Capital Gains Optimized',
    'tfsa-first': 'TFSA First',
    'balanced': 'Balanced',
    'rrif-frontload': 'RRIF Front-Load (Tax Smoothing + OAS Protection)',
  };

  // Click the strategy dropdown to open it
  await page.click('#strategy');

  // Wait a moment for dropdown animation
  await page.waitForTimeout(500);

  // Click the strategy option by visible text
  await page.click(`text="${strategyLabels[strategy]}"`);

  // Verify selection (give it a moment to update)
  await page.waitForTimeout(300);
}

export async function fillPersonForm(
  page: Page,
  personNumber: 'p1' | 'p2',
  data: {
    name?: string;
    startAge?: number;
    tfsaBalance?: number;
    rrspBalance?: number;
    rrifBalance?: number;
    nonregBalance?: number;
    corporateBalance?: number;
    cppStartAge?: number;
    cppAnnualAtStart?: number;
    oasStartAge?: number;
    oasAnnualAtStart?: number;
  }
) {
  const prefix = personNumber === 'p1' ? 'p1' : 'p2';

  if (data.name !== undefined) {
    await page.fill(`input[name="${prefix}-name"]`, data.name);
  }

  if (data.startAge !== undefined) {
    await page.fill(`input[name="${prefix}-start-age"]`, data.startAge.toString());
  }

  if (data.tfsaBalance !== undefined) {
    await page.fill(`input[name="${prefix}-tfsa-balance"]`, data.tfsaBalance.toString());
  }

  if (data.rrspBalance !== undefined) {
    await page.fill(`input[name="${prefix}-rrsp-balance"]`, data.rrspBalance.toString());
  }

  if (data.rrifBalance !== undefined) {
    await page.fill(`input[name="${prefix}-rrif-balance"]`, data.rrifBalance.toString());
  }

  if (data.nonregBalance !== undefined) {
    await page.fill(`input[name="${prefix}-nonreg-balance"]`, data.nonregBalance.toString());
  }

  if (data.corporateBalance !== undefined) {
    await page.fill(`input[name="${prefix}-corporate-balance"]`, data.corporateBalance.toString());
  }

  if (data.cppStartAge !== undefined) {
    await page.fill(`input[name="${prefix}-cpp-start-age"]`, data.cppStartAge.toString());
  }

  if (data.cppAnnualAtStart !== undefined) {
    await page.fill(`input[name="${prefix}-cpp-annual"]`, data.cppAnnualAtStart.toString());
  }

  if (data.oasStartAge !== undefined) {
    await page.fill(`input[name="${prefix}-oas-start-age"]`, data.oasStartAge.toString());
  }

  if (data.oasAnnualAtStart !== undefined) {
    await page.fill(`input[name="${prefix}-oas-annual"]`, data.oasAnnualAtStart.toString());
  }
}

export async function fillHouseholdForm(
  page: Page,
  data: {
    province?: string;
    startYear?: number;
    endAge?: number;
    spendingGoGo?: number;
    goGoEndAge?: number;
    spendingSlowGo?: number;
    slowGoEndAge?: number;
    spendingNoGo?: number;
    spendingInflation?: number;
    generalInflation?: number;
  }
) {
  if (data.province !== undefined) {
    await page.click('#province');
    await page.click(`[role="option"][data-value="${data.province}"]`);
  }

  if (data.startYear !== undefined) {
    await page.fill('#start-year', data.startYear.toString());
  }

  if (data.endAge !== undefined) {
    await page.fill('#end-age', data.endAge.toString());
  }

  if (data.spendingGoGo !== undefined) {
    await page.fill('#spending-go-go', data.spendingGoGo.toString());
  }

  if (data.goGoEndAge !== undefined) {
    await page.fill('#go-go-end-age', data.goGoEndAge.toString());
  }

  if (data.spendingSlowGo !== undefined) {
    await page.fill('#spending-slow-go', data.spendingSlowGo.toString());
  }

  if (data.slowGoEndAge !== undefined) {
    await page.fill('#slow-go-end-age', data.slowGoEndAge.toString());
  }

  if (data.spendingNoGo !== undefined) {
    await page.fill('#spending-no-go', data.spendingNoGo.toString());
  }

  if (data.spendingInflation !== undefined) {
    await page.fill('#spending-inflation', data.spendingInflation.toString());
  }

  if (data.generalInflation !== undefined) {
    await page.fill('#general-inflation', data.generalInflation.toString());
  }
}

export async function addPartner(page: Page) {
  await page.click('button:has-text("Add Spouse/Partner")');
  await page.waitForSelector('[data-testid="person2-form"]', { timeout: 5000 });
}

export async function removePartner(page: Page) {
  await page.click('button:has-text("Remove")');
  await page.waitForSelector('[data-testid="person2-form"]', { state: 'hidden', timeout: 5000 });
}

// ============================================================================
// Simulation Execution Helpers
// ============================================================================

export async function runSimulation(page: Page, expectSuccess: boolean = true) {
  // Click "Run Simulation" button
  await page.click('button:has-text("Run Simulation")');

  // Wait for simulation to complete by checking for the Results tab to become active
  // or checking for the Plan Health Score card to appear
  if (expectSuccess) {
    // Wait for either the Results tab to activate OR the health score to appear
    try {
      await Promise.race([
        page.waitForSelector('[data-state="active"]:has-text("Results")', { timeout: 60000 }),
        page.waitForSelector('text=Plan Health Score', { timeout: 60000 })
      ]);
    } catch (error) {
      // If timeout, take a screenshot for debugging
      await page.screenshot({ path: 'test-results/simulation-timeout.png' });
      throw error;
    }

    // Give it a moment for all results to render
    await page.waitForTimeout(1000);
  }
}

// ============================================================================
// Results Validation Helpers
// ============================================================================

export async function getSimulationResults(page: Page) {
  // Wait for results to load
  await page.waitForSelector('[data-testid="results-dashboard"]', { timeout: 10000 });

  // Extract key metrics from the UI
  const summary = await page.evaluate(() => {
    const getTextContent = (selector: string): string | null => {
      const element = document.querySelector(selector);
      return element?.textContent?.trim() || null;
    };

    const parseNumber = (text: string | null): number => {
      if (!text) return 0;
      return parseFloat(text.replace(/[$,]/g, ''));
    };

    const parseTaxRate = (text: string | null): number => {
      if (!text) return 0;
      // Extract percentage from text like "Avg effective rate: 8.8%"
      const match = text.match(/(\d+\.?\d*)%/);
      return match ? parseFloat(match[1]) : 0;
    };

    return {
      success: !!document.querySelector('[data-testid="success-indicator"]'),
      healthScore: parseNumber(getTextContent('[data-testid="health-score"]')),
      totalAssets: parseNumber(getTextContent('[data-testid="total-assets"]')),
      totalWithdrawals: parseNumber(getTextContent('[data-testid="total-withdrawals"]')),
      totalTax: parseNumber(getTextContent('[data-testid="total-tax"]')),
      avgTaxRate: parseTaxRate(getTextContent('[data-testid="avg-tax-rate"]')),
      finalEstate: parseNumber(getTextContent('[data-testid="final-estate"]')),
      yearsFunded: parseNumber(getTextContent('[data-testid="years-funded"]')),
    };
  });

  return summary;
}

export async function getYearByYearData(page: Page, year: number) {
  // The year-by-year table is already visible on the Results tab, no need to click anything
  // Just scroll to make sure the table is in view
  await page.locator('text=10 Year Summary').scrollIntoViewIfNeeded();

  // Find the row for the specified year
  const row = page.locator(`tr:has-text("${year}")`).first();

  const data = await row.evaluate((el) => {
    const cells = el.querySelectorAll('td');
    return {
      year: cells[0]?.textContent?.trim() || '',
      age: cells[1]?.textContent?.trim() || '',
      tfsaWithdrawal: cells[2]?.textContent?.trim() || '',
      rrifWithdrawal: cells[3]?.textContent?.trim() || '',
      nonregWithdrawal: cells[4]?.textContent?.trim() || '',
      corporateWithdrawal: cells[5]?.textContent?.trim() || '',
      totalTax: cells[6]?.textContent?.trim() || '',
      tfsaBalance: cells[7]?.textContent?.trim() || '',
      rrifBalance: cells[8]?.textContent?.trim() || '',
      nonregBalance: cells[9]?.textContent?.trim() || '',
      corporateBalance: cells[10]?.textContent?.trim() || '',
    };
  });

  return data;
}

export async function verifyStrategyPattern(
  page: Page,
  strategy: WithdrawalStrategy,
  expectedPatterns: {
    primarySource?: 'tfsa' | 'rrif' | 'nonreg' | 'corporate';
    secondarySource?: 'tfsa' | 'rrif' | 'nonreg' | 'corporate';
    taxOptimized?: boolean;
    balancedWithdrawals?: boolean;
  }
) {
  const yearOneData = await getYearByYearData(page, 2025);

  // Verify primary source has highest withdrawal in year 1
  if (expectedPatterns.primarySource) {
    const sourceField = `${expectedPatterns.primarySource}Withdrawal`;
    const primaryAmount = parseFloat(yearOneData[sourceField as keyof typeof yearOneData].replace(/[$,]/g, ''));

    // Check that primary source has higher withdrawals than others
    const otherSources = ['tfsa', 'rrif', 'nonreg', 'corporate'].filter(
      s => s !== expectedPatterns.primarySource
    );

    for (const source of otherSources) {
      const sourceAmount = parseFloat(
        yearOneData[`${source}Withdrawal` as keyof typeof yearOneData].replace(/[$,]/g, '')
      );
      expect(primaryAmount).toBeGreaterThanOrEqual(sourceAmount);
    }
  }
}

// ============================================================================
// Prefill Data Helpers
// ============================================================================

export async function waitForPrefillToComplete(page: Page) {
  // Wait for prefill loading indicator to disappear
  await page.waitForSelector('[data-testid="prefill-loading"]', { state: 'hidden', timeout: 10000 });

  // Wait for success message
  await page.waitForSelector('text=Your financial profile and assets have been automatically loaded', {
    timeout: 5000,
  });
}

export async function reloadFromProfile(page: Page) {
  await page.click('button:has-text("Reload from Profile")');
  await waitForPrefillToComplete(page);
}

// ============================================================================
// Assertion Helpers
// ============================================================================

export async function assertSimulationSuccess(page: Page) {
  // Check if success indicator exists (it may be hidden, just needs to be in the DOM)
  const successIndicator = await page.locator('[data-testid="success-indicator"]').count();
  expect(successIndicator).toBeGreaterThan(0);
}

export async function assertNoErrors(page: Page) {
  // Check for actual error messages (not warnings)
  const errorMessages = await page.locator('[role="alert"]:has-text("Error"), [role="alert"]:has-text("Failed")').count();
  expect(errorMessages).toBe(0);
}

export async function assertTaxEfficiency(actualRate: number, maxRate: number) {
  expect(actualRate).toBeLessThanOrEqual(maxRate);
}

export async function assertWithdrawalPattern(
  actualWithdrawals: Record<string, number>,
  expectedPrimary: string
) {
  const primary = actualWithdrawals[expectedPrimary];
  const others = Object.entries(actualWithdrawals).filter(([key]) => key !== expectedPrimary);

  for (const [, value] of others) {
    expect(primary).toBeGreaterThanOrEqual(value);
  }
}

// ============================================================================
// Wait Helpers
// ============================================================================

export async function waitForSimulationComplete(page: Page) {
  // Wait for simulation results to appear (Plan Health Score)
  await page.waitForSelector('text=Plan Health Score', { timeout: 60000 });
}

export async function waitForChartRender(page: Page, chartName: string) {
  await page.waitForSelector(`[data-testid="${chartName}"]`, { timeout: 10000 });
}

// ============================================================================
// Screenshot Helpers
// ============================================================================

export async function takeStrategyScreenshot(page: Page, strategy: string, suffix: string = '') {
  const filename = `${strategy}${suffix ? '-' + suffix : ''}.png`;
  await page.screenshot({ path: `test-results/screenshots/${filename}`, fullPage: true });
}
