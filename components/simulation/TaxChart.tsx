'use client';

import { YearResult } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TaxChartProps {
  yearByYear: YearResult[];
  isSinglePerson?: boolean;
  personOneName?: string;
  personTwoName?: string;
}

export function TaxChart({
  yearByYear,
  isSinglePerson = false,
  personOneName = 'Person 1',
  personTwoName = 'Person 2'
}: TaxChartProps) {
  // Prepare data for chart
  const p1Name = personOneName.split(' ')[0] || 'P1';
  const p2Name = personTwoName?.split(' ')[0] || 'P2';

  const chartData = yearByYear.map((year) =>
    isSinglePerson ? {
      year: year.year,
      [p1Name]: year.total_tax_p1,
      'Total Tax': year.total_tax,
    } : {
      year: year.year,
      [p1Name]: year.total_tax_p1,
      [p2Name]: year.total_tax_p2,
      'Total Tax': year.total_tax,
    }
  );

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
        <CardTitle style={{ color: '#111827' }}>Tax Paid Over Time</CardTitle>
        <CardDescription style={{ color: '#111827' }}>Annual tax liability for each person</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
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
              label={{ value: 'Tax ($)', angle: -90, position: 'insideLeft', style: { fill: '#374151' } }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fill: '#374151' }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey={p1Name} fill="#3b82f6" />
            {!isSinglePerson && <Bar dataKey={p2Name} fill="#10b981" />}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
