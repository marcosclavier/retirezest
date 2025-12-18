import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError } from '@/lib/errors';
import { defaultPersonInput, type PersonInput } from '@/lib/types/simulation';

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
      },
    });

    // Fetch all assets
    const assets = await prisma.asset.findMany({
      where: { userId: session.userId },
      select: {
        type: true,
        balance: true,
        owner: true,
        contributionRoom: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch CPP and OAS income sources
    const incomeSources = await prisma.income.findMany({
      where: {
        userId: session.userId,
        type: { in: ['cpp', 'oas'] },
      },
      select: {
        type: true,
        amount: true,
        startAge: true,
        owner: true,
      },
      orderBy: { createdAt: 'desc' },
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

    // Extract CPP and OAS data by owner
    const govBenefits = incomeSources.reduce((acc, income) => {
      const owner = income.owner || 'person1';
      const type = income.type.toLowerCase();

      if (!acc[owner]) {
        acc[owner] = {
          cpp_start_age: null,
          cpp_annual_at_start: null,
          oas_start_age: null,
          oas_annual_at_start: null,
        };
      }

      if (type === 'cpp') {
        acc[owner].cpp_start_age = income.startAge;
        acc[owner].cpp_annual_at_start = income.amount;
      } else if (type === 'oas') {
        acc[owner].oas_start_age = income.startAge;
        acc[owner].oas_annual_at_start = income.amount;
      }

      return acc;
    }, {} as Record<string, {
      cpp_start_age: number | null;
      cpp_annual_at_start: number | null;
      oas_start_age: number | null;
      oas_annual_at_start: number | null;
    }>);

    // Aggregate assets by type and owner
    const assetsByOwner = assets.reduce((acc, asset) => {
      const type = asset.type.toUpperCase();
      const balance = asset.balance || 0;
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
            acc[ownerKey].tfsa_room += roomPerOwner;
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

    // Get government benefits for person1 (use database values if available, otherwise defaults)
    const person1Benefits = govBenefits.person1 || {};

    // Build person 1 input with profile and asset data
    const person1Input: PersonInput = {
      ...defaultPersonInput,
      name: user?.firstName || 'Me',
      start_age: age,

      // Government benefits from database (or sensible defaults)
      cpp_start_age: person1Benefits.cpp_start_age ?? Math.max(age, 65),
      cpp_annual_at_start: person1Benefits.cpp_annual_at_start ?? defaultPersonInput.cpp_annual_at_start,
      oas_start_age: person1Benefits.oas_start_age ?? Math.max(age, 65),
      oas_annual_at_start: person1Benefits.oas_annual_at_start ?? defaultPersonInput.oas_annual_at_start,

      // Account balances from assets (person 1's share)
      tfsa_balance: person1Totals.tfsa_balance,
      rrsp_balance: person1Totals.rrsp_balance,
      rrif_balance: person1Totals.rrif_balance,
      nonreg_balance: person1Totals.nonreg_balance,
      corporate_balance: person1Totals.corporate_balance,

      // Contribution room from assets
      tfsa_room_start: person1Totals.tfsa_room,

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
    };

    // Build person 2 input (for partner) - only if couples planning is enabled or they have assets
    const hasPartnerAssets = Object.values(person2Totals).some(val => val > 0);
    const shouldIncludePartner = user?.includePartner || hasPartnerAssets;
    let person2Input: PersonInput | null = null;

    if (shouldIncludePartner) {
      // Get government benefits for person2 (use database values if available, otherwise defaults)
      const person2Benefits = govBenefits.person2 || {};

      person2Input = {
        ...defaultPersonInput,
        name: user?.partnerFirstName || 'Partner',
        start_age: partnerAge,

        // Government benefits from database (or sensible defaults)
        cpp_start_age: person2Benefits.cpp_start_age ?? Math.max(partnerAge, 65),
        cpp_annual_at_start: person2Benefits.cpp_annual_at_start ?? defaultPersonInput.cpp_annual_at_start,
        oas_start_age: person2Benefits.oas_start_age ?? Math.max(partnerAge, 65),
        oas_annual_at_start: person2Benefits.oas_annual_at_start ?? defaultPersonInput.oas_annual_at_start,

        // Account balances from assets (person 2's share)
        tfsa_balance: person2Totals.tfsa_balance,
        rrsp_balance: person2Totals.rrsp_balance,
        rrif_balance: person2Totals.rrif_balance,
        nonreg_balance: person2Totals.nonreg_balance,
        corporate_balance: person2Totals.corporate_balance,

        // Contribution room from assets
        tfsa_room_start: person2Totals.tfsa_room,

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
      };
    }

    // Determine province
    let province = 'AB'; // default
    if (user?.province) {
      const provinceUpper = user.province.toUpperCase();
      if (['AB', 'BC', 'ON', 'QC'].includes(provinceUpper)) {
        province = provinceUpper as any;
      }
    }

    // Use includePartner setting from profile (takes priority over marital status or assets)
    const includePartner = shouldIncludePartner;

    // Calculate total net worth
    const totalNetWorth = Object.values(person1Totals).reduce((sum, val) => sum + val, 0) +
                         Object.values(person2Totals).reduce((sum, val) => sum + val, 0);

    return NextResponse.json({
      person1Input,
      person2Input,
      province,
      includePartner,
      hasAssets: assets.length > 0,
      hasPartnerAssets,
      totalNetWorth,
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
