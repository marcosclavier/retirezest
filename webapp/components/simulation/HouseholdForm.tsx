'use client';

import { HouseholdInput, Province, WithdrawalStrategy, provinceOptions, strategyOptions } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { simulationTooltips } from '@/lib/help-text/simulation-tooltips';
import { Target } from 'lucide-react';

// Helper component for labels with optional tooltips
function LabelWithTooltip({ htmlFor, children, tooltip }: { htmlFor: string; children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor}>{children}</Label>
      {tooltip && <HelpTooltip content={tooltip} />}
    </div>
  );
}

interface HouseholdFormProps {
  household: HouseholdInput;
  onChange: <K extends keyof HouseholdInput>(field: K, value: HouseholdInput[K]) => void;
  isPrefilled?: boolean;
  userProfileProvince?: string | null;
}

export function HouseholdForm({ household, onChange, isPrefilled = false, userProfileProvince = null }: HouseholdFormProps) {
  // Helper function to get full province name
  const getProvinceName = (code: string): string => {
    const provinceNames: Record<string, string> = {
      'AB': 'Alberta',
      'BC': 'British Columbia',
      'ON': 'Ontario',
      'QC': 'Quebec',
      'SK': 'Saskatchewan',
      'MB': 'Manitoba',
      'NB': 'New Brunswick',
      'NS': 'Nova Scotia',
      'PE': 'Prince Edward Island',
      'NL': 'Newfoundland and Labrador',
      'YT': 'Yukon',
      'NT': 'Northwest Territories',
      'NU': 'Nunavut',
    };
    return provinceNames[code.toUpperCase()] || code;
  };

  // Supported provinces for tax calculations
  const supportedProvinces = ['AB', 'BC', 'ON', 'QC'];

  // Check if user's profile province is unsupported and was mapped to a different province
  const showProvinceWarning = userProfileProvince &&
    !supportedProvinces.includes(userProfileProvince.toUpperCase()) &&
    userProfileProvince.toUpperCase() !== household.province;

  return (
    <div className="space-y-6">
      {/* Province Warning Message */}
      {showProvinceWarning && (
        <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-yellow-800">Province not supported at this moment</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Your profile province (<strong>{getProvinceName(userProfileProvince!)}</strong>) is not currently supported for tax calculations.
                Using <strong>{getProvinceName(household.province)}</strong> tax rates instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Household Settings</CardTitle>
          <CardDescription>Configure province, time horizon, and withdrawal strategy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="space-y-2">
              <div className="flex items-center justify-between min-h-[20px]">
                <LabelWithTooltip
                  htmlFor="province"
                  tooltip={simulationTooltips.household.province}
                >
                  Province
                </LabelWithTooltip>
                {isPrefilled && (
                  <span className="text-xs text-blue-600 font-medium">✓ From profile</span>
                )}
              </div>
              <Select
                value={household.province}
                onValueChange={(value: Province) => onChange('province', value)}
              >
                <SelectTrigger id="province" className={isPrefilled ? "bg-blue-50 border-blue-200" : ""}>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1 min-h-[32px]">
                Tax calculations currently supported for AB, BC, ON, and QC only
              </p>
            </div>
            <div className="space-y-2">
              <div className="min-h-[20px]">
                <Label htmlFor="start-year">Start Year</Label>
              </div>
              <Input
                id="start-year"
                type="number"
                value={household.start_year}
                onChange={(e) => onChange('start_year', parseInt(e.target.value) || 2025)}
              />
              <div className="min-h-[32px]"></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between min-h-[20px]">
                <LabelWithTooltip
                  htmlFor="end-age"
                  tooltip={simulationTooltips.household.endAge}
                >
                  End Age (Planning Horizon)
                </LabelWithTooltip>
                {isPrefilled && (
                  <span className="text-xs text-blue-600 font-medium">✓ From profile</span>
                )}
              </div>
              <Input
                id="end-age"
                type="number"
                min="65"
                max="120"
                value={household.end_age}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    onChange('end_age', 95);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      onChange('end_age', numValue);
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    onChange('end_age', 95);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      onChange('end_age', Math.min(Math.max(numValue, 65), 120));
                    }
                  }
                }}
                className={isPrefilled ? "bg-blue-50 border-blue-200" : ""}
              />
              <p className="text-xs text-gray-600 mt-1 min-h-[32px]">
                How long should we plan for? Set in the wizard's "Planning Horizon (Life Expectancy)" step.
              </p>
            </div>
          </div>

          {/* Withdrawal Strategy - Enhanced Section */}
          <div className="space-y-3 p-4 border-2 border-blue-200 bg-blue-50/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <LabelWithTooltip
                  htmlFor="strategy"
                  tooltip={simulationTooltips.household.strategy.description}
                >
                  <span className="text-base font-semibold text-gray-900">
                    {simulationTooltips.household.strategy.label}
                  </span>
                </LabelWithTooltip>
                <p className="text-xs text-gray-600 mt-0.5">
                  Critical decision: How to withdraw from accounts to optimize taxes and benefits
                </p>
              </div>
            </div>
            <Select
              value={household.strategy}
              onValueChange={(value: WithdrawalStrategy) => onChange('strategy', value)}
            >
              <SelectTrigger id="strategy" className="h-auto min-h-[48px] bg-white">
                <SelectValue placeholder="Select withdrawal strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="py-3">
                    <div>
                      <div className="font-medium text-base">{option.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-blue-700">
              💡 Tip: "Income Minimization (GIS-Optimized)" preserves government benefits
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Spending Phases */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Phases</CardTitle>
          <CardDescription>Define spending amounts for different life phases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Information Banner - Show if spending values are pre-populated from expenses */}
          {isPrefilled && household.spending_go_go > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Spending Phases Calculated from Your Expenses
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    These spending amounts are based on your total annual expenses from the Financial Profile. Go-Go spending uses your current expenses, while Slow-Go and No-Go phases assume reduced spending (80% and 70% respectively). You can adjust these values as needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">Go-Go Years (Active retirement)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <LabelWithTooltip
                    htmlFor="spending-go-go"
                    tooltip={simulationTooltips.household.spendingGoGo}
                  >
                    Annual Spending ($)
                  </LabelWithTooltip>
                  {isPrefilled && household.spending_go_go > 0 && (
                    <span className="text-xs text-blue-600 font-medium">✓ From expenses</span>
                  )}
                </div>
                <CurrencyInput
                  id="spending-go-go"
                  value={household.spending_go_go}
                  onChange={(value) => onChange('spending_go_go', value)}
                  className={isPrefilled && household.spending_go_go > 0 ? "bg-blue-50 border-blue-200" : ""}
                />
              </div>
              <div className="space-y-2">
                <LabelWithTooltip
                  htmlFor="go-go-end-age"
                  tooltip={simulationTooltips.household.goGoEndAge}
                >
                  End Age
                </LabelWithTooltip>
                <Input
                  id="go-go-end-age"
                  type="number"
                  value={household.go_go_end_age}
                  onChange={(e) => onChange('go_go_end_age', parseInt(e.target.value) || 75)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">Slow-Go Years (Reduced activity)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <LabelWithTooltip
                    htmlFor="spending-slow-go"
                    tooltip={simulationTooltips.household.spendingSlowGo}
                  >
                    Annual Spending ($)
                  </LabelWithTooltip>
                  {isPrefilled && household.spending_slow_go > 0 && (
                    <span className="text-xs text-blue-600 font-medium">✓ From expenses</span>
                  )}
                </div>
                <CurrencyInput
                  id="spending-slow-go"
                  value={household.spending_slow_go}
                  onChange={(value) => onChange('spending_slow_go', value)}
                  className={isPrefilled && household.spending_slow_go > 0 ? "bg-blue-50 border-blue-200" : ""}
                />
              </div>
              <div className="space-y-2">
                <LabelWithTooltip
                  htmlFor="slow-go-end-age"
                  tooltip={simulationTooltips.household.slowGoEndAge}
                >
                  End Age
                </LabelWithTooltip>
                <Input
                  id="slow-go-end-age"
                  type="number"
                  value={household.slow_go_end_age}
                  onChange={(e) => onChange('slow_go_end_age', parseInt(e.target.value) || 85)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">No-Go Years (Limited mobility)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <LabelWithTooltip
                    htmlFor="spending-no-go"
                    tooltip={simulationTooltips.household.spendingNoGo}
                  >
                    Annual Spending ($)
                  </LabelWithTooltip>
                  {isPrefilled && household.spending_no_go > 0 && (
                    <span className="text-xs text-blue-600 font-medium">✓ From expenses</span>
                  )}
                </div>
                <CurrencyInput
                  id="spending-no-go"
                  value={household.spending_no_go}
                  onChange={(value) => onChange('spending_no_go', value)}
                  className={isPrefilled && household.spending_no_go > 0 ? "bg-blue-50 border-blue-200" : ""}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inflation & Economic Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Inflation Rates</CardTitle>
          <CardDescription>Economic assumptions for the simulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor="spending-inflation"
                tooltip={simulationTooltips.household.spendingInflation}
              >
                Spending Inflation (%)
              </LabelWithTooltip>
              <Input
                id="spending-inflation"
                type="number"
                step="0.1"
                value={household.spending_inflation}
                onChange={(e) => onChange('spending_inflation', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor="general-inflation"
                tooltip={simulationTooltips.household.generalInflation}
              >
                General Inflation (%)
              </LabelWithTooltip>
              <Input
                id="general-inflation"
                type="number"
                step="0.1"
                value={household.general_inflation}
                onChange={(e) => onChange('general_inflation', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TFSA Settings */}
      <Card>
        <CardHeader>
          <CardTitle>TFSA Settings</CardTitle>
          <CardDescription>Household-wide TFSA configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tfsa-room-growth">Annual TFSA Limit Growth ($)</Label>
            <CurrencyInput
              id="tfsa-room-growth"
              value={household.tfsa_room_annual_growth}
              onChange={(value) => onChange('tfsa_room_annual_growth', value)}
            />
            <p className="text-xs text-gray-600">
              The annual TFSA contribution limit increase set by the government (e.g., $7,000 for 2026).
              This is the same for everyone in Canada.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Options</CardTitle>
          <CardDescription>Fine-tune simulation parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gap-tolerance">Spending Gap Tolerance ($)</Label>
            <CurrencyInput
              id="gap-tolerance"
              value={household.gap_tolerance}
              onChange={(value) => onChange('gap_tolerance', value)}
            />
            <p className="text-xs text-gray-600">
              Acceptable shortfall in meeting spending goals
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <LabelWithTooltip
                  htmlFor="reinvest-nonreg"
                  tooltip={simulationTooltips.household.reinvestNonregDist}
                >
                  Reinvest Non-Registered Distributions
                </LabelWithTooltip>
                <p className="text-xs text-gray-600">
                  Automatically reinvest dividends and distributions
                </p>
              </div>
              <Switch
                id="reinvest-nonreg"
                checked={household.reinvest_nonreg_dist}
                onCheckedChange={(checked) => onChange('reinvest_nonreg_dist', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stop-on-fail">Stop Simulation on Failure</Label>
                <p className="text-xs text-gray-600">
                  End simulation when assets are depleted
                </p>
              </div>
              <Switch
                id="stop-on-fail"
                checked={household.stop_on_fail}
                onCheckedChange={(checked) => onChange('stop_on_fail', checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="income-split">Income Split RRIF Fraction</Label>
              <Input
                id="income-split"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={household.income_split_rrif_fraction}
                onChange={(e) => onChange('income_split_rrif_fraction', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-600">
                Fraction of RRIF income to split (0 to 1)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hybrid-rrif-topup">Hybrid RRIF Top-up (per person) ($)</Label>
              <CurrencyInput
                id="hybrid-rrif-topup"
                value={household.hybrid_rrif_topup_per_person}
                onChange={(value) => onChange('hybrid_rrif_topup_per_person', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
