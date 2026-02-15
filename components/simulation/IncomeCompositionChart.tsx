'use client';

import { ChartDataPoint } from '@/lib/types/simulation';
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

interface IncomeCompositionChartProps {
  chartData: ChartDataPoint[];
  isSinglePerson?: boolean;
  personOneName?: string;
  personTwoName?: string;
}

export function IncomeCompositionChart({
  chartData,
  isSinglePerson = false,
  personOneName = 'Person 1',
  personTwoName = 'Person 2'
}: IncomeCompositionChartProps) {
  // Prepare data for chart
  const data = chartData.map((point) => ({
    year: point.year,
    age: point.age_p1,
    'Taxable Income': point.taxable_income || 0,
    'Tax-Free Income': point.tax_free_income || 0,
  }));

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
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
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
          <p className="text-sm font-medium mt-1 pt-1 border-t">
            Total: {formatCurrency(total)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: '#111827' }}>Income Composition</CardTitle>
        <CardDescription style={{ color: '#111827' }}>Taxable vs tax-free income by year</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
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
              label={{ value: 'Income ($)', angle: -90, position: 'insideLeft', style: { fill: '#374151' } }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fill: '#374151' }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Taxable Income" stackId="a" fill="#ef4444" />
            <Bar dataKey="Tax-Free Income" stackId="a" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
