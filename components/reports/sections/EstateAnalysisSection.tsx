import { EstateSummary } from '@/lib/types/simulation';
import { SectionHeader } from '../shared/SectionHeader';
import { MetricCard } from '../shared/MetricCard';
import { ReportTable } from '../shared/ReportTable';
import { withNonBreakingSpaces } from '../shared/utils';

interface EstateAnalysisSectionProps {
  estate: EstateSummary;
}

export function EstateAnalysisSection({ estate }: EstateAnalysisSectionProps) {
  // Prepare data for taxable components table
  const componentRows = estate.taxable_components.map(component => ({
    account_type: component.account_type,
    balance: component.balance_at_death,
    inclusion_rate: component.taxable_inclusion_rate,
    estimated_tax: component.estimated_tax,
    description: component.description,
  }));

  const columns = [
    { header: 'Account Type', accessor: 'account_type', align: 'left' as const },
    {
      header: 'Balance at Death',
      accessor: 'balance',
      align: 'right' as const,
      format: (val: number) => `$${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      header: 'Inclusion Rate',
      accessor: 'inclusion_rate',
      align: 'right' as const,
      format: (val: number) => `${(val || 0).toFixed(0)}%`,
    },
    {
      header: 'Estimated Tax',
      accessor: 'estimated_tax',
      align: 'right' as const,
      format: (val: number) => `$${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      className: 'font-semibold',
    },
  ];

  return (
    <section className="mb-8 page-break">
      <SectionHeader
        title="Estate Analysis - Taxes at Death"
        subtitle="Projected estate value and tax implications for beneficiaries"
      />

      {/* Estate Tax Summary */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{withNonBreakingSpaces('Estate Tax Summary')}</h3>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Gross Estate Value"
            value={`$${estate.gross_estate_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            valueClassName="text-blue-600"
          />
          <MetricCard
            label="Taxes at Death"
            value={`$${estate.taxes_at_death.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            valueClassName="text-red-600"
          />
          <MetricCard
            label="After-Tax Legacy"
            value={`$${estate.after_tax_legacy.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            valueClassName="text-green-600"
          />
          <MetricCard
            label="Effective Tax Rate at Death"
            value={`${estate.effective_tax_rate_at_death.toFixed(1)}%`}
            subValue="Of gross estate"
          />
        </div>
      </div>

      {/* Taxable Components at Death */}
      <div className="mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{withNonBreakingSpaces('Taxable Components at Death')}</h3>
        <ReportTable columns={columns} data={componentRows} />

        {/* Descriptions */}
        <div className="mt-4 space-y-3">
          {estate.taxable_components.map((component, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded">
              <p className="font-semibold text-gray-900">{component.account_type}:</p>
              <p className="text-sm text-gray-700 mt-1">{component.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Observations */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-3">{withNonBreakingSpaces('Key Estate Observations')}</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Your gross estate is valued at <strong>${estate.gross_estate_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>,
              with an estimated tax liability of <strong>${estate.taxes_at_death.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>{' '}
              ({estate.effective_tax_rate_at_death.toFixed(1)}%).
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>RRIF/RRSP balances</strong> ($
              {estate.rrif_balance_at_death.toLocaleString(undefined, { maximumFractionDigits: 0 })}) are 100% taxable at death - the full amount is
              added to your final tax return at marginal rates.
            </span>
          </li>
          {estate.tfsa_balance_at_death > 0 && (
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>TFSA balance</strong> ($
                {estate.tfsa_balance_at_death.toLocaleString(undefined, { maximumFractionDigits: 0 })}) transfers tax-free to beneficiaries - this is
                the most tax-efficient account for estate planning.
              </span>
            </li>
          )}
          {estate.nonreg_balance_at_death > 0 && (
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>Non-registered accounts</strong> ($
                {estate.nonreg_balance_at_death.toLocaleString(undefined, { maximumFractionDigits: 0 })}) trigger capital gains tax at death, with
                only 50% of gains included in taxable income (assuming 50% of balance is unrealized gains).
              </span>
            </li>
          )}
          {estate.corporate_balance_at_death > 0 && (
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>Corporate holdings</strong> ($
                {estate.corporate_balance_at_death.toLocaleString(undefined, { maximumFractionDigits: 0 })}) are distributed as capital dividends
                (using Capital Dividend Account) or eligible dividends when the corporation is wound up.
              </span>
            </li>
          )}
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Your beneficiaries will inherit approximately{' '}
              <strong className="text-green-600">${estate.after_tax_legacy.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> after
              all taxes are paid.
            </span>
          </li>
        </ul>
      </div>

      {/* Estate Planning Tips */}
      {estate.estate_planning_tips.length > 0 && (
        <div className="border-l-4 border-green-500 bg-green-50 p-6 rounded-r mb-8" style={{ pageBreakInside: 'avoid' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-3">{withNonBreakingSpaces('Estate Planning Tips')}</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {estate.estate_planning_tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Important Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 rounded border-l-4 border-yellow-400">
        <p className="text-sm text-gray-700">
          <strong>Important:</strong> Estate tax calculations are estimates based on general assumptions and
          current tax rules. Actual tax liability will depend on:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 ml-4 space-y-1">
          <li>Final taxable income in the year of death</li>
          <li>Specific asset valuations and adjusted cost base (ACB)</li>
          <li>Beneficiary designations and spousal rollovers</li>
          <li>Provincial tax rates and estate administration taxes</li>
          <li>Changes to tax legislation</li>
        </ul>
        <p className="text-sm text-gray-700 mt-3">
          <strong>Recommendation:</strong> Consult with an estate planning professional and tax advisor to
          develop a comprehensive estate plan tailored to your specific situation.
        </p>
      </div>
    </section>
  );
}
