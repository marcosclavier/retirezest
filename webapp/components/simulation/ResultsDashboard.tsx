'use client';

import { SimulationResponse } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, AlertTriangle, Calendar, DollarSign, TrendingUp, PieChart, Settings, Landmark, Lightbulb, CheckCircle2 } from 'lucide-react';

interface ResultsDashboardProps {
  result: SimulationResponse;
}

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Error state
  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Simulation Failed</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>{result.message}</p>
            {result.error && <p className="text-sm">{result.error}</p>}
            {result.error_details && <p className="text-xs">{result.error_details}</p>}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {result.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Years Funded</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {result.summary.years_funded}/{result.summary.years_simulated}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercent(result.summary.success_rate)} success rate
              </p>
              {result.summary.first_failure_year && (
                <p className="text-xs text-destructive mt-1">
                  First failure: {result.summary.first_failure_year}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Final Estate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(result.summary.final_estate_after_tax)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gross: {formatCurrency(result.summary.final_estate_gross)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tax Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(result.summary.total_tax_paid)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg effective rate: {formatPercent(result.summary.avg_effective_tax_rate)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(result.summary.total_withdrawals)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total spending: {formatCurrency(result.summary.total_spending)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio Composition */}
      {result.composition_analysis && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Portfolio Composition</CardTitle>
              <CardDescription>Asset allocation and recommended strategy</CardDescription>
            </div>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">TFSA</p>
                <p className="text-2xl font-bold">{formatPercent(result.composition_analysis.tfsa_pct)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">RRIF</p>
                <p className="text-2xl font-bold">{formatPercent(result.composition_analysis.rrif_pct)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Non-Registered</p>
                <p className="text-2xl font-bold">{formatPercent(result.composition_analysis.nonreg_pct)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Corporate</p>
                <p className="text-2xl font-bold">{formatPercent(result.composition_analysis.corporate_pct)}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dominant Account:</span>
                <Badge variant="secondary">{result.composition_analysis.dominant_account}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recommended Strategy:</span>
                <Badge>{result.composition_analysis.recommended_strategy}</Badge>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                {result.composition_analysis.strategy_rationale}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Analysis */}
      {result.spending_analysis && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Spending Analysis</CardTitle>
              <CardDescription>Coverage and funding status</CardDescription>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan Status */}
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {result.spending_analysis.plan_status_text}
              </p>
            </div>

            {/* Spending Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Spending Coverage</p>
                <p className="text-2xl font-bold">{result.spending_analysis.spending_coverage_pct.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Available</p>
                <p className="text-xl font-bold">{formatCurrency(result.spending_analysis.total_spending_available)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Target Spending</p>
                <p className="text-xl font-bold">{formatCurrency(result.spending_analysis.spending_target_total)}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Portfolio Withdrawals</p>
                <p className="text-lg font-medium">{formatCurrency(result.spending_analysis.portfolio_withdrawals)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Government Benefits</p>
                <p className="text-lg font-medium">{formatCurrency(result.spending_analysis.government_benefits_total)}</p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground pt-2">
              Average annual spending: {formatCurrency(result.spending_analysis.avg_annual_spending)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Assumptions */}
      {result.key_assumptions && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Key Assumptions</CardTitle>
              <CardDescription>Simulation parameters</CardDescription>
            </div>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">General Inflation</p>
                <p className="text-lg font-medium">{result.key_assumptions.general_inflation_rate}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Spending Inflation</p>
                <p className="text-lg font-medium">{result.key_assumptions.spending_inflation_rate}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CPP Indexing</p>
                <p className="text-lg font-medium">{result.key_assumptions.cpp_indexing_rate}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">OAS Indexing</p>
                <p className="text-lg font-medium">{result.key_assumptions.oas_indexing_rate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Projection Period</p>
                <p className="text-lg font-medium">{result.key_assumptions.projection_period_years} years</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tax Year Basis</p>
                <p className="text-lg font-medium">{result.key_assumptions.tax_year_basis}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Province</p>
                <p className="text-lg font-medium">{result.key_assumptions.province}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Strategy</p>
                <p className="text-lg font-medium">{result.key_assumptions.withdrawal_strategy}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estate Summary */}
      {result.estate_summary && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Estate Summary</CardTitle>
              <CardDescription>Projected estate at end of simulation</CardDescription>
            </div>
            <Landmark className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estate Values */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gross Estate</p>
                <p className="text-2xl font-bold">{formatCurrency(result.estate_summary.gross_estate_value)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Taxes at Death</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(result.estate_summary.taxes_at_death)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">After-Tax Legacy</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(result.estate_summary.after_tax_legacy)}</p>
              </div>
            </div>

            {/* Account Balances at Death */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">RRIF</p>
                <p className="text-lg font-medium">{formatCurrency(result.estate_summary.rrif_balance_at_death)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">TFSA</p>
                <p className="text-lg font-medium">{formatCurrency(result.estate_summary.tfsa_balance_at_death)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Non-Registered</p>
                <p className="text-lg font-medium">{formatCurrency(result.estate_summary.nonreg_balance_at_death)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Corporate</p>
                <p className="text-lg font-medium">{formatCurrency(result.estate_summary.corporate_balance_at_death)}</p>
              </div>
            </div>

            {/* Taxable Components */}
            {result.estate_summary.taxable_components && result.estate_summary.taxable_components.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Tax Breakdown by Account</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Type</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Inclusion Rate</TableHead>
                        <TableHead className="text-right">Est. Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.estate_summary.taxable_components.map((component, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{component.account_type}</p>
                              <p className="text-xs text-muted-foreground">{component.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(component.balance_at_death)}</TableCell>
                          <TableCell className="text-right">{component.taxable_inclusion_rate}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(component.estimated_tax)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Estate Planning Tips */}
            {result.estate_summary.estate_planning_tips && result.estate_summary.estate_planning_tips.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <h4 className="font-medium">Estate Planning Tips</h4>
                </div>
                <ul className="space-y-2">
                  {result.estate_summary.estate_planning_tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Five Year Plan */}
      {result.five_year_plan && result.five_year_plan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>5-Year Withdrawal Plan</CardTitle>
            <CardDescription>Recommended withdrawals for the first 5 years</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Spending Target</TableHead>
                    <TableHead className="text-right">RRIF</TableHead>
                    <TableHead className="text-right">Non-Reg</TableHead>
                    <TableHead className="text-right">TFSA</TableHead>
                    <TableHead className="text-right">Corporate</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.five_year_plan.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell>{year.age_p1}/{year.age_p2}</TableCell>
                      <TableCell className="text-right">{formatCurrency(year.spending_target)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year.rrif_withdrawal_p1 + year.rrif_withdrawal_p2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year.nonreg_withdrawal_p1 + year.nonreg_withdrawal_p2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year.tfsa_withdrawal_p1 + year.tfsa_withdrawal_p2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year.corp_withdrawal_p1 + year.corp_withdrawal_p2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(year.total_withdrawn)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Underfunding Summary */}
      {result.summary && result.summary.total_underfunded_years > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Underfunding Detected</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              <p>
                The plan is underfunded for {result.summary.total_underfunded_years} years with a total
                shortfall of {formatCurrency(result.summary.total_underfunding)}.
              </p>
              <p className="text-xs">
                Consider adjusting spending goals, retirement age, or asset allocation.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Year-by-Year Results Table */}
      {result.year_by_year && result.year_by_year.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Year-by-Year Results</CardTitle>
            <CardDescription>
              Detailed simulation results ({result.year_by_year.length} years)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Age P1</TableHead>
                    <TableHead>Age P2</TableHead>
                    <TableHead className="text-right">Spending Need</TableHead>
                    <TableHead className="text-right">Spending Met</TableHead>
                    <TableHead className="text-right">Total Tax</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Success</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.year_by_year.slice(0, 10).map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell>{year.age_p1}</TableCell>
                      <TableCell>{year.age_p2}</TableCell>
                      <TableCell className="text-right">{formatCurrency(year.spending_need)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(year.spending_met)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(year.total_tax)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(year.total_value)}</TableCell>
                      <TableCell>
                        {year.plan_success ? (
                          <Badge variant="default">✓</Badge>
                        ) : (
                          <Badge variant="destructive">✗</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {result.year_by_year.length > 10 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Showing first 10 of {result.year_by_year.length} years
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
