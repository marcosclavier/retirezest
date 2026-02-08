'use client';

import { PersonInput } from '@/lib/types/simulation';
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
import { Collapsible } from '@/components/ui/collapsible';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { simulationTooltips } from '@/lib/help-text/simulation-tooltips';
import EarlyRrifWithdrawalControl from '@/components/simulation/EarlyRrifWithdrawalControl';

// Helper component for labels with optional tooltips
function LabelWithTooltip({ htmlFor, children, tooltip }: { htmlFor: string; children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor}>{children}</Label>
      {tooltip && <HelpTooltip content={tooltip} />}
    </div>
  );
}

interface PersonFormProps {
  person: PersonInput;
  personLabel: string;
  personNumber: 'p1' | 'p2';
  onChange: (field: keyof PersonInput, value: any) => void;
  isPrefilled?: boolean;
}

export function PersonForm({ person, personLabel, personNumber, onChange, isPrefilled = false }: PersonFormProps) {
  // Helper functions to determine section completion
  const isAccountBalancesComplete = (): boolean => {
    return (person.tfsa_balance ?? 0) > 0 ||
           (person.rrsp_balance ?? 0) > 0 ||
           (person.rrif_balance ?? 0) > 0 ||
           (person.nonreg_balance ?? 0) > 0 ||
           (person.corporate_balance ?? 0) > 0;
  };

  const isGovernmentBenefitsComplete = (): boolean => {
    return person.cpp_start_age >= 60 && person.cpp_annual_at_start > 0 &&
           person.oas_start_age >= 65 && person.oas_annual_at_start > 0;
  };

  const isOtherIncomeComplete = (): boolean => {
    return (person.pension_incomes?.length ?? 0) > 0 ||
           (person.other_incomes?.length ?? 0) > 0;
  };

  const isNonregDetailsComplete = (): boolean => {
    return (person.nonreg_balance ?? 0) > 0 && person.nonreg_acb > 0;
  };

  const isCorporateDetailsComplete = (): boolean => {
    return (person.corp_cash_bucket ?? 0) > 0 ||
           (person.corp_gic_bucket ?? 0) > 0 ||
           (person.corp_invest_bucket ?? 0) > 0;
  };

  const isTfsaStrategyComplete = (): boolean => {
    return (person.tfsa_balance ?? 0) > 0 && person.tfsa_contribution_annual >= 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{personLabel}</CardTitle>
        <CardDescription>
          Enter retirement details and account balances
          {isPrefilled && <span className="ml-2 text-xs text-blue-600 font-medium">✓ Auto-filled from profile</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info - Always Visible */}
        <div className="space-y-4 pb-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-name`}
                tooltip={simulationTooltips.person.name}
              >
                Name
              </LabelWithTooltip>
              <Input
                id={`${personNumber}-name`}
                value={person.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-start-age`}
                tooltip={simulationTooltips.person.startAge}
              >
                Planning Age
              </LabelWithTooltip>
              <Input
                id={`${personNumber}-start-age`}
                type="number"
                value={person.start_age}
                onChange={(e) => onChange('start_age', parseInt(e.target.value) || 0)}
                placeholder="Age to start simulation"
              />
            </div>
          </div>
        </div>

        {/* Account Balances - Default Open */}
        <Collapsible
          title="Account Balances"
          description="Registered and non-registered account balances"
          defaultOpen={true}
          isComplete={isAccountBalancesComplete()}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-tfsa`}
                tooltip={simulationTooltips.person.tfsaBalance}
              >
                TFSA Balance ($)
              </LabelWithTooltip>
              <CurrencyInput
                id={`${personNumber}-tfsa`}
                value={person.tfsa_balance ?? 0}
                onChange={(value) => onChange('tfsa_balance', value)}
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-rrif`}
                tooltip={simulationTooltips.person.rrifBalance}
              >
                RRIF Balance ($)
              </LabelWithTooltip>
              <CurrencyInput
                id={`${personNumber}-rrif`}
                value={person.rrif_balance ?? 0}
                onChange={(value) => onChange('rrif_balance', value)}
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-rrsp`}
                tooltip={simulationTooltips.person.rrspBalance}
              >
                RRSP Balance ($)
              </LabelWithTooltip>
              <CurrencyInput
                id={`${personNumber}-rrsp`}
                value={person.rrsp_balance ?? 0}
                onChange={(value) => onChange('rrsp_balance', value)}
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-nonreg`}
                tooltip={simulationTooltips.person.nonregBalance}
              >
                Non-Registered Balance ($)
              </LabelWithTooltip>
              <CurrencyInput
                id={`${personNumber}-nonreg`}
                value={person.nonreg_balance ?? 0}
                onChange={(value) => onChange('nonreg_balance', value)}
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-corporate`}
                tooltip={simulationTooltips.person.corporateBalance}
              >
                Corporate Balance ($)
              </LabelWithTooltip>
              <CurrencyInput
                id={`${personNumber}-corporate`}
                value={person.corporate_balance ?? 0}
                onChange={(value) => onChange('corporate_balance', value)}
              />
            </div>
          </div>

          {/* Early RRIF Withdrawal Control - Show only if RRSP/RRIF balance > 0 */}
          {((person.rrsp_balance ?? 0) > 0 || (person.rrif_balance ?? 0) > 0) && (
            <div className="mt-6">
              <EarlyRrifWithdrawalControl
                enabled={person.enable_early_rrif_withdrawal ?? false}
                startAge={person.early_rrif_withdrawal_start_age ?? person.start_age}
                endAge={person.early_rrif_withdrawal_end_age ?? 70}
                annualAmount={person.early_rrif_withdrawal_annual ?? 20000}
                percentage={person.early_rrif_withdrawal_percentage ?? 5.0}
                mode={person.early_rrif_withdrawal_mode ?? 'fixed'}
                personName={person.name}
                currentAge={person.start_age}
                onUpdate={(settings) => {
                  onChange('enable_early_rrif_withdrawal', settings.enabled);
                  onChange('early_rrif_withdrawal_start_age', settings.startAge);
                  onChange('early_rrif_withdrawal_end_age', settings.endAge);
                  onChange('early_rrif_withdrawal_annual', settings.annualAmount);
                  onChange('early_rrif_withdrawal_percentage', settings.percentage);
                  onChange('early_rrif_withdrawal_mode', settings.mode);
                }}
              />
            </div>
          )}
        </Collapsible>

        {/* Government Benefits */}
        <Collapsible
          title="Government Benefits"
          description="CPP and OAS start ages and annual amounts"
          defaultOpen={false}
          isComplete={isGovernmentBenefitsComplete()}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-cpp-start`}
                tooltip={simulationTooltips.person.cppStartAge}
              >
                CPP Start Age
              </LabelWithTooltip>
              <Input
                id={`${personNumber}-cpp-start`}
                type="number"
                value={person.cpp_start_age}
                onChange={(e) => onChange('cpp_start_age', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-cpp-amount`}
                tooltip={simulationTooltips.person.cppAnnualAmount}
              >
                CPP Annual Amount ($)
              </LabelWithTooltip>
              <CurrencyInput
                id={`${personNumber}-cpp-amount`}
                value={person.cpp_annual_at_start}
                onChange={(value) => onChange('cpp_annual_at_start', value)}
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-oas-start`}
                tooltip={simulationTooltips.person.oasStartAge}
              >
                OAS Start Age
              </LabelWithTooltip>
              <Input
                id={`${personNumber}-oas-start`}
                type="number"
                value={person.oas_start_age}
                onChange={(e) => onChange('oas_start_age', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-oas-amount`}
                tooltip={simulationTooltips.person.oasAnnualAmount}
              >
                OAS Annual Amount ($)
              </LabelWithTooltip>
              <CurrencyInput
                id={`${personNumber}-oas-amount`}
                value={person.oas_annual_at_start}
                onChange={(value) => onChange('oas_annual_at_start', value)}
              />
            </div>
          </div>
        </Collapsible>

        {/* Other Income Sources */}
        <Collapsible
          title="Other Income Sources"
          description="Pension, rental income, and other regular income"
          defaultOpen={false}
          isComplete={isOtherIncomeComplete()}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Pension and other income sources (employment, rental, business, investment)
                are now managed through your Profile → Income page, where you can set specific start ages
                for each income source.
              </p>
            </div>
          </div>
        </Collapsible>

        {/* Non-Registered Details */}
        <Collapsible
          title="Non-Registered Account Details"
          description="Asset allocation and tax basis for non-registered accounts"
          defaultOpen={false}
          isComplete={isNonregDetailsComplete()}
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Account Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-nonreg-acb`}
                    tooltip={simulationTooltips.person.nonregACB}
                  >
                    Adjusted Cost Base ($)
                  </LabelWithTooltip>
                  <CurrencyInput
                    id={`${personNumber}-nonreg-acb`}
                    value={person.nonreg_acb}
                    onChange={(value) => onChange('nonreg_acb', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-cash`}>Cash ($)</Label>
                  <CurrencyInput
                    id={`${personNumber}-nr-cash`}
                    value={person.nr_cash}
                    onChange={(value) => onChange('nr_cash', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-gic`}>GIC ($)</Label>
                  <CurrencyInput
                    id={`${personNumber}-nr-gic`}
                    value={person.nr_gic}
                    onChange={(value) => onChange('nr_gic', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-invest`}>Investments ($)</Label>
                  <CurrencyInput
                    id={`${personNumber}-nr-invest`}
                    value={person.nr_invest}
                    onChange={(value) => onChange('nr_invest', value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Investment Yields (%)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-nr-cash`}
                    tooltip={simulationTooltips.person.cashInterest}
                  >
                    Cash Interest (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-nr-cash`}
                    type="number"
                    step="0.1"
                    value={person.y_nr_cash_interest}
                    onChange={(e) => onChange('y_nr_cash_interest', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-nr-gic`}
                    tooltip={simulationTooltips.person.gicInterest}
                  >
                    GIC Interest (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-nr-gic`}
                    type="number"
                    step="0.1"
                    value={person.y_nr_gic_interest}
                    onChange={(e) => onChange('y_nr_gic_interest', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-nr-total`}
                    tooltip={simulationTooltips.person.invTotalReturn}
                  >
                    Total Return (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-nr-total`}
                    type="number"
                    step="0.1"
                    value={person.y_nr_inv_total_return}
                    onChange={(e) => onChange('y_nr_inv_total_return', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-nr-eligdiv`}
                    tooltip={simulationTooltips.person.invEligDiv}
                  >
                    Eligible Dividend (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-nr-eligdiv`}
                    type="number"
                    step="0.1"
                    value={person.y_nr_inv_elig_div}
                    onChange={(e) => onChange('y_nr_inv_elig_div', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-nr-noneligdiv`}
                    tooltip={simulationTooltips.person.invNonEligDiv}
                  >
                    Non-Eligible Dividend (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-nr-noneligdiv`}
                    type="number"
                    step="0.1"
                    value={person.y_nr_inv_nonelig_div}
                    onChange={(e) => onChange('y_nr_inv_nonelig_div', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-nr-capg`}
                    tooltip={simulationTooltips.person.invCapGains}
                  >
                    Capital Gains (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-nr-capg`}
                    type="number"
                    step="0.1"
                    value={person.y_nr_inv_capg}
                    onChange={(e) => onChange('y_nr_inv_capg', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-nr-roc`}
                    tooltip={simulationTooltips.person.invROC}
                  >
                    Return of Capital (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-nr-roc`}
                    type="number"
                    step="0.1"
                    value={person.y_nr_inv_roc_pct}
                    onChange={(e) => onChange('y_nr_inv_roc_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Asset Allocation (must sum to 100%)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-cash-pct`}>Cash (%)</Label>
                  <Input
                    id={`${personNumber}-nr-cash-pct`}
                    type="number"
                    step="0.1"
                    value={person.nr_cash_pct}
                    onChange={(e) => onChange('nr_cash_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-gic-pct`}>GIC (%)</Label>
                  <Input
                    id={`${personNumber}-nr-gic-pct`}
                    type="number"
                    step="0.1"
                    value={person.nr_gic_pct}
                    onChange={(e) => onChange('nr_gic_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-invest-pct`}>Investments (%)</Label>
                  <Input
                    id={`${personNumber}-nr-invest-pct`}
                    type="number"
                    step="0.1"
                    value={person.nr_invest_pct}
                    onChange={(e) => onChange('nr_invest_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>
        </Collapsible>

        {/* Corporate Details */}
        <Collapsible
          title="Corporate Account Details"
          description="Corporate investment buckets and tax settings"
          defaultOpen={false}
          isComplete={isCorporateDetailsComplete()}
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Account Buckets</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-cash`}>Cash Bucket ($)</Label>
                  <CurrencyInput
                    id={`${personNumber}-corp-cash`}
                    value={person.corp_cash_bucket}
                    onChange={(value) => onChange('corp_cash_bucket', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-gic`}>GIC Bucket ($)</Label>
                  <CurrencyInput
                    id={`${personNumber}-corp-gic`}
                    value={person.corp_gic_bucket}
                    onChange={(value) => onChange('corp_gic_bucket', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-invest`}>Investment Bucket ($)</Label>
                  <CurrencyInput
                    id={`${personNumber}-corp-invest`}
                    value={person.corp_invest_bucket}
                    onChange={(value) => onChange('corp_invest_bucket', value)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-corp-rdtoh`}
                    tooltip="Refundable Dividend Tax On Hand - tracks taxes that can be recovered when paying dividends from your corporation."
                  >
                    RDTOH ($)
                  </LabelWithTooltip>
                  <CurrencyInput
                    id={`${personNumber}-corp-rdtoh`}
                    value={person.corp_rdtoh}
                    onChange={(value) => onChange('corp_rdtoh', value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Investment Yields (%)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-corp-cash`}
                    tooltip={simulationTooltips.person.corpCashInterest}
                  >
                    Cash Interest (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-corp-cash`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_cash_interest}
                    onChange={(e) => onChange('y_corp_cash_interest', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-corp-gic`}
                    tooltip={simulationTooltips.person.corpGICInterest}
                  >
                    GIC Interest (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-corp-gic`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_gic_interest}
                    onChange={(e) => onChange('y_corp_gic_interest', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-corp-total`}
                    tooltip={simulationTooltips.person.corpInvTotalReturn}
                  >
                    Total Return (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-corp-total`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_inv_total_return}
                    onChange={(e) => onChange('y_corp_inv_total_return', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-corp-eligdiv`}
                    tooltip={simulationTooltips.person.corpInvEligDiv}
                  >
                    Eligible Dividend (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-corp-eligdiv`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_inv_elig_div}
                    onChange={(e) => onChange('y_corp_inv_elig_div', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-y-corp-capg`}
                    tooltip={simulationTooltips.person.corpInvCapGains}
                  >
                    Capital Gains (%)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-y-corp-capg`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_inv_capg}
                    onChange={(e) => onChange('y_corp_inv_capg', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Asset Allocation (must sum to 100%)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-cash-pct`}>Cash (%)</Label>
                  <Input
                    id={`${personNumber}-corp-cash-pct`}
                    type="number"
                    step="0.1"
                    value={person.corp_cash_pct}
                    onChange={(e) => onChange('corp_cash_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-gic-pct`}>GIC (%)</Label>
                  <Input
                    id={`${personNumber}-corp-gic-pct`}
                    type="number"
                    step="0.1"
                    value={person.corp_gic_pct}
                    onChange={(e) => onChange('corp_gic_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-invest-pct`}>Investments (%)</Label>
                  <Input
                    id={`${personNumber}-corp-invest-pct`}
                    type="number"
                    step="0.1"
                    value={person.corp_invest_pct}
                    onChange={(e) => onChange('corp_invest_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-div-type`}>Dividend Type</Label>
                  <Select
                    value={person.corp_dividend_type}
                    onValueChange={(value: 'eligible' | 'non-eligible') => onChange('corp_dividend_type', value)}
                  >
                    <SelectTrigger id={`${personNumber}-corp-div-type`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eligible">Eligible</SelectItem>
                      <SelectItem value="non-eligible">Non-Eligible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </Collapsible>

        {/* TFSA Strategy */}
        <Collapsible
          title="TFSA Strategy"
          description="TFSA contribution room and annual contribution plan"
          defaultOpen={false}
          isComplete={isTfsaStrategyComplete()}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Starting Room: ${(person.tfsa_room_start || 0).toLocaleString()}</p>
                  <p className="text-xs">
                    This value is automatically loaded from your Financial Profile and cannot be edited here.
                    To update it, go to Profile → Assets and edit your TFSA contribution room.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor={`${personNumber}-tfsa-contribution`}
                tooltip={simulationTooltips.person.tfsaRoom}
              >
                Annual TFSA Contribution ($)
              </LabelWithTooltip>
              <CurrencyInput
                id={`${personNumber}-tfsa-contribution`}
                value={person.tfsa_contribution_annual}
                onChange={(value) => onChange('tfsa_contribution_annual', value)}
              />
              <p className="text-xs text-gray-600">
                How much you'll contribute to TFSA each year (0 = no contributions)
              </p>
            </div>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
