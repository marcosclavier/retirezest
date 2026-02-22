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
import { ChevronDown, ChevronUp, Download, ChevronRight, Lock, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

interface YearByYearTableProps {
  yearByYear: YearResult[];
  initialRowsToShow?: number;
  reinvestNonregDist?: boolean;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
  isSinglePerson?: boolean;
  personOneName?: string;
  personTwoName?: string;
  province?: string;
}

export function YearByYearTable({ yearByYear, initialRowsToShow = 10, reinvestNonregDist = true, isPremium = false, onUpgradeClick, isSinglePerson = false, personOneName = 'Person 1', personTwoName = 'Person 2', province = 'ON' }: YearByYearTableProps) {
  // Determine pension label based on province
  const pensionLabel = province === 'QC' ? 'QPP' : 'CPP';
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

    const p1Name = personOneName.split(' ')[0] || 'P1';
    const p2Name = personTwoName?.split(' ')[0] || 'P2';

    const headers = isSinglePerson ? [
      'Year',
      `Age ${p1Name}`,
      `${pensionLabel} ${p1Name}`,
      `OAS ${p1Name}`,
      `GIS ${p1Name}`,
      `RRSP/RRIF WD ${p1Name}`,
      `NonReg WD ${p1Name}`,
      `TFSA WD ${p1Name}`,
      `TFSA Contrib ${p1Name}`,
      `Corp WD ${p1Name}`,
      'NonReg Dist',
      `RRSP/RRIF Bal ${p1Name}`,
      `TFSA Bal ${p1Name}`,
      `NonReg Bal ${p1Name}`,
      `Corp Bal ${p1Name}`,
      'Total Value',
      `Taxable Inc ${p1Name}`,
      `Tax ${p1Name}`,
      'Total Tax',
      'Spending Need',
      'Spending Met',
      'Gap',
      'Success',
    ] : [
      'Year',
      `Age ${p1Name}`,
      `Age ${p2Name}`,
      `${pensionLabel} ${p1Name}`,
      `${pensionLabel} ${p2Name}`,
      `OAS ${p1Name}`,
      `OAS ${p2Name}`,
      `GIS ${p1Name}`,
      `GIS ${p2Name}`,
      `RRSP/RRIF WD ${p1Name}`,
      `RRSP/RRIF WD ${p2Name}`,
      `NonReg WD ${p1Name}`,
      `NonReg WD ${p2Name}`,
      `TFSA WD ${p1Name}`,
      `TFSA WD ${p2Name}`,
      `TFSA Contrib ${p1Name}`,
      `TFSA Contrib ${p2Name}`,
      `Corp WD ${p1Name}`,
      `Corp WD ${p2Name}`,
      'NonReg Dist',
      `RRSP/RRIF Bal ${p1Name}`,
      `RRSP/RRIF Bal ${p2Name}`,
      `TFSA Bal ${p1Name}`,
      `TFSA Bal ${p2Name}`,
      `NonReg Bal ${p1Name}`,
      `NonReg Bal ${p2Name}`,
      `Corp Bal ${p1Name}`,
      `Corp Bal ${p2Name}`,
      'Total Value',
      `Taxable Inc ${p1Name}`,
      `Taxable Inc ${p2Name}`,
      `Tax ${p1Name}`,
      `Tax ${p2Name}`,
      'Total Tax',
      'Spending Need',
      'Spending Met',
      'Gap',
      'Success',
    ];

    const rows = yearByYear.map((year) =>
      isSinglePerson ? [
        year.year,
        year.age_p1,
        year.cpp_p1,
        year.oas_p1,
        year.gis_p1 || 0,
        year.rrif_withdrawal_p1,
        year.nonreg_withdrawal_p1,
        year.tfsa_withdrawal_p1,
        year.tfsa_contribution_p1 || 0,
        year.corporate_withdrawal_p1,
        year.nonreg_distributions || 0,
        year.rrif_balance_p1,
        year.tfsa_balance_p1,
        year.nonreg_balance_p1,
        year.corporate_balance_p1,
        year.total_value,
        year.taxable_income_p1,
        year.total_tax_p1,
        year.total_tax,
        year.spending_need,
        year.spending_met,
        year.spending_gap,
        year.plan_success ? 'Yes' : 'No',
      ] : [
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
      ]
    );

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
                const totalBenefits = year.cpp_p1 + year.cpp_p2 + year.oas_p1 + year.oas_p2 + (year.gis_p1 || 0) + (year.gis_p2 || 0);
                const totalEmployerPension = (year.employer_pension_p1 || 0) + (year.employer_pension_p2 || 0);
                const totalWithdrawals =
                  year.rrif_withdrawal_p1 + year.rrif_withdrawal_p2 +
                  year.tfsa_withdrawal_p1 + year.tfsa_withdrawal_p2 +
                  year.nonreg_withdrawal_p1 + year.nonreg_withdrawal_p2 +
                  year.corporate_withdrawal_p1 + year.corporate_withdrawal_p2;
                const nonregDistributions = year.nonreg_distributions || 0;
                const tfsaContributions = (year.tfsa_contribution_p1 || 0) + (year.tfsa_contribution_p2 || 0);
                const tfsaSurplusReinvest = ((year as any).tfsa_reinvest_p1 || 0) + ((year as any).tfsa_reinvest_p2 || 0);
                const totalInflows = totalBenefits + totalEmployerPension + totalWithdrawals + nonregDistributions;
                const hasGap = year.spending_gap > 0;
                // Keep regular contributions separate from surplus reinvestment for clarity
                const totalTfsaContributions = tfsaContributions;  // Only show regular contributions in main column

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
                        {isSinglePerson ? String(year.age_p1) : `${year.age_p1}/${year.age_p2}`}
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
                        {formatCurrency(totalTfsaContributions)}
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
                        <TableCell colSpan={11} className="bg-muted/20 p-2 sm:p-6">
                          <div className="max-w-full overflow-hidden">
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 text-[10px] sm:text-sm">
                            {/* COLUMN 1: INCOME SOURCES (per person) */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-semibold text-[10px] sm:text-sm uppercase text-green-700 dark:text-green-400 mb-1 sm:mb-3">
                                💰 Income Sources
                              </h4>
                              <div className="space-y-0.5 sm:space-y-2 text-[10px] sm:text-sm">
                                <div className="font-semibold text-[9px] sm:text-xs" style={{ color: '#6B7280' }}>PERSON 1</div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>{pensionLabel}</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.cpp_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>OAS</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.oas_p1)}
                                  </span>
                                </div>
                                {(year.oas_clawback_p1 ?? 0) > 0 && (
                                  <div className="flex justify-between items-center gap-1 min-w-0">
                                    <span className="truncate" style={{ color: '#DC2626' }}>OAS Clawback</span>
                                    <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#DC2626' }}>
                                      -{formatCurrency(year.oas_clawback_p1 ?? 0)}
                                    </span>
                                  </div>
                                )}
                                {(year.gis_p1 ?? 0) > 0 && (
                                  <div className="flex justify-between items-center gap-1 min-w-0">
                                    <span className="truncate" style={{ color: '#111827' }}>GIS</span>
                                    <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#10B981' }}>
                                      {formatCurrency(year.gis_p1 ?? 0)}
                                    </span>
                                  </div>
                                )}
                                {(year.employer_pension_p1 ?? 0) > 0 && (
                                  <div className="flex justify-between items-center gap-1 min-w-0">
                                    <span className="truncate" style={{ color: '#111827' }}>Employer Pension</span>
                                    <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#059669' }}>
                                      {formatCurrency(year.employer_pension_p1 ?? 0)}
                                    </span>
                                  </div>
                                )}

                                {!isSinglePerson && (
                                  <>
                                    <div className="font-semibold text-xs pt-2 sm:pt-3" style={{ color: '#6B7280' }}>PERSON 2</div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>{pensionLabel}</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.cpp_p2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>OAS</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.oas_p2)}
                                      </span>
                                    </div>
                                    {(year.oas_clawback_p2 ?? 0) > 0 && (
                                      <div className="flex justify-between items-center gap-1 min-w-0">
                                        <span className="truncate" style={{ color: '#DC2626' }}>OAS Clawback</span>
                                        <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#DC2626' }}>
                                          -{formatCurrency(year.oas_clawback_p2 ?? 0)}
                                        </span>
                                      </div>
                                    )}
                                    {(year.gis_p2 ?? 0) > 0 && (
                                      <div className="flex justify-between items-center gap-1 min-w-0">
                                        <span className="truncate" style={{ color: '#111827' }}>GIS</span>
                                        <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#10B981' }}>
                                          {formatCurrency(year.gis_p2 ?? 0)}
                                        </span>
                                      </div>
                                    )}
                                    {(year.employer_pension_p2 ?? 0) > 0 && (
                                      <div className="flex justify-between items-center gap-1 min-w-0">
                                        <span className="truncate" style={{ color: '#111827' }}>Employer Pension</span>
                                        <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#059669' }}>
                                          {formatCurrency(year.employer_pension_p2 ?? 0)}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}

                                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                                  <span className="font-semibold truncate" style={{ color: '#111827' }}>
                                    Total Income Sources
                                  </span>
                                  <span className="font-semibold whitespace-nowrap" style={{ color: '#10B981' }}>
                                    {formatCurrency(totalBenefits + totalEmployerPension)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* COLUMN 2: WITHDRAWALS/CASH FLOW (per person) */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-semibold text-xs sm:text-sm uppercase text-blue-700 dark:text-blue-400 mb-2 sm:mb-3">
                                💵 Withdrawals
                              </h4>
                              <div className="space-y-0.5 sm:space-y-2 text-[10px] sm:text-sm">
                                <div className="font-semibold text-[9px] sm:text-xs" style={{ color: '#6B7280' }}>PERSON 1</div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate flex items-center gap-1" style={{ color: '#111827' }}>
                                          RRSP/RRIF
                                          <Info className="h-3 w-3 text-gray-400" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-sm">
                                          Registered Retirement Savings Plan (RRSP) or Registered Retirement Income Fund (RRIF).
                                          RRSPs automatically convert to RRIFs by age 71, or earlier if you enable early retirement withdrawals.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1" style={{ color: '#111827' }}>
                                    {formatCurrency(year.rrif_withdrawal_p1)}
                                    {year.rrif_frontload_exceeded_p1 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="text-amber-600">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                              </svg>
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p className="text-sm font-semibold">RRIF withdrawal exceeded standard frontload</p>
                                            <p className="text-sm mt-1">
                                              Withdrew {year.rrif_frontload_pct_p1?.toFixed(1)}% of RRIF balance to meet spending needs.
                                              Standard RRIF-Frontload strategy targets {year.age_p1 < 65 ? '15%' : '8%'} {year.age_p1 < 65 ? 'before' : 'after'} OAS.
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>Corporate</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.corporate_withdrawal_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>TFSA</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.tfsa_withdrawal_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>Non-Reg</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.nonreg_withdrawal_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>NonReg Passive</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(isSinglePerson ? nonregDistributions : nonregDistributions / 2)}
                                  </span>
                                </div>

                                {!isSinglePerson && (
                                  <>
                                    <div className="font-semibold text-xs pt-2 sm:pt-3" style={{ color: '#6B7280' }}>PERSON 2</div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>RRSP/RRIF</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1" style={{ color: '#111827' }}>
                                        {formatCurrency(year.rrif_withdrawal_p2)}
                                        {year.rrif_frontload_exceeded_p2 && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="text-amber-600">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                  </svg>
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-xs">
                                                <p className="text-sm font-semibold">RRIF withdrawal exceeded standard frontload</p>
                                                <p className="text-sm mt-1">
                                                  Withdrew {year.rrif_frontload_pct_p2?.toFixed(1)}% of RRIF balance to meet spending needs.
                                                  Standard RRIF-Frontload strategy targets {year.age_p2 < 65 ? '15%' : '8%'} {year.age_p2 < 65 ? 'before' : 'after'} OAS.
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>Corporate</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.corporate_withdrawal_p2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>TFSA</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.tfsa_withdrawal_p2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>Non-Reg</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.nonreg_withdrawal_p2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>NonReg Passive</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(nonregDistributions / 2)}
                                      </span>
                                    </div>
                                  </>
                                )}

                                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                                  <span className="font-semibold truncate" style={{ color: '#111827' }}>
                                    Total Withdrawals
                                  </span>
                                  <span className="font-semibold whitespace-nowrap" style={{ color: '#2563EB' }}>
                                    {formatCurrency(totalWithdrawals + nonregDistributions)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* COLUMN 3: CASH FLOW SUMMARY */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-semibold text-xs sm:text-sm uppercase text-orange-700 dark:text-orange-400 mb-2 sm:mb-3">
                                💸 Cash Flow Summary
                              </h4>
                              <div className="space-y-0.5 sm:space-y-2 text-[10px] sm:text-sm">
                                <div className="flex justify-between items-center gap-2 pt-2 border-t-2 border-green-600">
                                  <span className="font-bold truncate" style={{ color: '#059669' }}>
                                    Gross Cash Inflows
                                  </span>
                                  <span className="font-bold whitespace-nowrap" style={{ color: '#059669' }}>
                                    {formatCurrency(totalBenefits + totalEmployerPension + nonregDistributions + totalWithdrawals)}
                                  </span>
                                </div>

                                <div className="font-semibold text-xs pt-2 sm:pt-3" style={{ color: '#6B7280' }}>OUTFLOWS</div>

                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>Spending Target</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.spending_need)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>
                                    TFSA Contrib {!isSinglePerson && year.tfsa_contribution_p1 > 0 && year.tfsa_contribution_p2 > 0 ? '($7K each)' : ''}
                                  </span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#8B5CF6' }}>
                                    {formatCurrency(tfsaContributions)}
                                  </span>
                                </div>

                                {tfsaSurplusReinvest > 0 && (
                                  <div className="flex justify-between items-center gap-1 min-w-0">
                                    <span className="truncate text-xs" style={{ color: '#6B7280' }}>TFSA Surplus Reinvest</span>
                                    <span className="font-medium whitespace-nowrap flex-shrink-0 text-xs" style={{ color: '#10B981' }}>
                                      {formatCurrency(tfsaSurplusReinvest)}
                                    </span>
                                  </div>
                                )}

                                <div className="flex justify-between items-center gap-1 min-w-0">
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
                                    {formatCurrency(year.spending_need + ((year.tfsa_contribution_p1 || 0) + (year.tfsa_contribution_p2 || 0)) + year.total_tax)}
                                  </span>
                                </div>

                                {(() => {
                                  const grossCashInflows = totalBenefits + totalEmployerPension + nonregDistributions + totalWithdrawals;
                                  // Only include regular TFSA contributions in outflows, NOT reinvestments (which are internal allocations)
                                  const regularTfsaContributions = (year.tfsa_contribution_p1 || 0) + (year.tfsa_contribution_p2 || 0);
                                  const totalOutflows = year.spending_need + regularTfsaContributions + year.total_tax;
                                  const netCashFlow = grossCashInflows - totalOutflows;
                                  const isBalanced = Math.abs(netCashFlow) < 1.0;
                                  const hasSurplus = netCashFlow > 1.0;

                                  return (
                                    <>
                                      <div className={`flex justify-between items-center gap-2 pt-2 border-t-2 ${isBalanced ? 'border-green-600' : 'border-amber-600'}`}>
                                        <span className="font-bold truncate" style={{ color: isBalanced ? '#059669' : '#D97706' }}>
                                          Net Cash Flow
                                        </span>
                                        <span className="font-bold whitespace-nowrap" style={{ color: isBalanced ? '#059669' : '#D97706' }}>
                                          {netCashFlow >= 0 ? '' : '-'}{formatCurrency(Math.abs(netCashFlow))}
                                        </span>
                                      </div>

                                      {/* Show surplus allocation when there's positive cash flow */}
                                      {hasSurplus && (
                                        <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                                          <div className="text-xs font-semibold text-green-700 mb-1">Surplus Allocation:</div>
                                          <div className="text-xs space-y-0.5">
                                            {/* Use actual TFSA reinvestment amount from simulation */}
                                            {((year as any).tfsa_reinvest_p1 || 0) > 0 && (
                                              <div className="flex justify-between">
                                                <span className="text-green-600">→ TFSA</span>
                                                <span className="font-medium text-green-700">
                                                  {formatCurrency((year as any).tfsa_reinvest_p1 || 0)}
                                                </span>
                                              </div>
                                            )}
                                            {/* Use actual Non-Reg reinvestment amount from simulation */}
                                            {((year as any).reinvest_nonreg_p1 || 0) > 0 && (
                                              <div className="flex justify-between">
                                                <span className="text-green-600">→ Non-Reg</span>
                                                <span className="font-medium text-green-700">
                                                  {formatCurrency((year as any).reinvest_nonreg_p1 || 0)}
                                                </span>
                                              </div>
                                            )}
                                            {/* Show unallocated surplus if any */}
                                            {netCashFlow > ((year as any).tfsa_reinvest_p1 || 0) + ((year as any).reinvest_nonreg_p1 || 0) + 100 && (
                                              <div className="flex justify-between">
                                                <span className="text-yellow-600">⚠️ Unallocated</span>
                                                <span className="font-medium text-yellow-700">
                                                  {formatCurrency(netCashFlow - ((year as any).tfsa_reinvest_p1 || 0) - ((year as any).reinvest_nonreg_p1 || 0))}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* COLUMN 4: END-OF-YEAR BALANCES (per person) */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-semibold text-xs sm:text-sm uppercase text-gray-700 dark:text-gray-400 mb-2 sm:mb-3">
                                💼 End Balances
                              </h4>
                              <div className="space-y-0.5 sm:space-y-2 text-[10px] sm:text-sm">
                                <div className="font-semibold text-[9px] sm:text-xs" style={{ color: '#6B7280' }}>PERSON 1</div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate flex items-center gap-1" style={{ color: '#111827' }}>
                                          RRSP/RRIF
                                          <Info className="h-3 w-3 text-gray-400" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-sm">
                                          Registered Retirement Savings Plan (RRSP) or Registered Retirement Income Fund (RRIF).
                                          RRSPs automatically convert to RRIFs by age 71, or earlier if you enable early retirement withdrawals.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.rrif_balance_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>TFSA</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.tfsa_balance_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>Non-Reg</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.nonreg_balance_p1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-1 min-w-0">
                                  <span className="truncate" style={{ color: '#111827' }}>Corporate</span>
                                  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                    {formatCurrency(year.corporate_balance_p1)}
                                  </span>
                                </div>

                                {!isSinglePerson && (
                                  <>
                                    <div className="font-semibold text-xs pt-2 sm:pt-3" style={{ color: '#6B7280' }}>PERSON 2</div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>RRSP/RRIF</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.rrif_balance_p2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>TFSA</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.tfsa_balance_p2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>Non-Reg</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.nonreg_balance_p2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 min-w-0">
                                      <span className="truncate" style={{ color: '#111827' }}>Corporate</span>
                                      <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
                                        {formatCurrency(year.corporate_balance_p2)}
                                      </span>
                                    </div>
                                  </>
                                )}

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
