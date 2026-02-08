'use client';

import { useState, Fragment, useEffect } from 'react';
import { YearResult } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronUp, Download, ChevronRight, Lock } from 'lucide-react';

interface YearByYearTableProps {
  yearByYear: YearResult[];
  initialRowsToShow?: number;
  reinvestNonregDist?: boolean;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

export function YearByYearTable({ yearByYear, initialRowsToShow = 10, reinvestNonregDist = true, isPremium = false, onUpgradeClick }: YearByYearTableProps) {
  const [showAll, setShowAll] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof YearResult>('year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (year: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Sort data
  const sortedData = [...yearByYear].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const displayedData = showAll ? sortedData : sortedData.slice(0, initialRowsToShow);

  const handleSort = (column: keyof YearResult) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: keyof YearResult }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3 inline ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-1" />
    );
  };

  const exportToCSV = () => {
    // Check if user is premium
    if (!isPremium) {
      if (onUpgradeClick) {
        onUpgradeClick();
      }
      return;
    }

    const headers = [
      'Year',
      'Age P1',
      'Age P2',
      'CPP P1',
      'CPP P2',
      'OAS P1',
      'OAS P2',
      'GIS P1',
      'GIS P2',
      'RRIF WD P1',
      'RRIF WD P2',
      'NonReg WD P1',
      'NonReg WD P2',
      'TFSA WD P1',
      'TFSA WD P2',
      'TFSA Contrib P1',
      'TFSA Contrib P2',
      'Corp WD P1',
      'Corp WD P2',
      'NonReg Dist',
      'RRIF Bal P1',
      'RRIF Bal P2',
      'TFSA Bal P1',
      'TFSA Bal P2',
      'NonReg Bal P1',
      'NonReg Bal P2',
      'Corp Bal P1',
      'Corp Bal P2',
      'Total Value',
      'Taxable Inc P1',
      'Taxable Inc P2',
      'Tax P1',
      'Tax P2',
      'Total Tax',
      'Spending Need',
      'Spending Met',
      'Gap',
      'Success',
    ];

    const rows = yearByYear.map((year) => [
      year.year,
      year.age_p1,
      year.age_p2,
      year.cpp_p1,
      year.cpp_p2,
      year.oas_p1,
      year.oas_p2,
      year.gis_p1 || 0,
      year.gis_p2 || 0,
      year.rrif_withdrawal_p1,
      year.rrif_withdrawal_p2,
      year.nonreg_withdrawal_p1,
      year.nonreg_withdrawal_p2,
      year.tfsa_withdrawal_p1,
      year.tfsa_withdrawal_p2,
      year.tfsa_contribution_p1 || 0,
      year.tfsa_contribution_p2 || 0,
      year.corporate_withdrawal_p1,
      year.corporate_withdrawal_p2,
      year.nonreg_distributions || 0,
      year.rrif_balance_p1,
      year.rrif_balance_p2,
      year.tfsa_balance_p1,
      year.tfsa_balance_p2,
      year.nonreg_balance_p1,
      year.nonreg_balance_p2,
      year.corporate_balance_p1,
      year.corporate_balance_p2,
      year.total_value,
      year.taxable_income_p1,
      year.taxable_income_p2,
      year.total_tax_p1,
      year.total_tax_p2,
      year.total_tax,
      year.spending_need,
      year.spending_met,
      year.spending_gap,
      year.plan_success ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'year-by-year-results.csv';
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle style={{ color: '#111827' }}>Year-by-Year Retirement Plan</CardTitle>
            <CardDescription style={{ color: '#111827' }}>
              Detailed simulation results ({yearByYear.length} years)
            </CardDescription>
          </div>
          <Button
            variant={isPremium ? "outline" : "default"}
            size="sm"
            onClick={exportToCSV}
            className={!isPremium ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {!isPremium && <Lock className="h-4 w-4 mr-2" />}
            {isPremium && <Download className="h-4 w-4 mr-2" />}
            Export CSV {!isPremium && "(Premium)"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" style={{ color: '#111827' }}></TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('year')}
                  style={{ color: '#111827' }}
                >
                  Year
                  <SortIcon column="year" />
                </TableHead>
                <TableHead style={{ color: '#111827' }}>Ages</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('spending_need')}
                  style={{ color: '#111827' }}
                >
                  Spending Target
                  <SortIcon column="spending_need" />
                </TableHead>
                <TableHead className="text-right" style={{ color: '#111827' }}>Total Inflows</TableHead>
                <TableHead className="text-right" style={{ color: '#111827' }}>Total Withdrawals</TableHead>
                <TableHead className="text-right" style={{ color: '#111827' }}>TFSA Contrib</TableHead>
                <TableHead className="text-right" style={{ color: '#111827' }}>NonReg Dist</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('total_tax')}
                  style={{ color: '#111827' }}
                >
                  Tax Paid
                  <SortIcon column="total_tax" />
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('total_value')}
                  style={{ color: '#111827' }}
                >
                  Net Worth
                  <SortIcon column="total_value" />
                </TableHead>
                <TableHead className="text-center" style={{ color: '#111827' }}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedData.map((year) => {
                const isExpanded = expandedRows.has(year.year);
                const totalBenefits = year.cpp_p1 + year.cpp_p2 + year.oas_p1 + year.oas_p2;
                const totalWithdrawals =
                  year.rrif_withdrawal_p1 + year.rrif_withdrawal_p2 +
                  year.tfsa_withdrawal_p1 + year.tfsa_withdrawal_p2 +
                  year.nonreg_withdrawal_p1 + year.nonreg_withdrawal_p2 +
                  year.corporate_withdrawal_p1 + year.corporate_withdrawal_p2;
                const nonregDistributions = year.nonreg_distributions || 0;
                const tfsaContributions = (year.tfsa_contribution_p1 || 0) + (year.tfsa_contribution_p2 || 0);
                const totalInflows = totalBenefits + totalWithdrawals + nonregDistributions;
                const hasGap = year.spending_gap > 0;

                return (
                  <Fragment key={year.year}>
                    <TableRow
                      className={`cursor-pointer hover:bg-muted/30 ${hasGap ? 'bg-red-50 dark:bg-red-950/30' : ''}`}
                      onClick={() => toggleRow(year.year)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium" style={{ color: '#111827' }}>
                        {year.year}
                      </TableCell>
                      <TableCell style={{ color: '#111827' }}>
                        {year.age_p1}/{year.age_p2}
                      </TableCell>
                      <TableCell className="text-right" style={{ color: '#111827' }}>
                        {formatCurrency(year.spending_need)}
                      </TableCell>
                      <TableCell className="text-right" style={{ color: '#10B981' }}>
                        {formatCurrency(totalInflows)}
                      </TableCell>
                      <TableCell className="text-right" style={{ color: '#2563EB' }}>
                        {formatCurrency(totalWithdrawals)}
                      </TableCell>
                      <TableCell className="text-right" style={{ color: '#8B5CF6' }}>
                        {formatCurrency(tfsaContributions)}
                      </TableCell>
                      <TableCell className="text-right" style={{ color: '#10B981' }}>
                        {formatCurrency(nonregDistributions)}
                      </TableCell>
                      <TableCell className="text-right" style={{ color: '#EA580C' }}>
                        {formatCurrency(year.total_tax)}
                      </TableCell>
                      <TableCell className="text-right font-medium" style={{ color: '#111827' }}>
                        {formatCurrency(year.total_value)}
                      </TableCell>
                      <TableCell className="text-center">
                        {year.plan_success ? (
                          <Badge variant="default" className="bg-green-600">
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Gap</Badge>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <TableRow key={`${year.year}-detail`}>
                        <TableCell colSpan={11} className="bg-muted/20 p-3 sm:p-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {/* COLUMN 1: GOV BENEFITS (per person) */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-semibold text-xs sm:text-sm uppercase text-green-700 dark:text-green-400 mb-2 sm:mb-3">
                                💰 Gov Benefits
                              </h4>
                              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                <div className="font-semibold text-xs" style={{ color: '#6B7280' }}>PERSON 1</div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>CPP</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.cpp_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>OAS</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.oas_p1)}
                                  </span>
                                </div>
                                {(year.oas_clawback_p1 ?? 0) > 0 && (
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="truncate" style={{ color: '#DC2626' }}>OAS Clawback</span>
                                    <span className="font-medium whitespace-nowrap" style={{ color: '#DC2626' }}>
                                      -{formatCurrency(year.oas_clawback_p1 ?? 0)}
                                    </span>
                                  </div>
                                )}
                                {(year.gis_p1 ?? 0) > 0 && (
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="truncate" style={{ color: '#111827' }}>GIS</span>
                                    <span className="font-medium whitespace-nowrap" style={{ color: '#10B981' }}>
                                      {formatCurrency(year.gis_p1 ?? 0)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>NonReg Dist</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#10B981' }}>
                                    {formatCurrency(nonregDistributions / 2)}
                                  </span>
                                </div>

                                <div className="font-semibold text-xs pt-2 sm:pt-3" style={{ color: '#6B7280' }}>PERSON 2</div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>CPP</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.cpp_p2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>OAS</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.oas_p2)}
                                  </span>
                                </div>
                                {(year.oas_clawback_p2 ?? 0) > 0 && (
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="truncate" style={{ color: '#DC2626' }}>OAS Clawback</span>
                                    <span className="font-medium whitespace-nowrap" style={{ color: '#DC2626' }}>
                                      -{formatCurrency(year.oas_clawback_p2 ?? 0)}
                                    </span>
                                  </div>
                                )}
                                {(year.gis_p2 ?? 0) > 0 && (
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="truncate" style={{ color: '#111827' }}>GIS</span>
                                    <span className="font-medium whitespace-nowrap" style={{ color: '#10B981' }}>
                                      {formatCurrency(year.gis_p2 ?? 0)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>NonReg Dist</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#10B981' }}>
                                    {formatCurrency(nonregDistributions / 2)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                                  <span className="font-semibold truncate" style={{ color: '#111827' }}>
                                    Total Gov Benefits
                                  </span>
                                  <span className="font-semibold whitespace-nowrap" style={{ color: '#10B981' }}>
                                    {formatCurrency(totalBenefits + nonregDistributions)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* COLUMN 2: WITHDRAWALS/CASH FLOW (per person) */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-semibold text-xs sm:text-sm uppercase text-blue-700 dark:text-blue-400 mb-2 sm:mb-3">
                                💵 Withdrawals
                              </h4>
                              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                <div className="font-semibold text-xs" style={{ color: '#6B7280' }}>PERSON 1</div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>RRIF</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.rrif_withdrawal_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Corporate</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.corporate_withdrawal_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>TFSA</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.tfsa_withdrawal_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Non-Reg</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.nonreg_withdrawal_p1)}
                                  </span>
                                </div>

                                <div className="font-semibold text-xs pt-2 sm:pt-3" style={{ color: '#6B7280' }}>PERSON 2</div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>RRIF</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.rrif_withdrawal_p2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Corporate</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.corporate_withdrawal_p2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>TFSA</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.tfsa_withdrawal_p2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Non-Reg</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.nonreg_withdrawal_p2)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                                  <span className="font-semibold truncate" style={{ color: '#111827' }}>
                                    Total Withdrawals
                                  </span>
                                  <span className="font-semibold whitespace-nowrap" style={{ color: '#2563EB' }}>
                                    {formatCurrency(totalWithdrawals)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* COLUMN 3: CASH FLOW SUMMARY */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-semibold text-xs sm:text-sm uppercase text-orange-700 dark:text-orange-400 mb-2 sm:mb-3">
                                💸 Cash Flow Summary
                              </h4>
                              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                <div className="flex justify-between items-center gap-2 pt-2 border-t-2 border-green-600">
                                  <span className="font-bold truncate" style={{ color: '#059669' }}>
                                    Gross Cash Inflows
                                  </span>
                                  <span className="font-bold whitespace-nowrap" style={{ color: '#059669' }}>
                                    {formatCurrency(totalBenefits + nonregDistributions + totalWithdrawals)}
                                  </span>
                                </div>

                                <div className="font-semibold text-xs pt-2 sm:pt-3" style={{ color: '#6B7280' }}>OUTFLOWS</div>

                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Spending Target</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.spending_need)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>TFSA Contrib</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#8B5CF6' }}>
                                    {formatCurrency(tfsaContributions)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Taxes</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#EA580C' }}>
                                    {formatCurrency(year.total_tax)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                                  <span className="font-semibold truncate" style={{ color: '#111827' }}>
                                    Total Outflows
                                  </span>
                                  <span className="font-semibold whitespace-nowrap" style={{ color: '#EA580C' }}>
                                    {formatCurrency(year.spending_need + tfsaContributions + year.total_tax)}
                                  </span>
                                </div>

                                {(() => {
                                  const grossCashInflows = totalBenefits + nonregDistributions + totalWithdrawals;
                                  const totalOutflows = year.spending_need + tfsaContributions + year.total_tax;
                                  const netCashFlow = grossCashInflows - totalOutflows;
                                  const isBalanced = Math.abs(netCashFlow) < 1.0;
                                  return (
                                    <div className={`flex justify-between items-center gap-2 pt-2 border-t-2 ${isBalanced ? 'border-green-600' : 'border-amber-600'}`}>
                                      <span className="font-bold truncate" style={{ color: isBalanced ? '#059669' : '#D97706' }}>
                                        Net Cash Flow
                                      </span>
                                      <span className="font-bold whitespace-nowrap" style={{ color: isBalanced ? '#059669' : '#D97706' }}>
                                        {netCashFlow >= 0 ? '' : '-'}{formatCurrency(Math.abs(netCashFlow))}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* COLUMN 4: END-OF-YEAR BALANCES (per person) */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-semibold text-xs sm:text-sm uppercase text-gray-700 dark:text-gray-400 mb-2 sm:mb-3">
                                💼 End Balances
                              </h4>
                              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                <div className="font-semibold text-xs" style={{ color: '#6B7280' }}>PERSON 1</div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>RRIF</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.rrif_balance_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>TFSA</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.tfsa_balance_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Non-Reg</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.nonreg_balance_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Corporate</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.corporate_balance_p1)}
                                  </span>
                                </div>

                                <div className="font-semibold text-xs pt-2 sm:pt-3" style={{ color: '#6B7280' }}>PERSON 2</div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>RRIF</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.rrif_balance_p2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>TFSA</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.tfsa_balance_p2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Non-Reg</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.nonreg_balance_p2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="truncate" style={{ color: '#111827' }}>Corporate</span>
                                  <span className="font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {formatCurrency(year.corporate_balance_p2)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                                  <span className="font-semibold truncate" style={{ color: '#111827' }}>
                                    Net Worth
                                  </span>
                                  <span className="font-semibold whitespace-nowrap text-green-600">
                                    {formatCurrency(year.total_value)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Show More/Less Button */}
        {yearByYear.length > initialRowsToShow && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => setShowAll(!showAll)} style={{ color: '#111827' }}>
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show All {yearByYear.length} Years
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
