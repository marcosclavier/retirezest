'use client';

import { useState } from 'react';
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
import { ChevronDown, ChevronUp, Download } from 'lucide-react';

interface YearByYearTableProps {
  yearByYear: YearResult[];
  initialRowsToShow?: number;
}

export function YearByYearTable({ yearByYear, initialRowsToShow = 10 }: YearByYearTableProps) {
  const [showAll, setShowAll] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof YearResult>('year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    const headers = [
      'Year',
      'Age P1',
      'Age P2',
      'CPP P1',
      'CPP P2',
      'OAS P1',
      'OAS P2',
      'RRIF WD P1',
      'RRIF WD P2',
      'NonReg WD P1',
      'NonReg WD P2',
      'TFSA WD P1',
      'TFSA WD P2',
      'Corp WD P1',
      'Corp WD P2',
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
      year.rrif_withdrawal_p1,
      year.rrif_withdrawal_p2,
      year.nonreg_withdrawal_p1,
      year.nonreg_withdrawal_p2,
      year.tfsa_withdrawal_p1,
      year.tfsa_withdrawal_p2,
      year.corporate_withdrawal_p1,
      year.corporate_withdrawal_p2,
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
            <CardTitle style={{ color: '#111827' }}>Year-by-Year Results</CardTitle>
            <CardDescription style={{ color: '#111827' }}>
              Detailed simulation results ({yearByYear.length} years)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('year')}
                  style={{ color: '#111827' }}
                >
                  Year
                  <SortIcon column="year" />
                </TableHead>
                <TableHead style={{ color: '#111827' }}>Ages</TableHead>
                <TableHead className="text-right" style={{ color: '#111827' }}>CPP+OAS</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('spending_need')}
                  style={{ color: '#111827' }}
                >
                  Target
                  <SortIcon column="spending_need" />
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('spending_met')}
                  style={{ color: '#111827' }}
                >
                  Spent
                  <SortIcon column="spending_met" />
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('total_tax')}
                  style={{ color: '#111827' }}
                >
                  Tax
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
                const totalBenefits =
                  year.cpp_p1 + year.cpp_p2 + year.oas_p1 + year.oas_p2;
                const hasGap = year.spending_gap > 0;

                return (
                  <TableRow
                    key={year.year}
                    className={hasGap ? 'bg-red-50 dark:bg-red-950/30' : ''}
                  >
                    <TableCell className="font-medium" style={{ color: '#111827' }}>{year.year}</TableCell>
                    <TableCell style={{ color: '#111827' }}>
                      {year.age_p1}/{year.age_p2}
                    </TableCell>
                    <TableCell className="text-right" style={{ color: '#2563EB' }}>
                      {formatCurrency(totalBenefits)}
                    </TableCell>
                    <TableCell className="text-right" style={{ color: '#111827' }}>{formatCurrency(year.spending_need)}</TableCell>
                    <TableCell className="text-right" style={{ color: '#111827' }}>{formatCurrency(year.spending_met)}</TableCell>
                    <TableCell className="text-right" style={{ color: '#EA580C' }}>
                      {formatCurrency(year.total_tax)}
                    </TableCell>
                    <TableCell className="text-right font-medium" style={{ color: '#111827' }}>
                      {formatCurrency(year.total_value)}
                    </TableCell>
                    <TableCell className="text-center">
                      {year.plan_success ? (
                        <Badge variant="default" className="bg-green-600">OK</Badge>
                      ) : (
                        <Badge variant="destructive">Gap</Badge>
                      )}
                    </TableCell>
                  </TableRow>
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
