/**
 * Canadian Tax Calculator
 * Calculates federal and provincial taxes for retirement income
 * Based on 2026 CRA tax brackets and credits
 */

// ============================================================================
// FEDERAL TAX (2026)
// ============================================================================

export const FEDERAL_TAX_BRACKETS_2026 = [
  { threshold: 0, limit: 58523, rate: 0.14 },       // 14% on first $58,523 (CRA 2026)
  { threshold: 58523, limit: 117045, rate: 0.205 }, // 20.5% on $58,523-$117,045
  { threshold: 117045, limit: 181440, rate: 0.26 }, // 26% on $117,045-$181,440
  { threshold: 181440, limit: 258482, rate: 0.29 }, // 29% on $181,440-$258,482
  { threshold: 258482, limit: Infinity, rate: 0.33 }, // 33% on $258,482+
];

export const FEDERAL_TAX_CREDITS_2026 = {
  basicPersonalAmount: 16452, // CRA 2026 official
  basicPersonalAmountHigh: 14829, // For income > $258,482
  bpaPhaseoutStart: 181440,
  bpaPhaseoutEnd: 258482,
  ageAmount: 9206, // CRA 2026 (indexed at 2%) (Age 65+)
  agePhaseoutThreshold: 46432, // CRA 2026 (indexed at 2%) - Phase-out starts here
  agePhaseoutEnd: 107845, // Full phase-out
  agePhaseoutRate: 0.15, // 15% reduction on excess income
  pensionIncomeAmount: 2000,
  spouseAmount: 16452,
  disabilityAmount: 9617,
  canadaEmploymentAmount: 1461,
};

export const OAS_CLAWBACK_2026 = {
  threshold: 88637, // CRA 2026 (indexed at 2%)
  rate: 0.15, // 15% of excess income
};

export const DIVIDEND_RATES_2026 = {
  eligible: {
    grossup: 0.38, // 38% grossup
    federalCredit: 0.150198, // 15.0198% credit
  },
  nonEligible: {
    grossup: 0.15, // 15% grossup
    federalCredit: 0.090301, // 9.0301% credit
  },
};

export const CAPITAL_GAINS_2026 = {
  inclusionRateStandard: 0.50, // 50% for gains up to $250k
  inclusionRateHigh: 0.6667, // 66.67% for gains over $250k
  highThreshold: 250000,
};

// ============================================================================
// ONTARIO TAX (2026)
// ============================================================================

export const ONTARIO_TAX_BRACKETS_2026 = [
  { threshold: 0, limit: 53891, rate: 0.0505 },     // 5.05% on first $53,891 (Ontario 2026)
  { threshold: 53891, limit: 107785, rate: 0.0915 }, // 9.15% on $53,891-$107,785
  { threshold: 107785, limit: 150000, rate: 0.1116 }, // 11.16% on $107,785-$150,000
  { threshold: 150000, limit: 220000, rate: 0.1216 }, // 12.16% on $150,000-$220,000
  { threshold: 220000, limit: Infinity, rate: 0.1316 }, // 13.16% on $220,000+
];

export const ONTARIO_TAX_CREDITS_2026 = {
  basicPersonalAmount: 12989, // Ontario 2026 (indexed at 1.9%)
  ageAmount: 6347, // Ontario 2026 (indexed at 1.9%) (Age 65+)
  agePhaseoutThreshold: 47210, // Ontario 2026 (indexed at 1.9%) - Phase-out starts here
  agePhaseoutEnd: 89485, // Full phase-out
  agePhaseoutRate: 0.15, // 15% reduction on excess income
  pensionIncomeAmount: 2000,
  spouseAmount: 10202,
};

export const ONTARIO_DIVIDEND_RATES_2026 = {
  eligible: {
    credit: 0.10, // 10% credit
  },
  nonEligible: {
    credit: 0.015, // 1.5% credit (note: this is lower than the grossup)
  },
};

// ============================================================================
// ALBERTA TAX (2026)
// ============================================================================

