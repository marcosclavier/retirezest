import { YearResult } from '@/lib/types/simulation';
import { SectionHeader } from '../shared/SectionHeader';
import { withNonBreakingSpaces } from '../shared/utils';

interface ComprehensiveYearByYearSectionProps {
  yearByYear: YearResult[];
  personOneName: string;
  personTwoName?: string;
  isSinglePerson: boolean;
}

export function ComprehensiveYearByYearSection({
  yearByYear,
  personOneName,
  personTwoName,
  isSinglePerson,
}: ComprehensiveYearByYearSectionProps) {
  if (!yearByYear || yearByYear.length === 0) {
    return null;
  }

  // Format currency with no decimals for cleaner display
  const fmt = (val: number) => `$${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const fmtPct = (val: number) => `${(val * 100 || 0).toFixed(1)}%`;

  // Use short names to fit in PDF
  const p1Short = personOneName.split(' ')[0]; // First name only
  const p2Short = personTwoName?.split(' ')[0] || 'P2'; // First name only

  // Comprehensive columns - ALL data for couples - REORGANIZED BY ACCOUNT TYPE
  const comprehensiveColumns = [
    // Year and Ages
    { header: 'Yr', accessor: 'year', align: 'center' as const, className: 'bg-gray-200' },
    { header: `${p1Short}`, accessor: 'age_p1', align: 'center' as const, className: 'bg-gray-200' },
    { header: `${p2Short}`, accessor: 'age_p2', align: 'center' as const, className: 'bg-gray-200' },

    // Spending
    { header: 'Spend', accessor: 'spending_need', align: 'right' as const, format: fmt, className: 'bg-yellow-50' },

    // CPP - Both persons
    { header: `CPP1`, accessor: 'cpp_p1', align: 'right' as const, format: fmt, className: 'bg-green-50' },
    { header: `CPP2`, accessor: 'cpp_p2', align: 'right' as const, format: fmt, className: 'bg-green-50' },

    // OAS - Both persons
    { header: `OAS1`, accessor: 'oas_p1', align: 'right' as const, format: fmt, className: 'bg-green-50' },
    { header: `OAS2`, accessor: 'oas_p2', align: 'right' as const, format: fmt, className: 'bg-green-50' },

    // GIS - Both persons
    {
      header: `GIS1`,
      accessor: 'gis_p1',
      align: 'right' as const,
      format: (val: number | undefined) => fmt(val || 0),
      className: 'bg-green-50',
    },
    {
      header: `GIS2`,
      accessor: 'gis_p2',
      align: 'right' as const,
      format: (val: number | undefined) => fmt(val || 0),
      className: 'bg-green-50',
    },

    // OAS Clawback - Both persons
    {
      header: `OASClaw1`,
      accessor: 'oas_clawback_p1',
      align: 'right' as const,
      format: (val: number | undefined) => (val || 0) > 0 ? `-${fmt(val || 0)}` : '$0',
      className: 'bg-red-50',
    },
    {
      header: `OASClaw2`,
      accessor: 'oas_clawback_p2',
      align: 'right' as const,
      format: (val: number | undefined) => (val || 0) > 0 ? `-${fmt(val || 0)}` : '$0',
      className: 'bg-red-50',
    },

    // NonReg Distributions
    {
      header: `NRDist`,
      accessor: 'nonreg_distributions',
      align: 'right' as const,
      format: (val: number | undefined) => fmt(val || 0),
      className: 'bg-green-50',
    },

    // RRIF Withdrawals - Both persons
    { header: `RRIF1`, accessor: 'rrif_withdrawal_p1', align: 'right' as const, format: fmt, className: 'bg-blue-50' },
    { header: `RRIF2`, accessor: 'rrif_withdrawal_p2', align: 'right' as const, format: fmt, className: 'bg-blue-50' },

    // TFSA Withdrawals - Both persons
    { header: `TFSA1`, accessor: 'tfsa_withdrawal_p1', align: 'right' as const, format: fmt, className: 'bg-blue-50' },
    { header: `TFSA2`, accessor: 'tfsa_withdrawal_p2', align: 'right' as const, format: fmt, className: 'bg-blue-50' },

    // NonReg Withdrawals - Both persons
    { header: `NReg1`, accessor: 'nonreg_withdrawal_p1', align: 'right' as const, format: fmt, className: 'bg-blue-50' },
    { header: `NReg2`, accessor: 'nonreg_withdrawal_p2', align: 'right' as const, format: fmt, className: 'bg-blue-50' },

    // Corporate Withdrawals - Both persons
    { header: `Corp1`, accessor: 'corporate_withdrawal_p1', align: 'right' as const, format: fmt, className: 'bg-blue-50' },
    { header: `Corp2`, accessor: 'corporate_withdrawal_p2', align: 'right' as const, format: fmt, className: 'bg-blue-50' },

    // TFSA Contributions - Both persons
    {
      header: `TFSACont1`,
      accessor: 'tfsa_contribution_p1',
      align: 'right' as const,
      format: (val: number | undefined) => fmt(val || 0),
      className: 'bg-purple-50',
    },
    {
      header: `TFSACont2`,
      accessor: 'tfsa_contribution_p2',
      align: 'right' as const,
      format: (val: number | undefined) => fmt(val || 0),
      className: 'bg-purple-50',
    },

    // Taxable Income - Both persons
    { header: `TaxInc1`, accessor: 'taxable_income_p1', align: 'right' as const, format: fmt, className: 'bg-orange-50' },
    { header: `TaxInc2`, accessor: 'taxable_income_p2', align: 'right' as const, format: fmt, className: 'bg-orange-50' },

    // Tax Paid - Both persons
    { header: `Tax1`, accessor: 'total_tax_p1', align: 'right' as const, format: fmt, className: 'bg-orange-50' },
    { header: `Tax2`, accessor: 'total_tax_p2', align: 'right' as const, format: fmt, className: 'bg-orange-50' },

    // Marginal Rate - Both persons
    { header: `MRate1`, accessor: 'marginal_rate_p1', align: 'right' as const, format: fmtPct, className: 'bg-orange-50' },
    { header: `MRate2`, accessor: 'marginal_rate_p2', align: 'right' as const, format: fmtPct, className: 'bg-orange-50' },

    // Total Tax
    { header: `TotTax`, accessor: 'total_tax', align: 'right' as const, format: fmt, className: 'bg-orange-100 font-semibold' },

    // RRIF Balances - Both persons
    { header: `RRIFBal1`, accessor: 'rrif_balance_p1', align: 'right' as const, format: fmt, className: 'bg-gray-50' },
    { header: `RRIFBal2`, accessor: 'rrif_balance_p2', align: 'right' as const, format: fmt, className: 'bg-gray-50' },

    // TFSA Balances - Both persons
    { header: `TFSABal1`, accessor: 'tfsa_balance_p1', align: 'right' as const, format: fmt, className: 'bg-gray-50' },
    { header: `TFSABal2`, accessor: 'tfsa_balance_p2', align: 'right' as const, format: fmt, className: 'bg-gray-50' },

    // NonReg Balances - Both persons
    { header: `NRegBal1`, accessor: 'nonreg_balance_p1', align: 'right' as const, format: fmt, className: 'bg-gray-50' },
    { header: `NRegBal2`, accessor: 'nonreg_balance_p2', align: 'right' as const, format: fmt, className: 'bg-gray-50' },

    // Corporate Balances - Both persons
    { header: `CorpBal1`, accessor: 'corporate_balance_p1', align: 'right' as const, format: fmt, className: 'bg-gray-50' },
    { header: `CorpBal2`, accessor: 'corporate_balance_p2', align: 'right' as const, format: fmt, className: 'bg-gray-50' },

    // Net Worth and Status
    {
      header: 'NetWorth',
      accessor: 'total_value',
      align: 'right' as const,
      format: fmt,
      className: 'font-semibold bg-gray-200',
    },
    {
      header: 'OK',
      accessor: 'plan_success',
      align: 'center' as const,
      format: (val: boolean) => (val ? '✓' : '✗'),
      className: 'font-semibold',
    },
  ];

  // Comprehensive columns for single person
  const singlePersonColumns = [
    // Year and Age
    { header: 'Year', accessor: 'year', align: 'center' as const, className: 'bg-gray-200' },
    { header: 'Age', accessor: 'age_p1', align: 'center' as const, className: 'bg-gray-200' },

    // Spending
    { header: 'Spending', accessor: 'spending_need', align: 'right' as const, format: fmt, className: 'bg-yellow-50' },

    // Government Benefits
    { header: 'CPP', accessor: 'cpp_p1', align: 'right' as const, format: fmt, className: 'bg-green-50' },
    { header: 'OAS', accessor: 'oas_p1', align: 'right' as const, format: fmt, className: 'bg-green-50' },
    {
      header: 'GIS',
      accessor: 'gis_p1',
      align: 'right' as const,
      format: (val: number | undefined) => fmt(val || 0),
      className: 'bg-green-50',
    },
    {
      header: 'OAS Claw',
      accessor: 'oas_clawback_p1',
      align: 'right' as const,
      format: (val: number | undefined) => (val || 0) > 0 ? `-${fmt(val || 0)}` : '$0',
      className: 'bg-red-50',
    },
    {
      header: 'NonReg Dist',
      accessor: 'nonreg_distributions',
      align: 'right' as const,
      format: (val: number | undefined) => fmt(val || 0),
      className: 'bg-green-50',
    },

    // Withdrawals
    { header: 'RRIF WD', accessor: 'rrif_withdrawal_p1', align: 'right' as const, format: fmt, className: 'bg-blue-50' },
    { header: 'TFSA WD', accessor: 'tfsa_withdrawal_p1', align: 'right' as const, format: fmt, className: 'bg-blue-50' },
    { header: 'NonReg WD', accessor: 'nonreg_withdrawal_p1', align: 'right' as const, format: fmt, className: 'bg-blue-50' },
    { header: 'Corp WD', accessor: 'corporate_withdrawal_p1', align: 'right' as const, format: fmt, className: 'bg-blue-50' },

    // TFSA Contributions
    {
      header: 'TFSA Cont',
      accessor: 'tfsa_contribution_p1',
      align: 'right' as const,
      format: (val: number | undefined) => fmt(val || 0),
      className: 'bg-purple-50',
    },

    // Tax Details
    { header: 'Taxable Inc', accessor: 'taxable_income_p1', align: 'right' as const, format: fmt, className: 'bg-orange-50' },
    { header: 'Tax Paid', accessor: 'total_tax_p1', align: 'right' as const, format: fmt, className: 'bg-orange-50' },
    { header: 'Marg Rate', accessor: 'marginal_rate_p1', align: 'right' as const, format: fmtPct, className: 'bg-orange-50' },

    // End Balances
    { header: 'RRIF Bal', accessor: 'rrif_balance_p1', align: 'right' as const, format: fmt, className: 'bg-gray-50' },
    { header: 'TFSA Bal', accessor: 'tfsa_balance_p1', align: 'right' as const, format: fmt, className: 'bg-gray-50' },
    { header: 'NonReg Bal', accessor: 'nonreg_balance_p1', align: 'right' as const, format: fmt, className: 'bg-gray-50' },
    { header: 'Corp Bal', accessor: 'corporate_balance_p1', align: 'right' as const, format: fmt, className: 'bg-gray-50' },

    // Net Worth and Status
    {
      header: 'Net Worth',
      accessor: 'total_value',
      align: 'right' as const,
      format: fmt,
      className: 'font-semibold bg-gray-200',
    },
    {
      header: 'Status',
      accessor: 'plan_success',
      align: 'center' as const,
      format: (val: boolean) => (val ? '✓' : '✗'),
      className: 'font-semibold',
    },
  ];

  const columns = isSinglePerson ? singlePersonColumns : comprehensiveColumns;

  return (
    <section className="mb-8 page-break" style={{ pageBreakBefore: 'always' }}>
      <SectionHeader
        title="Comprehensive Year-by-Year Analysis"
        subtitle="Complete financial details for every year of retirement - all data included"
      />

      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200" style={{ pageBreakInside: 'avoid' }}>
        <p className="text-sm text-gray-700 font-semibold mb-2">
          This table contains ALL available data for each year of your retirement plan:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          <div>
            <strong>Government Benefits:</strong> CPP, OAS, GIS, OAS Clawbacks
          </div>
          <div>
            <strong>Passive Income:</strong> NonReg distributions (dividends, interest, capital gains)
          </div>
          <div>
            <strong>Withdrawals:</strong> RRIF, TFSA, NonReg, Corporate (per person)
          </div>
          <div>
            <strong>TFSA Contributions:</strong> Transfers from NonReg to TFSA
          </div>
          <div>
            <strong>Tax Details:</strong> Taxable income, tax paid, marginal rate (per person)
          </div>
          <div>
            <strong>Account Balances:</strong> End-of-year balances for all accounts
          </div>
        </div>
      </div>

      {/* Comprehensive Table - Optimized font and spacing for readability */}
      <div className="overflow-x-auto" style={{ pageBreakBefore: 'always' }}>
        <table className="min-w-full border-collapse border-2 border-gray-600" style={{ fontSize: '8px' }}>
          <thead className="bg-gray-700">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`text-${column.align || 'left'} font-bold text-white border border-gray-600 whitespace-nowrap bg-gray-700`}
                  style={{ fontSize: '8px', padding: '3px 4px' }}
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
                      className={`text-center border border-gray-400 text-gray-900 ${column.className || ''} whitespace-nowrap align-middle`}
                      style={{ fontSize: '8px', padding: '3px 4px', verticalAlign: 'middle' }}
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

      {/* Legend for Column Abbreviations */}
      <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-300">
        <p className="text-sm font-semibold text-gray-900 mb-2">Column Abbreviations:</p>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs text-gray-700">
          <div><strong>Yr:</strong> Calendar Year</div>
          <div><strong>Spend:</strong> Spending Target</div>
          <div><strong>CPP1/2:</strong> CPP benefits (Person 1/2)</div>
          <div><strong>OAS1/2:</strong> OAS benefits (Person 1/2)</div>
          <div><strong>GIS1/2:</strong> GIS benefits (Person 1/2)</div>
          <div><strong>OASClaw1/2:</strong> OAS Clawback amount</div>
          <div><strong>NRDist:</strong> NonReg passive distributions</div>
          <div><strong>RRIF1/2:</strong> RRIF withdrawals</div>
          <div><strong>TFSA1/2:</strong> TFSA withdrawals</div>
          <div><strong>NReg1/2:</strong> NonReg withdrawals</div>
          <div><strong>Corp1/2:</strong> Corporate withdrawals</div>
          <div><strong>TFSACont1/2:</strong> TFSA contributions</div>
          <div><strong>TaxInc1/2:</strong> Taxable income</div>
          <div><strong>Tax1/2:</strong> Tax paid</div>
          <div><strong>MRate1/2:</strong> Marginal tax rate</div>
          <div><strong>TotTax:</strong> Total household tax</div>
          <div><strong>RRIFBal1/2:</strong> RRIF end balance</div>
          <div><strong>TFSABal1/2:</strong> TFSA end balance</div>
          <div><strong>NRegBal1/2:</strong> NonReg end balance</div>
          <div><strong>CorpBal1/2:</strong> Corporate end balance</div>
          <div><strong>NetWorth:</strong> Total net worth</div>
          <div><strong>OK:</strong> Plan success (✓/✗)</div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-3">{withNonBreakingSpaces('Understanding This Data')}</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>NonReg Distributions</strong> represent passive income (dividends, interest, capital gains) that
              is taxed annually whether withdrawn or not. This is separate from NonReg Withdrawals.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>TFSA Contributions</strong> show transfers from non-registered accounts into TFSA to utilize
              available contribution room and shelter future growth from tax.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>OAS Clawback</strong> reduces OAS benefits when income exceeds the threshold (~$86,000 in 2024).
              The clawback is 15% of income above this threshold.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>Marginal Rate</strong> is your top tax bracket - the rate applied to the next dollar of income.
              This is important for understanding the tax impact of additional withdrawals.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>Account Balances</strong> are shown at end of year after all withdrawals, contributions, and
              investment growth.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
