/**
 * Canadian Tax Calculator
 * Calculates federal and provincial taxes for retirement income
 */

// Federal tax brackets for 2025
export const FEDERAL_TAX_BRACKETS_2025 = [
  { limit: 55867, rate: 0.15 },
  { limit: 111733, rate: 0.205 },
  { limit: 173205, rate: 0.26 },
  { limit: 246752, rate: 0.29 },
  { limit: Infinity, rate: 0.33 },
];

// Federal tax credits for 2025
export const FEDERAL_TAX_CREDITS_2025 = {
  basicPersonalAmount: 15705,
  ageAmount: 8790, // Age 65+
  pensionIncomeAmount: 2000,
  spouseAmount: 15705,
  disabilityAmount: 9428,
  canadaEmploymentAmount: 1433,
};

// Ontario tax brackets for 2025
export const ONTARIO_TAX_BRACKETS_2025 = [
  { limit: 51446, rate: 0.0505 },
  { limit: 102894, rate: 0.0915 },
  { limit: 150000, rate: 0.1116 },
  { limit: 220000, rate: 0.1216 },
  { limit: Infinity, rate: 0.1316 },
];

// Ontario tax credits for 2025
export const ONTARIO_TAX_CREDITS_2025 = {
  basicPersonalAmount: 11865,
  ageAmount: 5826, // Age 65+
  pensionIncomeAmount: 1605,
  spouseAmount: 10011,
};

/**
 * Calculate federal tax
 */
export function calculateFederalTax(
  taxableIncome: number,
  age: number = 65,
  hasPensionIncome: boolean = false
): {
  grossTax: number;
  credits: number;
  netTax: number;
  marginalRate: number;
  averageRate: number;
} {
  if (taxableIncome <= 0) {
    return {
      grossTax: 0,
      credits: 0,
      netTax: 0,
      marginalRate: 0,
      averageRate: 0,
    };
  }

  // Calculate gross tax
  let grossTax = 0;
  let previousLimit = 0;
  let marginalRate = 0;

  for (const bracket of FEDERAL_TAX_BRACKETS_2025) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(
        taxableIncome - previousLimit,
        bracket.limit - previousLimit
      );
      grossTax += taxableInBracket * bracket.rate;
      marginalRate = bracket.rate;
      previousLimit = bracket.limit;
    }
  }

  // Calculate tax credits
  let creditableAmount = FEDERAL_TAX_CREDITS_2025.basicPersonalAmount;

  if (age >= 65) {
    creditableAmount += FEDERAL_TAX_CREDITS_2025.ageAmount;
  }

  if (hasPensionIncome) {
    creditableAmount += FEDERAL_TAX_CREDITS_2025.pensionIncomeAmount;
  }

  const credits = creditableAmount * 0.15; // Federal credit rate

  // Net tax
  const netTax = Math.max(0, grossTax - credits);

  // Average tax rate
  const averageRate = taxableIncome > 0 ? netTax / taxableIncome : 0;

  return {
    grossTax: Math.round(grossTax * 100) / 100,
    credits: Math.round(credits * 100) / 100,
    netTax: Math.round(netTax * 100) / 100,
    marginalRate: Math.round(marginalRate * 10000) / 100, // As percentage
    averageRate: Math.round(averageRate * 10000) / 100, // As percentage
  };
}

/**
 * Calculate Ontario provincial tax
 */
export function calculateOntarioTax(
  taxableIncome: number,
  age: number = 65,
  hasPensionIncome: boolean = false
): {
  grossTax: number;
  credits: number;
  netTax: number;
  marginalRate: number;
  averageRate: number;
} {
  if (taxableIncome <= 0) {
    return {
      grossTax: 0,
      credits: 0,
      netTax: 0,
      marginalRate: 0,
      averageRate: 0,
    };
  }

  // Calculate gross tax
  let grossTax = 0;
  let previousLimit = 0;
  let marginalRate = 0;

  for (const bracket of ONTARIO_TAX_BRACKETS_2025) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(
        taxableIncome - previousLimit,
        bracket.limit - previousLimit
      );
      grossTax += taxableInBracket * bracket.rate;
      marginalRate = bracket.rate;
      previousLimit = bracket.limit;
    }
  }

  // Calculate tax credits
  let creditableAmount = ONTARIO_TAX_CREDITS_2025.basicPersonalAmount;

  if (age >= 65) {
    creditableAmount += ONTARIO_TAX_CREDITS_2025.ageAmount;
  }

  if (hasPensionIncome) {
    creditableAmount += ONTARIO_TAX_CREDITS_2025.pensionIncomeAmount;
  }

  const credits = creditableAmount * 0.0505; // Ontario credit rate (lowest bracket)

  // Net tax
  const netTax = Math.max(0, grossTax - credits);

  // Average tax rate
  const averageRate = taxableIncome > 0 ? netTax / taxableIncome : 0;

  return {
    grossTax: Math.round(grossTax * 100) / 100,
    credits: Math.round(credits * 100) / 100,
    netTax: Math.round(netTax * 100) / 100,
    marginalRate: Math.round(marginalRate * 10000) / 100, // As percentage
    averageRate: Math.round(averageRate * 10000) / 100, // As percentage
  };
}

/**
 * Calculate total tax (federal + provincial)
 */
