"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Check, X } from "lucide-react";
import { getStrategyDisplayName } from "@/lib/types/simulation";

interface OptimizationResult {
  optimized: boolean;
  original_strategy: string;
  optimized_strategy: string;
  optimization_reason: string;
  original_success_rate: number;
  optimized_success_rate: number;
  gaps_eliminated: number;
  tax_increase_pct: number;
  tax_increase_amount: number;
}

interface OptimizationSuggestionProps {
  optimization: OptimizationResult;
  onAccept: () => void;
  onDismiss: () => void;
}

export function OptimizationSuggestion({
  optimization,
  onAccept,
  onDismiss,
}: OptimizationSuggestionProps) {
  const improvement =
    (optimization.optimized_success_rate - optimization.original_success_rate) * 100;

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-6">
      <Lightbulb className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-lg font-semibold text-blue-900">
        Better Strategy Available
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-4 mt-3">
          <p className="text-gray-700">
            We found a strategy that could improve your retirement plan:
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {/* Current Strategy */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">
                Current: {getStrategyDisplayName(optimization.original_strategy)}
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  • {(optimization.original_success_rate * 100).toFixed(1)}% success
                  rate
                </p>
                <p className="text-orange-600 font-medium">
                  • {optimization.gaps_eliminated} years with funding gaps
                </p>
              </div>
            </div>

            {/* Suggested Strategy */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-blue-900">
                  Suggested: {getStrategyDisplayName(optimization.optimized_strategy)}
                </p>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
                  RECOMMENDED
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-green-700 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {(optimization.optimized_success_rate * 100).toFixed(1)}% success
                  rate (+{improvement.toFixed(1)}%)
                </p>
                <p className="text-gray-700">
                  • {optimization.optimization_reason}
                </p>
                {optimization.tax_increase_pct !== 0 && (
                  <p className="text-gray-600">
                    • Tax impact: {optimization.tax_increase_pct > 0 ? "+" : ""}
                    {optimization.tax_increase_pct.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={onAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Try {getStrategyDisplayName(optimization.optimized_strategy)}
            </Button>
            <Button
              onClick={onDismiss}
              variant="outline"
              className="sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Keep Current Strategy
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can always change strategies later in the Input tab
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
