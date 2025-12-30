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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="province">Province</Label>
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
              <p className="text-xs text-gray-600 mt-1">
                Tax calculations currently supported for AB, BC, ON, and QC only
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-year">Start Year</Label>
              <Input
                id="start-year"
                type="number"
                value={household.start_year}
                onChange={(e) => onChange('start_year', parseInt(e.target.value) || 2025)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-age">End Age</Label>
              <Input
                id="end-age"
                type="number"
                min="65"
                max="120"
                value={household.end_age}
                onChange={(e) => onChange('end_age', parseInt(e.target.value) || 95)}
                readOnly={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Withdrawal Strategy</Label>
            <Select
              value={household.strategy}
              onValueChange={(value: WithdrawalStrategy) => onChange('strategy', value)}
            >
              <SelectTrigger id="strategy">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">Go-Go Years (Active retirement)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spending-go-go">Annual Spending ($)</Label>
                <CurrencyInput
                  id="spending-go-go"
                  value={household.spending_go_go}
                  onChange={(value) => onChange('spending_go_go', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="go-go-end-age">End Age</Label>
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
                <Label htmlFor="spending-slow-go">Annual Spending ($)</Label>
                <CurrencyInput
                  id="spending-slow-go"
                  value={household.spending_slow_go}
                  onChange={(value) => onChange('spending_slow_go', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slow-go-end-age">End Age</Label>
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
                <Label htmlFor="spending-no-go">Annual Spending ($)</Label>
                <CurrencyInput
                  id="spending-no-go"
                  value={household.spending_no_go}
                  onChange={(value) => onChange('spending_no_go', value)}
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
              <Label htmlFor="spending-inflation">Spending Inflation (%)</Label>
              <Input
                id="spending-inflation"
                type="number"
                step="0.1"
                value={household.spending_inflation}
                onChange={(e) => onChange('spending_inflation', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="general-inflation">General Inflation (%)</Label>
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
                <Label htmlFor="reinvest-nonreg">Reinvest Non-Registered Distributions</Label>
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
