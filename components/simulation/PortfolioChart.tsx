'use client';

import { memo } from 'react';
import { YearResult } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PortfolioChartProps {
  yearByYear: YearResult[];
  isSinglePerson?: boolean;
  personOneName?: string;
  personTwoName?: string;
}

export const PortfolioChart = memo(function PortfolioChart({
  yearByYear,
  isSinglePerson = false,
  personOneName = 'Person 1',
  personTwoName = 'Person 2'
}: PortfolioChartProps) {
  // Prepare data for chart
  const suffix = isSinglePerson ? '' : ' (P1+P2)';
  const chartData = yearByYear.map((year) => ({
    year: year.year,
    [`TFSA${suffix}`]: year.tfsa_balance_p1 + year.tfsa_balance_p2,
    [`RRIF${suffix}`]: year.rrif_balance_p1 + year.rrif_balance_p2,
    [`Non-Reg${suffix}`]: year.nonreg_balance_p1 + year.nonreg_balance_p2,
    [`Corporate${suffix}`]: year.corporate_balance_p1 + year.corporate_balance_p2,
    'Total': year.total_value,
  }));

  // Custom tooltip formatter
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">Year {label}</p>
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
        <CardTitle style={{ color: '#111827' }}>Portfolio Balance Over Time</CardTitle>
        <CardDescription style={{ color: '#111827' }}>Account balances by type throughout retirement</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
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
              label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft', style: { fill: '#374151' } }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fill: '#374151' }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={`TFSA${suffix}`}
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={`RRIF${suffix}`}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={`Non-Reg${suffix}`}
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={`Corporate${suffix}`}
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Total"
              stroke="#ef4444"
              strokeWidth={3}
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
