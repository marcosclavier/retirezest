/**
 * Help content database for tooltips and FAQ
 * Contains explanations for Canadian retirement planning terms and concepts
 */

export const helpContent = {
  // Account Types
  rrsp: {
    title: 'RRSP (Registered Retirement Savings Plan)',
    short: 'Tax-deferred retirement savings account. Contributions are tax-deductible, but withdrawals are taxed as income.',
    long: 'A Registered Retirement Savings Plan (RRSP) is a tax-advantaged retirement savings account. Contributions reduce your taxable income, and investments grow tax-free. You must convert to a RRIF by age 71. Withdrawals are taxed as regular income.',
  },
  tfsa: {
    title: 'TFSA (Tax-Free Savings Account)',
    short: 'Tax-free savings account. Contributions are not tax-deductible, but withdrawals and investment growth are tax-free.',
    long: 'A Tax-Free Savings Account (TFSA) allows you to save money tax-free. Unlike RRSPs, contributions are not tax-deductible, but all investment income and withdrawals are completely tax-free. There are annual contribution limits.',
  },
  nonRegistered: {
    title: 'Non-Registered Account',
    short: 'Regular investment account with no tax advantages. Investment income is taxable annually.',
    long: 'Non-registered accounts have no contribution limits or tax advantages. Capital gains are taxed at 50% inclusion rate, dividends receive dividend tax credits, and interest is fully taxable. Useful once RRSP and TFSA are maximized.',
  },
  rrif: {
    title: 'RRIF (Registered Retirement Income Fund)',
    short: 'Converted from RRSP at age 71. Requires minimum annual withdrawals that are taxed as income.',
    long: 'A Registered Retirement Income Fund (RRIF) is what your RRSP becomes at age 71. You must withdraw a minimum percentage each year (starts at 5.28% at age 71, increases with age). All withdrawals are taxed as regular income.',
  },
  corporate: {
    title: 'Corporate Account',
    short: 'Investment account held within a corporation. For business owners. Dividends receive special tax treatment.',
    long: 'A Corporate account holds investments inside your corporation (for business owners). Withdrawals are typically taken as dividends, which benefit from dividend tax credits and can be more tax-efficient than salary. The small business tax rate allows income to be taxed at lower corporate rates before withdrawal. Useful for tax deferral and income splitting strategies.',
  },

  // Government Benefits
  cpp: {
    title: 'CPP (Canada Pension Plan)',
    short: 'Government pension based on your contributions during working years. Can start between age 60-70.',
    long: 'Canada Pension Plan is a monthly retirement pension you receive based on contributions during your working career. Standard age is 65, but you can start as early as 60 (reduced 36%) or delay to 70 (increased 42%). Maximum 2025: $1,433/month at age 65.',
  },
  oas: {
    title: 'OAS (Old Age Security)',
    short: 'Government pension available to most Canadians age 65+. No contributions required, but subject to income clawback.',
    long: 'Old Age Security is a monthly payment available to Canadians 65+ who meet residency requirements. You don\'t need to have worked to qualify. Maximum 2025: $713/month. Subject to clawback if income exceeds $90,997 (recovery tax of 15% on excess income).',
  },
  gis: {
    title: 'GIS (Guaranteed Income Supplement)',
    short: 'Additional benefit for low-income seniors receiving OAS. Income-tested and tax-free.',
    long: 'Guaranteed Income Supplement provides additional tax-free income to low-income OAS recipients. Maximum 2025: $1,086/month for singles. Reduces $0.50 for every $1 of other income. Automatically reassessed annually based on tax returns.',
  },

  // Financial Concepts
  currentAge: {
    title: 'Current Age',
    short: 'Your age today. Used as the starting point for retirement projections.',
    long: 'Your current age is the starting point for all retirement calculations. The calculator projects your finances year-by-year from your current age through your life expectancy.',
  },
  retirementAge: {
    title: 'Target Retirement Age',
    short: 'The age when you plan to stop working and start drawing from retirement savings.',
    long: 'Your target retirement age is when you plan to stop working. Common ages are 60-65. Retiring earlier requires more savings, while working longer allows more time to save and delays drawing down assets.',
  },
  lifeExpectancy: {
    title: 'Life Expectancy',
    short: 'How long you expect to live. Used to ensure your savings last throughout retirement.',
    long: 'Life expectancy is how long you plan for your retirement to last. Average Canadian life expectancy is mid-80s, but planning to 90-95 provides a safety cushion. Your savings need to last this long.',
  },
  annualExpenses: {
    title: 'Annual Expenses',
    short: 'How much you expect to spend per year in retirement, in today\'s dollars.',
    long: 'Your annual retirement expenses in today\'s dollars. The calculator adjusts for inflation automatically. Include housing, food, transportation, healthcare, travel, and leisure. Many retirees need 70-80% of pre-retirement income.',
  },
  investmentReturn: {
    title: 'Investment Return Rate',
    short: 'Expected average annual return on investments. Conservative: 4-5%, Moderate: 5-6%, Aggressive: 6-8%.',
    long: 'Your expected average annual investment return. Conservative portfolios (mostly bonds) might return 4-5%, balanced portfolios 5-6%, and aggressive portfolios (mostly stocks) 6-8%. Higher returns come with higher risk.',
  },
  inflationRate: {
    title: 'Inflation Rate',
    short: 'Expected average annual increase in cost of living. Historical average: 2-3%.',
    long: 'The expected average annual inflation rate. Historical Canadian average is about 2%, though it varies. Inflation erodes purchasing power over time, so your expenses will increase even if lifestyle stays the same.',
  },

  // Tax Concepts
  marginalTaxRate: {
    title: 'Marginal Tax Rate',
    short: 'The tax rate on your last dollar of income. Depends on total income and province.',
    long: 'Your marginal tax rate is the percentage of tax you pay on your last dollar of income. It increases as income rises through tax brackets. Used to calculate tax savings from RRSP contributions and tax on withdrawals.',
  },
  effectiveTaxRate: {
    title: 'Effective Tax Rate',
    short: 'Average tax rate on all your income. Lower than marginal rate due to progressive taxation.',
    long: 'Effective tax rate is your total tax divided by total income. It\'s always lower than your marginal rate because you only pay the higher rates on income above each bracket threshold.',
  },
  taxBracket: {
    title: 'Tax Bracket',
    short: 'Income range with a specific tax rate. Canada has progressive brackets (higher income = higher rate).',
    long: 'Tax brackets are income ranges taxed at specific rates. Canada uses progressive taxation - you only pay the higher rate on income above each threshold. Federal brackets start at 15% and go up to 33%.',
  },
  basicPersonalAmount: {
    title: 'Basic Personal Amount',
    short: 'Tax credit available to all taxpayers. Federal 2025: $15,705. Reduces taxes owed.',
    long: 'The Basic Personal Amount is a non-refundable tax credit available to everyone. In 2025, it\'s $15,705 federally (plus provincial amounts). This amount of income is effectively tax-free.',
  },
  pensionIncomeSplitting: {
    title: 'Pension Income Splitting',
    short: 'Couples can split eligible pension income for tax purposes, potentially lowering overall taxes.',
    long: 'Pension income splitting allows couples to allocate up to 50% of eligible pension income (like RRIF withdrawals, but not OAS/GIS) to the lower-income spouse, potentially reducing overall family tax burden.',
  },

  // RRIF Withdrawals
  rrifMinWithdrawal: {
    title: 'RRIF Minimum Withdrawal',
    short: 'Required minimum amount you must withdraw from RRIF each year. Percentage increases with age.',
    long: 'Once you convert your RRSP to a RRIF at 71, you must withdraw a minimum percentage annually. It starts at 5.28% at age 71 and increases each year (e.g., 6.82% at age 80, 20% at age 95+). All withdrawals are taxable.',
  },

  // CPP Timing
  cppStartAge: {
    title: 'CPP Start Age',
    short: 'Age you begin receiving CPP. Age 60 = 64% of max, Age 65 = 100%, Age 70 = 142%.',
    long: 'You can start CPP between 60-70. Taking it early (60) reduces benefits by 36% (0.6% per month before 65). Delaying to 70 increases benefits by 42% (0.7% per month after 65). Consider health, other income, and longevity.',
  },

  // OAS Clawback
  oasClawback: {
    title: 'OAS Clawback (Recovery Tax)',
    short: 'OAS reduced by 15% of income above $90,997 (2025). Fully eliminated at ~$148,000.',
    long: 'If your net income exceeds $90,997 (2025), you must repay 15% of the excess as OAS recovery tax. At approximately $148,000, OAS is fully clawed back. Strategies like RRSP withdrawals or pension splitting can help minimize clawback.',
  },

  // Planning Strategies
  withdrawalStrategy: {
    title: 'Withdrawal Strategy',
    short: 'Order to withdraw from different accounts to minimize taxes and maximize savings longevity.',
    long: 'A tax-efficient withdrawal strategy typically draws from non-registered accounts first (lower tax rates on capital gains), then RRSP/RRIF (fully taxable), and TFSA last (tax-free). Must balance with RRIF minimums and OAS clawback management.',
  },
  assetAllocation: {
    title: 'Asset Allocation',
    short: 'How investments are divided between stocks, bonds, and cash. Typically gets more conservative with age.',
    long: 'Asset allocation is the mix of stocks, bonds, and cash in your portfolio. Common rule: "100 minus age" = stock percentage. Younger investors can handle more risk (stocks), while retirees typically shift toward bonds for stability.',
  },
};

/**
 * Get help content by key
 */
export function getHelp(key: keyof typeof helpContent): typeof helpContent[keyof typeof helpContent] | undefined {
  return helpContent[key];
}

/**
 * Get short help text (for tooltips)
 */
export function getShortHelp(key: keyof typeof helpContent): string {
  return helpContent[key]?.short || 'Help information not available.';
}

/**
 * Get long help text (for detailed explanations)
 */
export function getLongHelp(key: keyof typeof helpContent): string {
  return helpContent[key]?.long || 'Help information not available.';
}

/**
 * Get help title
 */
export function getHelpTitle(key: keyof typeof helpContent): string {
  return helpContent[key]?.title || 'Help';
}
