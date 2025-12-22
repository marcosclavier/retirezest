import { SimulationResponse } from '@/lib/types/simulation';
import { SectionHeader } from './shared/SectionHeader';
import { MetricCard } from './shared/MetricCard';
import { HealthMetricsSection } from './sections/HealthMetricsSection';
import { TaxAnalysisSection } from './sections/TaxAnalysisSection';
import { EstateAnalysisSection } from './sections/EstateAnalysisSection';
import { WithdrawalAnalysisSection } from './sections/WithdrawalAnalysisSection';
import { FiveYearPlanSection } from './sections/FiveYearPlanSection';
import { YearByYearSection } from './sections/YearByYearSection';
import { ComprehensiveYearByYearSection } from './sections/ComprehensiveYearByYearSection';
import { PortfolioChart } from '../simulation/PortfolioChart';
import { TaxChart } from '../simulation/TaxChart';
import { WithdrawalsBySourceChart } from '../simulation/WithdrawalsBySourceChart';

interface RetirementReportProps {
  result: SimulationResponse;
  companyName?: string;
  companyLogo?: string;
}

export function RetirementReport({ result, companyName, companyLogo }: RetirementReportProps) {
  const today = new Date().toLocaleDateString();

  // Destructure result data
  const { summary, year_by_year, estate_summary, five_year_plan, spending_analysis, key_assumptions, household_input } = result;

  // Early return if no data
  if (!summary || !year_by_year || !household_input) {
    return (
      <div className="bg-white p-8 max-w-4xl mx-auto">
        <p className="text-red-600">Unable to generate report: Missing required simulation data</p>
      </div>
    );
  }

  // Extract person names and household info
  const personOneName = household_input.p1.name || 'Person 1';
  const personTwoName = household_input.p2.name || 'Person 2';
  const isSinglePerson = household_input.p1.start_age > 0 && household_input.p2.start_age === 0;
  const userName = isSinglePerson ? personOneName : `${personOneName} & ${personTwoName}`;

  // Calculate total assets
  const totalAssets =
    household_input.p1.rrif_balance +
    household_input.p1.rrsp_balance +
    household_input.p1.tfsa_balance +
    household_input.p1.nonreg_balance +
    household_input.p1.corporate_balance +
    household_input.p2.rrif_balance +
    household_input.p2.rrsp_balance +
    household_input.p2.tfsa_balance +
    household_input.p2.nonreg_balance +
    household_input.p2.corporate_balance;

  // Format currency
  const fmt = (val: number) => `$${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Determine health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <div id="retirement-report" className="bg-white max-w-4xl mx-auto print:max-w-none print:p-0 print:mx-0" style={{ padding: '40px 12px 0 12px' }}>
        {/* Header with Optional Company Branding */}
      <div className="border-b-4 border-blue-600 pb-6 mb-12" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ wordSpacing: '0.25em' }}>
              Retirement Planning Report
            </h1>
            <p className="text-lg text-gray-600">Prepared for {userName}</p>
            {companyName && (
              <p className="text-base text-blue-600 font-medium mt-1">Prepared by {companyName}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">Report Generated: {today}</p>
          </div>
          {companyLogo && (
            <div className="ml-4">
              <img src={companyLogo} alt={companyName || 'Company Logo'} className="h-16 w-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <section className="mb-12" style={{ pageBreakInside: 'avoid' }}>
        <SectionHeader title="Executive Summary" />
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg" style={{ pageBreakInside: 'avoid' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Plan Health Score" value={`${summary.health_score}/100`} valueClassName={getHealthScoreColor(summary.health_score)} subValue={summary.health_rating} />
            <MetricCard label="Success Rate" value={`${((summary.success_rate || 0) * 100).toFixed(0)}%`} valueClassName={summary.success_rate === 1 ? 'text-green-600' : 'text-yellow-600'} subValue={`${summary.years_funded}/${summary.years_simulated} years`} />
            <MetricCard label="Initial Net Worth" value={fmt(summary.initial_net_worth)} />
            <MetricCard label="Final Net Worth" value={fmt(summary.final_net_worth)} valueClassName={summary.final_net_worth > 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Total Government Benefits" value={fmt(summary.total_government_benefits)} subValue={`Avg: ${fmt(summary.avg_annual_benefits)}/year`} />
            <MetricCard label="Total Taxes Paid" value={fmt(summary.total_tax_paid)} valueClassName="text-gray-900" subValue={`Avg rate: ${((summary.avg_effective_tax_rate || 0) * 100).toFixed(1)}%`} />
          </div>
        </div>
      </section>

      {/* Key Findings */}
      <section className="mb-12" style={{ pageBreakInside: 'avoid' }}>
        <SectionHeader title="Key Findings" />
        <div className="bg-blue-50 p-6 rounded-lg" style={{ pageBreakInside: 'avoid' }}>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 text-xl font-bold">•</span>
              <span className="text-gray-700">
                <strong>Plan Health:</strong> Your retirement plan has a health score of{' '}
                <strong className={getHealthScoreColor(summary.health_score)}>{summary.health_score}/100</strong> (
                {summary.health_rating}), indicating{' '}
                {summary.health_score >= 80
                  ? 'excellent sustainability'
                  : summary.health_score >= 60
                  ? 'good overall health with minor areas for improvement'
                  : summary.health_score >= 40
                  ? 'moderate sustainability with some concerns to address'
                  : 'significant risks that require attention'}
                .
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 text-xl font-bold">•</span>
              <span className="text-gray-700">
                <strong>Funding Success:</strong> Your plan successfully funds{' '}
                <strong>
                  {summary.years_funded} out of {summary.years_simulated} years
                </strong>{' '}
                ({((summary.success_rate || 0) * 100).toFixed(0)}% success rate).
                {summary.first_failure_year && (
                  <span className="text-red-600">
                    {' '}
                    First funding gap occurs in year <strong>{summary.first_failure_year}</strong>.
                  </span>
                )}
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 text-xl font-bold">•</span>
              <span className="text-gray-700">
                <strong>Government Benefits:</strong> You will receive approximately{' '}
                <strong>{fmt(summary.total_government_benefits)}</strong> in lifetime government benefits (CPP, OAS,
                GIS), averaging <strong>{fmt(summary.avg_annual_benefits)}/year</strong>.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 text-xl font-bold">•</span>
              <span className="text-gray-700">
                <strong>Tax Burden:</strong> You will pay approximately <strong>{fmt(summary.total_tax_paid)}</strong>{' '}
                in taxes over your retirement (average effective tax rate: {((summary.avg_effective_tax_rate || 0) * 100).toFixed(1)}
                %). Your tax efficiency is{' '}
                {summary.tax_efficiency_rate < 25 ? (
                  <strong className="text-green-600">excellent</strong>
                ) : summary.tax_efficiency_rate < 35 ? (
                  <strong className="text-yellow-600">moderate</strong>
                ) : (
                  <strong className="text-red-600">high</strong>
                )}
                .
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 text-xl font-bold">•</span>
              <span className="text-gray-700">
                <strong>Net Worth Trend:</strong> Your net worth{' '}
                {summary.net_worth_change_pct >= 0 ? (
                  <>
                    <strong className="text-green-600">grows by {(summary.net_worth_change_pct || 0).toFixed(1)}%</strong> from{' '}
                    {fmt(summary.initial_net_worth)} to {fmt(summary.final_net_worth)}
                  </>
                ) : (
                  <>
                    <strong className="text-red-600">declines by {Math.abs(summary.net_worth_change_pct || 0).toFixed(1)}%</strong>{' '}
                    from {fmt(summary.initial_net_worth)} to {fmt(summary.final_net_worth)}
                  </>
                )}
                .
              </span>
            </li>
            {estate_summary && (
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 text-xl font-bold">•</span>
                <span className="text-gray-700">
                  <strong>Estate Legacy:</strong> Your estimated after-tax estate value is{' '}
                  <strong className="text-green-600">{fmt(estate_summary.after_tax_legacy)}</strong> (after{' '}
                  {fmt(estate_summary.taxes_at_death)} in death taxes).
                </span>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* Current Financial Position */}
      <section className="mb-12" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid', marginTop: '64px' }}>
        <SectionHeader title="Current Financial Position" subtitle="Your starting assets and assumptions" />
        <div className="grid grid-cols-2 gap-6" style={{ pageBreakInside: 'avoid' }}>
          {/* Assets Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Current Assets</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">RRSP/RRIF:</span>
                <span className="font-semibold text-gray-900">
                  {fmt(household_input.p1.rrif_balance + household_input.p1.rrsp_balance + household_input.p2.rrif_balance + household_input.p2.rrsp_balance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">TFSA:</span>
                <span className="font-semibold text-gray-900">{fmt(household_input.p1.tfsa_balance + household_input.p2.tfsa_balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Non-Registered:</span>
                <span className="font-semibold text-gray-900">{fmt(household_input.p1.nonreg_balance + household_input.p2.nonreg_balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Corporate:</span>
                <span className="font-semibold text-gray-900">{fmt(household_input.p1.corporate_balance + household_input.p2.corporate_balance)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-900 font-bold">Total Assets:</span>
                <span className="font-bold text-blue-600">{fmt(totalAssets)}</span>
              </div>
            </div>
          </div>

          {/* Planning Assumptions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Planning Assumptions</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Starting Age ({personOneName}):</span>
                <span className="font-semibold text-gray-900">{household_input.p1.start_age}</span>
              </div>
              {!isSinglePerson && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Starting Age ({personTwoName}):</span>
                  <span className="font-semibold text-gray-900">{household_input.p2.start_age}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-700">Planning to Age:</span>
                <span className="font-semibold text-gray-900">{household_input.end_age}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Province:</span>
                <span className="font-semibold text-gray-900">{household_input.province}</span>
              </div>
              {key_assumptions && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Spending Inflation:</span>
                    <span className="font-semibold text-gray-900">{(key_assumptions.spending_inflation_rate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">General Inflation:</span>
                    <span className="font-semibold text-gray-900">{(key_assumptions.general_inflation_rate || 0).toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Spending Phases */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Retirement Spending Phases</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Go-Go Phase</p>
              <p className="text-xl font-bold text-gray-900">{fmt(household_input.spending_go_go)}</p>
              <p className="text-xs text-gray-500">Until age {household_input.go_go_end_age}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Slow-Go Phase</p>
              <p className="text-xl font-bold text-gray-900">{fmt(household_input.spending_slow_go)}</p>
              <p className="text-xs text-gray-500">
                Ages {household_input.go_go_end_age + 1}-{household_input.slow_go_end_age}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">No-Go Phase</p>
              <p className="text-xl font-bold text-gray-900">{fmt(household_input.spending_no_go)}</p>
              <p className="text-xs text-gray-500">Age {household_input.slow_go_end_age + 1}+</p>
            </div>
          </div>
        </div>
      </section>

      {/* Health Metrics Section - Start on Page 4 */}
      <div style={{ pageBreakBefore: 'always' }}>
        <HealthMetricsSection summary={summary} spendingAnalysis={spending_analysis} />
      </div>

      {/* Portfolio Balance Chart */}
      <section className="mb-12" style={{ pageBreakInside: 'avoid', marginTop: '48px' }}>
        <div style={{ pageBreakInside: 'avoid' }}>
          <PortfolioChart yearByYear={year_by_year} />
        </div>
      </section>

      {/* Tax Analysis Section */}
      <div style={{ pageBreakBefore: 'always' }}>
        <TaxAnalysisSection summary={summary} yearByYear={year_by_year} />
      </div>

      {/* Tax Chart */}
      <section className="mb-12" style={{ pageBreakInside: 'avoid', marginTop: '48px' }}>
        <div style={{ pageBreakInside: 'avoid' }}>
          <TaxChart yearByYear={year_by_year} />
        </div>
      </section>

      {/* Withdrawal Analysis Section */}
      <div style={{ pageBreakBefore: 'always' }}>
        <WithdrawalAnalysisSection summary={summary} keyAssumptions={key_assumptions} />
      </div>

      {/* Withdrawals by Source Chart */}
      {result.chart_data?.data_points && result.chart_data.data_points.length > 0 && (
        <section className="mb-12" style={{ pageBreakInside: 'avoid', marginTop: '48px' }}>
          <div style={{ pageBreakInside: 'avoid' }}>
            <WithdrawalsBySourceChart chartData={result.chart_data.data_points} />
          </div>
        </section>
      )}

      {/* Five-Year Detailed Plan */}
      {five_year_plan && five_year_plan.length > 0 && (
        <div style={{ pageBreakBefore: 'always' }}>
          <FiveYearPlanSection
            fiveYearPlan={five_year_plan}
            personOneName={personOneName}
            personTwoName={personTwoName}
            isSinglePerson={isSinglePerson}
          />
        </div>
      )}

      {/* Estate Analysis Section */}
      {estate_summary && <EstateAnalysisSection estate={estate_summary} />}

      {/* Year-by-Year Section */}
      <YearByYearSection
        yearByYear={year_by_year}
        personOneName={personOneName}
        personTwoName={personTwoName}
        isSinglePerson={isSinglePerson}
      />

      {/* Comprehensive Year-by-Year Section with ALL data */}
      <div style={{ pageBreakBefore: 'always' }}>
        <ComprehensiveYearByYearSection
          yearByYear={year_by_year}
          personOneName={personOneName}
          personTwoName={personTwoName}
          isSinglePerson={isSinglePerson}
        />
      </div>

      {/* Important Disclaimers */}
      <section className="mb-0 border-t-2 border-gray-300 pt-8 mt-12" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid' }}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Important Disclaimers</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 space-y-2 text-sm text-gray-700" style={{ pageBreakInside: 'avoid' }}>
          <p>
            <strong>Not Financial Advice:</strong> This report is for informational purposes only and does not
            constitute professional financial, investment, or tax advice. The projections are estimates based on the
            assumptions you provided and should not be relied upon as guarantees of future performance.
          </p>
          <p>
            <strong>Estimates Only:</strong> All projections are estimates based on the assumptions provided. Actual
            results may vary significantly due to market conditions, changes in tax law, personal circumstances, and
            other factors beyond our control or prediction.
          </p>
          <p>
            <strong>Consult a Professional:</strong> Before making any financial decisions, please consult with a
            Certified Financial Planner (CFP), tax professional, or qualified financial advisor who can provide
            personalized advice based on your complete financial situation.
          </p>
          <p>
            <strong>Government Benefits:</strong> CPP, OAS, and GIS amounts are estimates based on current 2025 rates
            and may change. Benefit eligibility and amounts depend on your personal contribution history and income
            levels. Verify all benefit calculations with Service Canada before making retirement decisions.
          </p>
          <p>
            <strong>Tax Calculations:</strong> Tax calculations are approximate and based on {key_assumptions?.tax_year_basis || 2025}{' '}
            federal and provincial tax rates for {household_input.province}. They may not reflect all available credits,
            deductions, or provincial variations. Tax laws change frequently. Consult a tax professional for accurate
            tax planning.
          </p>
          <p>
            <strong>Estate Tax Estimates:</strong> Estate tax calculations are simplified estimates. Actual estate tax
            liability will depend on many factors including specific asset valuations, beneficiary designations, spousal
            rollovers, estate administration costs, and changes to tax legislation. Professional estate planning is
            strongly recommended.
          </p>
          <p>
            <strong>Assumptions and Limitations:</strong> This simulation assumes constant investment returns, inflation
            rates, and tax rates. Real-world market volatility, sequence of returns risk, and changing economic
            conditions can significantly impact your actual retirement outcomes. Consider stress-testing your plan with
            different scenarios.
          </p>
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-300">
            Report Generated: {today}
            {companyName && ` | Prepared by ${companyName}`}
            {' • '}RetireZest Canadian Retirement Planning Tool
          </p>
        </div>
      </section>
    </div>
    </>
  );
}