export const ALBERTA_TAX_BRACKETS_2026 = [
  { threshold: 0, limit: 61200, rate: 0.08 },       // 8% on first $61,200 (Alberta 2026)
  { threshold: 61200, limit: 154259, rate: 0.10 },  // 10% on $61,200-$154,259
  { threshold: 154259, limit: 185111, rate: 0.12 }, // 12% on $154,259-$185,111
  { threshold: 185111, limit: 246813, rate: 0.13 }, // 13% on $185,111-$246,813
  { threshold: 246813, limit: 370220, rate: 0.14 }, // 14% on $246,813-$370,220
  { threshold: 370220, limit: Infinity, rate: 0.15 }, // 15% on $370,220+
];

export const ALBERTA_TAX_CREDITS_2026 = {
  basicPersonalAmount: 22769, // Alberta 2026 (indexed at 2%)
  ageAmount: 5835, // Alberta 2026 (indexed at 2%)
  pensionIncomeAmount: 1613, // Alberta 2026 (indexed at 2%)
  spouseAmount: 22769,
};

// ============================================================================
// QUEBEC TAX (2026)
// ============================================================================

export const QUEBEC_TAX_BRACKETS_2026 = [
  { threshold: 0, limit: 51780, rate: 0.14 },
  { threshold: 51780, limit: 103545, rate: 0.19 },
  { threshold: 103545, limit: 126000, rate: 0.24 },
  { threshold: 126000, limit: Infinity, rate: 0.2575 },
];

export const QUEBEC_TAX_CREDITS_2026 = {
  basicPersonalAmount: 18056,
  ageAmount: 3251,
  pensionIncomeAmount: 3251,
  spouseAmount: 18056,
};

// ============================================================================
// INFLATION INDEXING FOR FUTURE YEARS
// ============================================================================

/**
 * Index tax brackets and credits for future years based on inflation
 * @param year Target year (e.g., 2027, 2028, etc.)
 * @param inflationRate Annual inflation rate (e.g., 0.02 for 2%)
 */
