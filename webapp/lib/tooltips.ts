/**
 * Tooltip content for retirement planning fields
 * Organized by category for easy maintenance
 */

export const ACCOUNT_TOOLTIPS = {
  TFSA: 'Tax-Free Savings Account: All growth and withdrawals are tax-free. No tax deduction for contributions. Great for flexibility in retirement.',
  RRSP: 'Registered Retirement Savings Plan: Tax-deferred account. Contributions reduce current taxes, but all withdrawals are fully taxable as income.',
  RRIF: 'Registered Retirement Income Fund: Converted from RRSP at age 71. Requires minimum annual withdrawals that are fully taxable.',
  NON_REGISTERED: 'Taxable investment account: Only investment income (interest, dividends, capital gains) is taxed. More tax-efficient than RRSP for high earners.',
  CORPORATE: 'Corporation-owned accounts: Subject to corporate tax rates. Withdrawals as dividends may be tax-advantaged depending on income level.',
  CONTRIBUTION_ROOM: 'Maximum amount you can contribute this year without penalty. Updated annually by CRA based on your income and previous contributions.',
};

export const GOVERNMENT_BENEFITS_TOOLTIPS = {
  CPP_START_AGE: 'Canada Pension Plan can start between ages 60-70. Taking at 65 = 100%. Each year earlier reduces by 7.2%. Each year later increases by 8.4% (max 42% at 70).',
  CPP_AMOUNT: 'Your estimated annual CPP benefit. Maximum 2026 benefit is $17,024/year at age 65. Actual amount depends on your contribution history.',
  OAS_START_AGE: 'Old Age Security can start between ages 65-70. Taking at 65 = 100%. Each year of deferral increases payments by 7.2% (max 36% at 70).',
  OAS_AMOUNT: 'Your estimated annual OAS benefit. Maximum 2026 benefit is $8,907/year at age 65. Subject to clawback if income exceeds $90,997.',
  OAS_CLAWBACK: 'If your net income exceeds $90,997 (2026), you must repay 15% of the excess. Full clawback occurs at $148,451. Consider income splitting strategies.',
};

export const SPENDING_TOOLTIPS = {
  GO_GO_PHASE: 'Active retirement years (typically 65-75): Higher spending for travel, hobbies, and activities while you\'re most active.',
  SLOW_GO_PHASE: 'Transition years (typically 75-85): Moderate spending as activities slow down but healthcare costs may increase.',
  NO_GO_PHASE: 'Later years (85+): Lower spending on activities, but potential for higher healthcare and care costs.',
  SPENDING_INFLATION: 'How much your expenses will increase each year due to inflation. Historical average is 2-3%. Healthcare often inflates faster.',
};

export const STRATEGY_TOOLTIPS = {
  STANDARD: 'Balanced withdrawal strategy following CRA minimum RRIF withdrawals. Good for most retirees.',
  TAX_EFFICIENT: 'Minimizes lifetime taxes by strategically timing withdrawals from different account types. Recommended for higher net worth.',
  PRESERVE_TFSA: 'Withdraws from TFSA last to maximize tax-free growth. Good if you want flexibility or to leave a tax-free inheritance.',
  EARLY_RRSP: 'Draws down RRSP/RRIF before OAS to avoid clawback. Best if you have large RRSP and expect OAS clawback.',
};

export const INVESTMENT_TOOLTIPS = {
  TOTAL_RETURN: 'Expected annual growth including all sources (interest, dividends, capital gains). Historical stock market average is 7-10%, bonds 3-5%.',
  ELIGIBLE_DIVIDEND: 'Dividends from Canadian corporations qualify for tax credit. More tax-efficient than interest income.',
  CAPITAL_GAINS: 'Profit from selling investments. Only 50% is taxable, making it more tax-efficient than interest or employment income.',
  RETURN_OF_CAPITAL: 'Non-taxable return of your original investment. Reduces your adjusted cost base (ACB) for future capital gains calculations.',
  ACB: 'Adjusted Cost Base: Original cost plus additions minus return of capital. Used to calculate capital gains when you sell.',
};

export const GENERAL_TOOLTIPS = {
  LIFE_EXPECTANCY: 'Plan to this age to avoid running out of money. Statistics Canada: 84 for men, 87 for women. Consider planning to 95+ for safety.',
  GENERAL_INFLATION: 'Overall price increases for goods and services. Bank of Canada target is 2%. Historical average is 2-3%.',
  PARTNER: 'Including a partner allows joint planning, income splitting, and survivor benefits. Important for tax optimization.',
  REINVEST_DISTRIBUTIONS: 'If enabled, non-registered investment income is automatically reinvested rather than being available for spending.',
};

/**
 * Helper function to get tooltip content by key
 */
export function getTooltip(category: keyof typeof TOOLTIPS, key: string): string {
  const categoryTooltips = TOOLTIPS[category];
  return (categoryTooltips as any)[key] || '';
}

export const TOOLTIPS = {
  ACCOUNT: ACCOUNT_TOOLTIPS,
  BENEFITS: GOVERNMENT_BENEFITS_TOOLTIPS,
  SPENDING: SPENDING_TOOLTIPS,
  STRATEGY: STRATEGY_TOOLTIPS,
  INVESTMENT: INVESTMENT_TOOLTIPS,
  GENERAL: GENERAL_TOOLTIPS,
} as const;
