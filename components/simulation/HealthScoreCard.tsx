'use client';

import { SimulationSummary, HealthCriterion } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface HealthScoreCardProps {
  summary: SimulationSummary;
}

export function HealthScoreCard({ summary }: HealthScoreCardProps) {
  const { health_score, health_rating, health_criteria } = summary;

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return '!bg-blue-600';      // Excellent: Dark blue
    if (score >= 70) return '!bg-green-600';     // Good: Dark green
    if (score >= 50) return '!bg-yellow-100';    // Fair: Light yellow
    return '!bg-red-100';                        // Poor: Light red
  };

  // Determine text color for optimal contrast
  // Excellent (90+) & Good (70-89): WHITE text on dark backgrounds
  // Fair (50-69) & Poor (<50): BLACK text on light backgrounds
  const getTextColor = (score: number) => {
    if (score >= 70) return 'text-white';           // White on blue/green
    return 'text-gray-900 dark:text-gray-900';      // Black on yellow/red
  };

  const getTextColorSecondary = (score: number) => {
    if (score >= 70) return 'text-white/90';
    return 'text-gray-700 dark:text-gray-800';
  };

  const getTextColorMuted = (score: number) => {
    if (score >= 70) return 'text-white/75';
    return 'text-gray-600 dark:text-gray-700';
  };

  const getBadgeColor = (score: number) => {
    // Ensure badge has border and proper contrast on colored backgrounds
    // Using solid colors for better visibility
    if (score >= 70) return 'bg-white border-2 border-white text-gray-900 shadow-md';
    return 'bg-gray-900 border-2 border-gray-900 text-white shadow-md';
  };

  const getIconColor = (score: number) => {
    if (score >= 70) return 'text-white';
    return 'text-gray-900 dark:text-gray-900';
  };

  const getBorderColor = (score: number) => {
    if (score >= 70) return 'border-white/20';
    return 'border-gray-900/20 dark:border-gray-800/30';
  };

  const getCriterionIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'fair':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'at risk':
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCriterionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      funding_coverage: 'Funding Coverage',
      tax_efficiency: 'Tax Efficiency',
      estate_preservation: 'Estate Preservation',
      benefit_optimization: 'Benefit Optimization',
      risk_management: 'Risk Management',
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getCriterionTooltipInfo = (key: string) => {
    const tooltips: Record<string, { title: string; content: string; examples: string[] }> = {
      funding_coverage: {
        title: "Full Period Funded",
        content: "Measures whether your retirement plan can cover your spending needs for all years of retirement. A fully funded plan ensures you won't run out of money.",
        examples: [
          "20/20 points: Plan funds 100% of retirement years",
          "10/20 points: Plan funds about 50% of years",
          "0/20 points: Plan funds less than 42% of years",
          "Target: Fund at least 80% of retirement years"
        ]
      },
      tax_efficiency: {
        title: "Good Tax Efficiency",
        content: "Evaluates how effectively your plan minimizes taxes through strategic withdrawals and income splitting. Lower effective tax rates mean more money stays in your pocket.",
        examples: [
          "20/20 points: Effective tax rate under 25%",
          "10/20 points: Effective tax rate around 30%",
          "0/20 points: Effective tax rate over 35%",
          "Optimize with TFSA, income splitting, and timing"
        ]
      },
      estate_preservation: {
        title: "Adequate Reserve",
        content: "Assesses whether you'll have sufficient assets remaining as a buffer or estate. A good reserve provides security and legacy potential.",
        examples: [
          "20/20 points: Ending assets exceed 80% of starting",
          "10/20 points: Ending assets around 40% of starting",
          "0/20 points: Ending assets below 20% of starting",
          "Consider both emergency fund and legacy goals"
        ]
      },
      benefit_optimization: {
        title: "Government Benefits",
        content: "Measures how well you're maximizing government benefits like CPP, OAS, and GIS. Optimal timing and income management can significantly increase lifetime benefits.",
        examples: [
          "20/20 points: Receiving all available benefits",
          "Benefits include CPP, OAS, and potentially GIS",
          "Consider deferral strategies for higher payments",
          "Income splitting can help avoid OAS clawback"
        ]
      },
      risk_management: {
        title: "Growing Net Worth",
        content: "Evaluates whether your net worth is maintained or growing during retirement. Positive trends indicate sustainable spending and good investment returns.",
        examples: [
          "20/20 points: Net worth growing or stable",
          "10/20 points: Moderate decline in net worth",
          "0/20 points: Significant net worth depletion",
          "Balance spending with asset preservation"
        ]
      }
    };
    return tooltips[key] || {
      title: getCriterionLabel(key),
      content: "This criterion evaluates an aspect of your retirement plan health.",
      examples: []
    };
  };

  const renderCriterion = (key: string, criterion: HealthCriterion) => {
    const percentage = criterion.max_score > 0 ? (criterion.score / criterion.max_score) * 100 : 0;
    const tooltipInfo = getCriterionTooltipInfo(key);

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getCriterionIcon(criterion.status)}
            <span className={`text-sm font-medium ${getTextColor(health_score)}`}>{getCriterionLabel(key)}</span>
            <InfoTooltip
              title={tooltipInfo.title}
              content={tooltipInfo.content}
              examples={tooltipInfo.examples}
            />
          </div>
          <span className={`text-sm font-bold ${getTextColor(health_score)}`}>
            {criterion.score}/{criterion.max_score}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className={`text-xs ${getTextColorMuted(health_score)}`}>{criterion.description}</p>
      </div>
    );
  };

  // If health_criteria is not available, compute from summary
  const hasHealthCriteria = health_criteria && Object.keys(health_criteria).length > 0;

  return (
    <Card className={`${getScoreBackground(health_score)} border-2`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`h-5 w-5 ${getIconColor(health_score)}`} />
            <div className="flex items-center">
              <CardTitle className={getTextColor(health_score)}>Plan Health Score</CardTitle>
              <InfoTooltip
                title="Plan Health Score"
                content="A comprehensive 0-100 score that evaluates the overall strength of your retirement plan. It considers multiple factors including funding adequacy, tax efficiency, estate preservation, and benefit optimization. A higher score indicates a more robust and sustainable retirement plan."
                examples={[
                  "90-100: Excellent - Plan exceeds all targets with significant buffer",
                  "70-89: Good - Plan meets most goals with reasonable safety margin",
                  "50-69: Fair - Plan has some gaps but is generally workable",
                  "Below 50: Needs Attention - Significant adjustments recommended"
                ]}
              />
            </div>
          </div>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors ${getBadgeColor(health_score)}`}>
            {health_rating || 'Not Calculated'}
          </div>
        </div>
        <CardDescription className={getTextColorSecondary(health_score)}>Overall assessment of your retirement plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="flex items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(health_score / 100) * 283} 283`}
                className={getScoreColor(health_score)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getTextColor(health_score)}`} data-testid="health-score">{health_score}</span>
              <span className={`text-xs ${getTextColorMuted(health_score)}`}>out of 100</span>
            </div>
          </div>
        </div>

        {/* Criteria Breakdown */}
        {hasHealthCriteria && (
          <div className={`space-y-4 pt-4 border-t ${getBorderColor(health_score)}`}>
            <div className="flex items-center">
              <h4 className={`text-sm font-semibold ${getTextColor(health_score)}`}>Score Breakdown</h4>
              <InfoTooltip
                title="Score Breakdown"
                content="Your Plan Health Score is calculated based on five key criteria, each worth 20 points. Meeting or exceeding targets in each area contributes to your overall score."
                examples={[
                  "Full Period Funded: Can you cover all retirement years?",
                  "Adequate Reserve: Do you have enough buffer?",
                  "Tax Efficiency: Are you minimizing taxes?",
                  "Government Benefits: Are you maximizing CPP/OAS/GIS?",
                  "Growing Net Worth: Is your wealth preserved?"
                ]}
              />
            </div>
            {Object.entries(health_criteria).map(([key, criterion]) =>
              renderCriterion(key, criterion as HealthCriterion)
            )}
          </div>
        )}

        {/* Summary stats if no criteria */}
        {!hasHealthCriteria && (
          <div className={`space-y-3 pt-4 border-t ${getBorderColor(health_score)}`}>
            <h4 className={`text-sm font-semibold ${getTextColor(health_score)}`}>Key Indicators</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className={getTextColorMuted(health_score)}>Success Rate</p>
                <p className={`font-medium ${getTextColor(health_score)}`}>{(summary.success_rate * 100).toFixed(1)}%</p>
                {typeof summary.success_rate === 'number' && (
                  <p className={`text-xs ${getTextColorMuted(health_score)} mt-0.5`}>
                    {summary.success_rate >= 0.9 ? 'Fully funded' :
                     summary.success_rate >= 0.7 ? 'Strong funding' :
                     summary.success_rate >= 0.5 ? 'Partial funding' :
                     'Limited funding'}
                  </p>
                )}
              </div>
              <div>
                <p className={getTextColorMuted(health_score)}>Years Funded</p>
                <p className={`font-medium ${getTextColor(health_score)}`}>
                  {summary.years_funded}/{summary.years_simulated}
                </p>
                {summary.first_failure_year && (
                  <p className={`text-xs ${getTextColorMuted(health_score)} mt-0.5`}>
                    Shortfall starts: {summary.first_failure_year}
                  </p>
                )}
              </div>
              <div>
                <p className={getTextColorMuted(health_score)}>Tax Efficiency</p>
                <p className={`font-medium ${getTextColor(health_score)}`}>{(summary.avg_effective_tax_rate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className={getTextColorMuted(health_score)}>Net Worth Trend</p>
                <p className={`font-medium ${getTextColor(health_score)}`}>{summary.net_worth_trend || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
