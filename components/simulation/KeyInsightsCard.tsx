'use client';

import { SimulationResponse } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Calendar } from 'lucide-react';

interface KeyInsightsCardProps {
  result: SimulationResponse;
}

interface Insight {
  type: 'success' | 'warning' | 'suggestion' | 'info';
  icon: React.ReactNode;
  title: string;
  description: string;
  impact?: string;
}

export function KeyInsightsCard({ result }: KeyInsightsCardProps) {
  if (!result.success || !result.summary || !result.year_by_year) {
    return null;
  }

  const insights: Insight[] = [];
  const summary = result.summary;
  const yearByYear = result.year_by_year;

  // Debug logging to understand the data
  console.log('KeyInsights Debug:', {
    success_rate: summary.success_rate,
    health_score: summary.health_score,
    total_underfunded_years: summary.total_underfunded_years,
    total_underfunding: summary.total_underfunding,
    final_estate_after_tax: summary.final_estate_after_tax
  });

  // Get end age from last year of simulation
  const endAge = yearByYear.length > 0 ? yearByYear[yearByYear.length - 1].age_p1 : 95;

  // Insight 1: Success Rate Analysis
  // Check for underfunded years FIRST - but ignore microscopic rounding errors
  const ROUNDING_THRESHOLD = 1; // Ignore underfunding less than $1
  const meaningfulUnderfunding = (summary.total_underfunding || 0) > ROUNDING_THRESHOLD;

  if (summary.total_underfunded_years > 0 && meaningfulUnderfunding) {
    const shortfall = summary.total_underfunding || 0;
    const yearText = summary.total_underfunded_years === 1 ? 'year' : 'years';

    // If shortfall is very small (< $500), show a different message
    const description = shortfall < 500
      ? `Your plan has ${summary.total_underfunded_years} ${yearText} where spending goals were not fully met. The shortfall is minimal but consider reviewing your withdrawal strategy.`
      : `Your plan is underfunded for ${summary.total_underfunded_years} ${yearText} with a total shortfall of $${(shortfall / 1000).toFixed(0)}K. Consider reducing spending, delaying retirement, or increasing assets.`;

    insights.push({
      type: 'warning',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Underfunding Detected',
      description,
      impact: shortfall < 500 ? 'Minor adjustment may be needed' : 'Action needed to meet spending goals'
    });
  } else if (summary.success_rate >= 0.999) {  // Use >= 0.999 to handle floating point precision
    const finalEstate = summary.final_estate_after_tax;
    if (finalEstate > 500000) {
      insights.push({
        type: 'success',
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: 'Strong Financial Position',
        description: `Your plan is fully funded with $${(finalEstate / 1000).toFixed(0)}K remaining at age ${endAge}. You may have room to increase your retirement spending.`,
        impact: 'Potential to enhance lifestyle'
      });
    } else if (finalEstate > 100000) {
      insights.push({
        type: 'success',
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: 'Plan Successfully Funded',
        description: `Your assets will last throughout retirement with $${(finalEstate / 1000).toFixed(0)}K remaining at age ${endAge}.`,
      });
    } else {
      insights.push({
        type: 'info',
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Plan on Track',
        description: `Your plan is funded, ending with $${(finalEstate / 1000).toFixed(0)}K at age ${endAge}. Consider building more buffer for unexpected expenses.`,
      });
    }
  } else if (summary.success_rate > 0.8 && summary.success_rate < 0.999) {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Plan at Risk',
      description: `Your plan runs out of funds ${summary.first_failure_year ? `at age ${summary.first_failure_year}` : 'before your target age'}. Consider reducing spending or delaying retirement.`,
      impact: summary.total_underfunding ? `Shortfall of approximately $${(summary.total_underfunding / 1000).toFixed(0)}K` : undefined
    });
  } else {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Significant Funding Gap',
      description: `Your current plan has substantial shortfalls. ${summary.first_failure_year ? `Funds depleted at age ${summary.first_failure_year}. ` : ''}Immediate adjustments recommended.`,
      impact: summary.total_underfunding ? `Shortfall of approximately $${(summary.total_underfunding / 1000).toFixed(0)}K` : 'High priority - plan needs revision'
    });
  }

  // Insight 2: Tax Efficiency
  const avgTaxRate = summary.avg_effective_tax_rate;
  if (avgTaxRate > 0.25) {
    const annualTax = summary.total_tax_paid / summary.years_simulated;
    insights.push({
      type: 'suggestion',
      icon: <Lightbulb className="h-5 w-5" />,
      title: 'High Tax Burden Detected',
      description: `Your average effective tax rate is ${(avgTaxRate * 100).toFixed(1)}%, costing approximately $${(annualTax / 1000).toFixed(0)}K per year. Consider income-splitting strategies or TFSA prioritization.`,
      impact: 'Potential tax savings available'
    });
  } else if (avgTaxRate < 0.15 && avgTaxRate > 0) {
    insights.push({
      type: 'success',
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: 'Tax-Efficient Plan',
      description: `Your effective tax rate of ${(avgTaxRate * 100).toFixed(1)}% indicates good tax planning. Current withdrawal strategy appears optimal.`,
    });
  }

  // Insight 3: CPP/OAS Optimization (if data available)
  if (result.household_input) {
    const p1CppStart = result.household_input.p1.cpp_start_age;
    const p1CurrentAge = result.household_input.p1.start_age;

    if (p1CppStart && p1CppStart < 70 && p1CppStart > p1CurrentAge) {
      const yearsToDelay = 70 - p1CppStart;
      const potentialIncrease = yearsToDelay * 0.084; // 8.4% per year after 65
      const cppAnnual = result.household_input.p1.cpp_annual_at_start || 0;
      const lifetimeBenefit = cppAnnual * potentialIncrease * (endAge - 70);

      if (lifetimeBenefit > 20000) {
        insights.push({
          type: 'suggestion',
          icon: <Lightbulb className="h-5 w-5" />,
          title: 'CPP Deferral Opportunity',
          description: `Delaying CPP from age ${p1CppStart} to 70 could increase lifetime benefits by approximately $${(lifetimeBenefit / 1000).toFixed(0)}K.`,
          impact: 'Consider if assets allow deferral'
        });
      }
    }
  }

  // Insight 4: Spending Pattern Analysis
  const firstYearSpending = yearByYear[0]?.spending_met || 0;
  const lastYearSpending = yearByYear[yearByYear.length - 1]?.spending_met || 0;
  const spendingDecline = (firstYearSpending - lastYearSpending) / firstYearSpending;

  if (spendingDecline > 0.4) {
    insights.push({
      type: 'info',
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Three-Phase Spending Model Active',
      description: `Your spending declines ${(spendingDecline * 100).toFixed(0)}% over retirement, from $${(firstYearSpending / 1000).toFixed(0)}K to $${(lastYearSpending / 1000).toFixed(0)}K annually. This aligns with typical retirement patterns.`,
    });
  }

  // Insight 5: Asset Depletion Timing
  // Only show this if we DON'T have underfunding insight (avoid duplication)
  if (summary.first_failure_year && summary.total_underfunded_years === 0) {
    const yearsShort = endAge - summary.first_failure_year;
    const additionalNeeded = summary.total_underfunding || Math.abs(summary.final_estate_after_tax);

    // Only show if yearsShort is positive (valid calculation)
    if (yearsShort > 0) {
      insights.push({
        type: 'suggestion',
        icon: <DollarSign className="h-5 w-5" />,
        title: 'Funding Gap Identified',
        description: `To fully fund your plan, you need approximately $${(additionalNeeded / 1000).toFixed(0)}K more in assets, or reduce annual spending by about $${(additionalNeeded / yearsShort / 1000).toFixed(0)}K.`,
        impact: `${yearsShort} years underfunded`
      });
    }
  }

  // Insight 6: Estate Planning Opportunity
  if (summary.final_estate_after_tax > 1000000 && summary.success_rate === 1.0) {
    insights.push({
      type: 'suggestion',
      icon: <Lightbulb className="h-5 w-5" />,
      title: 'Significant Estate Remaining',
      description: `You're projected to leave $${(summary.final_estate_after_tax / 1000000).toFixed(1)}M to your estate. Consider gifting strategies, charitable donations, or increased spending.`,
      impact: 'Estate planning opportunities'
    });
  }

  // Limit to top 5 insights
  const topInsights = insights.slice(0, 5);

  if (topInsights.length === 0) {
    return null;
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'suggestion':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'suggestion':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'destructive';
      case 'suggestion':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border-2 border-blue-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-xl font-bold text-gray-900">Key Insights & Recommendations</CardTitle>
        </div>
        <CardDescription>
          AI-generated observations about your retirement plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topInsights.map((insight, index) => (
          <Alert key={index} className={`${getInsightColor(insight.type)} border-2`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${getIconColor(insight.type)}`}>
                {insight.icon}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <AlertDescription className="font-semibold text-gray-900 text-base">
                    {insight.title}
                  </AlertDescription>
                  {insight.type === 'suggestion' && (
                    <Badge variant={getBadgeVariant(insight.type)} className="shrink-0">
                      Suggestion
                    </Badge>
                  )}
                  {insight.type === 'warning' && (
                    <Badge variant={getBadgeVariant(insight.type)} className="shrink-0">
                      Action Needed
                    </Badge>
                  )}
                </div>
                <AlertDescription className="text-gray-700 text-sm">
                  {insight.description}
                </AlertDescription>
                {insight.impact && (
                  <AlertDescription className="text-xs text-gray-600 font-medium italic">
                    💡 {insight.impact}
                  </AlertDescription>
                )}
              </div>
            </div>
          </Alert>
        ))}

        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            These insights are generated automatically based on your simulation results. Always consult with a financial advisor for personalized advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
