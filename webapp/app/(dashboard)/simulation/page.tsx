'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
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
import { Collapsible } from '@/components/ui/collapsible';
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
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [prefillAvailable, setPrefillAvailable] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Check API health, fetch CSRF token, and load prefill data on mount
  useEffect(() => {
    healthCheck().then(setApiHealthy);

    // Fetch CSRF token to ensure it's available for simulation requests
    fetch('/api/csrf')
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setCsrfToken(data.token);
        }
      })
      .catch(err => console.error('Failed to fetch CSRF token:', err));

    // Fetch prefill data from user profile and assets
    loadPrefillData();
  }, []);

  const loadPrefillData = async () => {
    try {
      setPrefillLoading(true);
      const response = await fetch('/api/simulation/prefill');

      if (response.ok) {
        const data = await response.json();

        if (data.hasAssets || data.person1Input.start_age !== 65) {
          // Determine partner data first
          let partnerData = { ...defaultPersonInput, name: '' };
          let shouldIncludePartner = false;

          if (data.includePartner && data.person2Input) {
            shouldIncludePartner = true;
            partnerData = {
              ...defaultPersonInput,
              ...data.person2Input,
            };
          } else if (data.includePartner) {
            // Married but no partner assets yet
            shouldIncludePartner = true;
            partnerData = { ...defaultPersonInput, name: 'Partner' };
          }

          // Update household with all prefilled data in a single setState call
          setHousehold(prev => ({
            ...prev,
            province: data.province || prev.province,
            p1: {
              ...prev.p1,
              ...data.person1Input,
            },
            p2: {
              ...prev.p2,
              ...partnerData,
              // Preserve user-entered name if it exists and isn't empty
              name: prev.p2.name || partnerData.name,
            },
          }));

          setIncludePartner(shouldIncludePartner);
          setPrefillAvailable(true);
        }
      }
    } catch (error) {
      console.error('Failed to load prefill data:', error);
    } finally {
      setPrefillLoading(false);
    }
  };

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
      const response = await runSimulation(simulationData, csrfToken);
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Retirement Simulation</h1>
            <p className="text-gray-700">
              Run comprehensive retirement projections with tax optimization
            </p>
          </div>
        </div>

        {/* Prefill Success Message */}
        {prefillAvailable && !prefillLoading && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-900">
              ✓ Your financial profile and assets have been automatically loaded. Review and adjust the values below before running your simulation.
            </AlertDescription>
          </Alert>
        )}

        {/* Warning about assumed values */}
        {prefillAvailable && !prefillLoading && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>Important:</strong> Some values have been estimated and may affect accuracy:
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Asset allocation (cash/GIC/investments) based on typical distributions</li>
                <li>Adjusted Cost Base (ACB) estimated at 80% of non-registered balance</li>
                <li>CPP and OAS amounts use default values</li>
              </ul>
              <p className="mt-2 text-sm font-medium">
                Please review and adjust these values in the expandable sections below for more accurate results.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* API Health Warning */}
        {apiHealthy === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Python API is not responding. Make sure the backend is running on port 8000.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Review Auto-Populated Values */}
      {prefillAvailable && !prefillLoading && (
        <Collapsible
          title="Review Auto-Populated Values"
          description="Verify the data loaded from your profile before running the simulation"
          defaultOpen={false}
        >
          <div className="space-y-4">
            {/* Profile Information */}
            <div>
              <Label className="text-sm font-semibold">Profile Information</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span>{household.p1.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Age:</span>
                  <span>{household.p1.start_age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Province:</span>
                  <span>{household.province}</span>
                </div>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Account Balances */}
            <div>
              <Label className="text-sm font-semibold">Account Balances</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">TFSA:</span>
                  <span>${(household.p1.tfsa_balance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RRSP:</span>
                  <span>${(household.p1.rrsp_balance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RRIF:</span>
                  <span>${(household.p1.rrif_balance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Non-Registered:</span>
                  <span>${((household.p1.nr_cash || 0) + (household.p1.nr_gic || 0) + (household.p1.nr_invest || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Corporate:</span>
                  <span>${((household.p1.corp_cash_bucket || 0) + (household.p1.corp_gic_bucket || 0) + (household.p1.corp_invest_bucket || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Estimated Values Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-900">
                  <p className="font-semibold">Estimated Values</p>
                  <p className="mt-1 text-xs">
                    The following values have been estimated and should be reviewed in the detailed forms below:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                    <li>Asset allocation between cash, GICs, and investments</li>
                    <li>Adjusted Cost Base (ACB) for non-registered accounts</li>
                    <li>CPP and OAS benefit amounts and start ages</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Expand the sections below to review and adjust all values before running your simulation.
            </p>
          </div>
        </Collapsible>
      )}

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
            isPrefilled={prefillAvailable}
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
                  isPrefilled={prefillAvailable}
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
          <HouseholdForm household={household} onChange={updateHousehold} isPrefilled={prefillAvailable} />
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
                  <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>Visualizations</h2>

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
            <div className="text-center text-gray-600 py-12">
              <p>Run a simulation to see results</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