export function calculateTotalTax(
  taxableIncome: number,
  province: string = 'ON',
  age: number = 65,
  hasPensionIncome: boolean = false
): {
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  marginalRate: number;
  averageRate: number;
  breakdown: {
    federal: ReturnType<typeof calculateFederalTax>;
    provincial: ReturnType<typeof calculateOntarioTax>;
  };
} {
  const federal = calculateFederalTax(taxableIncome, age, hasPensionIncome);

  // Currently only Ontario implemented, can add other provinces later
  const provincial =
    province === 'ON'
      ? calculateOntarioTax(taxableIncome, age, hasPensionIncome)
      : { grossTax: 0, credits: 0, netTax: 0, marginalRate: 0, averageRate: 0 };

  const totalTax = federal.netTax + provincial.netTax;
  const combinedMarginalRate = federal.marginalRate + provincial.marginalRate;
  const averageRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;

  return {
    federalTax: federal.netTax,
    provincialTax: provincial.netTax,
    totalTax: Math.round(totalTax * 100) / 100,
    marginalRate: Math.round(combinedMarginalRate * 100) / 100,
    averageRate: Math.round(averageRate * 100) / 100,
    breakdown: {
      federal,
      provincial,
    },
  };
}

/**
 * Calculate after-tax income
 */
export function calculateAfterTaxIncome(
  grossIncome: number,
  province: string = 'ON',
  age: number = 65,
  hasPensionIncome: boolean = false
): {
  grossIncome: number;
  totalTax: number;
  afterTaxIncome: number;
  taxRate: number;
} {
  const tax = calculateTotalTax(grossIncome, province, age, hasPensionIncome);

  return {
    grossIncome,
    totalTax: tax.totalTax,
    afterTaxIncome: Math.round((grossIncome - tax.totalTax) * 100) / 100,
    taxRate: tax.averageRate,
  };
}

/**
 * Calculate RRSP/RRIF withholding tax
 */
export function calculateWithholdingTax(
  withdrawalAmount: number,
  province: string = 'ON'
): number {
  // Federal withholding tax rates
  let federalRate: number;
  if (withdrawalAmount <= 5000) {
    federalRate = 0.10;
  } else if (withdrawalAmount <= 15000) {
    federalRate = 0.20;
  } else {
    federalRate = 0.30;
  }

  // Provincial withholding tax rates (Ontario)
  let provincialRate: number;
  if (province === 'ON') {
    if (withdrawalAmount <= 5000) {
      provincialRate = 0.05;
    } else if (withdrawalAmount <= 15000) {
      provincialRate = 0.10;
    } else {
      provincialRate = 0.15;
    }
  } else {
    provincialRate = 0; // Add other provinces as needed
  }

  const totalWithholdingRate = federalRate + provincialRate;
  return Math.round(withdrawalAmount * totalWithholdingRate * 100) / 100;
}

/**
 * Calculate capital gains tax
 */
export function calculateCapitalGainsTax(
  capitalGain: number,
  marginalTaxRate: number
): {
  capitalGain: number;
  taxableAmount: number;
  tax: number;
} {
  // Only 50% of capital gains are taxable in Canada
  const taxableAmount = capitalGain * 0.5;
  const tax = taxableAmount * (marginalTaxRate / 100);

  return {
    capitalGain,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
  };
}

/**
 * Estimate tax-efficient withdrawal strategy
 */
export function calculateTaxEfficientWithdrawal(
  targetAfterTaxIncome: number,
  tfsaBalance: number,
  rrspBalance: number,
  nonRegBalance: number,
  province: string = 'ON',
  age: number = 65
): {
  tfsaWithdrawal: number;
  rrspWithdrawal: number;
  nonRegWithdrawal: number;
  totalWithdrawn: number;
  totalTax: number;
  netIncome: number;
} {
  let tfsaWithdrawal = 0;
  let rrspWithdrawal = 0;
  let nonRegWithdrawal = 0;
  let remaining = targetAfterTaxIncome;

  // Strategy: TFSA first (tax-free), then non-reg (50% taxable), then RRSP (fully taxable)

  // Step 1: Withdraw from TFSA (tax-free)
  if (tfsaBalance > 0 && remaining > 0) {
    tfsaWithdrawal = Math.min(tfsaBalance, remaining);
    remaining -= tfsaWithdrawal;
  }

  // Step 2: Withdraw from non-registered (only 50% taxable as capital gains)
  if (nonRegBalance > 0 && remaining > 0) {
    // Estimate how much to withdraw considering 50% is taxable
    const estimatedWithdrawal = remaining * 1.15; // Rough estimate
    nonRegWithdrawal = Math.min(nonRegBalance, estimatedWithdrawal);

    const taxOnNonReg = calculateCapitalGainsTax(
      nonRegWithdrawal,
      25 // Rough marginal rate estimate
    ).tax;

    remaining = Math.max(0, remaining - (nonRegWithdrawal - taxOnNonReg));
  }

  // Step 3: Withdraw from RRSP (fully taxable)
  if (rrspBalance > 0 && remaining > 0) {
    // Need to withdraw more than remaining to account for tax
    const estimatedWithdrawal = remaining * 1.35; // Rough estimate
    rrspWithdrawal = Math.min(rrspBalance, estimatedWithdrawal);
  }

  // Calculate actual tax
  const taxableIncome = rrspWithdrawal + nonRegWithdrawal * 0.5;
  const tax = calculateTotalTax(taxableIncome, province, age, true).totalTax;

  const totalWithdrawn = tfsaWithdrawal + rrspWithdrawal + nonRegWithdrawal;
  const netIncome = totalWithdrawn - tax;

  return {
    tfsaWithdrawal: Math.round(tfsaWithdrawal * 100) / 100,
    rrspWithdrawal: Math.round(rrspWithdrawal * 100) / 100,
    nonRegWithdrawal: Math.round(nonRegWithdrawal * 100) / 100,
    totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
    totalTax: Math.round(tax * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
  };
}
