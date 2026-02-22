/**
 * Tooltip content library for simulation fields
 * Provides contextual help and examples for users
 */

// Helper to get pension plan name based on province
export const getPensionName = (province?: string) => {
  return province === 'QC' ? 'QPP' : 'CPP';
};

export const getPensionFullName = (province?: string) => {
  return province === 'QC' ? 'Quebec Pension Plan' : 'Canada Pension Plan';
};

// Dynamic tooltip generator for pension-related fields
export const getPensionTooltips = (province?: string) => {
  const pensionName = getPensionName(province);
  const pensionFullName = getPensionFullName(province);

  return {
    cppStartAge: `Age when you'll start receiving ${pensionFullName} benefits. Can start between 60-70. Earlier = lower payments (36% reduction at 60), later = higher payments (42% increase at 70). Starting at 65 is standard. Example: 65`,

    cppAnnualAmount: `Annual ${pensionName} benefit amount at the age you start. Maximum is about $17,500 (2025). Average is $10,000-$12,000. Calculate your estimate at canada.ca/${pensionName.toLowerCase()}. Example: $15,000`,
  };
};

export const simulationTooltips = {
  // Person Fields
  person: {
    name: "Your name as it appears in your retirement plan",

    startAge: "Age to start your retirement simulation from. This can be your current age or a future age (e.g., your planned retirement age). Used as the starting point for all projections.",

    tfsaBalance: "Tax-Free Savings Account balance. Withdrawals are tax-free in retirement. Example: $75,000",

    rrspBalance: "Registered Retirement Savings Plan balance. Withdrawals are fully taxable. Automatically converts to RRIF at age 71. Example: $250,000",

    rrifBalance: "Registered Retirement Income Fund balance. Required minimum withdrawals apply. Withdrawals are fully taxable. Example: $0 (if under 71)",

    nonregBalance: "Non-registered investment account balance. Only capital gains and investment income are taxable. Example: $150,000",

    corporateBalance: "Corporate investment account balance. For incorporated business owners. Example: $0 (if not incorporated)",

    tfsaRoom: "Available contribution room in your TFSA. This grows each year if unused. Example: $88,000",

    nonregACB: "Adjusted Cost Base - the original purchase price of your non-registered investments. Used to calculate capital gains. Typically 70-90% of current balance. Example: $120,000 for a $150,000 balance",

    cppStartAge: "Age when you'll start receiving pension plan benefits (CPP/QPP). Can start between 60-70. Earlier = lower payments (36% reduction at 60), later = higher payments (42% increase at 70). Starting at 65 is standard. Example: 65",

    cppAnnualAmount: "Annual pension plan benefit amount (CPP/QPP) at the age you start. Maximum is about $17,500 (2025). Average is $10,000-$12,000. Calculate your estimate at canada.ca. Example: $15,000",

    oasStartAge: "Age when you'll start receiving Old Age Security benefits. OAS starts at 65 minimum. Deferring to age 70 increases payments by 36% (0.6% per month). High-income retirees ($93,000+ in 2026) may face OAS clawback. Example: 65",

    oasAnnualAmount: "Annual OAS benefit amount at age 65. Maximum is about $8,900 (2025). Subject to clawback if income is too high. Example: $8,500",

    cashInterest: "Annual interest rate on cash holdings in non-registered account. Example: 3.5% for high-interest savings",

    gicInterest: "Annual interest rate on GICs in non-registered account. Example: 4.5% for 5-year GIC",

    invTotalReturn: "Expected total annual return on non-registered investments (capital gains + dividends + interest). Example: 6.0% for balanced portfolio",

    invEligDiv: "Portion of investment return that comes from eligible Canadian dividends. Benefits from dividend tax credit. Example: 2.0%",

    invNonEligDiv: "Portion of investment return from non-eligible dividends. Less tax-efficient than eligible dividends. Example: 0.5%",

    invCapGains: "Portion of investment return from capital gains. Only 50% is taxable. Example: 2.5%",

    invROC: "Portion of investment return that is Return of Capital. Not immediately taxable but reduces ACB. Example: 0%",

    corpCashInterest: "Interest rate on cash holdings in corporate account. Example: 3.5%",

    corpGICInterest: "Interest rate on GICs in corporate account. Example: 4.5%",

    corpInvTotalReturn: "Expected total return on corporate investments. Passive investment income faces higher corporate tax. Example: 6.0%",

    corpInvEligDiv: "Corporate investments receiving eligible dividends. Example: 3.0%",

    corpInvCapGains: "Corporate investment capital gains. 50% taxable at corporate rates. Example: 2.5%",
  },

  // Household Fields
  household: {
    province: "Your province of residence. Affects provincial tax rates and benefit amounts. Provincial taxes vary significantly across Canada.",

    endAge: "The age to which you want to plan (life expectancy). Common choices: 90-100. Consider family longevity and health. Example: 95",

    spendingGoGo: "Annual retirement spending during your active years (typically 65-75). Include travel, hobbies, and regular expenses. Don't include taxes (calculated separately). Example: $60,000",

    goGoEndAge: "Age when your 'go-go' active phase ends and spending typically decreases. Common choice: 75. Example: 75",

    spendingSlowGo: "Annual spending during your 'slow-go' years (typically 75-85). Often 20-30% less than go-go phase as travel decreases. Example: $48,000",

    slowGoEndAge: "Age when your 'slow-go' phase ends. Common choice: 85. Example: 85",

    spendingNoGo: "Annual spending during your 'no-go' years (typically 85+). Often 40-50% less than go-go phase. May increase if healthcare costs rise. Example: $40,000",

    spendingInflation: "Annual inflation rate applied to your spending amounts. Bank of Canada target is 2%. Historical average: 2-3%. Example: 2.0%",

    generalInflation: "General inflation rate applied to pension benefits (CPP/QPP), OAS, and other indexed amounts. Typically same as spending inflation. Example: 2.0%",

    strategy: {
      label: "Tax-Efficient Withdrawal Strategy",
      description: "Determines which accounts to withdraw from first to minimize lifetime taxes and maximize government benefits. The right strategy can save tens of thousands in taxes over retirement.",

      options: {
        minimizeIncome: "Recommended for most retirees. Minimizes taxable income each year to reduce taxes and preserve government benefits (OAS, GIS). Withdraws from TFSA and non-registered accounts first, delays RRSP/RRIF withdrawals. Best for maximizing after-tax retirement income.",

        tfsaLast: "Preserves TFSA for as long as possible while minimizing tax. Good if you want to maximize tax-free growth or leave TFSA to beneficiaries. Delays TFSA withdrawals until other sources are exhausted.",

        proportional: "Withdraws proportionally from all account types. Simpler but usually not tax-optimal. Good for understanding tax implications of each account type. Not recommended for most situations.",

        nonregFirst: "Exhausts non-registered accounts first, then registered accounts. Tax-efficient approach that withdraws from taxable accounts early to preserve tax-sheltered growth in TFSA/RRSP.",

        rrspFirst: "Draws down RRSP/RRIF first to reduce future required minimum withdrawals. May be useful if you expect higher income later or want to minimize estate taxes. Rarely optimal for most retirees.",
      },
    },

    reinvestNonregDist: "Whether to reinvest non-registered distributions (dividends, interest) or use them for spending. Reinvesting creates compound growth but may create more taxable income. Most conservative plans reinvest. Example: Yes (checked)",
  },

  // Advanced Options
  advanced: {
    assetAllocation: "How assets are split between cash, GICs, and investments affects returns and taxes. Conservative: more cash/GICs. Aggressive: more investments.",

    yields: "Return assumptions for different asset types. Be conservative - historical averages don't guarantee future returns. Real returns (after inflation) are what matter.",

    corporateAccounts: "For business owners with holding companies. Corporate passive investment income faces higher tax rates but provides tax deferral opportunities.",
  },

  // General Tips
  tips: {
    prefilled: "This value was automatically loaded from your profile. You can edit it here without changing your profile.",

    estimated: "This is an estimated value. Update your profile or edit here for more accurate projections.",

    required: "This field is required to run a simulation.",

    optional: "This field is optional. Default values will be used if left empty.",

    smartDefault: "This is a smart default based on typical Canadian retirees. Adjust if your situation differs.",
  },
};

/**
 * Helper function to get tooltip text
 */
export function getTooltip(category: keyof typeof simulationTooltips, field: string): string {
  const categoryTooltips = simulationTooltips[category];
  if (typeof categoryTooltips === 'object' && field in categoryTooltips) {
    return (categoryTooltips as any)[field];
  }
  return '';
}

/**
 * Helper function to format tooltip with example
 */
export function tooltipWithExample(text: string, example?: string): string {
  if (example) {
    return `${text}\n\nExample: ${example}`;
  }
  return text;
}
