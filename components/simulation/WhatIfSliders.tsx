'use client';

import { useState } from 'react';
import { SimulationResponse } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, RotateCcw, Sparkles, Play, Loader2, AlertCircle } from 'lucide-react';

interface WhatIfSlidersProps {
  result: SimulationResponse;
  onScenarioChange?: (adjustments: ScenarioAdjustments) => void;
}

export interface ScenarioAdjustments {
  spendingMultiplier: number;  // 0.5 to 1.5 (50% to 150%)
  retirementAgeShift: number;  // -5 to +5 years
  cppStartAgeShift: number;    // -5 to +5 years (but min 60, max 70)
  oasStartAgeShift: number;    // -5 to +5 years (but min 65, max 70)
}

export function WhatIfSliders({ result, onScenarioChange }: WhatIfSlidersProps) {
  const [adjustments, setAdjustments] = useState<ScenarioAdjustments>({
    spendingMultiplier: 1.0,
    retirementAgeShift: 0,
    cppStartAgeShift: 0,
    oasStartAgeShift: 0,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Original values from simulation
  const originalRetirementAge = result.household_input?.p1.start_age || 65;
  const originalCppAge = result.household_input?.p1.cpp_start_age || 65;
  const originalOasAge = result.household_input?.p1.oas_start_age || 65;

  // Calculated values based on adjustments
  const newRetirementAge = originalRetirementAge + adjustments.retirementAgeShift;
  const newCppAge = Math.max(60, Math.min(70, originalCppAge + adjustments.cppStartAgeShift));
  const newOasAge = Math.max(65, Math.min(70, originalOasAge + adjustments.oasStartAgeShift));

  // Check if adjustments have been made
  const checkHasChanges = () => {
    return (
      adjustments.spendingMultiplier !== 1.0 ||
      adjustments.retirementAgeShift !== 0 ||
      adjustments.cppStartAgeShift !== 0 ||
      adjustments.oasStartAgeShift !== 0
    );
  };

  const handleAdjustmentChange = (field: keyof ScenarioAdjustments, value: number) => {
    const newAdjustments = { ...adjustments, [field]: value };
    setAdjustments(newAdjustments);

    // Check if new adjustments have changes (using newAdjustments, not old state)
    const hasAnyChanges = (
      newAdjustments.spendingMultiplier !== 1.0 ||
      newAdjustments.retirementAgeShift !== 0 ||
      newAdjustments.cppStartAgeShift !== 0 ||
      newAdjustments.oasStartAgeShift !== 0
    );
    setHasChanges(hasAnyChanges);

    // Clear previous What-If result when adjustments change
    setWhatIfResult(null);

    if (onScenarioChange) {
      onScenarioChange(newAdjustments);
    }
  };

  const handleReset = () => {
    setAdjustments({
      spendingMultiplier: 1.0,
      retirementAgeShift: 0,
      cppStartAgeShift: 0,
      oasStartAgeShift: 0,
    });
    setHasChanges(false);
    setWhatIfResult(null);
    setError(null);
  };

  const handleRunScenario = async () => {
    if (!result.household_input) {
      setError('No household input available');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/simulation/what-if', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          household: result.household_input,
          adjustments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run What-If scenario');
      }

      if (data.success) {
        setWhatIfResult(data);
      } else {
        setError(data.message || 'Simulation failed');
      }
    } catch (err) {
      console.error('What-If scenario error:', err);
      setError(err instanceof Error ? err.message : 'Failed to run What-If scenario');
    } finally {
      setIsRunning(false);
    }
  };

  if (!result.summary || !result.household_input) {
    return null;
  }

  // Use health_score from API or fallback to success_rate (already in percentage)
  const baseHealthScore = result.summary.health_score || Math.round(result.summary.success_rate || 0);
  const baseFinalEstate = result.summary.final_estate_after_tax;

  const whatIfHealthScore = whatIfResult?.summary
    ? (whatIfResult.summary.health_score || Math.round(whatIfResult.summary.success_rate || 0))
    : null;
  const whatIfFinalEstate = whatIfResult?.summary?.final_estate_after_tax || null;

  const healthScoreChange = whatIfHealthScore !== null ? whatIfHealthScore - baseHealthScore : null;
  const estateChange = whatIfFinalEstate !== null ? whatIfFinalEstate - baseFinalEstate : null;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle>What-If Scenarios</CardTitle>
          </div>
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
        <CardDescription>
          Explore how changes to your plan would impact your retirement
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Spending Adjustment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Spending Level
            </label>
            <Badge variant={adjustments.spendingMultiplier < 1.0 ? 'default' : 'secondary'}>
              {Math.round(adjustments.spendingMultiplier * 100)}%
            </Badge>
          </div>
          <Slider
            value={[adjustments.spendingMultiplier * 100]}
            onValueChange={(values) =>
              handleAdjustmentChange('spendingMultiplier', values[0] / 100)
            }
            min={50}
            max={150}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-gray-700">
            {adjustments.spendingMultiplier < 1.0
              ? `Reduce spending by ${Math.round((1.0 - adjustments.spendingMultiplier) * 100)}%`
              : adjustments.spendingMultiplier > 1.0
              ? `Increase spending by ${Math.round((adjustments.spendingMultiplier - 1.0) * 100)}%`
              : 'Current planned spending'}
          </p>
        </div>

        {/* Retirement Age Adjustment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Retirement Age
            </label>
            <Badge variant={adjustments.retirementAgeShift > 0 ? 'default' : 'secondary'}>
              Age {newRetirementAge}
            </Badge>
          </div>
          <Slider
            value={[adjustments.retirementAgeShift + 5]}
            onValueChange={(values) =>
              handleAdjustmentChange('retirementAgeShift', values[0] - 5)
            }
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-700">
            {adjustments.retirementAgeShift > 0
              ? `Retire ${adjustments.retirementAgeShift} year${adjustments.retirementAgeShift !== 1 ? 's' : ''} later`
              : adjustments.retirementAgeShift < 0
              ? `Retire ${Math.abs(adjustments.retirementAgeShift)} year${Math.abs(adjustments.retirementAgeShift) !== 1 ? 's' : ''} earlier`
              : `Retire at age ${originalRetirementAge} (current plan)`}
          </p>
        </div>

        {/* CPP Start Age Adjustment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              CPP Start Age
            </label>
            <Badge variant={adjustments.cppStartAgeShift > 0 ? 'default' : 'secondary'}>
              Age {newCppAge}
            </Badge>
          </div>
          <Slider
            value={[adjustments.cppStartAgeShift + 5]}
            onValueChange={(values) =>
              handleAdjustmentChange('cppStartAgeShift', values[0] - 5)
            }
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-700">
            {adjustments.cppStartAgeShift > 0
              ? `Delay CPP by ${adjustments.cppStartAgeShift} year${adjustments.cppStartAgeShift !== 1 ? 's' : ''} for ${Math.round(adjustments.cppStartAgeShift * 8.4)}% higher payments`
              : adjustments.cppStartAgeShift < 0
              ? `Start CPP ${Math.abs(adjustments.cppStartAgeShift)} year${Math.abs(adjustments.cppStartAgeShift) !== 1 ? 's' : ''} earlier (reduced payments)`
              : `Start CPP at age ${originalCppAge} (current plan)`}
          </p>
        </div>

        {/* OAS Start Age Adjustment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              OAS Start Age
            </label>
            <Badge variant={adjustments.oasStartAgeShift > 0 ? 'default' : 'secondary'}>
              Age {newOasAge}
            </Badge>
          </div>
          <Slider
            value={[adjustments.oasStartAgeShift + 5]}
            onValueChange={(values) =>
              handleAdjustmentChange('oasStartAgeShift', values[0] - 5)
            }
            min={0}
            max={5}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-700">
            {adjustments.oasStartAgeShift > 0
              ? `Delay OAS by ${adjustments.oasStartAgeShift} year${adjustments.oasStartAgeShift !== 1 ? 's' : ''} for ${Math.round(adjustments.oasStartAgeShift * 7.2)}% higher payments`
              : adjustments.oasStartAgeShift < 0
              ? `Start OAS ${Math.abs(adjustments.oasStartAgeShift)} year${Math.abs(adjustments.oasStartAgeShift) !== 1 ? 's' : ''} earlier`
              : `Start OAS at age ${originalOasAge} (current plan)`}
          </p>
        </div>

        {/* Run Scenario Button */}
        {hasChanges && (
          <div className="pt-4">
            <Button
              onClick={handleRunScenario}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Scenario...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run What-If Scenario
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Comparison */}
        {whatIfResult && whatIfResult.summary && (
          <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {healthScoreChange !== null && healthScoreChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              Comparison: Original vs What-If
            </h4>

            {/* Health Score Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Original</div>
                <div className="text-2xl font-bold text-gray-900">{baseHealthScore}</div>
                <div className="text-xs text-gray-600">Health Score</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">What-If</div>
                <div className="text-2xl font-bold text-blue-900">{whatIfHealthScore}</div>
                <div className="text-xs text-blue-600">
                  {healthScoreChange !== null && (
                    <span className={healthScoreChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ({healthScoreChange >= 0 ? '+' : ''}{healthScoreChange})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Final Estate Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Original</div>
                <div className="text-lg font-bold text-gray-900">
                  ${Math.round(baseFinalEstate).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Final Estate</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">What-If</div>
                <div className="text-lg font-bold text-blue-900">
                  ${whatIfFinalEstate !== null ? Math.round(whatIfFinalEstate).toLocaleString() : '0'}
                </div>
                <div className="text-xs text-blue-600">
                  {estateChange !== null && (
                    <span className={estateChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ({estateChange >= 0 ? '+' : ''}{Math.round(estateChange).toLocaleString()})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4 italic">
              Real simulation results with full tax calculations and asset management.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
