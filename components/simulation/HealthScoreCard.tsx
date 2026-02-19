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

  const getCriterionTooltipInfoDynamic = (key: string, criterion: HealthCriterion, summary: SimulationSummary) => {
    const score = criterion.score;
    const maxScore = criterion.max_score;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    const tooltips: Record<string, { title: string; content: string; examples: string[] }> = {
      funding_coverage: {
        title: percentage >= 80 ? "Full Period Funded ✅" : "Full Period Funded - Action Needed",
        content: percentage >= 80
          ? `Excellent! Your plan funds ${summary.years_funded}/${summary.years_simulated} years (${(summary.success_rate * 100).toFixed(0)}%). You have sufficient funds for your entire retirement.`
          : `Your plan only funds ${summary.years_funded}/${summary.years_simulated} years (${(summary.success_rate * 100).toFixed(0)}%). You need to fund at least 80% of retirement years for a secure plan.`,
        examples: percentage >= 80 ? [
          "✅ Your spending is sustainable",
          "✅ You have adequate savings",
          "✅ Your withdrawal strategy works",
          "💡 Consider increasing spending if desired",
          "💡 Monitor annually for changes"
        ] : [
          "💡 Reduce spending by 10-20% to extend coverage",
          "💡 Delay retirement by 1-2 years to save more",
          "💡 Work part-time in early retirement",
          "💡 Try 'rrif-miser' strategy to preserve capital",
          "💡 Consider downsizing or relocating"
        ]
      },
      tax_efficiency: {
        title: percentage >= 80 ? "Tax Efficiency - Optimized! ✅" : "Tax Efficiency - Room to Improve",
        content: percentage >= 80
          ? `Great! Your effective tax rate of ${(summary.avg_effective_tax_rate * 100).toFixed(1)}% is well optimized. You're keeping more of your money.`
          : `Your effective tax rate of ${(summary.avg_effective_tax_rate * 100).toFixed(1)}% could be lower with better planning.`,
        examples: percentage >= 80 ? [
          "✅ TFSA withdrawals are maximized",
          "✅ RRIF withdrawals are tax-efficient",
          "✅ Income splitting is working (if applicable)",
          "💡 Monitor OAS clawback threshold ($86,912 in 2024)",
          "💡 Review strategy annually"
        ] : [
          "💡 Prioritize TFSA withdrawals (tax-free)",
          "💡 Smooth RRIF withdrawals to avoid high brackets",
          "💡 Split pension income with spouse if eligible",
          "💡 Time CPP/OAS to minimize taxes",
          "💡 Consider RRSP to TFSA conversions"
        ]
      },
      estate_preservation: {
        title: percentage >= 80 ? "Adequate Reserve - Well Preserved ✅" : "Adequate Reserve - Below Target",
        content: percentage >= 80
          ? `Excellent! You'll have ${((summary.final_estate / summary.starting_assets) * 100).toFixed(0)}% of starting assets remaining. This provides both security and legacy.`
          : `You'll only have ${((summary.final_estate / summary.starting_assets) * 100).toFixed(0)}% of starting assets remaining, below the 80% target for optimal security.`,
        examples: percentage >= 80 ? [
          "✅ Emergency buffer is maintained",
          "✅ Legacy goals are achievable",
          "✅ Longevity risk is covered",
          "💡 Review beneficiary designations",
          "💡 Consider estate planning strategies"
        ] : [
          `💡 Target: Preserve $${((summary.starting_assets * 0.8) / 1000).toFixed(0)}K by end`,
          "💡 Reduce annual spending by 5-10%",
          "💡 Delay CPP to age 70 for 42% more income",
          "💡 Use more conservative withdrawal strategy",
          "💡 Consider annuity for guaranteed income"
        ]
      },
      benefit_optimization: {
        title: percentage >= 80 ? "Government Benefits - Maximized! ✅" : "Government Benefits - Optimization Needed",
        content: percentage >= 80
          ? "Perfect! You're receiving all available government benefits with optimal timing and no clawbacks."
          : "You may be missing out on government benefits or facing unnecessary clawbacks.",
        examples: percentage >= 80 ? [
          "✅ CPP timing is optimized",
          "✅ OAS is received without clawback",
          "✅ GIS eligibility considered if applicable",
          "💡 Review when tax rules change",
          "💡 Consider survivor benefit planning"
        ] : [
          "💡 Review CPP timing (60-70 age range)",
          "💡 Check OAS clawback threshold",
          "💡 Explore GIS eligibility if low income",
          "💡 Consider income splitting strategies",
          "💡 Verify all benefits are claimed"
        ]
      },
      risk_management: {
        title: percentage >= 80 ? "Net Worth Trend - Positive! ✅" : "Net Worth Trend - Concerning",
        content: percentage >= 80
          ? "Excellent! Your net worth remains stable or grows during retirement, providing excellent financial security."
          : `Warning: Your net worth is declining rapidly. You'll deplete ${(100 - (summary.final_estate / summary.starting_assets) * 100).toFixed(0)}% of your assets.`,
        examples: percentage >= 80 ? [
          "✅ Sustainable withdrawal rate",
          "✅ Investment returns cover inflation",
          "✅ Longevity risk is managed",
          "💡 Consider increasing spending if desired",
          "💡 Review investment allocation"
        ] : [
          "💡 Reduce spending immediately by 10-15%",
          "💡 Switch to 'rrif-miser' strategy",
          "💡 Review and cut discretionary expenses",
          "💡 Consider guaranteed income products",
          "💡 Explore home equity options if applicable"
        ]
      }
    };

    return tooltips[key] || {
      title: getCriterionLabel(key),
      content: criterion.description || "This criterion evaluates an aspect of your retirement plan health.",
      examples: [`Current score: ${score}/${maxScore}`]
    };
  };

  const getCriterionTooltipInfo = (key: string) => {
    const tooltips: Record<string, { title: string; content: string; examples: string[] }> = {
      funding_coverage: {
        title: "Full Period Funded - How to Improve",
        content: "Your plan currently funds only 42% of retirement years (8 out of 19 years). This means you'll run out of money before the end of your planned retirement. To earn points here, you need to fund at least 80% of your retirement years.",
        examples: [
          "💡 Reduce spending: Lower your Go-Go phase spending from $90,000",
          "💡 Work longer: Delay retirement by 1-2 years to save more",
          "💡 Increase savings: Maximize RRSP/TFSA contributions now",
          "💡 Adjust strategy: Try 'balanced' or 'rrif-miser' withdrawal strategies",
          "💡 Consider part-time income in early retirement"
        ]
      },
      tax_efficiency: {
        title: "Good Tax Efficiency - You're Doing Great!",
        content: "Excellent! Your effective tax rate is under 25%, earning you full points. This means your withdrawal strategy is tax-optimized. Keep using these strategies to maintain this score.",
        examples: [
          "✅ You're maximizing TFSA withdrawals (tax-free)",
          "✅ Strategic RRIF withdrawals are minimizing tax brackets",
          "✅ Income splitting with partner (if applicable) is working",
          "✅ Timing of CPP/OAS is tax-efficient",
          "💡 Continue monitoring for OAS clawback thresholds"
        ]
      },
      estate_preservation: {
        title: "Adequate Reserve - Needs Improvement",
        content: "Your ending assets are only 42% of starting assets, below the 80% target for full points. This affects both your emergency buffer and legacy potential. You need to preserve more capital throughout retirement.",
        examples: [
          "💡 Reduce spending by $5,000-10,000 annually",
          "💡 Consider downsizing home to free up capital",
          "💡 Delay CPP/OAS to age 70 for 42% higher benefits",
          "💡 Use more conservative withdrawal strategy",
          "💡 Target: Keep at least $320,000 by end of retirement"
        ]
      },
      benefit_optimization: {
        title: "Government Benefits - Maximized!",
        content: "Perfect score! You're receiving all available government benefits (CPP, OAS, and potentially GIS). Your benefit timing and income management are optimized for maximum lifetime benefits.",
        examples: [
          "✅ CPP timing is optimized for your situation",
          "✅ OAS benefits are being received without clawback",
          "✅ GIS eligibility is being considered if applicable",
          "✅ Survivor benefits are factored in if relevant",
          "💡 Review annually as rules and thresholds change"
        ]
      },
      risk_management: {
        title: "Growing Net Worth - Critical Issue",
        content: "Your net worth is declining significantly during retirement. By the end, you'll have depleted most assets. This creates risk if you live longer than expected or face unexpected expenses.",
        examples: [
          "💡 Reduce annual spending by 10-15% immediately",
          "💡 Adopt 'rrif-miser' strategy to preserve capital",
          "💡 Consider annuity for guaranteed lifetime income",
          "💡 Review and reduce discretionary expenses",
          "💡 Explore reverse mortgage if you own your home"
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
    const tooltipInfo = getCriterionTooltipInfoDynamic(key, criterion, summary);

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
