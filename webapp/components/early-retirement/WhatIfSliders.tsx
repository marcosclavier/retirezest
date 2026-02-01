'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils/debounce';

interface BaselineScenario {
  retirementAge: number;
  cppStartAge: number;
  oasStartAge: number;
  currentSavings: {
    rrsp: number;
    tfsa: number;
    nonRegistered: number;
    corporate: number;
  };
  annualSavings: number;
}

interface WhatIfSlidersProps {
  baselineScenario: BaselineScenario;
  currentAge: number;
  onScenarioChange: (scenario: Partial<BaselineScenario>) => void;
  isCalculating?: boolean;
}

export function WhatIfSliders({
  baselineScenario,
  currentAge,
  onScenarioChange,
  isCalculating = false,
}: WhatIfSlidersProps) {
  // Local state for slider values (updates immediately for responsive UI)
  const [retirementAge, setRetirementAge] = useState(baselineScenario.retirementAge);
  const [cppStartAge, setCppStartAge] = useState(baselineScenario.cppStartAge);
  const [oasStartAge, setOasStartAge] = useState(baselineScenario.oasStartAge);
  const [annualSavings, setAnnualSavings] = useState(baselineScenario.annualSavings);

  // Track if user has made changes
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-correct pension start ages based on CRA rules
  useEffect(() => {
    if (cppStartAge < 60) {
      setCppStartAge(60);
    }
    if (oasStartAge < 65) {
      setOasStartAge(65);
    }
  }, [cppStartAge, oasStartAge]);

  // Debounced update to parent (avoid excessive API calls)
  const debouncedUpdate = useMemo(
    () =>
      debounce((updatedScenario: Partial<typeof baselineScenario>) => {
        onScenarioChange(updatedScenario);
      }, 500), // 500ms delay
    [onScenarioChange]
  );

  // Update parent when slider values change
  useEffect(() => {
    const hasAnyChanges =
      retirementAge !== baselineScenario.retirementAge ||
      cppStartAge !== baselineScenario.cppStartAge ||
      oasStartAge !== baselineScenario.oasStartAge ||
      annualSavings !== baselineScenario.annualSavings;

    setHasChanges(hasAnyChanges);

    if (hasAnyChanges) {
      debouncedUpdate({
        ...baselineScenario,
        retirementAge,
        cppStartAge,
        oasStartAge,
        annualSavings,
      });
    }
  }, [retirementAge, cppStartAge, oasStartAge, annualSavings, baselineScenario, debouncedUpdate]);

  // Reset to baseline
  const handleReset = () => {
    setRetirementAge(baselineScenario.retirementAge);
    setCppStartAge(baselineScenario.cppStartAge);
    setOasStartAge(baselineScenario.oasStartAge);
    setAnnualSavings(baselineScenario.annualSavings);
    setHasChanges(false);
  };

  // Calculate min/max values
  const minRetirementAge = Math.max(50, currentAge + 1);
  const maxRetirementAge = 75;
  const minCppAge = 60;
  const maxCppAge = 70;
  const minOasAge = 65;
  const maxOasAge = 70;

  // Warnings
  const showEarlyRetirementWarning = retirementAge < 60;
  const showCppDelayBenefit = cppStartAge > 65;
  const showOasDelayBenefit = oasStartAge > 65;

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">What-If Scenarios</h3>
          </div>
          {hasChanges && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isCalculating}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-700">
          Adjust the sliders below to explore different retirement scenarios. Changes update automatically.
        </p>

        {/* Retirement Age Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-gray-900">Retirement Age</Label>
            <span className="text-2xl font-bold text-blue-600">{retirementAge}</span>
          </div>
          <Slider
            value={[retirementAge]}
            onValueChange={([value]) => setRetirementAge(value)}
            min={minRetirementAge}
            max={maxRetirementAge}
            step={1}
            className="w-full"
            disabled={isCalculating}
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>Min: {minRetirementAge}</span>
            <span>Max: {maxRetirementAge}</span>
          </div>
        </div>

        {/* CPP Start Age Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-gray-900">CPP Start Age</Label>
            <span className="text-2xl font-bold text-blue-600">{cppStartAge}</span>
          </div>
          <Slider
            value={[cppStartAge]}
            onValueChange={([value]) => setCppStartAge(value)}
            min={minCppAge}
            max={maxCppAge}
            step={1}
            className="w-full"
            disabled={isCalculating}
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>Min: 60 (early)</span>
            <span>Max: 70 (delayed)</span>
          </div>
          {showCppDelayBenefit && (
            <Alert className="border-green-300 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 text-sm">
                <strong>Benefit:</strong> Delaying CPP to age {cppStartAge} increases payments by{' '}
                {((cppStartAge - 65) * 8.4).toFixed(1)}% (0.7%/month after 65).
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* OAS Start Age Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-gray-900">OAS Start Age</Label>
            <span className="text-2xl font-bold text-blue-600">{oasStartAge}</span>
          </div>
          <Slider
            value={[oasStartAge]}
            onValueChange={([value]) => setOasStartAge(value)}
            min={minOasAge}
            max={maxOasAge}
            step={1}
            className="w-full"
            disabled={isCalculating}
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>Min: 65 (standard)</span>
            <span>Max: 70 (delayed)</span>
          </div>
          {showOasDelayBenefit && (
            <Alert className="border-green-300 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 text-sm">
                <strong>Benefit:</strong> Delaying OAS to age {oasStartAge} increases payments by{' '}
                {((oasStartAge - 65) * 7.2).toFixed(1)}% (0.6%/month after 65).
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Annual Savings Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-gray-900">Annual Savings</Label>
            <span className="text-2xl font-bold text-blue-600">
              ${annualSavings.toLocaleString()}
            </span>
          </div>
          <Slider
            value={[annualSavings]}
            onValueChange={([value]) => setAnnualSavings(value)}
            min={0}
            max={100000}
            step={1000}
            className="w-full"
            disabled={isCalculating}
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>$0</span>
            <span>$100,000</span>
          </div>
        </div>

        {/* Early Retirement Warning */}
        {showEarlyRetirementWarning && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong>Early Retirement Alert:</strong> Retiring before age 60 means you cannot
              access CPP. You'll need to fund {60 - retirementAge} years without government
              benefits. Ensure you have adequate savings or plan for part-time income.
            </AlertDescription>
          </Alert>
        )}

        {/* Calculating Indicator */}
        {isCalculating && (
          <div className="flex items-center justify-center gap-2 text-blue-600 text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Recalculating retirement plan...</span>
          </div>
        )}
      </div>
    </Card>
  );
}
