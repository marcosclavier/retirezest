import { SimulationSummary, KeyAssumptions } from '@/lib/types/simulation';
import { SectionHeader } from '../shared/SectionHeader';
import { MetricCard } from '../shared/MetricCard';
import { ReportTable } from '../shared/ReportTable';

interface WithdrawalAnalysisSectionProps {
  summary: SimulationSummary;
  keyAssumptions?: KeyAssumptions;
}

export function WithdrawalAnalysisSection({ summary, keyAssumptions }: WithdrawalAnalysisSectionProps) {
  // Prepare data for withdrawal breakdown table
  const withdrawalData = [
    {
      source: 'RRIF',
      total: summary.total_rrif_withdrawn,
      percentage: summary.rrif_pct_of_total,
    },
    {
      source: 'Non-Registered',
      total: summary.total_nonreg_withdrawn,
      percentage: summary.nonreg_pct_of_total,
    },
    {
      source: 'TFSA',
      total: summary.total_tfsa_withdrawn,
      percentage: summary.tfsa_pct_of_total,
    },
    {
      source: 'Corporate',
      total: summary.total_corporate_withdrawn,
      percentage: summary.corporate_pct_of_total,
    },
  ].filter(item => item.total > 0); // Only show accounts with withdrawals

  const columns = [
    { header: 'Account Source', accessor: 'source', align: 'left' as const },
    {
      header: 'Total Withdrawn',
      accessor: 'total',
      align: 'right' as const,
      format: (val: number) => `$${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      className: 'font-semibold',
    },
    {
      header: '% of Total',
      accessor: 'percentage',
      align: 'right' as const,
      format: (val: number) => `${(val || 0).toFixed(1)}%`,
    },
  ];

  // Calculate total withdrawals
  const totalWithdrawals = summary.total_withdrawals;

  // Determine dominant account
  let dominantAccount = '';
  let maxPct = 0;
  withdrawalData.forEach(item => {
    if (item.percentage > maxPct) {
      maxPct = item.percentage;
      dominantAccount = item.source;
    }
  });

  return (
    <section className="mb-8 page-break">
      <SectionHeader
        title="Withdrawal Source Analysis"
        subtitle="Breakdown of lifetime withdrawals by account type"
      />

      {/* Withdrawal Summary */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Total Withdrawals by Source</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            label="Total Withdrawals"
            value={`$${totalWithdrawals.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            valueClassName="text-blue-600"
          />
          <MetricCard
            label="RRIF"
            value={`$${summary.total_rrif_withdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subValue={`${summary.rrif_pct_of_total.toFixed(1)}%`}
          />
          <MetricCard
            label="Non-Registered"
            value={`$${summary.total_nonreg_withdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subValue={`${summary.nonreg_pct_of_total.toFixed(1)}%`}
          />
          <MetricCard
            label="TFSA"
            value={`$${summary.total_tfsa_withdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subValue={`${summary.tfsa_pct_of_total.toFixed(1)}%`}
          />
          <MetricCard
            label="Corporate"
            value={`$${summary.total_corporate_withdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subValue={`${summary.corporate_pct_of_total.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Withdrawal Breakdown Table */}
      {withdrawalData.length > 0 && (
        <div className="mb-8" style={{ pageBreakInside: 'avoid' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Withdrawal Breakdown</h3>
          <ReportTable columns={columns} data={withdrawalData} />

          {/* Visual percentage bars */}
          <div className="mt-6 space-y-3">
            {withdrawalData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.source}</span>
                  <span className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      index === 0
                        ? 'bg-blue-600'
                        : index === 1
                        ? 'bg-green-600'
                        : index === 2
                        ? 'bg-purple-600'
                        : 'bg-orange-600'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawal Strategy Used */}
      {keyAssumptions && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Withdrawal Strategy Used</h3>
          <p className="text-gray-700 mb-2">
            <strong>Strategy:</strong> {keyAssumptions.withdrawal_strategy}
          </p>
          <div className="text-sm text-gray-700 space-y-2 mt-4">
            <p>
              <strong>Strategy Description:</strong>
            </p>
            {getStrategyDescription(keyAssumptions.withdrawal_strategy)}

            {dominantAccount && maxPct > 50 && (
              <p className="mt-3 p-3 bg-white rounded border border-blue-200">
                <strong>Note:</strong> Your withdrawals are primarily from <strong>{dominantAccount}</strong>{' '}
                ({maxPct.toFixed(1)}% of total), which is consistent with the selected strategy.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tax Treatment by Source */}
      <div className="border border-gray-300 rounded-lg p-6 mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tax Treatment by Withdrawal Source</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-40 font-semibold text-gray-900">RRIF:</div>
            <div className="flex-1 text-sm text-gray-700">
              100% taxable at your marginal tax rate. Includes mandatory minimum withdrawals after age 72
              (71 for RRSP-to-RRIF conversion).
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-40 font-semibold text-gray-900">Non-Registered:</div>
            <div className="flex-1 text-sm text-gray-700">
              Tax treatment depends on income type: capital gains (50% inclusion), eligible dividends
              (dividend tax credit), interest (100% taxable). Passive distributions are reinvested or taxed
              annually.
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-40 font-semibold text-gray-900">TFSA:</div>
            <div className="flex-1 text-sm text-gray-700">
              100% tax-free withdrawals with no impact on income-tested benefits (GIS, OAS clawback). Most
              tax-efficient for estate planning.
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-40 font-semibold text-gray-900">Corporate:</div>
            <div className="flex-1 text-sm text-gray-700">
              Withdrawals are treated as eligible or non-eligible dividends (depending on corporate tax
              paid). Dividend tax credit applies, making this tax-efficient for high-income earners.
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-300">
        <p className="text-sm text-gray-700">
          <strong>Important:</strong> Withdrawal order and timing significantly impact your lifetime tax
          burden and benefit eligibility. Strategic use of TFSA, timing of RRIF conversions, and income
          splitting can optimize your after-tax retirement income. Consult a financial advisor to refine
          your withdrawal strategy.
        </p>
      </div>
    </section>
  );
}

// Helper function to get strategy description
function getStrategyDescription(strategy: string): JSX.Element {
  const descriptions: Record<string, string> = {
    'corporate-optimized':
      'Prioritizes corporate account withdrawals to minimize corporate tax and maximize personal dividend tax credits. Best for business owners with significant corporate holdings.',
    'minimize-income':
      'Minimizes taxable income to preserve income-tested benefits like GIS and avoid OAS clawback. Withdraws from TFSA and uses capital gains where possible.',
    'rrif-splitting':
      'Maximizes pension income splitting between spouses to reduce household tax. Requires both spouses to be age 65+ for RRIF income splitting.',
    'capital-gains-optimized':
      'Prioritizes withdrawals from non-registered accounts as capital gains (50% inclusion rate) for favorable tax treatment.',
    'tfsa-first':
      'Withdraws from TFSA before other accounts for tax-free income and maximum flexibility. Preserves RRIF/RRSP for later years.',
    balanced:
      'Balanced approach across all account types, taking into account mandatory RRIF minimums and tax optimization.',
    'rrif-frontload':
      'Withdraws 15% of RRIF before government benefits start (CPP/OAS), then 8% after. Automatically avoids OAS clawback threshold by switching to TFSA/NonReg when approaching $86,912 income limit.',
    manual: 'Custom withdrawal strategy defined by user preferences.',
  };

  const description = descriptions[strategy] || 'Custom withdrawal strategy';

  return <p className="text-gray-700">{description}</p>;
}
