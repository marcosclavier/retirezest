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
}

export function SpendingChart({ yearByYear }: SpendingChartProps) {
  // Prepare data for chart
  const chartData = yearByYear.map((year) => ({
    year: year.year,
    'Spending Need': year.spending_need,
    'Spending Met': year.spending_met,
    'Gap': year.spending_gap,
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
        <CardTitle>Spending Analysis</CardTitle>
        <CardDescription>Spending needs vs actual spending met</CardDescription>
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
              label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              className="text-xs"
            />
            <YAxis
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="Spending Need"
              stroke="#6b7280"
              fill="#9ca3af"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="Spending Met"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="Gap"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
