'use client';

import { SimulationResponse, getStrategyDisplayName, isDefaultStrategy } from '@/lib/types/simulation';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, AlertCircle, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ResultsHeroSectionProps {
  result: SimulationResponse;
}

/**
 * ResultsHeroSection - Interactive hero section showing retirement plan health score
 *
 * Features:
 * - Large health score display (0-100)
 * - Visual health bar with color coding
 * - Key insights and recommendations
 * - At-a-glance success indicators
 */
export function ResultsHeroSection({ result }: ResultsHeroSectionProps) {
  // Debug logging - check if household_input exists
  console.log('=== RESULTS HERO SECTION DEBUG ===');
  console.log('result.household_input:', result.household_input);
  console.log('p1 name:', result.household_input?.p1?.name);
  console.log('p2 name:', result.household_input?.p2?.name);
  console.log('strategy:', result.household_input?.strategy);
  console.log('==================================');

  if (!result.success || !result.summary) {
    return null;
  }

  const { summary } = result;

  // Use the health_score from the API (already 0-100), don't calculate from success_rate
  // success_rate is already a percentage (e.g., 22.58 for 22.58%)
  const healthScore = summary.health_score || Math.round(summary.success_rate || 0);

  // Determine health level and styling
  const getHealthLevel = (score: number) => {
    if (score >= 90) return { label: 'EXCELLENT', color: 'text-green-600', bgColor: 'bg-green-500', lightBg: 'bg-green-50', borderColor: 'border-green-200' };
    if (score >= 75) return { label: 'STRONG', color: 'text-blue-600', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (score >= 60) return { label: 'MODERATE', color: 'text-yellow-600', bgColor: 'bg-yellow-500', lightBg: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    if (score >= 40) return { label: 'NEEDS ATTENTION', color: 'text-orange-600', bgColor: 'bg-orange-500', lightBg: 'bg-orange-50', borderColor: 'border-orange-200' };
    return { label: 'AT RISK', color: 'text-red-600', bgColor: 'bg-red-500', lightBg: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const healthLevel = getHealthLevel(healthScore);

  // Generate key insights
  const insights: Array<{ type: 'success' | 'warning' | 'info'; text: string }> = [];

  // Insight 1: Asset longevity
  // success_rate is a percentage (0-100), not a decimal (0-1)
  if (summary.success_rate >= 100) {
    const endAge = result.household_input?.end_age || 95;
    insights.push({
      type: 'success',
      text: `Your assets will last to age ${endAge}${summary.final_estate_after_tax > 50000 ? ` with $${Math.round(summary.final_estate_after_tax / 1000).toLocaleString()}K remaining` : ''}`
    });
  } else if (summary.years_funded) {
    const shortfall = (summary.years_simulated || 0) - summary.years_funded;
    insights.push({
      type: 'warning',
      text: `Your plan is ${shortfall} year${shortfall !== 1 ? 's' : ''} short - assets last to age ${(result.household_input?.p1.start_age || 65) + summary.years_funded}`
    });
  }

  // Insight 2: Income consistency
  if (result.year_by_year && result.year_by_year.length > 5) {
    // Calculate after-tax income as spending_met (what was actually available after tax)
    const firstYearIncome = result.year_by_year[0].spending_met;
    const midYearIncome = result.year_by_year[Math.floor(result.year_by_year.length / 2)].spending_met;
    const incomeChange = ((midYearIncome - firstYearIncome) / firstYearIncome) * 100;

    if (Math.abs(incomeChange) < 15) {
      insights.push({
        type: 'success',
        text: 'Consistent income throughout retirement'
      });
    } else if (incomeChange < -20) {
      insights.push({
        type: 'warning',
        text: `Income drops ${Math.abs(Math.round(incomeChange))}% mid-retirement - consider adjusting withdrawals`
      });
    }
  }

  // Insight 3: CPP/OAS optimization
  const cppStartAge = result.household_input?.p1.cpp_start_age || 65;
  const oasStartAge = result.household_input?.p1.oas_start_age || 65;

  if (cppStartAge < 70 && summary.final_estate_after_tax > 100000) {
    insights.push({
      type: 'info',
      text: 'Consider delaying CPP to age 70 for 42% higher payments'
    });
  }

  if (oasStartAge < 70 && summary.final_estate_after_tax > 100000) {
    insights.push({
      type: 'info',
      text: 'Deferring OAS to age 70 increases payments by 36%'
    });
  }

  // Insight 4: Estate potential
  if (summary.final_estate_after_tax > 200000 && summary.success_rate >= 0.9) {
    insights.push({
      type: 'info',
      text: `You may be able to spend $${Math.round((summary.final_estate_after_tax * 0.3) / 1000).toLocaleString()}K more and still leave an estate`
    });
  }

  // Limit to 3-4 key insights
  const topInsights = insights.slice(0, 4);

  // Get person names for title
  const p1Name = result.household_input?.p1?.name || 'Person 1';
  const p2Name = result.household_input?.p2?.name || 'Partner 2';
  const hasP2 = result.household_input?.p2 && result.household_input.p2.name;

  // Get strategy name using helper function
  const strategy = result.household_input?.strategy;
  const strategyName = strategy ? getStrategyDisplayName(strategy) : '';
  const isDefault = strategy ? isDefaultStrategy(strategy) : false;

  // Create title with names
  const simulationTitle = hasP2
    ? `Retirement Simulation for ${p1Name} and ${p2Name}`
    : `Retirement Simulation for ${p1Name}`;

  console.log('📝 Title variables:', { p1Name, p2Name, hasP2, strategyName, isDefault, simulationTitle });

  return (
    <Card className={`${healthLevel.lightBg} ${healthLevel.borderColor} border-2 overflow-hidden`}>
      <div className="p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {simulationTitle}
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-600 mb-1">
            {strategyName && (
              <>
                <span>Strategy:</span>
                <span className="font-medium text-gray-900">{strategyName}</span>
                {isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
                <span>•</span>
              </>
            )}
            <span>Health Score: Based on your inputs and projected retirement timeline</span>
          </div>
        </div>

        {/* Health Score Display */}
        <div className="text-center mb-8">
          <div className={`text-7xl md:text-8xl font-bold ${healthLevel.color} mb-4`}>
            {healthScore}
            <span className="text-4xl md:text-5xl text-gray-400">/100</span>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <Progress
              value={healthScore}
              className="h-4 bg-gray-200"
              indicatorClassName={healthLevel.bgColor}
            />
          </div>

          {/* Health Level Label */}
          <div className={`inline-block px-6 py-2 rounded-full ${healthLevel.bgColor} text-white font-bold text-lg tracking-wide`}>
            {healthLevel.label}
          </div>
        </div>

        {/* Key Insights */}
        {topInsights.length > 0 && (
          <div className="space-y-3 mb-6">
            {topInsights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
              >
                {insight.type === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                {insight.type === 'warning' && (
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                {insight.type === 'info' && (
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm md:text-base text-gray-800 font-medium">
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* View Detailed Breakdown */}
        <div className="text-center pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              const detailsSection = document.getElementById('detailed-results');
              detailsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group"
          >
            <span>View Detailed Breakdown</span>
            <TrendingDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </Card>
  );
}
