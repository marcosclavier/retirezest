import { SimulationSummary, YearResult } from '@/lib/types/simulation';
import { SectionHeader } from '../shared/SectionHeader';
import { MetricCard } from '../shared/MetricCard';

interface TaxAnalysisSectionProps {
  summary: SimulationSummary;
  yearByYear?: YearResult[];
}

export function TaxAnalysisSection({ summary, yearByYear }: TaxAnalysisSectionProps) {
  // Find years with highest and lowest tax
  let highestTaxYear: YearResult | undefined;
  let lowestTaxYear: YearResult | undefined;

  if (yearByYear && yearByYear.length > 0) {
    highestTaxYear = yearByYear.reduce((prev, current) =>
      current.total_tax > prev.total_tax ? current : prev
    );
    lowestTaxYear = yearByYear.reduce((prev, current) =>
      current.total_tax < prev.total_tax ? current : prev
    );
  }

  // Calculate OAS clawback years
  const oasClawbackYears =
    yearByYear?.filter(year => (year.oas_clawback_p1 || 0) + (year.oas_clawback_p2 || 0) > 0) || [];

  return (
    <section className="mb-8 page-break">
      <SectionHeader
        title="Tax Analysis"
        subtitle="Comprehensive breakdown of your lifetime tax burden and optimization opportunities"
      />

      {/* Tax Metrics */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tax Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Cumulative Tax (Lifetime)"
            value={`$${(summary.total_tax_paid || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            valueClassName="text-gray-900"
          />
          <MetricCard
            label="Average Annual Tax"
            value={`$${((summary.total_tax_paid / summary.years_simulated) || 0).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}`}
          />
          <MetricCard
            label="Highest Annual Tax"
            value={`$${(summary.highest_annual_tax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subValue={highestTaxYear ? `Age ${highestTaxYear.age_p1}` : undefined}
            valueClassName="text-red-600"
          />
          <MetricCard
            label="Lowest Annual Tax"
            value={`$${(summary.lowest_annual_tax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subValue={lowestTaxYear ? `Age ${lowestTaxYear.age_p1}` : undefined}
            valueClassName="text-green-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <MetricCard
            label="Average Effective Tax Rate"
            value={`${((summary.avg_effective_tax_rate || 0) * 100).toFixed(1)}%`}
            subValue="On all taxable income"
          />
          <MetricCard
            label="Tax Efficiency Rating"
            value={`${(summary.tax_efficiency_rate || 0).toFixed(1)}%`}
            subValue="Tax as % of total income + withdrawals"
            valueClassName={summary.tax_efficiency_rate < 25 ? 'text-green-600' : 'text-yellow-600'}
          />
        </div>
      </div>

      {/* Key Observations */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Key Tax Observations</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Your cumulative lifetime tax burden is{' '}
              <strong>${(summary.total_tax_paid || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>, representing{' '}
              <strong>{(summary.tax_efficiency_rate || 0).toFixed(1)}%</strong> of your total income and withdrawals.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Tax efficiency is{' '}
              {summary.tax_efficiency_rate < 25 ? (
                <strong className="text-green-600">excellent</strong>
              ) : summary.tax_efficiency_rate < 35 ? (
                <strong className="text-yellow-600">moderate</strong>
              ) : (
                <strong className="text-red-600">high</strong>
              )}{' '}
              - strategies like TFSA prioritization and income splitting can help optimize tax outcomes.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>RRIF withdrawals</strong> are fully taxable at your marginal rate, while{' '}
              <strong>TFSA withdrawals</strong> are completely tax-free. Non-registered capital gains benefit
              from 50% inclusion rate.
            </span>
          </li>
          {highestTaxYear && lowestTaxYear && (
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                Tax varies from <strong>${(lowestTaxYear.total_tax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> at age{' '}
                {lowestTaxYear.age_p1} to <strong>${(highestTaxYear.total_tax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> at
                age {highestTaxYear.age_p1}, reflecting changes in income sources and withdrawal patterns.
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* OAS Clawback Explanation */}
      <div className="border-l-4 border-yellow-400 bg-yellow-50 p-6 rounded-r mb-8 page-break" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-3">OAS Clawback (Recovery Tax)</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <MetricCard
            label="Total OAS Clawback"
            value={`$${(summary.total_oas_clawback || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            valueClassName={summary.total_oas_clawback > 0 ? 'text-red-600' : 'text-green-600'}
          />
          <MetricCard
            label="Years Affected"
            value={oasClawbackYears.length}
            subValue={oasClawbackYears.length > 0 && oasClawbackYears.map(y => y.age_p1).length > 0 ? `Ages ${Math.min(...oasClawbackYears.map(y => y.age_p1))}-${Math.max(...oasClawbackYears.map(y => y.age_p1))}` : 'None'}
          />
          <MetricCard
            label="2025/2026 Threshold"
            value="$90,997 / $93,454"
            subValue="Net income (CRA)"
          />
        </div>

        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>How OAS Clawback Works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              When your net income exceeds <strong>$90,997</strong> (2025 threshold) or <strong>$93,454</strong> (2026 threshold), you must repay 15% of the excess.
            </li>
            <li>The clawback is also known as the "OAS recovery tax" and is calculated on your tax return.</li>
            <li>
              Full OAS is eliminated when net income exceeds <strong>$151,668</strong> (ages 65-74) or <strong>$157,490</strong> (ages 75+) based on 2026 rates.
            </li>
            <li>
              The threshold is indexed to inflation annually - amounts shown are CRA official rates for 2025 and 2026.
            </li>
          </ul>

          {summary.total_oas_clawback > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-300">
              <p className="font-semibold text-gray-900 mb-3">Should You Pay or Avoid the OAS Clawback?</p>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-semibold text-gray-700 mb-2">Current Strategy (Pay Clawback)</p>
                    <p className="text-xs text-gray-600 mb-1">Total OAS Benefits Received:</p>
                    <p className="text-lg font-bold text-green-600">${(summary.total_oas || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-gray-600 mb-1 mt-2">Total Clawback Paid:</p>
                    <p className="text-lg font-bold text-red-600">${(summary.total_oas_clawback || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-gray-600 mb-1 mt-2">Net OAS Benefit:</p>
                    <p className="text-lg font-bold text-blue-600">${((summary.total_oas - summary.total_oas_clawback) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-gray-600 mb-1 mt-2">Final Estate (After-Tax):</p>
                    <p className="text-lg font-bold text-gray-900">${(summary.final_estate_after_tax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>

                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-semibold text-gray-700 mb-2">Avoiding Clawback Strategy</p>
                    <p className="text-xs text-gray-600 mb-2">To avoid the ${(summary.total_oas_clawback || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} clawback, you would need to:</p>
                    <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                      <li>Reduce taxable income in {oasClawbackYears.length} years</li>
                      <li>Withdraw more from TFSA/NonReg (less tax-efficient)</li>
                      <li>Potentially reduce RRIF withdrawals</li>
                      <li>More complex tax planning required</li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Estimated Impact on Estate:</p>
                      <p className="text-sm font-semibold text-gray-700">Potentially ${Math.max(0, (summary.total_oas_clawback - (summary.total_oas_clawback * 0.3)) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} to ${(summary.total_oas_clawback * 1.2 || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} lower</p>
                      <p className="text-xs text-gray-500 mt-1">Due to less efficient withdrawal strategy and reduced growth</p>
                    </div>
                  </div>
                </div>

                <div className={`mt-3 p-3 rounded border ${
                  (summary.total_oas_clawback / (summary.total_oas || 1)) < 0.20
                    ? 'bg-green-50 border-green-400'
                    : 'bg-yellow-50 border-yellow-400'
                }`}>
                  <p className="font-semibold text-gray-900 mb-1">
                    {(summary.total_oas_clawback / (summary.total_oas || 1)) < 0.20 ? '✓ ' : '⚠ '}
                    Recommendation:
                  </p>
                  <p className="text-xs text-gray-700">
                    {(summary.total_oas_clawback / (summary.total_oas || 1)) < 0.20
                      ? `Your clawback is ${((summary.total_oas_clawback / (summary.total_oas || 1)) * 100).toFixed(1)}% of total OAS received. Since you still keep ${(100 - ((summary.total_oas_clawback / (summary.total_oas || 1)) * 100)).toFixed(0)}% of the benefit, it's generally better to pay the clawback and maintain your optimal withdrawal strategy. Attempting to avoid it could reduce your final estate by more than the clawback amount.`
                      : `Your clawback is ${((summary.total_oas_clawback / (summary.total_oas || 1)) * 100).toFixed(1)}% of total OAS received. Consider working with a financial advisor to evaluate strategies that might reduce your taxable income in the ${oasClawbackYears.length} affected years. However, ensure any changes don't significantly impact your overall estate value.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {summary.total_oas_clawback > 0 ? (
            <div className="mt-4 p-4 bg-white rounded border border-yellow-300">
              <p className="font-semibold text-gray-900 mb-2">Mitigation Strategies (If Beneficial):</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Withdraw from TFSA instead of RRIF when nearing threshold</li>
                <li>Use pension income splitting to reduce individual net income</li>
                <li>Time RRIF withdrawals strategically to avoid threshold years</li>
                <li>Consider OAS deferral (up to age 70) for 36% higher payments</li>
              </ul>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-green-50 rounded border border-green-300">
              <p className="font-semibold text-green-800">
                ✓ Your income stays below the OAS clawback threshold - no recovery tax applies.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Tax Notes */}
      <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-300">
        <p className="text-sm text-gray-700">
          <strong>Important:</strong> Tax calculations are based on 2025 federal and provincial tax rates.
          Actual tax amounts may vary based on changes to tax law, additional credits/deductions, and
          personal circumstances. Consult a qualified tax professional for personalized advice.
        </p>
      </div>
    </section>
  );
}
