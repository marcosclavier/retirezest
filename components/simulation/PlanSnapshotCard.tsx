'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, TrendingUp, Wallet } from 'lucide-react';
import { HouseholdInput } from '@/lib/types/simulation';

interface PlanSnapshotCardProps {
  household: HouseholdInput;
  includePartner: boolean;
}

export function PlanSnapshotCard({ household, includePartner }: PlanSnapshotCardProps) {
  // Calculate total assets
  const getTotalAssets = (): number => {
    const p1Total = (household.p1.tfsa_balance || 0) +
                    (household.p1.rrsp_balance || 0) +
                    (household.p1.rrif_balance || 0) +
                    (household.p1.nr_cash || 0) +
                    (household.p1.nr_gic || 0) +
                    (household.p1.nr_invest || 0) +
                    (household.p1.corp_cash_bucket || 0) +
                    (household.p1.corp_gic_bucket || 0) +
                    (household.p1.corp_invest_bucket || 0);

    const p2Total = includePartner
      ? (household.p2.tfsa_balance || 0) +
        (household.p2.rrsp_balance || 0) +
        (household.p2.rrif_balance || 0) +
        (household.p2.nr_cash || 0) +
        (household.p2.nr_gic || 0) +
        (household.p2.nr_invest || 0) +
        (household.p2.corp_cash_bucket || 0) +
        (household.p2.corp_gic_bucket || 0) +
        (household.p2.corp_invest_bucket || 0)
      : 0;

    return p1Total + p2Total;
  };

  // Calculate estimated annual retirement income from all sources
  const getEstimatedAnnualIncome = (): number => {
    const totalAssets = getTotalAssets();
    const yearsInRetirement = household.end_age - household.p1.start_age;

    // Simple calculation: assets / years + all income sources
    const assetIncome = yearsInRetirement > 0 ? totalAssets / yearsInRetirement : 0;

    // P1 income sources
    const p1Income = (household.p1.cpp_annual_at_start || 0) +
                     (household.p1.oas_annual_at_start || 0) +
                     (household.p1.pension_income || 0) +
                     (household.p1.other_income || 0);

    // P2 income sources (if applicable)
    const p2Income = includePartner
      ? (household.p2.cpp_annual_at_start || 0) +
        (household.p2.oas_annual_at_start || 0) +
        (household.p2.pension_income || 0) +
        (household.p2.other_income || 0)
      : 0;

    return Math.round(assetIncome + p1Income + p2Income);
  };

  // Determine retirement age (current age, since simulation starts from now)
  const getRetirementAge = (): number => {
    // If both people exist, use the younger person's age (earlier retirement)
    if (includePartner && household.p2.start_age) {
      return Math.min(household.p1.start_age, household.p2.start_age);
    }
    return household.p1.start_age;
  };

  const totalAssets = getTotalAssets();
  const estimatedIncome = getEstimatedAnnualIncome();
  const retirementAge = getRetirementAge();
  const planningHorizon = household.end_age;

  // Calculate years to retirement - since retirement age is the start age, this should be 0
  const currentAge = household.p1.start_age;
  const yearsToRetirement = 0; // Simulation starts at retirement age

  return (
    <Card className="shadow-md border-blue-100 sticky top-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-900">Plan Snapshot</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Live Preview
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Age */}
        <div className="flex items-start gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Current Age</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{currentAge}</p>
            {includePartner && household.p2.start_age && household.p2.start_age !== currentAge && (
              <p className="text-xs text-gray-500 mt-0.5">Partner: {household.p2.start_age}</p>
            )}
          </div>
        </div>

        {/* Retirement Age */}
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Retirement Age</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{retirementAge}</p>
            {retirementAge === currentAge ? (
              <p className="text-xs text-gray-500 mt-0.5">Already retired</p>
            ) : yearsToRetirement > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">{yearsToRetirement} years away</p>
            )}
          </div>
        </div>

        {/* Total Assets */}
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Assets</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              ${totalAssets.toLocaleString('en-CA')}
            </p>
            {includePartner && (
              <p className="text-xs text-gray-500 mt-0.5">Combined household</p>
            )}
          </div>
        </div>

        {/* Total Retirement Income */}
        <div className="flex items-start gap-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Retirement Income</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              ${estimatedIncome.toLocaleString('en-CA')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Annual (includes CPP, OAS, pensions, withdrawals)
            </p>
          </div>
        </div>

        {/* Life Expectancy */}
        <div className="flex items-start gap-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Life Expectancy</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{planningHorizon}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {planningHorizon - currentAge} years of planning
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3 mt-4">
          <p className="text-xs text-gray-600 text-center">
            Run simulation for detailed projections
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
