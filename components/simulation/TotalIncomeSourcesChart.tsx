'use client';

import { ChartDataPoint } from '@/lib/types/simulation';
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

interface TotalIncomeSourcesChartProps {
  chartData: ChartDataPoint[];
  isSinglePerson?: boolean;
  personOneName?: string;
  personTwoName?: string;
}

export function TotalIncomeSourcesChart({
  chartData,
  isSinglePerson = false,
  personOneName = 'Person 1',
  personTwoName = 'Person 2'
}: TotalIncomeSourcesChartProps) {
  // Prepare data for chart - combine pension income and withdrawals
  const data = chartData.map((point) => ({
    year: point.year,
    age: point.age_p1,
    // Government benefits (pension income)
    CPP: point.cpp_total || 0,
    OAS: point.oas_total || 0,
    GIS: point.gis_total || 0,
    // Account withdrawals
    RRIF: point.rrif_withdrawal || 0,
    'Non-Registered': point.nonreg_withdrawal || 0,
    TFSA: point.tfsa_withdrawal || 0,
    Corporate: point.corporate_withdrawal || 0,
    // Total for tooltip
    totalIncome: (point.cpp_total || 0) + (point.oas_total || 0) + (point.gis_total || 0) +
                 (point.rrif_withdrawal || 0) + (point.nonreg_withdrawal || 0) +
                 (point.tfsa_withdrawal || 0) + (point.corporate_withdrawal || 0)
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
      const dataPoint = chartData.find((p) => p.year === label);
      const currentData = data.find((d) => d.year === label);

      // Separate pension and withdrawal items
      const pensionItems = payload.filter((item: any) =>
        ['CPP', 'OAS', 'GIS'].includes(item.name)
      );
      const withdrawalItems = payload.filter((item: any) =>
        !['CPP', 'OAS', 'GIS'].includes(item.name)
      );

      const totalPension = pensionItems.reduce((sum: number, entry: any) => sum + entry.value, 0);
      const totalWithdrawals = withdrawalItems.reduce((sum: number, entry: any) => sum + entry.value, 0);

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">
            Year {label} {isSinglePerson
              ? `(Age ${dataPoint?.age_p1})`
              : `(Ages ${dataPoint?.age_p1} / ${dataPoint?.age_p2})`
            }
          </p>

          {/* Pension Income Section */}
          {totalPension > 0 && (
            <>
              <p className="text-sm font-medium mt-2 text-green-600">Government Benefits</p>
              {pensionItems.map((entry: any, index: number) => (
                entry.value > 0 && (
                  <p key={index} style={{ color: entry.color }} className="text-sm pl-2">
                    {entry.name}: {formatCurrency(entry.value)}
                  </p>
                )
              ))}
              <p className="text-sm font-medium pl-2 text-green-600">
                Subtotal: {formatCurrency(totalPension)}
              </p>
            </>
          )}

          {/* Withdrawals Section */}
          {totalWithdrawals > 0 && (
            <>
              <p className="text-sm font-medium mt-2 text-blue-600">Account Withdrawals</p>
              {withdrawalItems.map((entry: any, index: number) => (
                entry.value > 0 && (
                  <p key={index} style={{ color: entry.color }} className="text-sm pl-2">
                    {entry.name}: {formatCurrency(entry.value)}
                  </p>
                )
              ))}
              <p className="text-sm font-medium pl-2 text-blue-600">
                Subtotal: {formatCurrency(totalWithdrawals)}
              </p>
            </>
          )}

          <p className="text-sm font-bold mt-2 pt-2 border-t">
            Total Income: {formatCurrency(currentData?.totalIncome || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: '#111827' }}>Total Income Sources</CardTitle>
        <CardDescription style={{ color: '#111827' }}>
          Government benefits and account withdrawals throughout retirement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
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
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                // Add section headers in legend
                if (value === 'CPP') return '🍁 CPP';
                if (value === 'OAS') return '🍁 OAS';
                if (value === 'GIS') return '🍁 GIS';
                return value;
              }}
            />

            {/* Government Benefits - Bottom of stack (green shades) */}
            <Area
              type="monotone"
              dataKey="CPP"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.9}
            />
            <Area
              type="monotone"
              dataKey="OAS"
              stackId="1"
              stroke="#34d399"
              fill="#34d399"
              fillOpacity={0.9}
            />
            <Area
              type="monotone"
              dataKey="GIS"
              stackId="1"
              stroke="#86efac"
              fill="#86efac"
              fillOpacity={0.9}
            />

            {/* Account Withdrawals - Top of stack (blue/purple shades) */}
            <Area
              type="monotone"
              dataKey="RRIF"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="Non-Registered"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="TFSA"
              stackId="1"
              stroke="#a78bfa"
              fill="#a78bfa"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="Corporate"
              stackId="1"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.8}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Income Summary Legend */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-green-600 mb-1">🍁 Government Benefits</p>
            <p className="text-xs text-gray-600">CPP, OAS, and GIS pension income</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">💰 Account Withdrawals</p>
            <p className="text-xs text-gray-600">RRIF, TFSA, Non-Reg, and Corporate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}