'use client';

import { SimulationSummary, HealthCriterion } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

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
    if (score >= 80) return 'bg-green-100 dark:bg-green-950';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-950';
    return 'bg-red-100 dark:bg-red-950';
  };

  const getRatingBadgeVariant = (rating: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (rating?.toLowerCase()) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';
      case 'fair':
        return 'outline';
      case 'at risk':
        return 'destructive';
      default:
        return 'outline';
    }
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

  const renderCriterion = (key: string, criterion: HealthCriterion) => {
    const percentage = criterion.max_score > 0 ? (criterion.score / criterion.max_score) * 100 : 0;

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getCriterionIcon(criterion.status)}
            <span className="text-sm font-medium">{getCriterionLabel(key)}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {criterion.score}/{criterion.max_score}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">{criterion.description}</p>
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
            <Activity className="h-5 w-5" />
            <CardTitle>Plan Health Score</CardTitle>
          </div>
          <Badge variant={getRatingBadgeVariant(health_rating)}>{health_rating || 'Not Calculated'}</Badge>
        </div>
        <CardDescription>Overall assessment of your retirement plan</CardDescription>
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
              <span className={`text-4xl font-bold ${getScoreColor(health_score)}`}>{health_score}</span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
          </div>
        </div>

        {/* Criteria Breakdown */}
        {hasHealthCriteria && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold">Score Breakdown</h4>
            {Object.entries(health_criteria).map(([key, criterion]) =>
              renderCriterion(key, criterion as HealthCriterion)
            )}
          </div>
        )}

        {/* Summary stats if no criteria */}
        {!hasHealthCriteria && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-semibold">Key Indicators</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Success Rate</p>
                <p className="font-medium">{(summary.success_rate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Years Funded</p>
                <p className="font-medium">
                  {summary.years_funded}/{summary.years_simulated}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tax Efficiency</p>
                <p className="font-medium">{(summary.avg_effective_tax_rate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net Worth Trend</p>
                <p className="font-medium">{summary.net_worth_trend || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
