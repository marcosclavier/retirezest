import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError } from '@/lib/errors';
import { defaultPersonInput, type PersonInput } from '@/lib/types/simulation';
import { calculateVirginTFSARoom } from '@/lib/utils/tfsa-calculator';

/**
 * GET /api/simulation/prefill
 * Fetch user profile and assets, then transform into simulation-ready format
 */
// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    // Fetch user profile with partner information
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        maritalStatus: true,
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
        lifeExpectancy: true,
        targetRetirementAge: true, // Add retirement age for single source of truth
      },
    });

    // Fetch all assets
    const assets = await prisma.asset.findMany({
      where: { userId: session.userId },
      select: {
        type: true,
        balance: true,
        currentValue: true, // Legacy field for backwards compatibility
        owner: true,
        contributionRoom: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all real estate assets
    const realEstateAssets = await prisma.realEstateAsset.findMany({
      where: { userId: session.userId },
      select: {
        propertyType: true,
        purchasePrice: true,
        currentValue: true,
        mortgageBalance: true,
        owner: true,
        ownershipPercent: true,
        monthlyRentalIncome: true,
        isPrincipalResidence: true,
        planToSell: true,
        plannedSaleYear: true,
        plannedSalePrice: true,
        downsizeTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all income sources (CPP, OAS, pension, rental, other)
    const incomeSources = await prisma.income.findMany({
      where: {
        userId: session.userId,
        type: { in: ['cpp', 'oas', 'pension', 'rental', 'employment', 'business', 'investment', 'other'] },
      },
      select: {
        type: true,
        amount: true,
        startAge: true,
        owner: true,
        frequency: true,
        description: true,
        inflationIndexed: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch Scenario for CPP/OAS fallback values (establishes IncomeSource as primary, Scenario as fallback)
    // This fixes Bug #1: Scenario.cppStartAge/oasStartAge were being ignored completely
    const scenario = await prisma.scenario.findFirst({
      where: { userId: session.userId },
      select: {
        cppStartAge: true,
        oasStartAge: true,
      },
      orderBy: { createdAt: 'asc' }, // Get earliest/baseline scenario
    });

    // Fetch expenses to calculate total spending
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.userId,
        isRecurring: true, // Only recurring expenses
      },
      select: {
        amount: true,
        frequency: true,
        essential: true,
      },
    });

    // Fetch baseline scenario for inflation rates
    const baselineScenario = await prisma.scenario.findFirst({
      where: {
        userId: session.userId,
        isBaseline: true,
      },
      select: {
        expenseInflationRate: true,
        inflationRate: true,
      },
    });

    // Calculate age from date of birth
    let age = 65; // default
    if (user?.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(user.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Calculate partner age from date of birth
    let partnerAge = age; // default to same as person1
    if (user?.partnerDateOfBirth) {
      const today = new Date();
      const birthDate = new Date(user.partnerDateOfBirth);
      partnerAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        partnerAge--;
      }
    }

    // Calculate start year based on target retirement age
    const currentYear = new Date().getFullYear();
    const retirementAge = user?.targetRetirementAge || age;
    const yearsUntilRetirement = Math.max(0, retirementAge - age);
    const calculatedStartYear = currentYear + yearsUntilRetirement;

    // Extract all income data by owner
    const incomeByOwner = incomeSources.reduce((acc, income) => {
      const owner = income.owner || 'person1';
      const type = income.type.toLowerCase();

      if (!acc[owner]) {
        acc[owner] = {
          cpp_start_age: null,
          cpp_annual_at_start: null,
          oas_start_age: null,
          oas_annual_at_start: null,
          pension_incomes: [],
          other_incomes: [],
        };
      }

      // Convert income amount to annual based on frequency
      const frequency = (income.frequency || 'annual').toLowerCase();
      let annualAmount = income.amount;

      switch (frequency) {
        case 'monthly':
          annualAmount = income.amount * 12;
          break;
        case 'quarterly':
          annualAmount = income.amount * 4;
          break;
        case 'weekly':
          annualAmount = income.amount * 52;
          break;
        case 'biweekly':
          annualAmount = income.amount * 26;
          break;
        default:
          annualAmount = income.amount;
      }

      if (type === 'cpp') {
        acc[owner].cpp_start_age = income.startAge;
        acc[owner].cpp_annual_at_start = annualAmount;
      } else if (type === 'oas') {
        acc[owner].oas_start_age = income.startAge;
        acc[owner].oas_annual_at_start = annualAmount;
      } else if (type === 'pension') {
        // Add pension to list (preserve startAge for Python backend)
        console.log('🎯 Pension from DB:', {
          description: income.description,
          inflationIndexed_raw: income.inflationIndexed,
          inflationIndexed_result: income.inflationIndexed
        });
        acc[owner].pension_incomes.push({
          name: income.description || 'Pension',
          amount: annualAmount,
          startAge: income.startAge || 65,
          inflationIndexed: income.inflationIndexed,
        });
      } else if (type === 'rental') {
        // Rental from Income table (not real estate properties)
        acc[owner].other_incomes.push({
          type: 'rental',
          name: income.description || 'Rental Income',
          amount: annualAmount,
          startAge: income.startAge || undefined,
          inflationIndexed: income.inflationIndexed,
        });
      } else if (['employment', 'business', 'investment', 'other'].includes(type)) {
        // Add to other_incomes list (preserve startAge for Python backend)
        acc[owner].other_incomes.push({
          type,
          name: income.description || type.charAt(0).toUpperCase() + type.slice(1),
          amount: annualAmount,
          startAge: income.startAge || undefined,
          inflationIndexed: income.inflationIndexed,
        });
      }

      return acc;
    }, {} as Record<string, {
      cpp_start_age: number | null;
      cpp_annual_at_start: number | null;
      oas_start_age: number | null;
      oas_annual_at_start: number | null;
      pension_incomes: Array<{name: string; amount: number; startAge: number; inflationIndexed: boolean}>;
      other_incomes: Array<{type: string; name: string; amount: number; startAge?: number; inflationIndexed: boolean}>;
    }>);

    // Add rental income from real estate properties
    realEstateAssets.forEach((property) => {
      if (property.monthlyRentalIncome > 0) {
        const owner = property.owner || 'person1';
        const annualRentalIncome = property.monthlyRentalIncome * 12;
        const ownershipShare = (property.ownershipPercent / 100) * annualRentalIncome;

        // Initialize income object if it doesn't exist
        if (!incomeByOwner[owner]) {
          incomeByOwner[owner] = {
            cpp_start_age: null,
            cpp_annual_at_start: null,
            oas_start_age: null,
            oas_annual_at_start: null,
            pension_incomes: [],
            other_incomes: [],
          };
        }

        // Add property rental income to other_incomes list
        // Real estate rental income has no startAge (active from ownership)
        incomeByOwner[owner].other_incomes.push({
          type: 'rental',
          name: `Rental: ${property.propertyType || 'Property'}`,
          amount: ownershipShare,
          inflationIndexed: true,
        });
      }
    });

    // Aggregate assets by type and owner
    const assetsByOwner = assets.reduce((acc, asset) => {
      const type = asset.type.toUpperCase();
      // Use balance as primary, currentValue as fallback for legacy data
      const balance = asset.balance || asset.currentValue || 0;
      const contributionRoom = asset.contributionRoom || 0;
      const owner = asset.owner || 'person1'; // Default to person1 if not specified

      // Determine which person(s) to credit
      const owners = owner === 'joint' ? ['person1', 'person2'] : [owner];
      const sharePerOwner = owner === 'joint' ? balance / 2 : balance;
      const roomPerOwner = owner === 'joint' ? contributionRoom / 2 : contributionRoom;

      owners.forEach(ownerKey => {
        if (!acc[ownerKey]) {
          acc[ownerKey] = {
            tfsa_balance: 0,
            rrsp_balance: 0,
            rrif_balance: 0,
            nonreg_balance: 0,
            corporate_balance: 0,
            tfsa_room: 0,
          };
        }

        switch (type) {
          case 'TFSA':
            acc[ownerKey].tfsa_balance += sharePerOwner;
            // TFSA contribution room is per person, not per account
            // Use the maximum value across all TFSA accounts, don't sum
            acc[ownerKey].tfsa_room = Math.max(acc[ownerKey].tfsa_room, roomPerOwner);
            break;
          case 'RRSP':
            acc[ownerKey].rrsp_balance += sharePerOwner;
            break;
          case 'RRIF':
            acc[ownerKey].rrif_balance += sharePerOwner;
            break;
          case 'NONREG':
          case 'NON-REGISTERED':
          case 'NONREGISTERED':
          case 'NON_REGISTERED':
            acc[ownerKey].nonreg_balance += sharePerOwner;
            break;
          case 'CORPORATE':
          case 'CORP':
            acc[ownerKey].corporate_balance += sharePerOwner;
            break;
        }
      });

      return acc;
    }, {} as Record<string, {
      tfsa_balance: number;
      rrsp_balance: number;
      rrif_balance: number;
      nonreg_balance: number;
      corporate_balance: number;
      tfsa_room: number;
    }>);

    // Get totals for person1 (default to zeros if no assets)
    const person1Totals = assetsByOwner.person1 || {
      tfsa_balance: 0,
      rrsp_balance: 0,
      rrif_balance: 0,
      nonreg_balance: 0,
      corporate_balance: 0,
      tfsa_room: 0,
    };

    // Get totals for person2 (if any)
    const person2Totals = assetsByOwner.person2 || {
      tfsa_balance: 0,
      rrsp_balance: 0,
      rrif_balance: 0,
      nonreg_balance: 0,
      corporate_balance: 0,
      tfsa_room: 0,
    };

    // Get income data for person1 (use database values if available, otherwise defaults)
    const person1Income = incomeByOwner.person1 || {};

    // DEBUG: Log pension income data to verify it's being fetched
    if (person1Income.pension_incomes && person1Income.pension_incomes.length > 0) {
      console.log('🎯 DEBUG: Person1 pension_incomes found:', person1Income.pension_incomes);
    } else {
      console.log('⚠️ DEBUG: No pension_incomes for person1');
    }

    // Build person 1 input with profile and asset data
    const person1Input: PersonInput = {
      ...defaultPersonInput,
      name: user?.firstName || 'Me',
      start_age: user?.targetRetirementAge || age, // Use targetRetirementAge from profile as primary source

      // Government benefits with 3-tier priority: IncomeSource → Scenario → fallback
      // This fixes Bug #1: Users who configured CPP/OAS in Scenario but not IncomeSource now get correct values
      cpp_start_age: person1Income.cpp_start_age ?? scenario?.cppStartAge ?? Math.max(age, 65),
      cpp_annual_at_start: person1Income.cpp_annual_at_start ?? defaultPersonInput.cpp_annual_at_start,
      // For rrif-frontload strategy, default OAS to 70 (maximum deferral) to maximize front-loading
      // Otherwise default to 65 (minimum OAS age in Canada)
      oas_start_age: person1Income.oas_start_age ?? scenario?.oasStartAge ?? 70,  // Default to 70 for maximum deferral
      oas_annual_at_start: person1Income.oas_annual_at_start ?? defaultPersonInput.oas_annual_at_start,

      // Pension and other income lists (with startAge support)
      pension_incomes: person1Income.pension_incomes ?? [],
      other_incomes: person1Income.other_incomes ?? [],

      // Account balances from assets (person 1's share)
      tfsa_balance: person1Totals.tfsa_balance,
      rrsp_balance: person1Totals.rrsp_balance,
      rrif_balance: person1Totals.rrif_balance,
      nonreg_balance: person1Totals.nonreg_balance,
      corporate_balance: person1Totals.corporate_balance,

      // Contribution room from assets
      // If no TFSA room is stored, calculate based on CRA guidelines for someone who never contributed
      tfsa_room_start: person1Totals.tfsa_room || calculateVirginTFSARoom(
        new Date(user?.dateOfBirth || '1960-01-01').getFullYear(),
        new Date().getFullYear()
      ),

      // For non-registered, distribute balance across cash/gic/invest based on allocation percentages
      nr_cash: person1Totals.nonreg_balance * 0.10,
      nr_gic: person1Totals.nonreg_balance * 0.20,
      nr_invest: person1Totals.nonreg_balance * 0.70,

      // ACB defaults to 80% of balance for simplicity (could be enhanced)
      nonreg_acb: person1Totals.nonreg_balance * 0.80,

      // Corporate bucket distribution
      corp_cash_bucket: person1Totals.corporate_balance * 0.05,
      corp_gic_bucket: person1Totals.corporate_balance * 0.10,
      corp_invest_bucket: person1Totals.corporate_balance * 0.85,

      // RRSP/RRIF withdrawal settings
      // Automatically enable if person has RRSP and is at/near retirement age
      enable_early_rrif_withdrawal: person1Totals.rrsp_balance > 0 || person1Totals.rrif_balance > 0,
      early_rrif_withdrawal_start_age: user?.targetRetirementAge || age,
      early_rrif_withdrawal_end_age: 70, // Until mandatory conversion at 71
      early_rrif_withdrawal_annual: 0, // Not using fixed amount
      early_rrif_withdrawal_percentage: 5.0, // Use minimum RRIF percentage
      early_rrif_withdrawal_mode: 'percentage', // Percentage mode for flexibility
    };

    // Map real estate data to person1
    const person1RealEstate = realEstateAssets.filter(
      property => !property.owner || property.owner === 'person1' || property.owner === 'me'
    );
    if (person1RealEstate.length > 0) {
      // Find primary residence (first property with isPrincipalResidence = true, or first property)
      const primaryResidence = person1RealEstate.find(p => p.isPrincipalResidence) || person1RealEstate[0];
      const ownershipShare = (primaryResidence.ownershipPercent || 100) / 100;

      person1Input.has_primary_residence = true;
      person1Input.primary_residence_value = primaryResidence.currentValue * ownershipShare;
      person1Input.primary_residence_purchase_price = (primaryResidence.purchasePrice || 0) * ownershipShare;
      person1Input.primary_residence_mortgage = (primaryResidence.mortgageBalance || 0) * ownershipShare;
      person1Input.primary_residence_monthly_payment = 0; // TODO: Link to Debt table for accurate payment

      // Set rental_income_annual from primary residence (backward compatibility)
      // Note: Rental income is also in other_incomes array (lines 229-257)
      person1Input.rental_income_annual = (primaryResidence.monthlyRentalIncome || 0) * 12 * ownershipShare;

      // Map downsizing plan
      if (primaryResidence.planToSell && primaryResidence.plannedSaleYear) {
        person1Input.plan_to_downsize = true;
        person1Input.downsize_year = primaryResidence.plannedSaleYear;
        person1Input.downsize_new_home_cost = (primaryResidence.downsizeTo || 0) * ownershipShare;
        person1Input.downsize_is_principal_residence = primaryResidence.isPrincipalResidence;
      }
    }

    // Build person 2 input (for partner) - only if couples planning is enabled or they have assets
    const hasPartnerAssets = Object.values(person2Totals).some(val => val > 0);
    const shouldIncludePartner = user?.includePartner || hasPartnerAssets;
    let person2Input: PersonInput | null = null;

    if (shouldIncludePartner) {
      // Get income data for person2 (use database values if available, otherwise defaults)
      const person2Income = incomeByOwner.person2 || {};

      person2Input = {
        ...defaultPersonInput,
        name: user?.partnerFirstName || 'Partner',
        start_age: user?.targetRetirementAge || partnerAge, // Use same targetRetirementAge for partner

        // Government benefits with 3-tier priority: IncomeSource → Scenario → fallback
        // Same fix as person1 for Bug #1
        cpp_start_age: person2Income.cpp_start_age ?? scenario?.cppStartAge ?? Math.max(partnerAge, 65),
        cpp_annual_at_start: person2Income.cpp_annual_at_start ?? defaultPersonInput.cpp_annual_at_start,
        // For rrif-frontload strategy, default OAS to 70 (maximum deferral) to maximize front-loading
        oas_start_age: person2Income.oas_start_age ?? scenario?.oasStartAge ?? 70,  // Default to 70 for maximum deferral
        oas_annual_at_start: person2Income.oas_annual_at_start ?? defaultPersonInput.oas_annual_at_start,

        // Pension and other income lists (with startAge support)
        pension_incomes: person2Income.pension_incomes ?? [],
        other_incomes: person2Income.other_incomes ?? [],

        // Account balances from assets (person 2's share)
        tfsa_balance: person2Totals.tfsa_balance,
        rrsp_balance: person2Totals.rrsp_balance,
        rrif_balance: person2Totals.rrif_balance,
        nonreg_balance: person2Totals.nonreg_balance,
        corporate_balance: person2Totals.corporate_balance,

        // Contribution room from assets
        // If no TFSA room is stored, calculate based on CRA guidelines for someone who never contributed
        tfsa_room_start: person2Totals.tfsa_room || calculateVirginTFSARoom(
          new Date(user?.partnerDateOfBirth || '1960-01-01').getFullYear(),
          new Date().getFullYear()
        ),

        // For non-registered, distribute balance
        nr_cash: person2Totals.nonreg_balance * 0.10,
        nr_gic: person2Totals.nonreg_balance * 0.20,
        nr_invest: person2Totals.nonreg_balance * 0.70,

        // ACB defaults to 80% of balance
        nonreg_acb: person2Totals.nonreg_balance * 0.80,

        // Corporate bucket distribution
        corp_cash_bucket: person2Totals.corporate_balance * 0.05,
        corp_gic_bucket: person2Totals.corporate_balance * 0.10,
        corp_invest_bucket: person2Totals.corporate_balance * 0.85,

        // RRSP/RRIF withdrawal settings (same as person1)
        enable_early_rrif_withdrawal: person2Totals.rrsp_balance > 0 || person2Totals.rrif_balance > 0,
        early_rrif_withdrawal_start_age: user?.targetRetirementAge || partnerAge,
        early_rrif_withdrawal_end_age: 70,
        early_rrif_withdrawal_annual: 0,
        early_rrif_withdrawal_percentage: 5.0,
        early_rrif_withdrawal_mode: 'percentage',
      };

      // Map real estate data to person2
      const person2RealEstate = realEstateAssets.filter(
        property => property.owner === 'person2' || property.owner === 'partner'
      );
      if (person2RealEstate.length > 0) {
        // Find primary residence (first property with isPrincipalResidence = true, or first property)
        const primaryResidence = person2RealEstate.find(p => p.isPrincipalResidence) || person2RealEstate[0];
        const ownershipShare = (primaryResidence.ownershipPercent || 100) / 100;

        person2Input.has_primary_residence = true;
        person2Input.primary_residence_value = primaryResidence.currentValue * ownershipShare;
        person2Input.primary_residence_purchase_price = (primaryResidence.purchasePrice || 0) * ownershipShare;
        person2Input.primary_residence_mortgage = (primaryResidence.mortgageBalance || 0) * ownershipShare;
        person2Input.primary_residence_monthly_payment = 0; // TODO: Link to Debt table for accurate payment

        // Set rental_income_annual from primary residence (backward compatibility)
        person2Input.rental_income_annual = (primaryResidence.monthlyRentalIncome || 0) * 12 * ownershipShare;

        // Map downsizing plan
        if (primaryResidence.planToSell && primaryResidence.plannedSaleYear) {
          person2Input.plan_to_downsize = true;
          person2Input.downsize_year = primaryResidence.plannedSaleYear;
          person2Input.downsize_new_home_cost = (primaryResidence.downsizeTo || 0) * ownershipShare;
          person2Input.downsize_is_principal_residence = primaryResidence.isPrincipalResidence;
        }
      }
    }

    // Determine province - map user's profile province to supported simulation provinces
    // Only AB, BC, ON, QC have tax calculation support in the backend
    let province = 'ON'; // default to Ontario
    if (user?.province) {
      const provinceUpper = user.province.toUpperCase();

      // If user's province is directly supported, use it
      if (['AB', 'BC', 'ON', 'QC'].includes(provinceUpper)) {
        province = provinceUpper as any;
      } else {
        // Map other provinces to nearest supported province for tax calculations
        const provinceMapping: Record<string, string> = {
          'SK': 'AB',  // Saskatchewan -> Alberta (prairie provinces)
          'MB': 'ON',  // Manitoba -> Ontario (central Canada)
          'NB': 'QC',  // New Brunswick -> Quebec (Maritime, bilingual)
          'NS': 'QC',  // Nova Scotia -> Quebec (Maritime)
          'PE': 'QC',  // Prince Edward Island -> Quebec (Maritime)
          'NL': 'QC',  // Newfoundland and Labrador -> Quebec (Atlantic)
          'YT': 'BC',  // Yukon -> British Columbia (Pacific region)
          'NT': 'AB',  // Northwest Territories -> Alberta (northern)
          'NU': 'AB',  // Nunavut -> Alberta (northern)
        };
        province = (provinceMapping[provinceUpper] || 'ON') as any;
      }
    }

    // Use includePartner setting from profile (takes priority over marital status or assets)
    const includePartner = shouldIncludePartner;

    // Calculate total real estate equity
    const totalRealEstateEquity = realEstateAssets.reduce((sum, property) => {
      const equity = property.currentValue - property.mortgageBalance;
      const ownership = property.ownershipPercent / 100;
      return sum + (equity * ownership);
    }, 0);

    // Calculate total net worth (exclude tfsa_room as it's not a balance)
    // Include real estate equity in total net worth
    const totalLiquidNetWorth =
      person1Totals.tfsa_balance + person1Totals.rrsp_balance + person1Totals.rrif_balance +
      person1Totals.nonreg_balance + person1Totals.corporate_balance +
      person2Totals.tfsa_balance + person2Totals.rrsp_balance + person2Totals.rrif_balance +
      person2Totals.nonreg_balance + person2Totals.corporate_balance;

    const totalNetWorth = totalLiquidNetWorth + totalRealEstateEquity;

    // Calculate total annual spending from expenses
    let totalAnnualSpending = 0;
    expenses.forEach(expense => {
      const amount = expense.amount;
      const frequency = expense.frequency.toLowerCase();

      // Convert to annual amount based on frequency
      let annualAmount = 0;
      switch (frequency) {
        case 'monthly':
          annualAmount = amount * 12;
          break;
        case 'annual':
        case 'yearly':
          annualAmount = amount;
          break;
        case 'quarterly':
          annualAmount = amount * 4;
          break;
        case 'weekly':
          annualAmount = amount * 52;
          break;
        case 'biweekly':
          annualAmount = amount * 26;
          break;
        default:
          annualAmount = amount; // Default to treating as annual
      }

      totalAnnualSpending += annualAmount;
    });

    // Calculate smart default withdrawal strategy based on asset mix and profile
    let recommendedStrategy = 'minimize-income'; // Default fallback - GIS optimization benefits most Canadian retirees

    if (totalNetWorth > 0) {
      const totalRRIF = person1Totals.rrif_balance + person2Totals.rrif_balance;
      const totalTFSA = person1Totals.tfsa_balance + person2Totals.tfsa_balance;
      const totalRRSP = person1Totals.rrsp_balance + person2Totals.rrsp_balance;
      const totalNonReg = person1Totals.nonreg_balance + person2Totals.nonreg_balance;
      const totalCorporate = person1Totals.corporate_balance + person2Totals.corporate_balance;

      // Calculate percentages
      const rrifPct = totalRRIF / totalNetWorth;
      const rrspPct = totalRRSP / totalNetWorth;
      const registeredPct = (totalRRSP + totalRRIF) / totalNetWorth; // Combined RRSP+RRIF
      const tfsaPct = totalTFSA / totalNetWorth;
      const nonregPct = totalNonReg / totalNetWorth;
      const corporatePct = totalCorporate / totalNetWorth;

      // Get total other income (pension, rental, employment, etc.)
      // Sum up all pension and other income (regardless of startAge - for current planning context)
      const p1Income = incomeByOwner.person1 || { pension_incomes: [], other_incomes: [] };
      const person1PensionIncome = (p1Income.pension_incomes || []).reduce((sum, p) => sum + p.amount, 0);
      const person1OtherIncomeTotal = (p1Income.other_incomes || []).reduce((sum, i) => sum + i.amount, 0);
      const person1OtherIncome = person1PensionIncome + person1OtherIncomeTotal;

      const person2Income = incomeByOwner.person2 || { pension_incomes: [], other_incomes: [] };
      const person2PensionIncome = (person2Income.pension_incomes || []).reduce((sum, p) => sum + p.amount, 0);
      const person2OtherIncomeTotal = (person2Income.other_incomes || []).reduce((sum, i) => sum + i.amount, 0);
      const person2OtherIncome = person2PensionIncome + person2OtherIncomeTotal;

      const totalOtherIncome = person1OtherIncome + person2OtherIncome;

      // Smart strategy selection logic
      if (registeredPct > 0.4) {
        // Large RRSP/RRIF balance (>40%) - front-load withdrawals to minimize tax over lifetime
        recommendedStrategy = 'rrif-frontload'; // Use RRIF-frontload to actually access RRSP funds
      } else if (tfsaPct > 0.3 && (totalRRIF > 0 || totalRRSP > 0)) {
        // Large TFSA (>30%) with some RRSP/RRIF - use TFSA first to preserve tax-deferred growth
        recommendedStrategy = 'tfsa-first';
      } else if (corporatePct > 0.3) {
        // Significant corporate holdings (>30%) - use balanced approach for corporate optimization
        recommendedStrategy = 'corporate-optimized';
      } else if (totalOtherIncome > 50000) {
        // High ongoing income (>$50k/year from pension/rental/etc) - minimize additional taxable income
        recommendedStrategy = 'minimize-income';
      } else if (nonregPct > 0.5) {
        // Large non-registered balance (>50%) - optimize for capital gains
        recommendedStrategy = 'capital-gains-optimized';
      } else if (age < 65) {
        // Under 65 - income minimization helps preserve flexibility and benefits
        recommendedStrategy = 'minimize-income';
      } else {
        // Default for typical retiree with mixed assets - GIS optimization benefits most Canadians
        recommendedStrategy = 'minimize-income';
      }

      logger.info('Smart strategy recommendation', {
        totalNetWorth,
        rrspPct: `${(rrspPct * 100).toFixed(1)}%`,
        rrifPct: `${(rrifPct * 100).toFixed(1)}%`,
        registeredPct: `${(registeredPct * 100).toFixed(1)}%`,
        tfsaPct: `${(tfsaPct * 100).toFixed(1)}%`,
        nonregPct: `${(nonregPct * 100).toFixed(1)}%`,
        corporatePct: `${(corporatePct * 100).toFixed(1)}%`,
        totalOtherIncome,
        age,
        recommendedStrategy,
      });
    }

    // DEBUG: Log pension data in response
    console.log('📊 DEBUG: Prefill Response pension data:', {
      person1_pensions: person1Input?.pension_incomes?.length || 0,
      person1_pension_details: person1Input?.pension_incomes,
      person2_pensions: person2Input?.pension_incomes?.length || 0,
    });

    return NextResponse.json({
      person1Input,
      person2Input,
      province,
      userProfileProvince: user?.province || null, // Original province from profile
      includePartner,
      hasAssets: assets.length > 0,
      hasPartnerAssets,
      totalNetWorth, // Total including real estate equity
      totalLiquidNetWorth, // Investment accounts only (excludes real estate)
      // Use user's life expectancy preference, or default to 95
      // Allow range from 75-100 to accommodate different planning horizons
      lifeExpectancy: user?.lifeExpectancy || 95,
      totalAnnualSpending, // Total annual spending from expenses
      hasExpenses: expenses.length > 0,
      recommendedStrategy, // Smart default strategy based on user's profile
      spendingInflation: baselineScenario?.expenseInflationRate || 2.0, // Default 2%
      generalInflation: baselineScenario?.inflationRate || 2.0, // Default 2%
      calculatedStartYear, // Automatically calculated based on targetRetirementAge
      realEstate: {
        assets: realEstateAssets,
        totalEquity: totalRealEstateEquity,
        hasProperties: realEstateAssets.length > 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching simulation prefill data', error, {
      endpoint: '/api/simulation/prefill',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
