import { YearResult } from '@/lib/types/simulation';
import { SectionHeader } from '../shared/SectionHeader';

interface YearByYearSectionProps {
  yearByYear: YearResult[];
  personOneName: string;
  personTwoName?: string;
  isSinglePerson: boolean;
}

export function YearByYearSection({
  yearByYear,
  personOneName,
  personTwoName,
  isSinglePerson,
}: YearByYearSectionProps) {
  if (!yearByYear || yearByYear.length === 0) {
    return null;
  }

  // Format currency with no decimals for cleaner display
  const fmt = (val: number) => `$${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Single person columns - comprehensive view
  const singlePersonColumns = [
    { header: 'Year', accessor: 'year', align: 'center' as const },
    { header: 'Age', accessor: 'age_p1', align: 'center' as const },
    { header: 'Spending', accessor: 'spending_need', align: 'right' as const, format: fmt },
    { header: 'CPP', accessor: 'cpp_p1', align: 'right' as const, format: fmt },
    { header: 'OAS', accessor: 'oas_p1', align: 'right' as const, format: fmt },
    { header: 'RRIF WD', accessor: 'rrif_withdrawal_p1', align: 'right' as const, format: fmt },
    { header: 'TFSA WD', accessor: 'tfsa_withdrawal_p1', align: 'right' as const, format: fmt },
    { header: 'NonReg WD', accessor: 'nonreg_withdrawal_p1', align: 'right' as const, format: fmt },
    { header: 'Tax', accessor: 'total_tax', align: 'right' as const, format: fmt },
    {
      header: 'Net Worth',
      accessor: 'total_value',
      align: 'right' as const,
      format: fmt,
      className: 'font-semibold',
    },
    {
      header: 'Status',
      accessor: 'plan_success',
      align: 'center' as const,
      format: (val: boolean) => (val ? '✓' : '✗'),
      className: 'font-semibold',
    },
  ];

  // Couple columns - comprehensive view - Use short names to fit in PDF
  const p1Short = personOneName.split(' ')[0]; // First name only
  const p2Short = personTwoName?.split(' ')[0] || 'P2'; // First name only

  const coupleColumns = [
    { header: 'Yr', accessor: 'year', align: 'center' as const, className: 'bg-gray-100' },
    {
      header: `${p1Short} Age`,
      accessor: 'age_p1',
      align: 'center' as const,
      className: 'bg-gray-100',
    },
    {
      header: `${p2Short} Age`,
      accessor: 'age_p2',
      align: 'center' as const,
      className: 'bg-gray-100',
    },
    {
      header: 'Spending',
      accessor: 'spending_need',
      align: 'right' as const,
      format: fmt,
      className: 'bg-yellow-50',
    },
    {
      header: `CPP-${p1Short}`,
      accessor: 'cpp_p1',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `CPP-${p2Short}`,
      accessor: 'cpp_p2',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `OAS-${p1Short}`,
      accessor: 'oas_p1',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `OAS-${p2Short}`,
      accessor: 'oas_p2',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: 'Tax',
      accessor: 'total_tax',
      align: 'right' as const,
      format: fmt,
      className: 'bg-orange-50',
    },
    {
      header: 'Net Worth',
      accessor: 'total_value',
      align: 'right' as const,
      format: fmt,
      className: 'font-semibold',
    },
    {
      header: 'OK',
      accessor: 'plan_success',
      align: 'center' as const,
      format: (val: boolean) => (val ? '✓' : '✗'),
      className: 'font-semibold',
    },
  ];

  const columns = isSinglePerson ? singlePersonColumns : coupleColumns;

  // Calculate summary statistics
  const totalYears = yearByYear.length;
  const successfulYears = yearByYear.filter((y) => y.plan_success).length;
  const successRate = (successfulYears / totalYears) * 100;
  const totalTaxPaid = yearByYear.reduce((sum, y) => sum + y.total_tax, 0);
  const avgTax = totalTaxPaid / totalYears;
  const totalSpending = yearByYear.reduce((sum, y) => sum + y.spending_need, 0);
  const avgSpending = totalSpending / totalYears;
  const firstYear = yearByYear[0];
  const lastYear = yearByYear[yearByYear.length - 1];
  const netWorthChange = lastYear.total_value - firstYear.total_value;
  const netWorthChangePct = (netWorthChange / firstYear.total_value) * 100;

  // Find years with issues
  const yearsWithGaps = yearByYear.filter((y) => !y.plan_success);
  const firstGapYear = yearsWithGaps.length > 0 ? yearsWithGaps[0] : null;

  return (
    <section className="mb-8 page-break">
      <SectionHeader
        title="Year-by-Year Retirement Plan"
        subtitle={`Complete annual breakdown from age ${firstYear.age_p1} to ${lastYear.age_p1} (${totalYears} years)`}
      />

      {/* Summary Stats */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Plan Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <p
              className={`text-xl font-bold ${successRate === 100 ? 'text-green-600' : successRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}
            >
              {successRate.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">
              {successfulYears}/{totalYears} years funded
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Annual Spending</p>
            <p className="text-xl font-bold text-gray-900">{fmt(avgSpending)}</p>
            <p className="text-xs text-gray-500">Total: {fmt(totalSpending)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Annual Tax</p>
            <p className="text-xl font-bold text-gray-900">{fmt(avgTax)}</p>
            <p className="text-xs text-gray-500">Total: {fmt(totalTaxPaid)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Net Worth Change</p>
            <p
              className={`text-xl font-bold ${netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {netWorthChange >= 0 ? '+' : ''}
              {netWorthChangePct.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {fmt(firstYear.total_value)} → {fmt(lastYear.total_value)}
            </p>
          </div>
        </div>

        {firstGapYear && (
          <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-gray-700">
              <strong className="text-red-600">Warning:</strong> First funding gap occurs at age{' '}
              <strong>{firstGapYear.age_p1}</strong> (year {firstGapYear.year}) with a shortfall of{' '}
              <strong>{fmt(firstGapYear.spending_gap)}</strong>. Consider adjusting spending targets or
              retirement age.
            </p>
          </div>
        )}
      </div>

      {/* Year-by-Year Table - Use smaller font to fit all columns */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border-2 border-gray-600" style={{ fontSize: '7px' }}>
          <thead className="bg-gray-700">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-0.5 py-0.5 text-${column.align || 'left'} font-bold text-white border border-gray-600 whitespace-nowrap bg-gray-700`}
                  style={{ fontSize: '7px', padding: '1px 2px' }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yearByYear.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                {columns.map((column, colIndex) => {
                  const value = row[column.accessor as keyof typeof row];
                  let formattedValue: React.ReactNode;

                  if (column.format) {
                    // @ts-ignore - column.format types are intentionally varied by column
                    formattedValue = column.format(value);
                  } else {
                    formattedValue = value;
                  }

                  return (
                    <td
                      key={colIndex}
                      className={`px-0.5 py-0 text-center border border-gray-400 text-gray-900 ${column.className || ''} whitespace-nowrap align-middle`}
                      style={{ fontSize: '7px', padding: '1px 2px', verticalAlign: 'middle' }}
                    >
                      {formattedValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-300">
        <p className="text-sm font-semibold text-gray-900 mb-2">Table Legend:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
          <div>
            <strong>Spending:</strong> Annual household spending target (inflation-adjusted)
          </div>
          <div>
            <strong>CPP/OAS:</strong> Canada Pension Plan and Old Age Security benefits
          </div>
          <div>
            <strong>RRIF WD:</strong> RRIF/RRSP withdrawals (includes mandatory minimums)
          </div>
          <div>
            <strong>TFSA WD:</strong> Tax-Free Savings Account withdrawals
          </div>
          <div>
            <strong>NonReg WD:</strong> Non-registered account withdrawals
          </div>
          <div>
            <strong>Tax:</strong> Total federal and provincial income tax
          </div>
          <div>
            <strong>Net Worth:</strong> Total value of all accounts at year-end
          </div>
          <div>
            <strong>Status:</strong> ✓ = Spending fully funded, ✗ = Funding gap
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Key Insights</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Your plan covers <strong>{totalYears} years</strong> from age {firstYear.age_p1} to{' '}
              {lastYear.age_p1}, with a <strong>{successRate.toFixed(0)}% success rate</strong>.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Average annual spending of <strong>{fmt(avgSpending)}</strong> is funded through a combination
              of government benefits, investment income, and account withdrawals.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              You will pay approximately <strong>{fmt(totalTaxPaid)}</strong> in total taxes over{' '}
              {totalYears} years (average <strong>{fmt(avgTax)}/year</strong>).
            </span>
          </li>
          {netWorthChange >= 0 ? (
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                Your net worth <strong className="text-green-600">grows</strong> from{' '}
                <strong>{fmt(firstYear.total_value)}</strong> to <strong>{fmt(lastYear.total_value)}</strong>{' '}
                (+{netWorthChangePct.toFixed(1)}%), indicating a sustainable plan with potential for estate
                preservation.
              </span>
            </li>
          ) : (
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                Your net worth <strong className="text-red-600">declines</strong> from{' '}
                <strong>{fmt(firstYear.total_value)}</strong> to <strong>{fmt(lastYear.total_value)}</strong>{' '}
                ({netWorthChangePct.toFixed(1)}%). This is expected as you draw down assets to fund retirement.
              </span>
            </li>
          )}
          {firstGapYear && (
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠</span>
              <span>
                <strong className="text-red-600">Action Required:</strong> The first funding gap occurs at age{' '}
                {firstGapYear.age_p1}. Consider reducing spending targets, delaying retirement, or increasing
                initial savings.
              </span>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
