'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface GICRung {
  id: string;
  amount: number;
  termMonths: number;
  interestRate: number;
  maturityYear: number;
}

interface GICLadderPlannerProps {
  totalInvestment?: number;
  onLadderCreated?: (gics: GICRung[]) => void;
}

export function GICLadderPlanner({
  totalInvestment = 50000,
  onLadderCreated,
}: GICLadderPlannerProps) {
  const [investment, setInvestment] = useState(totalInvestment);
  const [numRungs, setNumRungs] = useState(5);
  const [ladder, setLadder] = useState<GICRung[]>([]);
  const [showLadder, setShowLadder] = useState(false);

  // Generate a GIC ladder
  const generateLadder = () => {
    const currentYear = new Date().getFullYear();
    const amountPerRung = investment / numRungs;

    const newLadder: GICRung[] = Array.from({ length: numRungs }, (_, i) => ({
      id: `gic-${i + 1}`,
      amount: Math.round(amountPerRung),
      termMonths: (i + 1) * 12, // 1-year, 2-year, 3-year, etc.
      interestRate: 4.0 + i * 0.2, // Higher rates for longer terms
      maturityYear: currentYear + (i + 1),
    }));

    setLadder(newLadder);
    setShowLadder(true);
  };

  // Update a specific rung
  const updateRung = (id: string, field: keyof GICRung, value: number) => {
    setLadder((prev) =>
      prev.map((rung) => (rung.id === id ? { ...rung, [field]: value } : rung))
    );
  };

  // Remove a rung
  const removeRung = (id: string) => {
    setLadder((prev) => prev.filter((rung) => rung.id !== id));
  };

  // Add a new rung
  const addRung = () => {
    const currentYear = new Date().getFullYear();
    const newRung: GICRung = {
      id: `gic-${Date.now()}`,
      amount: 10000,
      termMonths: 12,
      interestRate: 4.0,
      maturityYear: currentYear + 1,
    };
    setLadder((prev) => [...prev, newRung]);
  };

  // Calculate ladder statistics
  const totalInvested = ladder.reduce((sum, rung) => sum + rung.amount, 0);
  const weightedAvgRate =
    ladder.length > 0
      ? ladder.reduce((sum, rung) => sum + rung.interestRate * rung.amount, 0) / totalInvested
      : 0;
  const avgMaturity =
    ladder.length > 0
      ? ladder.reduce((sum, rung) => sum + rung.termMonths, 0) / ladder.length
      : 0;

  // Save the ladder
  const handleSave = () => {
    if (onLadderCreated) {
      onLadderCreated(ladder);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">GIC Ladder Planner</h2>
            <p className="text-sm text-gray-600">
              Build a GIC ladder to maximize returns while maintaining liquidity
            </p>
          </div>
        </div>

        {!showLadder ? (
          // Configuration Step
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium text-gray-900">Total Investment</Label>
              <div className="flex items-center gap-2 mt-2">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <Input
                  type="number"
                  value={investment}
                  onChange={(e) => setInvestment(Number(e.target.value))}
                  min={1000}
                  step={1000}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium text-gray-900">Number of Rungs</Label>
              <p className="text-sm text-gray-600 mb-2">
                How many GICs to split your investment across
              </p>
              <Input
                type="number"
                value={numRungs}
                onChange={(e) => setNumRungs(Math.min(10, Math.max(2, Number(e.target.value))))}
                min={2}
                max={10}
              />
            </div>

            <Alert className="border-blue-300 bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <strong>GIC Ladder Strategy:</strong> A ladder spreads investments across GICs with
                different maturity dates (e.g., 1-year, 2-year, 3-year, 4-year, 5-year). Each year,
                one GIC matures, providing liquidity while others earn higher long-term rates.
              </AlertDescription>
            </Alert>

            <Button onClick={generateLadder} className="w-full" size="lg">
              Generate GIC Ladder
            </Button>
          </div>
        ) : (
          // Ladder Display & Editing
          <div className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium">Total Invested</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${totalInvested.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 font-medium">Weighted Avg Rate</p>
                <p className="text-2xl font-bold text-green-900">{weightedAvgRate.toFixed(2)}%</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-700 font-medium">Avg Maturity</p>
                <p className="text-2xl font-bold text-purple-900">
                  {(avgMaturity / 12).toFixed(1)} years
                </p>
              </div>
            </div>

            {/* GIC Rungs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Ladder Rungs</h3>
                <Button onClick={addRung} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Rung
                </Button>
              </div>

              {ladder.map((rung, index) => (
                <Card key={rung.id} className="p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Rung {index + 1} - {rung.termMonths / 12} Year GIC
                      </h4>
                      <Button
                        onClick={() => removeRung(rung.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm">Amount</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-gray-500">$</span>
                          <Input
                            type="number"
                            value={rung.amount}
                            onChange={(e) => updateRung(rung.id, 'amount', Number(e.target.value))}
                            min={1000}
                            step={1000}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">Term (Years)</Label>
                        <Input
                          type="number"
                          value={rung.termMonths / 12}
                          onChange={(e) =>
                            updateRung(rung.id, 'termMonths', Number(e.target.value) * 12)
                          }
                          min={1}
                          max={10}
                          step={1}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Interest Rate (%)</Label>
                        <Input
                          type="number"
                          value={rung.interestRate}
                          onChange={(e) =>
                            updateRung(rung.id, 'interestRate', Number(e.target.value))
                          }
                          min={0}
                          max={10}
                          step={0.1}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      Matures: <span className="font-medium">{rung.maturityYear}</span> | Value at
                      maturity:{' '}
                      <span className="font-medium text-green-600">
                        $
                        {(
                          rung.amount *
                          Math.pow(1 + rung.interestRate / 100, rung.termMonths / 12)
                        ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowLadder(false)}
                variant="outline"
                className="flex-1"
              >
                Start Over
              </Button>
              <Button onClick={handleSave} className="flex-1 gap-2">
                <Calendar className="h-4 w-4" />
                Save Ladder
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
