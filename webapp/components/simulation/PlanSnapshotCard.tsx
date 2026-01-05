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

  // Calculate estimated annual retirement income (very basic calculation)
  const getEstimatedAnnualIncome = (): number => {
    const totalAssets = getTotalAssets();
    const yearsInRetirement = household.end_age - household.p1.start_age;

    // Simple calculation: assets / years + government benefits
    const assetIncome = yearsInRetirement > 0 ? totalAssets / yearsInRetirement : 0;
    const govBenefits = (household.p1.cpp_annual_at_start || 0) + (household.p1.oas_annual_at_start || 0);
    const p2GovBenefits = includePartner
      ? (household.p2.cpp_annual_at_start || 0) + (household.p2.oas_annual_at_start || 0)
      : 0;

    return Math.round(assetIncome + govBenefits + p2GovBenefits);
  };

  // Determine retirement age (earliest CPP start age)
  const getRetirementAge = (): number => {
    if (includePartner) {
      return Math.min(household.p1.cpp_start_age || 65, household.p2.cpp_start_age || 65);
    }
    return household.p1.cpp_start_age || 65;
  };

  const totalAssets = getTotalAssets();
  const estimatedIncome = getEstimatedAnnualIncome();
  const retirementAge = getRetirementAge();
  const planningHorizon = household.end_age;

  // Calculate years to retirement
  const currentAge = household.p1.start_age;
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);

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
        {/* Retirement Age */}
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Retirement Age</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{retirementAge}</p>
            {yearsToRetirement > 0 && (
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
              ${totalAssets.toLocaleString()}
            </p>
            {includePartner && (
              <p className="text-xs text-gray-500 mt-0.5">Combined household</p>
            )}
          </div>
        </div>

        {/* Estimated Annual Income */}
        {estimatedIncome > 0 && (
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Est. Annual Income</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                ${estimatedIncome.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">In retirement</p>
            </div>
          </div>
        )}

        {/* Planning Horizon */}
        <div className="flex items-start gap-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Planning To Age</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{planningHorizon}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {planningHorizon - currentAge} years total
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
