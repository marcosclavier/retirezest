'use client';

import { PersonInput } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
              <Label htmlFor={`${personNumber}-name`}>Name</Label>
              <Input
                id={`${personNumber}-name`}
                value={person.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-start-age`}>Current Age</Label>
              <Input
                id={`${personNumber}-start-age`}
                type="number"
                value={person.start_age}
                onChange={(e) => onChange('start_age', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Account Balances - Default Open */}
        <Collapsible
          title="Account Balances"
          description="Registered and non-registered account balances"
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-tfsa`}>TFSA Balance ($)</Label>
              <Input
                id={`${personNumber}-tfsa`}
                type="number"
                value={person.tfsa_balance ?? 0}
                onChange={(e) => onChange('tfsa_balance', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-rrif`}>RRIF Balance ($)</Label>
              <Input
                id={`${personNumber}-rrif`}
                type="number"
                value={person.rrif_balance ?? 0}
                onChange={(e) => onChange('rrif_balance', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-rrsp`}>RRSP Balance ($)</Label>
              <Input
                id={`${personNumber}-rrsp`}
                type="number"
                value={person.rrsp_balance ?? 0}
                onChange={(e) => onChange('rrsp_balance', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-nonreg`}>Non-Registered Balance ($)</Label>
              <Input
                id={`${personNumber}-nonreg`}
                type="number"
                value={person.nonreg_balance ?? 0}
                onChange={(e) => onChange('nonreg_balance', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-corporate`}>Corporate Balance ($)</Label>
              <Input
                id={`${personNumber}-corporate`}
                type="number"
                value={person.corporate_balance ?? 0}
                onChange={(e) => onChange('corporate_balance', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </Collapsible>

        {/* Government Benefits */}
        <Collapsible
          title="Government Benefits"
          description="CPP and OAS start ages and annual amounts"
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-cpp-start`}>CPP Start Age</Label>
              <Input
                id={`${personNumber}-cpp-start`}
                type="number"
                value={person.cpp_start_age}
                onChange={(e) => onChange('cpp_start_age', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-cpp-amount`}>CPP Annual Amount ($)</Label>
              <Input
                id={`${personNumber}-cpp-amount`}
                type="number"
                value={person.cpp_annual_at_start}
                onChange={(e) => onChange('cpp_annual_at_start', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-oas-start`}>OAS Start Age</Label>
              <Input
                id={`${personNumber}-oas-start`}
                type="number"
                value={person.oas_start_age}
                onChange={(e) => onChange('oas_start_age', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${personNumber}-oas-amount`}>OAS Annual Amount ($)</Label>
              <Input
                id={`${personNumber}-oas-amount`}
                type="number"
                value={person.oas_annual_at_start}
                onChange={(e) => onChange('oas_annual_at_start', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </Collapsible>

        {/* Non-Registered Details */}
        <Collapsible
          title="Non-Registered Account Details"
          description="Asset allocation and tax basis for non-registered accounts"
          defaultOpen={false}
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Account Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-nonreg-acb`}
                    tooltip="The original cost of your investments for tax purposes. Used to calculate capital gains when you sell."
                  >
                    Adjusted Cost Base ($)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-nonreg-acb`}
                    type="number"
                    value={person.nonreg_acb}
                    onChange={(e) => onChange('nonreg_acb', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-cash`}>Cash ($)</Label>
                  <Input
                    id={`${personNumber}-nr-cash`}
                    type="number"
                    value={person.nr_cash}
                    onChange={(e) => onChange('nr_cash', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-gic`}>GIC ($)</Label>
                  <Input
                    id={`${personNumber}-nr-gic`}
                    type="number"
                    value={person.nr_gic}
                    onChange={(e) => onChange('nr_gic', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-nr-invest`}>Investments ($)</Label>
                  <Input
                    id={`${personNumber}-nr-invest`}
                    type="number"
                    value={person.nr_invest}
                    onChange={(e) => onChange('nr_invest', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Investment Yields (%)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-y-nr-cash`}>Cash Interest (%)</Label>
                  <Input
                    id={`${personNumber}-y-nr-cash`}
                    type="number"
                    step="0.1"
                    value={person.y_nr_cash_interest}
                    onChange={(e) => onChange('y_nr_cash_interest', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-y-nr-gic`}>GIC Interest (%)</Label>
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
                    tooltip="Expected annual return including dividends, capital gains, and interest. This is the sum of all income components."
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
                    tooltip="Portion of return from eligible dividends (from Canadian public corporations). Taxed at preferential rates."
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
                    tooltip="Portion of return from non-eligible dividends (typically from small Canadian corporations)."
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
                    tooltip="Portion of return from capital appreciation. Only 50% of capital gains are taxable in Canada."
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
                    tooltip="Return of Capital - tax-deferred distributions that reduce your adjusted cost base."
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
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Account Buckets</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-cash`}>Cash Bucket ($)</Label>
                  <Input
                    id={`${personNumber}-corp-cash`}
                    type="number"
                    value={person.corp_cash_bucket}
                    onChange={(e) => onChange('corp_cash_bucket', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-gic`}>GIC Bucket ($)</Label>
                  <Input
                    id={`${personNumber}-corp-gic`}
                    type="number"
                    value={person.corp_gic_bucket}
                    onChange={(e) => onChange('corp_gic_bucket', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-corp-invest`}>Investment Bucket ($)</Label>
                  <Input
                    id={`${personNumber}-corp-invest`}
                    type="number"
                    value={person.corp_invest_bucket}
                    onChange={(e) => onChange('corp_invest_bucket', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip
                    htmlFor={`${personNumber}-corp-rdtoh`}
                    tooltip="Refundable Dividend Tax On Hand - tracks taxes that can be recovered when paying dividends from your corporation."
                  >
                    RDTOH ($)
                  </LabelWithTooltip>
                  <Input
                    id={`${personNumber}-corp-rdtoh`}
                    type="number"
                    value={person.corp_rdtoh}
                    onChange={(e) => onChange('corp_rdtoh', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-3">Investment Yields (%)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-y-corp-cash`}>Cash Interest (%)</Label>
                  <Input
                    id={`${personNumber}-y-corp-cash`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_cash_interest}
                    onChange={(e) => onChange('y_corp_cash_interest', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-y-corp-gic`}>GIC Interest (%)</Label>
                  <Input
                    id={`${personNumber}-y-corp-gic`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_gic_interest}
                    onChange={(e) => onChange('y_corp_gic_interest', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-y-corp-total`}>Total Return (%)</Label>
                  <Input
                    id={`${personNumber}-y-corp-total`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_inv_total_return}
                    onChange={(e) => onChange('y_corp_inv_total_return', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-y-corp-eligdiv`}>Eligible Dividend (%)</Label>
                  <Input
                    id={`${personNumber}-y-corp-eligdiv`}
                    type="number"
                    step="0.1"
                    value={person.y_corp_inv_elig_div}
                    onChange={(e) => onChange('y_corp_inv_elig_div', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${personNumber}-y-corp-capg`}>Capital Gains (%)</Label>
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
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Starting Room: ${person.tfsa_room_start.toLocaleString()}</p>
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
                tooltip="Amount to contribute to TFSA each year during retirement. This transfers money from non-registered accounts to TFSA and must not exceed available contribution room."
              >
                Annual TFSA Contribution ($)
              </LabelWithTooltip>
              <Input
                id={`${personNumber}-tfsa-contribution`}
                type="number"
                value={person.tfsa_contribution_annual}
                onChange={(e) => onChange('tfsa_contribution_annual', parseFloat(e.target.value) || 0)}
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
