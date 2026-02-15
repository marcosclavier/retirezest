'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  ExternalLink,
  ArrowLeft,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { type FailureAnalysis, type FailureReason } from '@/lib/analysis/failureReasons';

interface LowSuccessRateWarningProps {
  analysis: FailureAnalysis;
  onAdjustPlan: () => void;
  onDismiss: () => void;
  open: boolean;
}

const ICON_MAP: Record<FailureReason['type'], React.ElementType> = {
  early_retirement: Calendar,
  insufficient_savings: DollarSign,
  no_income: TrendingDown,
  high_expenses: Target,
  income_gap: Calendar,
  low_cpp_oas: TrendingDown,
};

const SEVERITY_COLORS: Record<FailureReason['severity'], 'destructive' | 'default' | 'secondary'> = {
  critical: 'destructive',
  high: 'default',
  medium: 'secondary',
};

export function LowSuccessRateWarning({
  analysis,
  onAdjustPlan,
  onDismiss,
  open,
}: LowSuccessRateWarningProps) {
  const [showAllReasons, setShowAllReasons] = useState(false);

  if (!analysis.hasLowSuccessRate) {
    return null;
  }

  const displayReasons = showAllReasons
    ? analysis.failureReasons
    : analysis.failureReasons.slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                Your Retirement Plan Needs Attention
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Success Rate: <span className="font-bold text-orange-600">{analysis.successRate.toFixed(1)}%</span>
                <br />
                <span className="text-sm text-gray-600">
                  This means your money lasts to age 95 in only {analysis.successRate.toFixed(1)}% of simulated market scenarios.
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* What This Means */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">What This Means</AlertTitle>
            <AlertDescription className="text-blue-800">
              A success rate below 10% indicates a high risk of running out of money before age 95.
              We've identified specific issues with your current plan that need to be addressed.
            </AlertDescription>
          </Alert>

          {/* Primary Issue (if exists) */}
          {analysis.primaryIssue && (
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Badge variant={SEVERITY_COLORS[analysis.primaryIssue.severity]}>
                    PRIMARY ISSUE
                  </Badge>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-2">
                    {analysis.primaryIssue.title}
                  </h4>
                  <p className="text-sm text-orange-800 mb-3">
                    {analysis.primaryIssue.message}
                  </p>
                  {analysis.primaryIssue.calculation && (
                    <div className="bg-white border border-orange-200 rounded p-3 mb-3">
                      <p className="text-xs font-mono text-orange-900">
                        {analysis.primaryIssue.calculation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* All Failure Reasons */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Why Your Plan May Not Work
            </h3>

            {displayReasons.map((reason, index) => {
              const Icon = ICON_MAP[reason.type];

              return (
                <Alert
                  key={index}
                  variant={reason.severity === 'critical' ? 'destructive' : 'default'}
                  className="border-l-4"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {reason.title}
                        <Badge variant={SEVERITY_COLORS[reason.severity]} className="text-xs">
                          {reason.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2 space-y-3">
                        <p>{reason.message}</p>

                        {reason.calculation && (
                          <div className="bg-gray-50 dark:bg-gray-900 border rounded p-2">
                            <p className="text-xs font-mono">{reason.calculation}</p>
                          </div>
                        )}

                        {/* Recommendations */}
                        <div className="mt-3">
                          <p className="text-sm font-semibold mb-2">How to Fix This:</p>
                          <ul className="space-y-1.5 text-sm">
                            {reason.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              );
            })}

            {/* Show More/Less Button */}
            {analysis.failureReasons.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllReasons(!showAllReasons)}
                className="w-full"
              >
                {showAllReasons
                  ? `Show Less`
                  : `Show ${analysis.failureReasons.length - 2} More Issue${analysis.failureReasons.length - 2 > 1 ? 's' : ''}`}
              </Button>
            )}
          </div>

          {/* Quick Summary */}
          {analysis.incomeGapYears > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">Income Gap Alert</AlertTitle>
              <AlertDescription className="text-yellow-800">
                You'll have <strong>{analysis.incomeGapYears} years</strong> between retirement and when
                CPP/OAS begins. This period needs special planning - consider building a dedicated "bridge fund"
                or planning for part-time income.
              </AlertDescription>
            </Alert>
          )}

          {/* Resources */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Helpful Resources
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <a
                  href="/guides/early-retirement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Early Retirement Planning Guide <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="/guides/withdrawal-strategies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Understanding Withdrawal Strategies <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="/guides/cpp-oas-timing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Optimizing CPP & OAS Timing <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
          <Button variant="outline" onClick={onDismiss} className="sm:flex-1">
            I Understand, Continue Anyway
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/contact', '_blank')}
            className="sm:flex-1"
          >
            <Phone className="h-4 w-4 mr-2" />
            Talk to an Advisor
          </Button>
          <Button onClick={onAdjustPlan} className="sm:flex-1 bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Adjust My Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
