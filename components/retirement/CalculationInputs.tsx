/**
 * Component to display the input data used in early retirement calculations
 * Shows expenses, assets, income, and savings information
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, PiggyBank, TrendingUp, Calendar } from 'lucide-react';

interface CalculationInputsProps {
  currentAge: number;
  targetRetirementAge: number;
  lifeExpectancy: number;
  currentSavings: {
    rrsp: number;
    tfsa: number;
    nonRegistered: number;
    corporate: number;
  };
  annualIncome: number;
  annualSavings: number;
  targetAnnualExpenses: number;
  includePartner?: boolean;
  partner?: {
    age: number;
    currentSavings: {
      rrsp: number;
      tfsa: number;
      nonRegistered: number;
      corporate: number;
    };
    annualIncome: number;
  };
  province?: string;
}

export function CalculationInputs({
  currentAge,
  targetRetirementAge,
  lifeExpectancy,
  currentSavings,
  annualIncome,
  annualSavings,
  targetAnnualExpenses,
  includePartner = false,
  partner,
  province = 'ON',
}: CalculationInputsProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalCurrentSavings = currentSavings.rrsp + currentSavings.tfsa + currentSavings.nonRegistered + currentSavings.corporate;
  const yearsToRetirement = targetRetirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - targetRetirementAge;
  const monthlySavings = annualSavings / 12;
  const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;

  // Partner data
  const partnerTotalSavings = partner
    ? partner.currentSavings.rrsp + partner.currentSavings.tfsa + partner.currentSavings.nonRegistered + partner.currentSavings.corporate
    : 0;
  const householdTotalSavings = totalCurrentSavings + partnerTotalSavings;
  const householdIncome = annualIncome + (partner?.annualIncome || 0);

  const provinceNames: Record<string, string> = {
    'ON': 'Ontario',
    'QC': 'Quebec',
    'BC': 'British Columbia',
    'AB': 'Alberta',
    'MB': 'Manitoba',
    'SK': 'Saskatchewan',
    'NS': 'Nova Scotia',
    'NB': 'New Brunswick',
    'PE': 'Prince Edward Island',
    'NL': 'Newfoundland and Labrador',
    'YT': 'Yukon',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut',
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <DollarSign className="h-5 w-5 text-blue-600" />
          {includePartner ? 'Household Financial Profile' : 'Your Financial Profile'}
        </CardTitle>
        <CardDescription>
          Data used for this early retirement calculation {includePartner && '(couples planning)'}
          {province && ` • ${provinceNames[province] || province}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Couples Planning Notice */}
        {includePartner && partner && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-md">
            <p className="text-sm text-blue-900 font-semibold mb-1">
              Couples Planning Enabled
            </p>
            <p className="text-xs text-blue-800">
              This calculation includes both partners' assets and income. Age difference: {Math.abs(currentAge - partner.age)} years.
              Combined household savings: {formatCurrency(householdTotalSavings)}.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Timeline</h3>
            </div>

            <div className="space-y-2 ml-7">
              <div className="flex justify-between">
                <span className="text-gray-700">Current Age:</span>
                <span className="font-semibold text-gray-900">{currentAge} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Target Retirement Age:</span>
                <span className="font-semibold text-blue-600">{targetRetirementAge} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Life Expectancy:</span>
                <span className="font-semibold text-gray-900">{lifeExpectancy} years</span>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-700">Years to Retirement:</span>
                  <span className="font-semibold text-blue-600">{yearsToRetirement} years</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-700">Years in Retirement:</span>
                  <span className="font-semibold text-gray-900">{yearsInRetirement} years</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Assets */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Current Savings</h3>
            </div>

            <div className="space-y-2 ml-7">
              <div className="flex justify-between">
                <span className="text-gray-700">RRSP:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(currentSavings.rrsp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">TFSA:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(currentSavings.tfsa)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Non-Registered:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(currentSavings.nonRegistered)}</span>
              </div>
              {currentSavings.corporate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Corporate:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(currentSavings.corporate)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-semibold">Total Savings:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(totalCurrentSavings)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Income & Savings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Income & Contributions</h3>
            </div>

            <div className="space-y-2 ml-7">
              <div className="flex justify-between">
                <span className="text-gray-700">Annual Income:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(annualIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Annual Savings:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(annualSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Monthly Savings:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(monthlySavings)}</span>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-700">Savings Rate:</span>
                  <span className="font-semibold text-green-600">{savingsRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Retirement Expenses */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Planned Expenses</h3>
            </div>

            <div className="space-y-2 ml-7">
              <div className="flex justify-between">
                <span className="text-gray-700">Annual Expenses in Retirement:</span>
                <span className="font-semibold text-orange-600">{formatCurrency(targetAnnualExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Monthly Expenses:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(targetAnnualExpenses / 12)}</span>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-700 text-sm">Total Lifetime Need:</span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(targetAnnualExpenses * yearsInRetirement)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  (Before inflation adjustments)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-6 pt-6 border-t border-gray-300">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{yearsToRetirement}</div>
              <div className="text-xs text-gray-600">Years to Build Wealth</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(annualSavings)}</div>
              <div className="text-xs text-gray-600">Annual Contributions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(targetAnnualExpenses)}</div>
              <div className="text-xs text-gray-600">Annual Retirement Spending</div>
            </div>
          </div>
        </div>

        {/* Corporate Account Disclaimer */}
        {currentSavings.corporate > 0 && (
          <div className="mt-4 text-xs bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-sm">📌</span>
              <div>
                <strong className="text-amber-900">Corporate Account Tax Treatment:</strong>
                <p className="text-amber-800 mt-1">
                  For this quick estimate, corporate accounts are treated similarly to non-registered accounts.
                  Corporate withdrawals involve complex tax planning including eligible/non-eligible dividend rates,
                  capital dividend account optimization, and integration with personal tax planning.
                </p>
                <p className="text-amber-800 mt-1 font-medium">
                  For accurate corporate tax strategies, please use the{' '}
                  <a href="/simulation" className="underline hover:text-amber-900">Full Simulation tool</a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="mt-4 text-xs text-gray-600 bg-gray-50 rounded-md p-3 border border-gray-200">
          <strong>Note:</strong> These values are taken from your onboarding profile. To update them,{' '}
          <a href="/onboarding/wizard" className="text-blue-600 hover:underline">
            edit your profile
          </a>.
        </div>
      </CardContent>
    </Card>
  );
}
