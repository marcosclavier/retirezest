'use client';

import { useState, useEffect } from 'react';
import { SimulationResponse } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, AlertTriangle, Calendar, DollarSign, TrendingUp, PieChart, Settings, Landmark, Lightbulb, CheckCircle2, FileDown, Loader2 } from 'lucide-react';
import { RetirementReport } from '@/components/reports/RetirementReport';
import { generatePDF } from '@/lib/reports/generatePDF';

interface ResultsDashboardProps {
  result: SimulationResponse;
}

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportSettings, setReportSettings] = useState<{ companyName?: string; companyLogo?: string }>({});
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state for client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch report settings from API
  useEffect(() => {
    const fetchReportSettings = async () => {
      try {
        const response = await fetch('/api/profile/settings');
        if (response.ok) {
          const data = await response.json();
          setReportSettings({
            companyName: data.companyName || undefined,
            companyLogo: data.companyLogo || undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching report settings:', error);
        // Continue without settings if fetch fails
      }
    };

    fetchReportSettings();
  }, []);

  // Debug logging for tax values
  if (result.year_by_year && result.year_by_year.length > 0) {
    const year2025 = result.year_by_year[0];
    console.log('=== RESULTS DASHBOARD DEBUG ===');
    console.log('Year 2025 Data:', year2025);
    console.log('Total Tax 2025:', year2025.total_tax);
    console.log('Tax P1 2025:', year2025.total_tax_p1);
    console.log('Tax P2 2025:', year2025.total_tax_p2);
    console.log('Taxable Income P1:', year2025.taxable_income_p1);
    console.log('Taxable Income P2:', year2025.taxable_income_p2);
    console.log('================================');
  }

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

  // Generate PDF report
  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDF('retirement-report', 'RetireZest-Retirement-Report.pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
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

      {/* PDF Export Button */}
      {result.summary && result.year_by_year && result.household_input && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Professional Retirement Report</h3>
              <p className="text-xs sm:text-sm text-gray-700 mt-1">
                Download a comprehensive PDF report with detailed analysis, tax breakdown, estate planning, and
                year-by-year projections.
              </p>
            </div>
            <Button
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              size="lg"
              className="w-full sm:w-auto sm:ml-4 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Download PDF Report</span>
                  <span className="sm:hidden">Download PDF</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {result.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: '#111827' }}>Years Funded</CardTitle>
              <Calendar className="h-4 w-4 text-gray-700 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold" style={{ color: '#111827' }}>
                {result.summary.years_funded}/{result.summary.years_simulated}
              </div>
              <p className="text-xs font-medium" style={{ color: '#111827' }}>
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
              <CardTitle className="text-sm font-semibold" style={{ color: '#111827' }}>Final Estate</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-700 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold" style={{ color: '#111827' }}>
                {formatCurrency(result.summary.final_estate_after_tax)}
              </div>
              <p className="text-xs font-medium" style={{ color: '#111827' }}>
                Gross: {formatCurrency(result.summary.final_estate_gross)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: '#111827' }}>Total Tax Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-700 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold" style={{ color: '#111827' }}>
                {formatCurrency(result.summary.total_tax_paid)}
              </div>
              <p className="text-xs font-medium" style={{ color: '#111827' }}>
                Avg effective rate: {formatPercent(result.summary.avg_effective_tax_rate)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: '#111827' }}>Total Withdrawals</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-700 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold" style={{ color: '#111827' }}>
                {formatCurrency(result.summary.total_withdrawals)}
              </div>
              <p className="text-xs font-medium" style={{ color: '#111827' }}>
                Total spending: {formatCurrency(result.summary.total_spending)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio Composition */}
      {result.composition_analysis && result.household_input && (() => {
        // Calculate original gross asset total from household input (before tax adjustments)
        const grossAssetTotal =
          (result.household_input.p1.tfsa_balance || 0) +
          (result.household_input.p2.tfsa_balance || 0) +
          (result.household_input.p1.rrif_balance || 0) +
          (result.household_input.p2.rrif_balance || 0) +
          (result.household_input.p1.rrsp_balance || 0) +
          (result.household_input.p2.rrsp_balance || 0) +
          (result.household_input.p1.nonreg_balance || 0) +
          (result.household_input.p2.nonreg_balance || 0) +
          (result.household_input.p1.corporate_balance || 0) +
          (result.household_input.p2.corporate_balance || 0);

        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle style={{ color: '#111827' }}>Portfolio Composition</CardTitle>
                <CardDescription style={{ color: '#111827' }}>
                  Asset allocation and recommended strategy
                  {result.household_input.start_year && (
                    <span className="block mt-1 text-xs text-gray-500">
                      Assets as of January {result.household_input.start_year}
                    </span>
                  )}
                </CardDescription>
              </div>
              <PieChart className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium" style={{ color: '#111827' }}>TFSA</p>
                  <p className="text-xl font-bold" style={{ color: '#111827' }}>{formatPercent(result.composition_analysis.tfsa_pct)}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(grossAssetTotal * result.composition_analysis.tfsa_pct)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium" style={{ color: '#111827' }}>RRIF</p>
                  <p className="text-xl font-bold" style={{ color: '#111827' }}>{formatPercent(result.composition_analysis.rrif_pct)}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(grossAssetTotal * result.composition_analysis.rrif_pct)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium" style={{ color: '#111827' }}>Non-Registered</p>
                  <p className="text-xl font-bold" style={{ color: '#111827' }}>{formatPercent(result.composition_analysis.nonreg_pct)}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(grossAssetTotal * result.composition_analysis.nonreg_pct)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium" style={{ color: '#111827' }}>Corporate</p>
                  <p className="text-xl font-bold" style={{ color: '#111827' }}>{formatPercent(result.composition_analysis.corporate_pct)}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(grossAssetTotal * result.composition_analysis.corporate_pct)}
                  </p>
                </div>
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <p className="text-base font-bold" style={{ color: '#111827' }}>Total</p>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: '#111827' }}>100%</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {formatCurrency(grossAssetTotal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
              {result.household_input?.strategy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: '#111827' }}>Selected Strategy:</span>
                  <Badge variant="outline">{result.household_input.strategy}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: '#111827' }}>Dominant Account:</span>
                <Badge variant="secondary">{result.composition_analysis.dominant_account}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: '#111827' }}>Recommended Strategy:</span>
                <Badge>{result.composition_analysis.recommended_strategy}</Badge>
              </div>
              <p className="text-sm font-medium pt-2" style={{ color: '#111827' }}>
                {result.composition_analysis.strategy_rationale}
              </p>
            </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Spending Analysis */}
      {result.spending_analysis && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle style={{ color: '#111827' }}>Spending Analysis</CardTitle>
              <CardDescription style={{ color: '#111827' }}>Coverage and funding status</CardDescription>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan Status */}
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-base font-semibold text-green-700 dark:text-green-300">
                {result.spending_analysis.plan_status_text}
              </p>
            </div>

            {/* Spending Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Spending Coverage</p>
                <p className="text-xl font-bold" style={{ color: '#111827' }}>{result.spending_analysis.spending_coverage_pct.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Total Available</p>
                <p className="text-xl font-bold" style={{ color: '#111827' }}>{formatCurrency(result.spending_analysis.total_spending_available)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Target Spending</p>
                <p className="text-xl font-bold" style={{ color: '#111827' }}>{formatCurrency(result.spending_analysis.spending_target_total)}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Portfolio Withdrawals</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{formatCurrency(result.spending_analysis.portfolio_withdrawals)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Government Benefits</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{formatCurrency(result.spending_analysis.government_benefits_total)}</p>
              </div>
            </div>

            <div className="text-sm font-medium pt-2" style={{ color: '#111827' }}>
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
              <CardTitle style={{ color: '#111827' }}>Key Assumptions</CardTitle>
              <CardDescription style={{ color: '#111827' }}>Simulation parameters</CardDescription>
            </div>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>General Inflation</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{result.key_assumptions.general_inflation_rate}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Spending Inflation</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{result.key_assumptions.spending_inflation_rate}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>CPP Indexing</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{result.key_assumptions.cpp_indexing_rate}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>OAS Indexing</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{result.key_assumptions.oas_indexing_rate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Projection Period</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{result.key_assumptions.projection_period_years} years</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Tax Year Basis</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{result.key_assumptions.tax_year_basis}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Province</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{result.key_assumptions.province}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Strategy</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{result.key_assumptions.withdrawal_strategy}</p>
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
              <CardTitle style={{ color: '#111827' }}>Estate Summary</CardTitle>
              <CardDescription style={{ color: '#111827' }}>Projected estate at end of simulation</CardDescription>
            </div>
            <Landmark className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estate Values */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Gross Estate</p>
                <p className="text-xl font-bold" style={{ color: '#111827' }}>{formatCurrency(result.estate_summary.gross_estate_value)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Taxes at Death</p>
                <p className="text-xl font-bold" style={{ color: '#DC2626' }}>{formatCurrency(result.estate_summary.taxes_at_death)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>After-Tax Legacy</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(result.estate_summary.after_tax_legacy)}</p>
              </div>
            </div>

            {/* Account Balances at Death */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>RRIF</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{formatCurrency(result.estate_summary.rrif_balance_at_death)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>TFSA</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{formatCurrency(result.estate_summary.tfsa_balance_at_death)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Non-Registered</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{formatCurrency(result.estate_summary.nonreg_balance_at_death)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Corporate</p>
                <p className="text-base font-medium" style={{ color: '#111827' }}>{formatCurrency(result.estate_summary.corporate_balance_at_death)}</p>
              </div>
            </div>

            {/* Taxable Components */}
            {result.estate_summary.taxable_components && result.estate_summary.taxable_components.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2" style={{ color: '#111827' }}>Tax Breakdown by Account</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ color: '#111827' }}>Account Type</TableHead>
                        <TableHead className="text-right" style={{ color: '#111827' }}>Balance</TableHead>
                        <TableHead className="text-right" style={{ color: '#111827' }}>Inclusion Rate</TableHead>
                        <TableHead className="text-right" style={{ color: '#111827' }}>Est. Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.estate_summary.taxable_components.map((component, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div>
                              <p className="font-medium" style={{ color: '#111827' }}>{component.account_type}</p>
                              <p className="text-xs" style={{ color: '#6B7280' }}>{component.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right" style={{ color: '#111827' }}>{formatCurrency(component.balance_at_death)}</TableCell>
                          <TableCell className="text-right" style={{ color: '#111827' }}>{component.taxable_inclusion_rate}%</TableCell>
                          <TableCell className="text-right" style={{ color: '#111827' }}>{formatCurrency(component.estimated_tax)}</TableCell>
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
                  <h4 className="font-medium" style={{ color: '#111827' }}>Estate Planning Tips</h4>
                </div>
                <ul className="space-y-2">
                  {result.estate_summary.estate_planning_tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span style={{ color: '#6B7280' }}>•</span>
                      <span className="text-sm" style={{ color: '#111827' }}>{tip}</span>
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
            <CardTitle style={{ color: '#111827' }}>5-Year Withdrawal Plan</CardTitle>
            <CardDescription style={{ color: '#111827' }}>Recommended withdrawals for the first 5 years</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="rounded-md border overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '45px' }}>Year</TableHead>
                    <TableHead className="px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '50px' }}>Age</TableHead>
                    <TableHead className="text-right px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '75px' }}>Target</TableHead>
                    <TableHead className="text-right px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '60px' }}>CPP</TableHead>
                    <TableHead className="text-right px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '60px' }}>OAS</TableHead>
                    <TableHead className="text-right px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '65px' }}>RRIF</TableHead>
                    <TableHead className="text-right px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '70px' }}>NonReg</TableHead>
                    <TableHead className="text-right px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '55px' }}>TFSA</TableHead>
                    <TableHead className="text-right px-1 py-2 text-[11px]" style={{ color: '#111827', minWidth: '75px' }}>Corp</TableHead>
                    <TableHead className="text-right px-1 py-2 text-[11px] font-semibold" style={{ color: '#111827', minWidth: '80px' }}>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.five_year_plan.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>{year.year}</TableCell>
                      <TableCell className="text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>{year.age_p1}/{year.age_p2}</TableCell>
                      <TableCell className="text-right text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>{formatCurrency(year.spending_target)}</TableCell>
                      <TableCell className="text-right text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>
                        {formatCurrency(year.cpp_p1 + year.cpp_p2)}
                      </TableCell>
                      <TableCell className="text-right text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>
                        {formatCurrency(year.oas_p1 + year.oas_p2)}
                      </TableCell>
                      <TableCell className="text-right text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>
                        {formatCurrency(year.rrif_withdrawal_p1 + year.rrif_withdrawal_p2)}
                      </TableCell>
                      <TableCell className="text-right text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>
                        {formatCurrency(
                          year.nonreg_withdrawal_p1 +
                          year.nonreg_withdrawal_p2 +
                          year.nonreg_distributions_total
                        )}
                      </TableCell>
                      <TableCell className="text-right text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>
                        {formatCurrency(year.tfsa_withdrawal_p1 + year.tfsa_withdrawal_p2)}
                      </TableCell>
                      <TableCell className="text-right text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>
                        {formatCurrency(year.corp_withdrawal_p1 + year.corp_withdrawal_p2)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-[11px] px-1 py-1.5" style={{ color: '#111827' }}>
                        {formatCurrency(
                          year.cpp_p1 + year.cpp_p2 +
                          year.oas_p1 + year.oas_p2 +
                          year.total_withdrawn +
                          year.nonreg_distributions_total
                        )}
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
            <CardTitle style={{ color: '#111827' }}>10 Year Summary</CardTitle>
            <CardDescription style={{ color: '#111827' }}>
              Detailed simulation results ({result.year_by_year.length} years)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: '#111827' }}>Year</TableHead>
                    <TableHead style={{ color: '#111827' }}>Age P1</TableHead>
                    <TableHead style={{ color: '#111827' }}>Age P2</TableHead>
                    <TableHead className="text-right" style={{ color: '#111827' }}>Spending Need</TableHead>
                    <TableHead className="text-right" style={{ color: '#111827' }}>Spending Met</TableHead>
                    <TableHead className="text-right" style={{ color: '#111827' }}>Total Tax</TableHead>
                    <TableHead className="text-right" style={{ color: '#111827' }}>Total Value</TableHead>
                    <TableHead style={{ color: '#111827' }}>Success</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.year_by_year.slice(0, 10).map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium" style={{ color: '#111827' }}>{year.year}</TableCell>
                      <TableCell style={{ color: '#111827' }}>{year.age_p1}</TableCell>
                      <TableCell style={{ color: '#111827' }}>{year.age_p2}</TableCell>
                      <TableCell className="text-right" style={{ color: '#111827' }}>{formatCurrency(year.spending_need)}</TableCell>
                      <TableCell className="text-right" style={{ color: '#111827' }}>{formatCurrency(year.spending_met)}</TableCell>
                      <TableCell className="text-right" style={{ color: '#111827' }}>{formatCurrency(year.total_tax)}</TableCell>
                      <TableCell className="text-right" style={{ color: '#111827' }}>{formatCurrency(year.total_value)}</TableCell>
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
              <p className="text-xs text-center mt-2" style={{ color: '#111827' }}>
                Showing first 10 of {result.year_by_year.length} years
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden PDF Report Container - Only render on client to avoid hydration errors */}
      {isMounted && result.summary && result.year_by_year && result.household_input && (
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            opacity: 0,
            pointerEvents: 'none',
            width: '1600px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          className="print:block print:static print:left-0 print:opacity-100"
        >
          <RetirementReport
            result={result}
            companyName={reportSettings.companyName}
            companyLogo={reportSettings.companyLogo}
          />
        </div>
      )}
    </div>
  );
}
