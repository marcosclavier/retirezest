'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { HouseholdInput } from '@/lib/types/simulation';

interface SmartStartCardProps {
  onQuickStart: () => void;
  onCustomize: () => void;
  household: HouseholdInput;
  includePartner: boolean;
  prefillAvailable: boolean;
  isLoading: boolean;
}

export function SmartStartCard({
  onQuickStart,
  onCustomize,
  household,
  includePartner,
  prefillAvailable,
  isLoading,
}: SmartStartCardProps) {
  // Calculate data completeness score
  const calculateCompleteness = (): { score: number; color: string; label: string } => {
    let score = 0;
    let maxScore = 0;

    // Basic info (20 points)
    maxScore += 20;
    if (household.p1.name) score += 5;
    if (household.p1.start_age >= 18) score += 5;
    if (household.province) score += 10;

    // Assets (40 points)
    maxScore += 40;
    const p1Assets = (household.p1.tfsa_balance || 0) +
                     (household.p1.rrsp_balance || 0) +
                     (household.p1.rrif_balance || 0) +
                     (household.p1.nr_cash || 0) +
                     (household.p1.nr_gic || 0) +
                     (household.p1.nr_invest || 0) +
                     (household.p1.corp_cash_bucket || 0) +
                     (household.p1.corp_gic_bucket || 0) +
                     (household.p1.corp_invest_bucket || 0);

    if (p1Assets > 0) score += 20;

    if (includePartner) {
      const p2Assets = (household.p2.tfsa_balance || 0) +
                       (household.p2.rrsp_balance || 0) +
                       (household.p2.rrif_balance || 0) +
                       (household.p2.nr_cash || 0) +
                       (household.p2.nr_gic || 0) +
                       (household.p2.nr_invest || 0) +
                       (household.p2.corp_cash_bucket || 0) +
                       (household.p2.corp_gic_bucket || 0) +
                       (household.p2.corp_invest_bucket || 0);
      if (p2Assets > 0) score += 20;
    } else {
      score += 20; // Don't penalize for not having partner
    }

    // Government benefits (20 points)
    maxScore += 20;
    if (household.p1.cpp_start_age >= 60) score += 10;
    if (household.p1.oas_start_age >= 65) score += 10;

    // Spending plan (20 points)
    maxScore += 20;
    if (household.spending_go_go > 0) score += 10;
    if (household.end_age >= 65) score += 10;

    const percentage = Math.round((score / maxScore) * 100);

    // Determine color and label
    let color = 'bg-gray-500';
    let label = 'Incomplete';

    if (percentage >= 80) {
      color = 'bg-green-500';
      label = 'Excellent';
    } else if (percentage >= 60) {
      color = 'bg-blue-500';
      label = 'Good';
    } else if (percentage >= 40) {
      color = 'bg-yellow-500';
      label = 'Fair';
    } else if (percentage >= 20) {
      color = 'bg-orange-500';
      label = 'Basic';
    }

    return { score: percentage, color, label };
  };

  const completeness = calculateCompleteness();

  // Calculate total assets for display
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

  const totalAssets = getTotalAssets();
  const hasAssets = totalAssets > 0;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl text-blue-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Ready to See Your Retirement Plan?
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {prefillAvailable
                ? "We've loaded your financial data. Run a quick simulation to see your retirement outlook."
                : "Enter your basic information and we'll show you personalized retirement projections."}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`${completeness.color} text-white border-0 px-3 py-1 text-sm font-semibold`}
          >
            {completeness.score}% {completeness.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Data Summary */}
        {prefillAvailable && (
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-600 text-xs uppercase tracking-wide">Planning Type</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {includePartner ? 'Couple' : 'Individual'}
                </p>
              </div>
              {hasAssets && (
                <div>
                  <p className="text-gray-600 text-xs uppercase tracking-wide">Total Assets</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    ${totalAssets.toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-600 text-xs uppercase tracking-wide">Current Age</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {household.p1.start_age}
                  {includePartner && household.p2.name && ` & ${household.p2.start_age}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warnings for low data quality */}
        {completeness.score < 60 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium">Limited Data Detected</p>
              <p className="mt-1 text-xs">
                {!hasAssets && "Add your financial information in your profile for more accurate results. "}
                You can still run a simulation with default values to see how the tool works.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={onQuickStart}
            disabled={isLoading}
            size="lg"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base h-12"
          >
            <Play className="mr-2 h-5 w-5" />
            {isLoading ? 'Running Simulation...' : 'Run Quick Simulation'}
          </Button>

          <Button
            onClick={onCustomize}
            disabled={isLoading}
            size="lg"
            variant="outline"
            className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold text-base h-12"
          >
            <Settings className="mr-2 h-5 w-5" />
            Customize Settings First
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-gray-600">
          <strong>Quick Simulation</strong> uses your data with smart defaults.
          <strong className="ml-1">Customize Settings</strong> to adjust all assumptions.
        </p>
      </CardContent>
    </Card>
  );
}
