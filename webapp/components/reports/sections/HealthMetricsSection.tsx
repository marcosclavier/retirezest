import { SimulationSummary, SpendingAnalysis, HealthCriterion } from '@/lib/types/simulation';
import { SectionHeader } from '../shared/SectionHeader';
import { MetricCard } from '../shared/MetricCard';
import { ReportTable } from '../shared/ReportTable';
import { formatCurrency } from '@/lib/utils';
import { withNonBreakingSpaces } from '../shared/utils';

interface HealthMetricsSectionProps {
  summary: SimulationSummary;
  spendingAnalysis?: SpendingAnalysis;
  grossAssetTotal?: number; // Original gross asset total from household input (January 2026)
}

export function HealthMetricsSection({ summary, spendingAnalysis, grossAssetTotal }: HealthMetricsSectionProps) {
  // Determine health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBgColor = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return 'bg-green-50 border-green-500';
      case 'Good':
        return 'bg-blue-50 border-blue-500';
      case 'Fair':
        return 'bg-yellow-50 border-yellow-500';
      case 'At Risk':
        return 'bg-red-50 border-red-500';
      default:
        return 'bg-gray-50 border-gray-500';
    }
  };

  // Helper to format criteria for display
  const criteriaArray = summary.health_criteria
    ? Object.entries(summary.health_criteria).map(([key, criterion]: [string, any]) => ({
        name: formatCriterionName(key),
        ...criterion,
        passed: criterion.score === criterion.max_score,
      }))
    : [];

  return (
    <section className="mb-4">
      <SectionHeader
        title="Retirement Health Metrics"
        subtitle="Comprehensive analysis of your retirement plan sustainability"
      />

      {/* Plan Health Score Card */}
      <div className={`${getRatingBgColor(summary.health_rating)} border-2 rounded-lg p-2 mb-2`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Overall Plan Health Score</p>
            <p className={`text-2xl font-bold ${getHealthScoreColor(summary.health_score)}`}>
              {summary.health_score}/100
            </p>
            <p className="text-xs font-semibold text-gray-800">
              Rating: {summary.health_rating}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-0.5">Years Funded</p>
              <p className="text-xl font-bold text-gray-900">
                {summary.years_funded}/{summary.years_simulated}
              </p>
              <p className="text-xs text-gray-600">
                ({(summary.success_rate * 100).toFixed(0)}% Success Rate)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Check Summary */}
      {criteriaArray.length > 0 && (
        <div className="border border-gray-300 rounded-lg p-3 mb-2">
          <h3 className="text-sm font-bold text-gray-900 mb-1">{withNonBreakingSpaces('Health Check Summary')}</h3>
          <p className="text-xs mb-2 text-gray-900 font-semibold">
            <span className="font-semibold">Rating:</span> {summary.health_rating} (Score:{' '}
            {summary.health_score}/100)
          </p>

          <div className="space-y-1 mb-2">
            {criteriaArray.map((criterion, index) => (
              <div key={index} className="flex items-start">
                <span className={`text-base mr-1.5 ${criterion.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {criterion.passed ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-gray-900">
                    <strong>{criterion.name}</strong>
                  </p>
                  <p className="text-xs text-gray-600">{criterion.description}</p>
                  <p className="text-xs text-gray-500">
                    Score: {criterion.score}/{criterion.max_score} - {criterion.status}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs font-semibold text-gray-900 mb-0.5">Rating Scale:</p>
            <ul className="text-xs text-gray-700 space-y-0">
              <li>
                <strong className="text-green-600">Excellent (80-100):</strong> Plan is highly sustainable
              </li>
              <li>
                <strong className="text-blue-600">Good (60-79):</strong> Plan is generally sound with minor concerns
              </li>
              <li>
                <strong className="text-yellow-600">Fair (40-59):</strong> Plan has moderate risks that should be addressed
              </li>
              <li>
                <strong className="text-red-600">At Risk (0-39):</strong> Plan requires significant improvements
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Plan Sustainability */}
      <div className="bg-blue-50 p-2 rounded-lg mb-2">
        <h3 className="text-sm font-bold text-gray-900 mb-2">{withNonBreakingSpaces('Plan Sustainability')}</h3>
        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            label="Initial Net Worth"
            value={formatCurrency(grossAssetTotal || summary.initial_net_worth || 0)}
          />
          <MetricCard
            label="Final Net Worth"
            value={formatCurrency(summary.final_net_worth || 0)}
            valueClassName={summary.final_net_worth >= (grossAssetTotal || summary.initial_net_worth) * 0.9 ? 'text-green-600' : 'text-red-600'}
          />
          <MetricCard
            label="Net Worth Trend"
            value={summary.net_worth_trend}
            subValue={`${summary.net_worth_change_pct >= 0 ? '+' : ''}${(summary.net_worth_change_pct || 0).toFixed(1)}%`}
            valueClassName={
              summary.net_worth_trend === 'Growing'
                ? 'text-green-600'
                : summary.net_worth_trend === 'Declining'
                ? 'text-red-600'
                : 'text-gray-900'
            }
          />
        </div>
      </div>

      {/* Government Benefits Summary */}
      <div className="bg-gray-50 p-2 rounded-lg mb-2">
        <h3 className="text-sm font-bold text-gray-900 mb-2">{withNonBreakingSpaces('Government Benefits Summary (Lifetime)')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <MetricCard
            label="Total CPP"
            value={formatCurrency(summary.total_cpp || 0)}
          />
          <MetricCard
            label="Total OAS"
            value={formatCurrency(summary.total_oas || 0)}
          />
          <MetricCard
            label="Total GIS"
            value={formatCurrency(summary.total_gis || 0)}
          />
          <MetricCard
            label="All Benefits"
            value={formatCurrency(summary.total_government_benefits || 0)}
            subValue={`Avg: ${formatCurrency(summary.avg_annual_benefits || 0)}/year`}
            valueClassName="text-blue-600"
          />
        </div>
      </div>

      {/* Withdrawal & Spending Analysis */}
      {spendingAnalysis && (
        <div className="bg-gray-50 p-2 rounded-lg mb-2">
          <h3 className="text-sm font-bold text-gray-900 mb-2">{withNonBreakingSpaces('Withdrawal & Spending Analysis')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              label="Portfolio Withdrawals"
              value={formatCurrency(spendingAnalysis.portfolio_withdrawals || 0)}
            />
            <MetricCard
              label="Government Benefits"
              value={formatCurrency(spendingAnalysis.government_benefits_total || 0)}
            />
            <MetricCard
              label="Total Available"
              value={formatCurrency(spendingAnalysis.total_spending_available || 0)}
              valueClassName="text-blue-600"
            />
            <MetricCard
              label="Spending Target"
              value={formatCurrency(spendingAnalysis.spending_target_total || 0)}
            />
            <MetricCard
              label="Coverage"
              value={`${(spendingAnalysis.spending_coverage_pct || 0).toFixed(1)}%`}
              valueClassName={spendingAnalysis.spending_coverage_pct >= 100 ? 'text-green-600' : 'text-red-600'}
            />
            <MetricCard
              label="Avg Annual Spending"
              value={formatCurrency(spendingAnalysis.avg_annual_spending || 0)}
            />
          </div>
          <p className="text-xs text-gray-700 mt-2">{spendingAnalysis.plan_status_text}</p>
        </div>
      )}

      {/* Tax Efficiency & OAS Clawback */}
      <div className="bg-gray-50 p-2 rounded-lg mb-2">
        <h3 className="text-sm font-bold text-gray-900 mb-2">{withNonBreakingSpaces('Tax Efficiency & OAS Clawback')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <MetricCard
            label="Total Taxes (Lifetime)"
            value={formatCurrency(summary.total_tax_paid || 0)}
          />
          <MetricCard
            label="OAS Clawback"
            value={formatCurrency(summary.total_oas_clawback || 0)}
            valueClassName={summary.total_oas_clawback > 0 ? 'text-red-600' : 'text-green-600'}
          />
          <MetricCard
            label="Tax Efficiency (All Sources)"
            value={`${(summary.tax_efficiency_rate || 0).toFixed(1)}%`}
            subValue={`Avg Effective Rate: ${((summary.avg_effective_tax_rate || 0) * 100).toFixed(1)}%`}
            valueClassName={summary.tax_efficiency_rate < 25 ? 'text-green-600' : 'text-yellow-600'}
          />
        </div>
        {summary.total_oas_clawback > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> Your income exceeds the CRA OAS recovery threshold (income limit) in some years,
              resulting in an OAS clawback of{' '}
              <strong>{formatCurrency(summary.total_oas_clawback || 0)}</strong> over your retirement.
              According to CRA, the OAS recovery threshold is $90,997 for 2025 and $93,454 for 2026 (indexed annually for inflation).
              The clawback is 15% of net income above the threshold.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// Helper function to format criterion names
function formatCriterionName(key: string): string {
  const nameMap: Record<string, string> = {
    full_period_funded: 'Full Period Funded (100%)',
    adequate_reserve: 'Adequate Funding Reserve (80%+ funded)',
    good_tax_efficiency: 'Good Tax Efficiency (<25% rate)',
    government_benefits: 'Government Benefits Available',
    growing_net_worth: 'Maintaining or Growing Net Worth',
    funding_coverage: 'Funding Coverage',
    tax_efficiency: 'Tax Efficiency',
    estate_preservation: 'Estate Preservation',
    benefit_optimization: 'Benefit Optimization',
    risk_management: 'Risk Management',
  };

  return nameMap[key] || key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
