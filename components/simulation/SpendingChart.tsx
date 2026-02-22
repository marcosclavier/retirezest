'use client';

import { YearResult } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SpendingChartProps {
  yearByYear: YearResult[];
  isSinglePerson?: boolean;
  personOneName?: string;
  personTwoName?: string;
}

export function SpendingChart({
  yearByYear,
  isSinglePerson = false,
  personOneName = 'Person 1',
  personTwoName = 'Person 2'
}: SpendingChartProps) {
  // Prepare data for chart
  // FIX: Backend is incorrectly reporting spending_gap as 0 even when plan_success is false
  // We need to calculate the actual gap from available cash flows
  const chartData = yearByYear.map((year) => {
    // Calculate total available cash (all inflows minus taxes)
    const totalBenefits = year.cpp_p1 + year.cpp_p2 + year.oas_p1 + year.oas_p2 +
                          (year.gis_p1 || 0) + (year.gis_p2 || 0);
    const totalEmployerPension = (year.employer_pension_p1 || 0) + (year.employer_pension_p2 || 0);
    const totalWithdrawals = year.rrif_withdrawal_p1 + year.rrif_withdrawal_p2 +
                            year.tfsa_withdrawal_p1 + year.tfsa_withdrawal_p2 +
                            year.nonreg_withdrawal_p1 + year.nonreg_withdrawal_p2 +
                            year.corporate_withdrawal_p1 + year.corporate_withdrawal_p2;
    const nonregDistributions = year.nonreg_distributions || 0;
    const totalInflows = totalBenefits + totalEmployerPension + totalWithdrawals + nonregDistributions;
    const totalAvailableAfterTax = totalInflows - year.total_tax;

    // Calculate the actual gap based on available funds vs needs
    let actualSpendingMet = Math.min(totalAvailableAfterTax, year.spending_need);
    let calculatedGap = Math.max(0, year.spending_need - totalAvailableAfterTax);

    // Use plan_success to verify if there's really a gap
    if (!year.plan_success && calculatedGap < 100) {
      // If plan failed but we calculated no gap, there's something wrong
      // Use a minimum gap to show the failure visually
      calculatedGap = Math.max(year.spending_gap, year.spending_need * 0.1); // At least 10% gap
      actualSpendingMet = year.spending_need - calculatedGap;
    }

    // Debug: Log all data for problem years
    if (year.year >= 2047 && year.year <= 2051) {
      console.log(`Year ${year.year}:`, {
        spending_need: year.spending_need,
        totalInflows: totalInflows,
        total_tax: year.total_tax,
        totalAvailableAfterTax: totalAvailableAfterTax,
        calculatedGap: calculatedGap,
        actualSpendingMet: actualSpendingMet,
        plan_success: year.plan_success
      });
    }

    return {
      year: year.year,
      age_p1: year.age_p1,
      age_p2: year.age_p2,
      'Spending Need': year.spending_need,
      'Spending Met': actualSpendingMet,
      'Gap': calculatedGap,
    };
  });

  // Custom tooltip formatter
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const p1Name = personOneName.split(' ')[0] || 'P1';
  const p2Name = personTwoName?.split(' ')[0] || 'P2';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find((p) => p.year === label);
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">
            Year {label} {isSinglePerson
              ? `(Age ${dataPoint?.age_p1})`
              : `(Ages ${dataPoint?.age_p1} / ${dataPoint?.age_p2})`
            }
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: '#111827' }}>Spending Analysis</CardTitle>
        <CardDescription style={{ color: '#111827' }}>Spending needs vs actual spending met</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year"
              label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fill: '#374151' } }}
              tick={{ fill: '#374151' }}
              className="text-xs"
            />
            <YAxis
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', style: { fill: '#374151' } }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fill: '#374151' }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Show spending need as a reference line */}
            <Area
              type="monotone"
              dataKey="Spending Need"
              stroke="#6b7280"
              fill="none"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            {/* Stack spending met and gap to show total spending picture */}
            <Area
              type="monotone"
              dataKey="Spending Met"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="Gap"
              stackId="1"
              stroke="#dc2626"
              fill="#ef4444"
              fillOpacity={0.9}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
