import { FiveYearPlanYear } from '@/lib/types/simulation';
import { SectionHeader } from '../shared/SectionHeader';

interface FiveYearPlanSectionProps {
  fiveYearPlan: FiveYearPlanYear[];
  personOneName: string;
  personTwoName?: string;
  isSinglePerson: boolean;
}

export function FiveYearPlanSection({
  fiveYearPlan,
  personOneName,
  personTwoName,
  isSinglePerson,
}: FiveYearPlanSectionProps) {
  if (!fiveYearPlan || fiveYearPlan.length === 0) {
    return null;
  }

  // Format currency with no decimals for cleaner display
  const fmt = (val: number) => `$${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Single person columns
  const singlePersonColumns = [
    { header: 'Year', accessor: 'year', align: 'center' as const },
    { header: 'Age', accessor: 'age_p1', align: 'center' as const },
    { header: 'Spending Target', accessor: 'spending_target', align: 'right' as const, format: fmt },
    { header: 'CPP', accessor: 'cpp_p1', align: 'right' as const, format: fmt },
    { header: 'OAS', accessor: 'oas_p1', align: 'right' as const, format: fmt },
    { header: 'RRIF', accessor: 'rrif_withdrawal_p1', align: 'right' as const, format: fmt },
    { header: 'NonReg', accessor: 'nonreg_withdrawal_p1', align: 'right' as const, format: fmt },
    { header: 'TFSA', accessor: 'tfsa_withdrawal_p1', align: 'right' as const, format: fmt },
    { header: 'Corporate', accessor: 'corp_withdrawal_p1', align: 'right' as const, format: fmt },
    {
      header: 'NonReg Dist.',
      accessor: 'nonreg_distributions_p1',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: 'Total Income',
      accessor: 'total_withdrawn_p1',
      align: 'right' as const,
      format: fmt,
      className: 'font-semibold bg-blue-50',
    },
    {
      header: 'Net Worth',
      accessor: 'net_worth_end',
      align: 'right' as const,
      format: fmt,
      className: 'font-semibold',
    },
  ];

  // Couple columns (more comprehensive) - Use short names to fit in PDF
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
      accessor: 'spending_target',
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
      header: `RRIF-${p1Short}`,
      accessor: 'rrif_withdrawal_p1',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `RRIF-${p2Short}`,
      accessor: 'rrif_withdrawal_p2',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `NReg-${p1Short}`,
      accessor: 'nonreg_withdrawal_p1',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `NReg-${p2Short}`,
      accessor: 'nonreg_withdrawal_p2',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `TFSA-${p1Short}`,
      accessor: 'tfsa_withdrawal_p1',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `TFSA-${p2Short}`,
      accessor: 'tfsa_withdrawal_p2',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `Corp-${p1Short}`,
      accessor: 'corp_withdrawal_p1',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: `Corp-${p2Short}`,
      accessor: 'corp_withdrawal_p2',
      align: 'right' as const,
      format: fmt,
    },
    {
      header: 'Total',
      accessor: 'total_withdrawn',
      align: 'right' as const,
      format: fmt,
      className: 'font-semibold bg-blue-50',
    },
    {
      header: 'Net Worth',
      accessor: 'net_worth_end',
      align: 'right' as const,
      format: fmt,
      className: 'font-semibold',
    },
  ];

  const columns = isSinglePerson ? singlePersonColumns : coupleColumns;

  return (
    <section className="mb-8 page-break">
      <SectionHeader
        title="5-Year Detailed Withdrawal Plan"
        subtitle="Projected income sources, withdrawals, and net worth for the first 5 years of retirement"
      />

      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200" style={{ pageBreakInside: 'avoid' }}>
        <p className="text-sm text-gray-700">
          This table shows a detailed breakdown of your retirement income and withdrawals for the first 5
          years. It includes government benefits (CPP, OAS), account withdrawals (RRIF, TFSA, NonReg,
          Corporate), and your projected net worth at the end of each year. The "Household Total" column shows
          the total amount withdrawn from all sources to fund your spending.
        </p>
      </div>

      {/* Five Year Table - Use smaller font to fit all columns */}
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
            {fiveYearPlan.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                {columns.map((column, colIndex) => {
                  const value = row[column.accessor as keyof typeof row];
                  const formattedValue = column.format ? column.format(value) : value;

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

      {/* Explanation of Non-Registered Distributions */}
      <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-300">
        <p className="text-sm font-semibold text-gray-900 mb-2">Understanding Non-Registered Distributions:</p>
        <p className="text-sm text-gray-700">
          <strong>NonReg</strong> withdrawals are intentional withdrawals you make from non-registered
          accounts to meet spending needs. <strong>NonReg Dist.</strong> (distributions) represents passive
          income generated by your non-registered investments (interest, dividends, capital gains) that is
          taxed annually whether you withdraw it or not. Depending on your settings, these distributions may
          be reinvested into your TFSA or non-registered account.
        </p>
      </div>

      {/* Key Observations */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Key Observations (First 5 Years)</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          {get5YearObservations(fiveYearPlan, personOneName, personTwoName, isSinglePerson).map(
            (observation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>{observation}</span>
              </li>
            )
          )}
        </ul>
      </div>
    </section>
  );
}

// Helper to generate observations from 5-year plan
function get5YearObservations(
  plan: FiveYearPlanYear[],
  p1Name: string,
  p2Name: string | undefined,
  isSingle: boolean
): string[] {
  const observations: string[] = [];

  if (plan.length === 0) return observations;

  const firstYear = plan[0];
  const lastYear = plan[plan.length - 1];

  // Spending analysis
  const avgSpending = plan.reduce((sum, y) => sum + y.spending_target, 0) / plan.length;
  observations.push(
    `Average annual household spending over these 5 years: $${(avgSpending || 0).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`
  );

  // Government benefits
  const totalCPP = plan.reduce((sum, y) => sum + y.cpp_p1 + y.cpp_p2, 0);
  const totalOAS = plan.reduce((sum, y) => sum + y.oas_p1 + y.oas_p2, 0);
  if (totalCPP + totalOAS > 0) {
    observations.push(
      `Government benefits (CPP + OAS) provide $${(((totalCPP + totalOAS) / plan.length) || 0).toLocaleString(
        undefined,
        { maximumFractionDigits: 0 }
      )}/year on average`
    );
  }

  // RRIF withdrawals
  const totalRRIF = plan.reduce((sum, y) => sum + y.rrif_withdrawal_p1 + y.rrif_withdrawal_p2, 0);
  if (totalRRIF > 0) {
    observations.push(
      `RRIF withdrawals average $${((totalRRIF / plan.length) || 0).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}/year (fully taxable)`
    );
  }

  // TFSA withdrawals
  const totalTFSA = plan.reduce((sum, y) => sum + y.tfsa_withdrawal_p1 + y.tfsa_withdrawal_p2, 0);
  if (totalTFSA > 0) {
    observations.push(
      `TFSA withdrawals average $${((totalTFSA / plan.length) || 0).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}/year (tax-free)`
    );
  }

  // Non-Registered withdrawals
  const totalNonReg = plan.reduce((sum, y) => sum + y.nonreg_withdrawal_p1 + y.nonreg_withdrawal_p2, 0);
  if (totalNonReg > 0) {
    observations.push(
      `Non-registered withdrawals average $${((totalNonReg / plan.length) || 0).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}/year (partially taxable)`
    );
  }

  // Corporate withdrawals
  const totalCorp = plan.reduce((sum, y) => sum + y.corp_withdrawal_p1 + y.corp_withdrawal_p2, 0);
  if (totalCorp > 0) {
    observations.push(
      `Corporate withdrawals average $${((totalCorp / plan.length) || 0).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}/year`
    );
  }

  // Net worth trend
  const netWorthChange = lastYear.net_worth_end - firstYear.net_worth_end;
  const netWorthChangePct = (netWorthChange / firstYear.net_worth_end) * 100;
  if (netWorthChange > 0) {
    observations.push(
      `Net worth grows from $${(firstYear.net_worth_end || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} to $${(lastYear.net_worth_end || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} (+${(netWorthChangePct || 0).toFixed(1)}%)`
    );
  } else if (netWorthChange < 0) {
    observations.push(
      `Net worth declines from $${(firstYear.net_worth_end || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} to $${(lastYear.net_worth_end || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} (${(netWorthChangePct || 0).toFixed(1)}%)`
    );
  } else {
    observations.push(`Net worth remains stable at approximately $${(firstYear.net_worth_end || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  }

  return observations;
}