export function getIndexedTaxRates(year: number, inflationRate: number) {
  const baseYear = 2026;
  if (year < baseYear) {
    throw new Error(`Year must be ${baseYear} or later`);
  }

  const yearsFromBase = year - baseYear;
  const indexFactor = Math.pow(1 + inflationRate, yearsFromBase);

  // Helper to index a value
  const index = (value: number) => Math.round(value * indexFactor);

  // Index federal brackets
  const federalBrackets = FEDERAL_TAX_BRACKETS_2026.map(b => ({
    threshold: index(b.threshold),
    limit: b.limit === Infinity ? Infinity : index(b.limit),
    rate: b.rate,
  }));

  // Index federal credits
  const federalCredits = {
    basicPersonalAmount: index(FEDERAL_TAX_CREDITS_2026.basicPersonalAmount),
    basicPersonalAmountHigh: index(FEDERAL_TAX_CREDITS_2026.basicPersonalAmountHigh),
    bpaPhaseoutStart: index(FEDERAL_TAX_CREDITS_2026.bpaPhaseoutStart),
    bpaPhaseoutEnd: index(FEDERAL_TAX_CREDITS_2026.bpaPhaseoutEnd),
    ageAmount: index(FEDERAL_TAX_CREDITS_2026.ageAmount),
    agePhaseoutThreshold: index(FEDERAL_TAX_CREDITS_2026.agePhaseoutThreshold),
    agePhaseoutEnd: index(FEDERAL_TAX_CREDITS_2026.agePhaseoutEnd),
    agePhaseoutRate: FEDERAL_TAX_CREDITS_2026.agePhaseoutRate,
    pensionIncomeAmount: FEDERAL_TAX_CREDITS_2026.pensionIncomeAmount,
    spouseAmount: index(FEDERAL_TAX_CREDITS_2026.spouseAmount),
    disabilityAmount: index(FEDERAL_TAX_CREDITS_2026.disabilityAmount),
    canadaEmploymentAmount: index(FEDERAL_TAX_CREDITS_2026.canadaEmploymentAmount),
  };

  // Index Ontario brackets
  const ontarioBrackets = ONTARIO_TAX_BRACKETS_2026.map(b => ({
    threshold: index(b.threshold),
    limit: b.limit === Infinity ? Infinity : index(b.limit),
    rate: b.rate,
  }));

  // Index Ontario credits
  const ontarioCredits = {
    basicPersonalAmount: index(ONTARIO_TAX_CREDITS_2026.basicPersonalAmount),
    ageAmount: index(ONTARIO_TAX_CREDITS_2026.ageAmount),
    agePhaseoutThreshold: index(ONTARIO_TAX_CREDITS_2026.agePhaseoutThreshold),
    agePhaseoutEnd: index(ONTARIO_TAX_CREDITS_2026.agePhaseoutEnd),
    agePhaseoutRate: ONTARIO_TAX_CREDITS_2026.agePhaseoutRate,
    pensionIncomeAmount: ONTARIO_TAX_CREDITS_2026.pensionIncomeAmount,
    spouseAmount: index(ONTARIO_TAX_CREDITS_2026.spouseAmount),
  };

  // Index Alberta brackets
  const albertaBrackets = ALBERTA_TAX_BRACKETS_2026.map(b => ({
    threshold: index(b.threshold),
    limit: b.limit === Infinity ? Infinity : index(b.limit),
    rate: b.rate,
  }));

  // Index Alberta credits
  const albertaCredits = {
    basicPersonalAmount: index(ALBERTA_TAX_CREDITS_2026.basicPersonalAmount),
    ageAmount: index(ALBERTA_TAX_CREDITS_2026.ageAmount),
    pensionIncomeAmount: index(ALBERTA_TAX_CREDITS_2026.pensionIncomeAmount),
    spouseAmount: index(ALBERTA_TAX_CREDITS_2026.spouseAmount),
  };

  // Index OAS clawback
  const oasClawback = {
    threshold: index(OAS_CLAWBACK_2026.threshold),
    rate: OAS_CLAWBACK_2026.rate,
  };

  return {
    year,
    indexFactor,
    federal: {
      brackets: federalBrackets,
      credits: federalCredits,
    },
    ontario: {
      brackets: ontarioBrackets,
      credits: ontarioCredits,
    },
    alberta: {
      brackets: albertaBrackets,
      credits: albertaCredits,
    },
    oasClawback,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply progressive tax brackets
 */
function applyTaxBrackets(
  taxableIncome: number,
  brackets: Array<{ threshold: number; limit: number; rate: number }>
): { tax: number; marginalRate: number } {
  let tax = 0;
  let marginalRate = 0;

  for (const bracket of brackets) {
    if (taxableIncome > bracket.threshold) {
      const amountInBracket = Math.min(
        taxableIncome - bracket.threshold,
        bracket.limit - bracket.threshold
      );
      tax += amountInBracket * bracket.rate;
      marginalRate = bracket.rate;
    }
  }

  return { tax, marginalRate };
}

/**
 * Calculate age amount with phase-out
 */
function calculateAgeAmount(
  netIncome: number,
  ageAmount: number,
  phaseoutThreshold: number,
  phaseoutRate: number
): number {
  if (netIncome <= phaseoutThreshold) {
    return ageAmount;
  }

  const excessIncome = netIncome - phaseoutThreshold;
  const reduction = excessIncome * phaseoutRate;
  return Math.max(0, ageAmount - reduction);
}

/**
 * Calculate OAS clawback
 */
export function calculateOASClawback(
  netIncome: number,
  oasReceived: number
): number {
  if (netIncome <= OAS_CLAWBACK_2026.threshold) {
    return 0;
  }

  const excessIncome = netIncome - OAS_CLAWBACK_2026.threshold;
  const clawback = excessIncome * OAS_CLAWBACK_2026.rate;
  return Math.min(clawback, oasReceived); // Can't clawback more than OAS received
}

/**
 * Calculate dividend tax credit
 */
export function calculateDividendTaxCredit(
  eligibleDividends: number,
  nonEligibleDividends: number,
  province: string = 'AB'
): {
  eligibleGrossup: number;
  nonEligibleGrossup: number;
  totalGrossup: number;
  federalCredit: number;
  provincialCredit: number;
  totalCredit: number;
} {
  // Calculate grossup
  const eligibleGrossup = eligibleDividends * DIVIDEND_RATES_2026.eligible.grossup;
  const nonEligibleGrossup = nonEligibleDividends * DIVIDEND_RATES_2026.nonEligible.grossup;
  const totalGrossup = eligibleGrossup + nonEligibleGrossup;

  // Calculate federal credit
  const federalEligibleCredit =
    (eligibleDividends + eligibleGrossup) * DIVIDEND_RATES_2026.eligible.federalCredit;
  const federalNonEligibleCredit =
    (nonEligibleDividends + nonEligibleGrossup) * DIVIDEND_RATES_2026.nonEligible.federalCredit;
  const federalCredit = federalEligibleCredit + federalNonEligibleCredit;

  // Calculate provincial credit (Alberta by default)
  let provincialCredit = 0;
  if (province.toUpperCase() === 'ON' || province.toUpperCase() === 'ONTARIO') {
    const provEligibleCredit =
      (eligibleDividends + eligibleGrossup) * ONTARIO_DIVIDEND_RATES_2026.eligible.credit;
    const provNonEligibleCredit =
      (nonEligibleDividends + nonEligibleGrossup) * ONTARIO_DIVIDEND_RATES_2026.nonEligible.credit;
    provincialCredit = provEligibleCredit + provNonEligibleCredit;
  }
  // Alberta has no provincial dividend tax credit

  return {
    eligibleGrossup,
    nonEligibleGrossup,
    totalGrossup,
    federalCredit,
    provincialCredit,
    totalCredit: federalCredit + provincialCredit,
  };
}

/**
 * Calculate capital gains inclusion
 */
export function calculateCapitalGainsInclusion(capitalGains: number): {
  includedAmount: number;
  inclusionRate: number;
} {
  if (capitalGains <= CAPITAL_GAINS_2026.highThreshold) {
    return {
      includedAmount: capitalGains * CAPITAL_GAINS_2026.inclusionRateStandard,
      inclusionRate: CAPITAL_GAINS_2026.inclusionRateStandard,
    };
  }

  // Split calculation for gains over $250k
  const standardAmount = CAPITAL_GAINS_2026.highThreshold * CAPITAL_GAINS_2026.inclusionRateStandard;
  const excessAmount =
    (capitalGains - CAPITAL_GAINS_2026.highThreshold) * CAPITAL_GAINS_2026.inclusionRateHigh;

  return {
    includedAmount: standardAmount + excessAmount,
    inclusionRate:
      (standardAmount + excessAmount) / capitalGains, // Effective inclusion rate
  };
}

// ============================================================================
// FEDERAL TAX CALCULATION
// ============================================================================

export interface TaxCalculationInputs {
  ordinaryIncome: number; // Employment, interest, rental, other
  pensionIncome: number; // CPP, OAS, RRIF, employer pensions
  eligibleDividends: number;
  nonEligibleDividends: number;
  capitalGains: number;
  oasReceived: number;
  age: number;
  province: string;
}

export function calculateFederalTax(inputs: TaxCalculationInputs): {
  grossTax: number;
  nonRefundableCredits: number;
  dividendTaxCredit: number;
  totalCredits: number;
  netTax: number;
  marginalRate: number;
  taxableIncome: number;
  breakdown: {
    basicPersonalCredit: number;
    ageCredit: number;
    pensionCredit: number;
  };
} {
  // 1. Calculate taxable income
  const dividendCalc = calculateDividendTaxCredit(
    inputs.eligibleDividends,
    inputs.nonEligibleDividends,
    inputs.province
  );
  const capitalGainsCalc = calculateCapitalGainsInclusion(inputs.capitalGains);

  const taxableIncome =
    inputs.ordinaryIncome +
    inputs.pensionIncome +
    inputs.oasReceived +
    dividendCalc.totalGrossup +
    capitalGainsCalc.includedAmount;

  // 2. Apply tax brackets
  const { tax: grossTax, marginalRate } = applyTaxBrackets(
    taxableIncome,
    FEDERAL_TAX_BRACKETS_2026
  );

  // 3. Calculate non-refundable credits
  // Basic Personal Amount phases out for high income earners
  let basicPersonalAmount = FEDERAL_TAX_CREDITS_2026.basicPersonalAmount;
  if (taxableIncome > FEDERAL_TAX_CREDITS_2026.bpaPhaseoutStart) {
    const phaseoutRange = FEDERAL_TAX_CREDITS_2026.bpaPhaseoutEnd - FEDERAL_TAX_CREDITS_2026.bpaPhaseoutStart;
    const excessIncome = Math.min(
      taxableIncome - FEDERAL_TAX_CREDITS_2026.bpaPhaseoutStart,
      phaseoutRange
    );
    const reduction = (FEDERAL_TAX_CREDITS_2026.basicPersonalAmount - FEDERAL_TAX_CREDITS_2026.basicPersonalAmountHigh) * (excessIncome / phaseoutRange);
    basicPersonalAmount = FEDERAL_TAX_CREDITS_2026.basicPersonalAmount - reduction;
  }
  const basicPersonalCredit = basicPersonalAmount * 0.14; // 14% for 2026

  let ageCredit = 0;
  if (inputs.age >= 65) {
    const ageAmount = calculateAgeAmount(
      taxableIncome,
      FEDERAL_TAX_CREDITS_2026.ageAmount,
      FEDERAL_TAX_CREDITS_2026.agePhaseoutThreshold,
      FEDERAL_TAX_CREDITS_2026.agePhaseoutRate
    );
    ageCredit = ageAmount * 0.14; // 14% for 2026
  }

  let pensionCredit = 0;
  if (inputs.pensionIncome > 0) {
    const eligiblePension = Math.min(
      inputs.pensionIncome,
      FEDERAL_TAX_CREDITS_2026.pensionIncomeAmount
    );
    pensionCredit = eligiblePension * 0.14; // 14% for 2026
  }

  const nonRefundableCredits = basicPersonalCredit + ageCredit + pensionCredit;

  // 4. Dividend tax credit (federal portion)
  const dividendTaxCredit = dividendCalc.federalCredit;

  // 5. Total credits and net tax
  const totalCredits = nonRefundableCredits + dividendTaxCredit;
  const netTax = Math.max(0, grossTax - totalCredits);

  return {
    grossTax: Math.round(grossTax * 100) / 100,
    nonRefundableCredits: Math.round(nonRefundableCredits * 100) / 100,
    dividendTaxCredit: Math.round(dividendTaxCredit * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    netTax: Math.round(netTax * 100) / 100,
    marginalRate: Math.round(marginalRate * 10000) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    breakdown: {
      basicPersonalCredit: Math.round(basicPersonalCredit * 100) / 100,
      ageCredit: Math.round(ageCredit * 100) / 100,
      pensionCredit: Math.round(pensionCredit * 100) / 100,
    },
  };
}

// ============================================================================
// PROVINCIAL TAX CALCULATIONS
// ============================================================================

export function calculateOntarioTax(inputs: TaxCalculationInputs): {
  grossTax: number;
  nonRefundableCredits: number;
  dividendTaxCredit: number;
  totalCredits: number;
  netTax: number;
  marginalRate: number;
  breakdown: {
    basicPersonalCredit: number;
    ageCredit: number;
    pensionCredit: number;
  };
} {
  // 1. Calculate taxable income (same as federal)
  const dividendCalc = calculateDividendTaxCredit(
    inputs.eligibleDividends,
    inputs.nonEligibleDividends,
    'ON'
  );
  const capitalGainsCalc = calculateCapitalGainsInclusion(inputs.capitalGains);

  const taxableIncome =
    inputs.ordinaryIncome +
    inputs.pensionIncome +
    inputs.oasReceived +
    dividendCalc.totalGrossup +
    capitalGainsCalc.includedAmount;

  // 2. Apply Ontario tax brackets
  const { tax: grossTax, marginalRate } = applyTaxBrackets(
    taxableIncome,
    ONTARIO_TAX_BRACKETS_2026
  );

  // 3. Calculate non-refundable credits (at 5.05% for Ontario)
  const basicPersonalCredit =
    ONTARIO_TAX_CREDITS_2026.basicPersonalAmount * 0.0505;

  let ageCredit = 0;
  if (inputs.age >= 65) {
    const ageAmount = calculateAgeAmount(
      taxableIncome,
      ONTARIO_TAX_CREDITS_2026.ageAmount,
      ONTARIO_TAX_CREDITS_2026.agePhaseoutThreshold,
      ONTARIO_TAX_CREDITS_2026.agePhaseoutRate
    );
    ageCredit = ageAmount * 0.0505;
  }

  let pensionCredit = 0;
  if (inputs.pensionIncome > 0) {
    const eligiblePension = Math.min(
      inputs.pensionIncome,
      ONTARIO_TAX_CREDITS_2026.pensionIncomeAmount
    );
    pensionCredit = eligiblePension * 0.0505;
  }

  const nonRefundableCredits = basicPersonalCredit + ageCredit + pensionCredit;

  // 4. Dividend tax credit (provincial portion)
  const dividendTaxCredit = dividendCalc.provincialCredit;

  // 5. Total credits and net tax
  const totalCredits = nonRefundableCredits + dividendTaxCredit;
  const netTax = Math.max(0, grossTax - totalCredits);

  return {
    grossTax: Math.round(grossTax * 100) / 100,
    nonRefundableCredits: Math.round(nonRefundableCredits * 100) / 100,
    dividendTaxCredit: Math.round(dividendTaxCredit * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    netTax: Math.round(netTax * 100) / 100,
    marginalRate: Math.round(marginalRate * 10000) / 100,
    breakdown: {
      basicPersonalCredit: Math.round(basicPersonalCredit * 100) / 100,
      ageCredit: Math.round(ageCredit * 100) / 100,
      pensionCredit: Math.round(pensionCredit * 100) / 100,
    },
  };
}

export function calculateAlbertaTax(inputs: TaxCalculationInputs): {
  grossTax: number;
  nonRefundableCredits: number;
  dividendTaxCredit: number;
  totalCredits: number;
  netTax: number;
  marginalRate: number;
  breakdown: {
    basicPersonalCredit: number;
    ageCredit: number;
    pensionCredit: number;
  };
} {
  // 1. Calculate taxable income (same as federal)
  const dividendCalc = calculateDividendTaxCredit(
    inputs.eligibleDividends,
    inputs.nonEligibleDividends,
    'AB'
  );
  const capitalGainsCalc = calculateCapitalGainsInclusion(inputs.capitalGains);

  const taxableIncome =
    inputs.ordinaryIncome +
    inputs.pensionIncome +
    inputs.oasReceived +
    dividendCalc.totalGrossup +
    capitalGainsCalc.includedAmount;

  // 2. Apply Alberta tax brackets
  const { tax: grossTax, marginalRate } = applyTaxBrackets(
    taxableIncome,
    ALBERTA_TAX_BRACKETS_2026
  );

  // 3. Calculate non-refundable credits (at 8% for Alberta - lowest bracket rate)
  const basicPersonalCredit =
    ALBERTA_TAX_CREDITS_2026.basicPersonalAmount * 0.08;

  let ageCredit = 0;
  if (inputs.age >= 65) {
    ageCredit = ALBERTA_TAX_CREDITS_2026.ageAmount * 0.08;
  }

  let pensionCredit = 0;
  if (inputs.pensionIncome > 0) {
    const eligiblePension = Math.min(
      inputs.pensionIncome,
      ALBERTA_TAX_CREDITS_2026.pensionIncomeAmount
    );
    pensionCredit = eligiblePension * 0.08;
  }

  const nonRefundableCredits = basicPersonalCredit + ageCredit + pensionCredit;

  // 4. Dividend tax credit (provincial portion - Alberta has no dividend tax credit)
  const dividendTaxCredit = 0; // Alberta does not provide dividend tax credit

  // 5. Total credits and net tax
  const totalCredits = nonRefundableCredits + dividendTaxCredit;
  const netTax = Math.max(0, grossTax - totalCredits);

  return {
    grossTax: Math.round(grossTax * 100) / 100,
    nonRefundableCredits: Math.round(nonRefundableCredits * 100) / 100,
    dividendTaxCredit: Math.round(dividendTaxCredit * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    netTax: Math.round(netTax * 100) / 100,
    marginalRate: Math.round(marginalRate * 10000) / 100,
    breakdown: {
      basicPersonalCredit: Math.round(basicPersonalCredit * 100) / 100,
      ageCredit: Math.round(ageCredit * 100) / 100,
      pensionCredit: Math.round(pensionCredit * 100) / 100,
    },
  };
}

// ============================================================================
// TOTAL TAX CALCULATION
// ============================================================================

export function calculateTotalTax(
  taxableIncome: number,
  province: string = 'AB',
  age: number = 65,
  hasPensionIncome: boolean = false
): {
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  marginalRate: number;
  averageRate: number;
  breakdown?: any;
} {
  // Simple wrapper for backward compatibility
  const inputs: TaxCalculationInputs = {
    ordinaryIncome: hasPensionIncome ? 0 : taxableIncome,
    pensionIncome: hasPensionIncome ? taxableIncome : 0,
    eligibleDividends: 0,
    nonEligibleDividends: 0,
    capitalGains: 0,
    oasReceived: 0,
    age,
    province,
  };

  return calculateCompleteTax(inputs);
}

export function calculateCompleteTax(inputs: TaxCalculationInputs): {
  federalTax: number;
  provincialTax: number;
  oasClawback: number;
  totalTax: number;
  marginalRate: number;
  averageRate: number;
  netIncome: number;
  breakdown: {
    federal: ReturnType<typeof calculateFederalTax>;
    provincial: ReturnType<typeof calculateOntarioTax> | ReturnType<typeof calculateAlbertaTax>;
  };
} {
  const federal = calculateFederalTax(inputs);

  // Calculate provincial tax based on province
  let provincial;
  const provinceCode = inputs.province.toUpperCase();
  switch (provinceCode) {
    case 'AB':
    case 'ALBERTA':
      provincial = calculateAlbertaTax(inputs);
      break;
    case 'ON':
    case 'ONTARIO':
    default:
      provincial = calculateOntarioTax(inputs);
      break;
  }

  // Calculate net income for OAS clawback (use taxable income)
  const netIncome = federal.taxableIncome;

  // Calculate OAS clawback
  const oasClawback = calculateOASClawback(netIncome, inputs.oasReceived);

  // Total tax includes OAS clawback
  const totalTax = federal.netTax + provincial.netTax + oasClawback;

  // Combined marginal rate
  const combinedMarginalRate = federal.marginalRate + provincial.marginalRate;

  // Average rate
  const grossIncome =
    inputs.ordinaryIncome +
    inputs.pensionIncome +
    inputs.oasReceived +
    inputs.eligibleDividends +
    inputs.nonEligibleDividends +
    inputs.capitalGains;
  const averageRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    federalTax: federal.netTax,
    provincialTax: provincial.netTax,
    oasClawback: Math.round(oasClawback * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    marginalRate: Math.round(combinedMarginalRate * 100) / 100,
    averageRate: Math.round(averageRate * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    breakdown: {
      federal,
      provincial,
    },
  };
}

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

export function calculateAfterTaxIncome(
  grossIncome: number,
  province: string = 'AB',
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

export function calculateCapitalGainsTax(
  capitalGain: number,
  marginalTaxRate: number
): {
  capitalGain: number;
  taxableAmount: number;
  tax: number;
} {
  const inclusion = calculateCapitalGainsInclusion(capitalGain);
  const tax = inclusion.includedAmount * (marginalTaxRate / 100);

  return {
    capitalGain,
    taxableAmount: Math.round(inclusion.includedAmount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
  };
}

export function calculateWithholdingTax(
  withdrawalAmount: number,
  province: string = 'AB'
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

  // Provincial withholding tax rates
  let provincialRate: number;
  if (province.toUpperCase() === 'ON' || province.toUpperCase() === 'ONTARIO') {
    if (withdrawalAmount <= 5000) {
      provincialRate = 0.05;
    } else if (withdrawalAmount <= 15000) {
      provincialRate = 0.10;
    } else {
      provincialRate = 0.15;
    }
  } else if (province.toUpperCase() === 'QC' || province.toUpperCase() === 'QUEBEC') {
    if (withdrawalAmount <= 5000) {
      provincialRate = 0.05;
    } else if (withdrawalAmount <= 15000) {
      provincialRate = 0.10;
    } else {
      provincialRate = 0.15;
    }
  } else {
    provincialRate = 0; // Alberta and other provinces have no provincial withholding
  }

  const totalWithholdingRate = federalRate + provincialRate;
  return Math.round(withdrawalAmount * totalWithholdingRate * 100) / 100;
}
