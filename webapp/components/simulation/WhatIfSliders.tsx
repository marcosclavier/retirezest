'use client';

import { useState, useEffect } from 'react';
import { SimulationResponse } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RotateCcw, Sparkles } from 'lucide-react';

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

/**
 * WhatIfSliders - Interactive sliders for exploring retirement scenarios
 *
 * Features:
 * - Adjust spending level (50% to 150% of current plan)
 * - Shift retirement age (-5 to +5 years)
 * - Adjust CPP start age (60-70)
 * - Adjust OAS start age (65-70)
 * - Real-time impact preview (estimated without full simulation)
 * - Reset to original values
 */
export function WhatIfSliders({ result, onScenarioChange }: WhatIfSlidersProps) {
  const [adjustments, setAdjustments] = useState<ScenarioAdjustments>({
    spendingMultiplier: 1.0,
    retirementAgeShift: 0,
    cppStartAgeShift: 0,
    oasStartAgeShift: 0,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Original values from simulation
  const originalRetirementAge = result.household_input?.p1.start_age || 65;
  const originalCppAge = result.household_input?.p1.cpp_start_age || 65;
  const originalOasAge = result.household_input?.p1.oas_start_age || 65;

  // Calculated values based on adjustments
  const newRetirementAge = originalRetirementAge + adjustments.retirementAgeShift;
  const newCppAge = Math.max(60, Math.min(70, originalCppAge + adjustments.cppStartAgeShift));
  const newOasAge = Math.max(65, Math.min(70, originalOasAge + adjustments.oasStartAgeShift));

  // Estimated impact calculations (simplified, client-side estimates)
  const estimateImpact = () => {
    if (!result.summary) return null;

    const baseHealthScore = Math.round((result.summary.success_rate || 0) * 100);
    const baseFinalEstate = result.summary.final_estate_after_tax;

    // Impact factors (simplified estimates)
    let healthScoreChange = 0;
    let estateChange = 0;

    // Spending impact: reducing spending improves outcomes
    const spendingImpact = (1.0 - adjustments.spendingMultiplier) * 10; // ±10 points per 10% change
    healthScoreChange += spendingImpact;
    estateChange += (baseFinalEstate * (1.0 - adjustments.spendingMultiplier)) * 0.5;

    // Retirement age impact: delaying retirement helps
    const retirementImpact = adjustments.retirementAgeShift * 3; // +3 points per year delayed
    healthScoreChange += retirementImpact;
    estateChange += adjustments.retirementAgeShift * 25000; // Rough estimate

    // CPP delay impact: up to 42% more at 70 vs 65
    const cppDelayYears = Math.max(0, adjustments.cppStartAgeShift);
    const cppImpact = cppDelayYears * 1.5; // +1.5 points per year delayed
    healthScoreChange += cppImpact;
    estateChange += cppDelayYears * 10000;

    // OAS delay impact: up to 36% more at 70 vs 65
    const oasDelayYears = Math.max(0, adjustments.oasStartAgeShift);
    const oasImpact = oasDelayYears * 1.2; // +1.2 points per year delayed
    healthScoreChange += oasImpact;
    estateChange += oasDelayYears * 8000;

    const estimatedHealthScore = Math.min(100, Math.max(0, baseHealthScore + healthScoreChange));
    const estimatedEstate = Math.max(0, baseFinalEstate + estateChange);

    return {
      healthScoreChange: Math.round(healthScoreChange),
      estimatedHealthScore: Math.round(estimatedHealthScore),
      estateChange: Math.round(estateChange),
      estimatedEstate: Math.round(estimatedEstate),
    };
  };

  const impact = estimateImpact();

  // Update parent component when adjustments change
  useEffect(() => {
    const hasAnyChanges =
      adjustments.spendingMultiplier !== 1.0 ||
      adjustments.retirementAgeShift !== 0 ||
      adjustments.cppStartAgeShift !== 0 ||
      adjustments.oasStartAgeShift !== 0;

    setHasChanges(hasAnyChanges);

    if (onScenarioChange && hasAnyChanges) {
      onScenarioChange(adjustments);
    }
  }, [adjustments, onScenarioChange]);

  const handleReset = () => {
    setAdjustments({
      spendingMultiplier: 1.0,
      retirementAgeShift: 0,
      cppStartAgeShift: 0,
      oasStartAgeShift: 0,
    });
  };

  if (!result.summary || !result.household_input) {
    return null;
  }

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
          Explore how changes to your plan would impact your retirement health score
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
              setAdjustments({ ...adjustments, spendingMultiplier: values[0] / 100 })
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
              setAdjustments({ ...adjustments, retirementAgeShift: values[0] - 5 })
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
              setAdjustments({ ...adjustments, cppStartAgeShift: values[0] - 5 })
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
              setAdjustments({ ...adjustments, oasStartAgeShift: values[0] - 5 })
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

        {/* Impact Summary */}
        {hasChanges && impact && (
          <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              {impact.healthScoreChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              Estimated Impact
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Health Score:</span>
                <span className={`text-sm font-medium ${impact.healthScoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {impact.estimatedHealthScore}
                  <span className="text-xs ml-1">
                    ({impact.healthScoreChange >= 0 ? '+' : ''}{impact.healthScoreChange})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Final Estate:</span>
                <span className={`text-sm font-medium ${impact.estateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.round(impact.estimatedEstate / 1000)}K
                  <span className="text-xs ml-1">
                    ({impact.estateChange >= 0 ? '+' : ''}{Math.round(impact.estateChange / 1000)}K)
                  </span>
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 italic">
              These are simplified estimates. Run a new simulation for precise results.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
