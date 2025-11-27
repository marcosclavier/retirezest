'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Play, UserPlus, UserMinus } from 'lucide-react';
import { runSimulation, healthCheck } from '@/lib/api/simulation-client';
import {
  defaultHouseholdInput,
  defaultPersonInput,
  type HouseholdInput,
  type PersonInput,
  type SimulationResponse,
} from '@/lib/types/simulation';
import { PersonForm } from '@/components/simulation/PersonForm';
import { HouseholdForm } from '@/components/simulation/HouseholdForm';
import { ResultsDashboard } from '@/components/simulation/ResultsDashboard';
import { PortfolioChart } from '@/components/simulation/PortfolioChart';
import { TaxChart } from '@/components/simulation/TaxChart';
import { SpendingChart } from '@/components/simulation/SpendingChart';
import { HealthScoreCard } from '@/components/simulation/HealthScoreCard';
import { GovernmentBenefitsChart } from '@/components/simulation/GovernmentBenefitsChart';
import { IncomeCompositionChart } from '@/components/simulation/IncomeCompositionChart';
import { WithdrawalsBySourceChart } from '@/components/simulation/WithdrawalsBySourceChart';
import { YearByYearTable } from '@/components/simulation/YearByYearTable';

export default function SimulationPage() {
  const [household, setHousehold] = useState<HouseholdInput>({
    ...defaultHouseholdInput,
    p1: { ...defaultPersonInput, name: 'Me' },
  });
  const [includePartner, setIncludePartner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('input');

  // Check API health on mount
  useEffect(() => {
    healthCheck().then(setApiHealthy);
  }, []);

  const updatePerson = (person: 'p1' | 'p2', field: keyof PersonInput, value: any) => {
    setHousehold((prev) => ({
      ...prev,
      [person]: {
        ...prev[person],
        [field]: value,
      },
    }));
  };

  const updateHousehold = <K extends keyof HouseholdInput>(
    field: K,
    value: HouseholdInput[K]
  ) => {
    setHousehold((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddPartner = () => {
    setIncludePartner(true);
    setHousehold((prev) => ({
      ...prev,
      p2: { ...defaultPersonInput, name: 'Partner' },
    }));
  };

  const handleRemovePartner = () => {
    setIncludePartner(false);
    setHousehold((prev) => ({
      ...prev,
      p2: { ...defaultPersonInput, name: '' },
    }));
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setResult(null);

    // If no partner, zero out p2 values
    const simulationData: HouseholdInput = includePartner
      ? household
      : {
          ...household,
          p2: { ...defaultPersonInput, name: '' },
        };

    try {
      const response = await runSimulation(simulationData);
      setResult(response);

      // Switch to results tab if simulation succeeded
      if (response.success) {
        setActiveTab('results');
      }
    } catch (error) {
      console.error('Simulation error:', error);
      setResult({
        success: false,
        message: 'Failed to run simulation',
        warnings: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Retirement Simulation</h1>
          <p className="text-muted-foreground">
            Run comprehensive retirement projections with tax optimization
          </p>
        </div>
        {apiHealthy === false && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Python API is not responding. Make sure the backend is running on port 8000.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Run Simulation Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleRunSimulation}
          disabled={isLoading || apiHealthy === false}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Run Simulation
            </>
          )}
        </Button>
      </div>

      {/* Tabs for Input and Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>
            Results
          </TabsTrigger>
        </TabsList>

        {/* Input Tab */}
        <TabsContent value="input" className="space-y-6">
          {/* Person 1 Form */}
          <PersonForm
            person={household.p1}
            personLabel={household.p1.name || 'You'}
            personNumber="p1"
            onChange={(field, value) => updatePerson('p1', field, value)}
          />

          {/* Add/Remove Partner Button */}
          {!includePartner ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleAddPartner}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Spouse/Partner
              </Button>
            </div>
          ) : (
            <>
              {/* Person 2 Form */}
              <div className="relative">
                <PersonForm
                  person={household.p2}
                  personLabel={household.p2.name || 'Partner'}
                  personNumber="p2"
                  onChange={(field, value) => updatePerson('p2', field, value)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePartner}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive gap-1"
                >
                  <UserMinus className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </>
          )}

          {/* Household Settings */}
          <HouseholdForm household={household} onChange={updateHousehold} />
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {result ? (
            <>
              {/* Health Score Card - Prominent Position */}
              {result.success && result.summary && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <HealthScoreCard summary={result.summary} />
                  </div>
                  <div className="lg:col-span-2">
                    <ResultsDashboard result={result} />
                  </div>
                </div>
              )}

              {/* Fallback if no summary */}
              {result.success && !result.summary && (
                <ResultsDashboard result={result} />
              )}

              {/* Error state */}
              {!result.success && (
                <ResultsDashboard result={result} />
              )}

              {/* Charts Section */}
              {result.success && result.year_by_year && result.year_by_year.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Visualizations</h2>

                  {/* Portfolio and Spending Charts */}
                  <PortfolioChart yearByYear={result.year_by_year} />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TaxChart yearByYear={result.year_by_year} />
                    <SpendingChart yearByYear={result.year_by_year} />
                  </div>

                  {/* Additional Charts from chart_data */}
                  {result.chart_data?.data_points && result.chart_data.data_points.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GovernmentBenefitsChart chartData={result.chart_data.data_points} />
                        <WithdrawalsBySourceChart chartData={result.chart_data.data_points} />
                      </div>
                      <IncomeCompositionChart chartData={result.chart_data.data_points} />
                    </>
                  )}

                  {/* Year-by-Year Table */}
                  <YearByYearTable yearByYear={result.year_by_year} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>Run a simulation to see results</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
