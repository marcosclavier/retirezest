/**
 * Retirement Projection Engine
 * Projects year-by-year retirement cash flow, taxes, and asset balances
 */

import { estimateCPPSimple } from './cpp';
import { calculateNetOAS } from './oas';
import { calculateGIS } from './gis';
import {
  calculateCompleteTax,
  type TaxCalculationInputs,
} from './tax';

export interface ProjectionInput {
  // Personal info
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  province: string;

  // Current assets
  rrspBalance: number;
  tfsaBalance: number;
  nonRegBalance: number;
  realEstateValue: number;

  // Income
  employmentIncome: number; // Until retirement
  pensionIncome: number; // Starts at retirement
  rentalIncome: number;
  otherIncome: number;

  // RRSP contributions (tax deductible)
  annualRRSPContribution?: number; // Annual RRSP contributions before retirement

  // CPP/OAS
  cppStartAge: number;
  oasStartAge: number;
  averageCareerIncome: number;
  yearsOfCPPContributions: number;
  yearsInCanada: number;

  // Expenses
  annualExpenses: number;
  expenseInflationRate: number;

  // Investment assumptions
  investmentReturnRate: number;
  inflationRate: number;

  // RRIF rules
  rrspToRrifAge: number; // Age 71

  // Withdrawal strategy
  withdrawalStrategy?: string; // e.g., "RRIF->Corp->NonReg->TFSA"
}

export interface YearProjection {
  year: number;
  age: number;

  // Income sources
  employmentIncome: number;
  pensionIncome: number;
  cppIncome: number;
  oasIncome: number;
  gisIncome: number;
  investmentIncome: number;
  rentalIncome: number;
  otherIncome: number;
  rrspWithdrawal: number;
  tfsaWithdrawal: number;
  nonRegWithdrawal: number;
  rrifMinWithdrawal: number;

  totalGrossIncome: number;
  taxableIncome: number;

  // Taxes
  federalTax: number;
  provincialTax: number;
  oasClawback: number;
  totalTax: number;
  averageTaxRate: number;

  // Cash flow
  totalAfterTaxIncome: number;
  annualExpenses: number;
  cashSurplusDeficit: number;

  // Asset balances (end of year)
  rrspBalance: number;
  tfsaBalance: number;
  nonRegBalance: number;
  totalAssets: number;

  // Flags
  isRetired: boolean;
  isRrifAge: boolean;
  assetsDepletedAge: number | null;
}

export interface ProjectionSummary {
  totalYears: number;
  retirementYears: number;

  totalIncome: number;
  totalTaxesPaid: number;
  totalExpenses: number;

  averageAnnualIncome: number;
  averageAnnualExpenses: number;
  averageAnnualTaxRate: number;

  assetsDepleted: boolean;
  assetsDepletedAge: number | null;
  remainingAssets: number;

  projections: YearProjection[];
}

/**
 * RRIF minimum withdrawal rates by age
 */
const RRIF_MIN_RATES: Record<number, number> = {
  71: 0.0528,
  72: 0.0540,
  73: 0.0553,
  74: 0.0567,
  75: 0.0582,
  76: 0.0598,
  77: 0.0617,
  78: 0.0636,
  79: 0.0658,
  80: 0.0682,
  81: 0.0708,
  82: 0.0738,
  83: 0.0771,
  84: 0.0808,
  85: 0.0851,
  86: 0.0899,
  87: 0.0955,
  88: 0.1021,
  89: 0.1099,
  90: 0.1192,
  91: 0.1306,
  92: 0.1449,
  93: 0.1634,
  94: 0.1879,
  95: 0.2000,
};

/**
 * Get RRIF minimum withdrawal rate for age
 */
function getRrifMinRate(age: number): number {
  if (age < 71) return 0;
  if (age >= 95) return 0.2000;
  return RRIF_MIN_RATES[age] || 0.2000;
}

/**
 * Calculate RRIF minimum withdrawal
 */
function calculateRrifMinWithdrawal(balance: number, age: number): number {
  const rate = getRrifMinRate(age);
  return balance * rate;
}

/**
 * Project retirement cash flow year by year
 */
export function projectRetirement(input: ProjectionInput): ProjectionSummary {
  const projections: YearProjection[] = [];
  const startYear = new Date().getFullYear();

  // Initialize balances
  let rrspBalance = input.rrspBalance;
  let tfsaBalance = input.tfsaBalance;
  let nonRegBalance = input.nonRegBalance;

  let assetsDepletedAge: number | null = null;

  // Project each year
  for (let age = input.currentAge; age <= input.lifeExpectancy; age++) {
    const year = startYear + (age - input.currentAge);
    const yearsFromNow = age - input.currentAge;
    const isRetired = age >= input.retirementAge;
    const isRrifAge = age >= input.rrspToRrifAge;

    // Calculate income sources
    let employmentIncome = 0;
    if (!isRetired) {
      employmentIncome = input.employmentIncome * Math.pow(1 + input.inflationRate, yearsFromNow);
    }

    const pensionIncome = isRetired ? input.pensionIncome * Math.pow(1 + input.inflationRate, yearsFromNow) : 0;

    const rentalIncome = input.rentalIncome * Math.pow(1 + input.inflationRate, yearsFromNow);
    const otherIncome = input.otherIncome * Math.pow(1 + input.inflationRate, yearsFromNow);

    // CPP
    let cppIncome = 0;
    if (age >= input.cppStartAge) {
      const cppEstimate = estimateCPPSimple(
        input.averageCareerIncome,
        input.yearsOfCPPContributions,
        input.cppStartAge
      );
      cppIncome = cppEstimate.annualAmount * Math.pow(1 + input.inflationRate, yearsFromNow);
    }

    // OAS
    let oasIncome = 0;
    if (age >= input.oasStartAge) {
      const totalIncome = employmentIncome + pensionIncome + cppIncome + rentalIncome + otherIncome;
      const oasEstimate = calculateNetOAS(input.yearsInCanada, totalIncome, age);
      oasIncome = oasEstimate.annualAmount * Math.pow(1 + input.inflationRate, yearsFromNow);
    }

    // GIS
    let gisIncome = 0;
    if (age >= 65 && oasIncome > 0) {
      const totalIncome = pensionIncome + cppIncome + rentalIncome + otherIncome;
      const gisEstimate = calculateGIS(totalIncome, 'single', false);
      gisIncome = gisEstimate.annualAmount * Math.pow(1 + input.inflationRate, yearsFromNow);
    }

    // Calculate expenses
    const annualExpenses = input.annualExpenses * Math.pow(1 + input.expenseInflationRate, yearsFromNow);

    // Calculate government + other income
    const governmentAndOtherIncome = employmentIncome + pensionIncome + cppIncome + oasIncome + gisIncome + rentalIncome + otherIncome;

    // Calculate shortfall (need to withdraw from investments)
    const shortfall = Math.max(0, annualExpenses - governmentAndOtherIncome);

    // RRIF minimum withdrawal
    let rrifMinWithdrawal = 0;
    if (isRrifAge) {
      rrifMinWithdrawal = calculateRrifMinWithdrawal(rrspBalance, age);
    }

    // Determine withdrawals based on strategy
    let rrspWithdrawal = 0;
    let tfsaWithdrawal = 0;
    let nonRegWithdrawal = 0;

    if (shortfall > 0 || rrifMinWithdrawal > 0) {
      const withdrawalNeeded = Math.max(shortfall, rrifMinWithdrawal);
      const strategy = input.withdrawalStrategy || 'RRIF->Corp->NonReg->TFSA';

      // Execute withdrawal based on selected strategy
      let remaining = withdrawalNeeded;

      if (strategy === 'NonReg->RRIF->Corp->TFSA') {
        // Strategy A: Non-Registered → RRIF → Corporate → TFSA
        // 1. Non-Registered
        if (remaining > 0 && nonRegBalance > 0) {
          nonRegWithdrawal = Math.min(nonRegBalance, remaining);
          nonRegBalance -= nonRegWithdrawal;
          remaining -= nonRegWithdrawal;
        }
        // 2. RRIF/RRSP (account for tax)
        if (remaining > 0 && rrspBalance > 0) {
          const estimatedWithdrawal = remaining * 1.3; // Rough estimate for tax
          rrspWithdrawal = Math.min(rrspBalance, estimatedWithdrawal);
          rrspBalance -= rrspWithdrawal;
          remaining -= rrspWithdrawal * 0.7; // After-tax amount
        }
        // 3. Corporate (not yet implemented - treat as non-reg for now)
        // 4. TFSA (last resort)
        if (remaining > 0 && tfsaBalance > 0) {
          tfsaWithdrawal = Math.min(tfsaBalance, remaining);
          tfsaBalance -= tfsaWithdrawal;
          remaining -= tfsaWithdrawal;
        }
      } else if (strategy === 'RRIF->Corp->NonReg->TFSA') {
        // Strategy B (Default): RRIF → Corporate → Non-Registered → TFSA
        // 1. RRIF/RRSP (account for tax)
        if (remaining > 0 && rrspBalance > 0) {
          const estimatedWithdrawal = remaining * 1.3; // Rough estimate for tax
          rrspWithdrawal = Math.min(rrspBalance, estimatedWithdrawal);
          rrspBalance -= rrspWithdrawal;
          remaining -= rrspWithdrawal * 0.7; // After-tax amount
        }
        // 2. Corporate (not yet implemented - treat as non-reg for now)
        // 3. Non-Registered
        if (remaining > 0 && nonRegBalance > 0) {
          nonRegWithdrawal = Math.min(nonRegBalance, remaining);
          nonRegBalance -= nonRegWithdrawal;
          remaining -= nonRegWithdrawal;
        }
        // 4. TFSA (last resort)
        if (remaining > 0 && tfsaBalance > 0) {
          tfsaWithdrawal = Math.min(tfsaBalance, remaining);
          tfsaBalance -= tfsaWithdrawal;
          remaining -= tfsaWithdrawal;
        }
      } else if (strategy === 'Corp->RRIF->NonReg->TFSA') {
        // Strategy C: Corporate → RRIF → Non-Registered → TFSA
        // 1. Corporate (not yet implemented - treat as non-reg for now)
        // 2. RRIF/RRSP (account for tax)
        if (remaining > 0 && rrspBalance > 0) {
          const estimatedWithdrawal = remaining * 1.3; // Rough estimate for tax
          rrspWithdrawal = Math.min(rrspBalance, estimatedWithdrawal);
          rrspBalance -= rrspWithdrawal;
          remaining -= rrspWithdrawal * 0.7; // After-tax amount
        }
        // 3. Non-Registered
        if (remaining > 0 && nonRegBalance > 0) {
          nonRegWithdrawal = Math.min(nonRegBalance, remaining);
          nonRegBalance -= nonRegWithdrawal;
          remaining -= nonRegWithdrawal;
        }
        // 4. TFSA (last resort)
        if (remaining > 0 && tfsaBalance > 0) {
          tfsaWithdrawal = Math.min(tfsaBalance, remaining);
          tfsaBalance -= tfsaWithdrawal;
          remaining -= tfsaWithdrawal;
        }
      } else if (strategy === 'Hybrid') {
        // Hybrid: RRIF top-up first → Non-Registered → Corporate → TFSA
        // 1. RRIF minimum only (top-up to basic personal amount)
        if (rrifMinWithdrawal > 0 && rrspBalance > 0) {
          rrspWithdrawal = Math.min(rrspBalance, rrifMinWithdrawal);
          rrspBalance -= rrspWithdrawal;
          remaining -= rrspWithdrawal * 0.7; // After-tax amount
        }
        // 2. Non-Registered
        if (remaining > 0 && nonRegBalance > 0) {
          nonRegWithdrawal = Math.min(nonRegBalance, remaining);
          nonRegBalance -= nonRegWithdrawal;
          remaining -= nonRegWithdrawal;
        }
        // 3. Corporate (not yet implemented)
        // 4. TFSA (last resort)
        if (remaining > 0 && tfsaBalance > 0) {
          tfsaWithdrawal = Math.min(tfsaBalance, remaining);
          tfsaBalance -= tfsaWithdrawal;
          remaining -= tfsaWithdrawal;
        }
        // 5. Additional RRIF if still needed
        if (remaining > 0 && rrspBalance > 0) {
          const estimatedWithdrawal = remaining * 1.3; // Rough estimate for tax
          const additionalRrif = Math.min(rrspBalance, estimatedWithdrawal);
          rrspBalance -= additionalRrif;
          rrspWithdrawal += additionalRrif;
        }
      } else {
        // Default fallback: TFSA first, then non-reg, then RRSP/RRIF
        if (tfsaBalance > 0) {
          tfsaWithdrawal = Math.min(tfsaBalance, remaining);
          tfsaBalance -= tfsaWithdrawal;
          remaining -= tfsaWithdrawal;
        }
        if (remaining > 0 && nonRegBalance > 0) {
          nonRegWithdrawal = Math.min(nonRegBalance, remaining);
          nonRegBalance -= nonRegWithdrawal;
          remaining -= nonRegWithdrawal;
        }
        if (remaining > 0 && rrspBalance > 0) {
          const estimatedWithdrawal = remaining * 1.3; // Rough estimate for tax
          rrspWithdrawal = Math.min(rrspBalance, estimatedWithdrawal);
          rrspBalance -= rrspWithdrawal;
        }
      }

      // Ensure RRIF minimum is met if in RRIF age
      if (isRrifAge && rrspWithdrawal < rrifMinWithdrawal && rrspBalance > 0) {
        const additionalRrif = Math.min(rrspBalance, rrifMinWithdrawal - rrspWithdrawal);
        rrspBalance -= additionalRrif;
        rrspWithdrawal += additionalRrif;
      }
    }

    // RRSP contributions (only before retirement and while employed)
    const rrspContribution = (!isRetired && employmentIncome > 0 && input.annualRRSPContribution)
      ? input.annualRRSPContribution * Math.pow(1 + input.inflationRate, yearsFromNow)
      : 0;

    // Add RRSP contributions to balance
    if (rrspContribution > 0) {
      rrspBalance += rrspContribution;
    }

    // Investment income (on remaining balances)
    const investmentIncome = (rrspBalance + tfsaBalance + nonRegBalance) * input.investmentReturnRate;

    // Apply investment returns
    rrspBalance *= (1 + input.investmentReturnRate);
    tfsaBalance *= (1 + input.investmentReturnRate);
    nonRegBalance *= (1 + input.investmentReturnRate);

    // Prepare tax calculation inputs using comprehensive tax system
    const taxInputs: TaxCalculationInputs = {
      ordinaryIncome: employmentIncome + rentalIncome + otherIncome,
      pensionIncome: pensionIncome + cppIncome + rrspWithdrawal, // RRIF/RRSP counted as pension
      eligibleDividends: 0, // TODO: Add dividend tracking
      nonEligibleDividends: 0, // TODO: Add dividend tracking
      capitalGains: nonRegWithdrawal, // Non-reg withdrawals treated as capital gains
      oasReceived: oasIncome,
      rrspContributions: rrspContribution, // Tax deductible RRSP contributions
      age,
      province: input.province,
    };

    // Calculate tax using comprehensive system (includes OAS clawback, age credits, etc.)
    const tax = calculateCompleteTax(taxInputs);

    // Total income
    const totalGrossIncome = governmentAndOtherIncome + rrspWithdrawal + tfsaWithdrawal + nonRegWithdrawal;
    const totalAfterTaxIncome = totalGrossIncome - tax.totalTax;

    // Cash surplus/deficit
    const cashSurplusDeficit = totalAfterTaxIncome - annualExpenses;

    // Check if assets depleted
    const totalAssets = rrspBalance + tfsaBalance + nonRegBalance;
    if (totalAssets <= 0 && assetsDepletedAge === null) {
      assetsDepletedAge = age;
    }

    // Store projection
    projections.push({
      year,
      age,
      employmentIncome: Math.round(employmentIncome),
      pensionIncome: Math.round(pensionIncome),
      cppIncome: Math.round(cppIncome),
      oasIncome: Math.round(oasIncome),
      gisIncome: Math.round(gisIncome),
      investmentIncome: Math.round(investmentIncome),
      rentalIncome: Math.round(rentalIncome),
      otherIncome: Math.round(otherIncome),
      rrspWithdrawal: Math.round(rrspWithdrawal),
      tfsaWithdrawal: Math.round(tfsaWithdrawal),
      nonRegWithdrawal: Math.round(nonRegWithdrawal),
      rrifMinWithdrawal: Math.round(rrifMinWithdrawal),
      totalGrossIncome: Math.round(totalGrossIncome),
      taxableIncome: Math.round(tax.netIncome),
      federalTax: Math.round(tax.federalTax),
      provincialTax: Math.round(tax.provincialTax),
      oasClawback: Math.round(tax.oasClawback),
      totalTax: Math.round(tax.totalTax),
      averageTaxRate: tax.averageRate,
      totalAfterTaxIncome: Math.round(totalAfterTaxIncome),
      annualExpenses: Math.round(annualExpenses),
      cashSurplusDeficit: Math.round(cashSurplusDeficit),
      rrspBalance: Math.round(rrspBalance),
      tfsaBalance: Math.round(tfsaBalance),
      nonRegBalance: Math.round(nonRegBalance),
      totalAssets: Math.round(totalAssets),
      isRetired,
      isRrifAge,
      assetsDepletedAge,
    });
  }

  // Calculate summary statistics
  const totalYears = projections.length;
  const retirementYears = projections.filter(p => p.isRetired).length;

  const totalIncome = projections.reduce((sum, p) => sum + p.totalGrossIncome, 0);
  const totalTaxesPaid = projections.reduce((sum, p) => sum + p.totalTax, 0);
  const totalExpenses = projections.reduce((sum, p) => sum + p.annualExpenses, 0);

  const averageAnnualIncome = totalIncome / totalYears;
  const averageAnnualExpenses = totalExpenses / totalYears;
  const averageAnnualTaxRate = (totalTaxesPaid / totalIncome) * 100;

  const lastProjection = projections[projections.length - 1];
  const remainingAssets = lastProjection?.totalAssets || 0;

  return {
    totalYears,
    retirementYears,
    totalIncome: Math.round(totalIncome),
    totalTaxesPaid: Math.round(totalTaxesPaid),
    totalExpenses: Math.round(totalExpenses),
    averageAnnualIncome: Math.round(averageAnnualIncome),
    averageAnnualExpenses: Math.round(averageAnnualExpenses),
    averageAnnualTaxRate: Math.round(averageAnnualTaxRate * 100) / 100,
    assetsDepleted: assetsDepletedAge !== null,
    assetsDepletedAge,
    remainingAssets: Math.round(remainingAssets),
    projections,
  };
}

/**
 * Find optimal retirement age based on maximizing lifetime income
 */
export function findOptimalRetirementAge(
  input: ProjectionInput,
  minAge: number = 60,
  maxAge: number = 70
): {
  optimalAge: number;
  maxLifetimeIncome: number;
  projections: Record<number, ProjectionSummary>;
} {
  const projections: Record<number, ProjectionSummary> = {};
  let optimalAge = minAge;
  let maxLifetimeIncome = 0;

  for (let age = minAge; age <= maxAge; age++) {
    const testInput = { ...input, retirementAge: age };
    const projection = projectRetirement(testInput);
    projections[age] = projection;

    const lifetimeIncome = projection.totalIncome - projection.totalTaxesPaid - projection.totalExpenses;

    if (lifetimeIncome > maxLifetimeIncome) {
      maxLifetimeIncome = lifetimeIncome;
      optimalAge = age;
    }
  }

  return {
    optimalAge,
    maxLifetimeIncome: Math.round(maxLifetimeIncome),
    projections,
  };
}
