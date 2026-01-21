'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Play, Trash2, Copy, Plus, TrendingUp, TrendingDown, Settings, Save, BookmarkCheck } from 'lucide-react';
import { runSimulation } from '@/lib/api/simulation-client';
import {
  type HouseholdInput,
  type SimulationResponse,
  type WithdrawalStrategy,
  strategyOptions,
} from '@/lib/types/simulation';
import { loadSavedScenarios, saveScenario, deleteSavedScenario } from '@/lib/saved-scenarios';

interface Scenario {
  id: string;
  name: string;
  description: string;
  inputs: HouseholdInput;
  results?: SimulationResponse;
  isRunning: boolean;
  savedId?: string; // ID in database if saved
  isSaved?: boolean; // Whether this scenario is saved to database
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [baselineLoaded, setBaselineLoaded] = useState(false);
  const [showQuickWhatIf, setShowQuickWhatIf] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  // Custom scenario builder state
  const [customStrategy, setCustomStrategy] = useState<WithdrawalStrategy | 'baseline'>('baseline');
  const [customBenefitsTiming, setCustomBenefitsTiming] = useState<'baseline' | '65' | '70' | '70-65' | '60-65'>('baseline');
  const [customSpending, setCustomSpending] = useState<'baseline' | 'reduce' | 'increase'>('baseline');
  const [customTFSA, setCustomTFSA] = useState<'baseline' | 'none' | 'maximize'>('baseline');

  // Fetch CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch('/api/csrf');
        if (res.ok) {
          const data = await res.json();
          setCsrfToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  // Load saved scenarios from database on mount
  useEffect(() => {
    const loadScenarios = async () => {
      const saved = await loadSavedScenarios();
      if (saved.length > 0) {
        const loadedScenarios: Scenario[] = saved.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          inputs: s.inputData,
          results: s.results || undefined,
          isRunning: false,
          savedId: s.id,
          isSaved: true,
        }));
        setScenarios(loadedScenarios);
        setBaselineLoaded(true);
      }
    };
    loadScenarios();
  }, []);

  // Load baseline scenario from localStorage or prefill API
  const loadBaselineFromSimulation = async () => {
    try {
      // Try localStorage first
      const savedHousehold = localStorage.getItem('simulation_household');
      if (savedHousehold) {
        const household: HouseholdInput = JSON.parse(savedHousehold);

        // Create baseline scenario
        const baselineScenario: Scenario = {
          id: `baseline-${Date.now()}`,
          name: 'Current Plan (Baseline)',
          description: 'Your current retirement plan from the simulation',
          inputs: household,
          isRunning: false,
        };

        setScenarios([baselineScenario]);
        setBaselineLoaded(true);

        // Auto-run baseline scenario
        runScenarioSimulation(baselineScenario.id, household);
        return;
      }

      // Fallback: Try loading from prefill API
      const prefillResponse = await fetch('/api/simulation/prefill');
      if (prefillResponse.ok) {
        const household: HouseholdInput = await prefillResponse.json();

        // Create baseline scenario from prefill
        const baselineScenario: Scenario = {
          id: `baseline-${Date.now()}`,
          name: 'Current Plan (Baseline)',
          description: 'Your current retirement plan loaded from your profile',
          inputs: household,
          isRunning: false,
        };

        setScenarios([baselineScenario]);
        setBaselineLoaded(true);

        // Auto-run baseline scenario
        runScenarioSimulation(baselineScenario.id, household);
      } else {
        alert('No baseline data found. Please run a simulation first from the Simulation page.');
      }
    } catch (error) {
      console.error('Failed to load baseline:', error);
      alert('Failed to load baseline data. Please run a simulation first.');
    }
  };

  const runScenarioSimulation = async (scenarioId: string, inputs: HouseholdInput) => {
    setScenarios(prev =>
      prev.map(s => (s.id === scenarioId ? { ...s, isRunning: true } : s))
    );

    try {
      const results = await runSimulation(inputs, csrfToken);

      setScenarios(prev =>
        prev.map(s =>
          s.id === scenarioId
            ? { ...s, results, isRunning: false }
            : s
        )
      );
    } catch (error) {
      console.error('Simulation failed:', error);
      setScenarios(prev =>
        prev.map(s => (s.id === scenarioId ? { ...s, isRunning: false } : s))
      );
    }
  };

  const createWhatIfScenario = (
    name: string,
    description: string,
    modifier: (baseline: HouseholdInput) => HouseholdInput
  ) => {
    const baseline = scenarios.find(s => s.name.includes('Baseline'))?.inputs;
    if (!baseline) {
      alert('Please load a baseline scenario first');
      return;
    }

    const modifiedInputs = modifier(JSON.parse(JSON.stringify(baseline)));
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name,
      description,
      inputs: modifiedInputs,
      isRunning: false,
    };

    setScenarios(prev => [...prev, newScenario]);
    runScenarioSimulation(newScenario.id, modifiedInputs);
  };

  const createCustomScenario = () => {
    const baseline = scenarios.find(s => s.name.includes('Baseline'))?.inputs;
    if (!baseline) {
      alert('Please load a baseline scenario first');
      return;
    }

    let modifiedInputs = JSON.parse(JSON.stringify(baseline)) as HouseholdInput;
    const changes: string[] = [];

    // Apply strategy change
    if (customStrategy !== 'baseline') {
      modifiedInputs.strategy = customStrategy;
      changes.push(strategyOptions.find(s => s.value === customStrategy)?.label || customStrategy);
    }

    // Apply benefits timing change
    if (customBenefitsTiming !== 'baseline') {
      switch (customBenefitsTiming) {
        case '65':
          modifiedInputs.p1 = { ...modifiedInputs.p1, cpp_start_age: 65, oas_start_age: 65 };
          modifiedInputs.p2 = { ...modifiedInputs.p2, cpp_start_age: 65, oas_start_age: 65 };
          changes.push('CPP & OAS at 65');
          break;
        case '70':
          modifiedInputs.p1 = { ...modifiedInputs.p1, cpp_start_age: 70, oas_start_age: 70 };
          modifiedInputs.p2 = { ...modifiedInputs.p2, cpp_start_age: 70, oas_start_age: 70 };
          changes.push('CPP & OAS delayed to 70');
          break;
        case '70-65':
          modifiedInputs.p1 = { ...modifiedInputs.p1, cpp_start_age: 70, oas_start_age: 65 };
          modifiedInputs.p2 = { ...modifiedInputs.p2, cpp_start_age: 70, oas_start_age: 65 };
          changes.push('CPP at 70, OAS at 65');
          break;
        case '60-65':
          modifiedInputs.p1 = { ...modifiedInputs.p1, cpp_start_age: 60, oas_start_age: 65 };
          modifiedInputs.p2 = { ...modifiedInputs.p2, cpp_start_age: 60, oas_start_age: 65 };
          changes.push('CPP at 60, OAS at 65');
          break;
      }
    }

    // Apply spending change
    if (customSpending !== 'baseline') {
      const multiplier = customSpending === 'reduce' ? 0.8 : 1.2;
      modifiedInputs.spending_go_go = modifiedInputs.spending_go_go * multiplier;
      modifiedInputs.spending_slow_go = modifiedInputs.spending_slow_go * multiplier;
      modifiedInputs.spending_no_go = modifiedInputs.spending_no_go * multiplier;
      changes.push(customSpending === 'reduce' ? 'Spending -20%' : 'Spending +20%');
    }

    // Apply TFSA strategy change
    if (customTFSA !== 'baseline') {
      const amount = customTFSA === 'maximize' ? 7000 : 0;
      modifiedInputs.p1 = { ...modifiedInputs.p1, tfsa_contribution_annual: amount };
      modifiedInputs.p2 = { ...modifiedInputs.p2, tfsa_contribution_annual: amount };
      changes.push(customTFSA === 'maximize' ? 'Maximize TFSA' : 'No TFSA contributions');
    }

    const scenarioName = changes.length > 0 ? changes.join(' + ') : 'Custom Scenario';
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: scenarioName,
      description: 'Custom scenario with combined changes',
      inputs: modifiedInputs,
      isRunning: false,
    };

    setScenarios(prev => [...prev, newScenario]);
    runScenarioSimulation(newScenario.id, modifiedInputs);

    // Reset custom builder
    setCustomStrategy('baseline');
    setCustomBenefitsTiming('baseline');
    setCustomSpending('baseline');
    setCustomTFSA('baseline');
  };

  const quickWhatIfScenarios = [
    {
      category: 'Withdrawal Strategy',
      options: [
        {
          name: 'Corporate Optimized',
          description: 'Optimize for corporate asset integration',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'corporate-optimized' as const,
          }),
        },
        {
          name: 'Minimize Income',
          description: 'Minimize taxable income to reduce clawbacks',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'minimize-income' as const,
          }),
        },
        {
          name: 'RRIF Splitting',
          description: 'Optimize RRIF withdrawals with income splitting',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'rrif-splitting' as const,
          }),
        },
        {
          name: 'Capital Gains Optimized',
          description: 'Focus on capital gains for tax efficiency',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'capital-gains-optimized' as const,
          }),
        },
        {
          name: 'TFSA First',
          description: 'Prioritize TFSA withdrawals',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'tfsa-first' as const,
          }),
        },
        {
          name: 'Balanced',
          description: 'Balanced withdrawal approach',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'balanced' as const,
          }),
        },
        {
          name: 'RRIF Front-Load',
          description: 'Higher RRIF withdrawals early to reduce future tax',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'rrif-frontload' as const,
          }),
        },
      ],
    },
    {
      category: 'Government Benefits Timing (Corporate Optimized)',
      options: [
        {
          name: 'CPP & OAS at 65',
          description: 'Take both at standard age - more income early',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'corporate-optimized' as const,
            p1: { ...input.p1, cpp_start_age: 65, oas_start_age: 65 },
            p2: { ...input.p2, cpp_start_age: 65, oas_start_age: 65 },
          }),
        },
        {
          name: 'Delay CPP & OAS to 70',
          description: 'Delay both - 42% higher CPP, 36% higher OAS',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'corporate-optimized' as const,
            p1: { ...input.p1, cpp_start_age: 70, oas_start_age: 70 },
            p2: { ...input.p2, cpp_start_age: 70, oas_start_age: 70 },
          }),
        },
        {
          name: 'CPP at 70, OAS at 65',
          description: 'Delay CPP for higher benefits, OAS at standard age',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'corporate-optimized' as const,
            p1: { ...input.p1, cpp_start_age: 70, oas_start_age: 65 },
            p2: { ...input.p2, cpp_start_age: 70, oas_start_age: 65 },
          }),
        },
        {
          name: 'CPP at 60, OAS at 65',
          description: 'Take CPP early for cash flow, OAS at standard age',
          modifier: (input: HouseholdInput) => ({
            ...input,
            strategy: 'corporate-optimized' as const,
            p1: { ...input.p1, cpp_start_age: 60, oas_start_age: 65 },
            p2: { ...input.p2, cpp_start_age: 60, oas_start_age: 65 },
          }),
        },
      ],
    },
    {
      category: 'Spending Level',
      options: [
        {
          name: 'Reduce Spending 20%',
          description: 'More conservative spending approach',
          modifier: (input: HouseholdInput) => ({
            ...input,
            spending_go_go: input.spending_go_go * 0.8,
            spending_slow_go: input.spending_slow_go * 0.8,
            spending_no_go: input.spending_no_go * 0.8,
          }),
        },
        {
          name: 'Increase Spending 20%',
          description: 'More aggressive spending approach',
          modifier: (input: HouseholdInput) => ({
            ...input,
            spending_go_go: input.spending_go_go * 1.2,
            spending_slow_go: input.spending_slow_go * 1.2,
            spending_no_go: input.spending_no_go * 1.2,
          }),
        },
      ],
    },
    {
      category: 'TFSA Strategy',
      options: [
        {
          name: 'No TFSA Contributions',
          description: 'Keep assets in taxable accounts',
          modifier: (input: HouseholdInput) => ({
            ...input,
            p1: { ...input.p1, tfsa_contribution_annual: 0 },
            p2: { ...input.p2, tfsa_contribution_annual: 0 },
          }),
        },
        {
          name: 'Maximize TFSA',
          description: 'Transfer up to $7K/year to TFSA for each person',
          modifier: (input: HouseholdInput) => ({
            ...input,
            p1: { ...input.p1, tfsa_contribution_annual: 7000 },
            p2: { ...input.p2, tfsa_contribution_annual: 7000 },
          }),
        },
      ],
    },
  ];

  const handleSaveScenario = async (id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    const result = await saveScenario({
      name: scenario.name,
      description: scenario.description,
      scenarioType: scenario.name.includes('Baseline') ? 'baseline' : 'custom',
      inputData: scenario.inputs,
      results: scenario.results,
      hasResults: !!scenario.results,
    });

    if (result.success) {
      // Update scenario to mark as saved
      setScenarios(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, isSaved: true, savedId: result.scenarioId }
            : s
        )
      );
      alert('Scenario saved successfully!');
    } else if (result.requiresPremium) {
      if (confirm(result.error + '\n\nWould you like to upgrade now?')) {
        window.location.href = '/subscribe';
      }
    } else {
      alert(result.error || 'Failed to save scenario');
    }
  };

  const deleteScenario = async (id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    if (scenario.name.includes('Baseline')) {
      if (!confirm('This is your baseline scenario. Are you sure you want to delete it?')) {
        return;
      }
    }

    // If saved to database, delete from there too
    if (scenario.savedId) {
      const success = await deleteSavedScenario(scenario.savedId);
      if (!success) {
        alert('Failed to delete from database');
        return;
      }
    }

    setScenarios(prev => prev.filter(s => s.id !== id));
    setSelectedScenarios(prev => prev.filter(sid => sid !== id));
  };

  const duplicateScenario = (id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    const newScenario: Scenario = {
      ...scenario,
      id: `scenario-${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      results: undefined,
      isRunning: false,
      isSaved: false, // Duplicates are not saved by default
      savedId: undefined,
    };

    setScenarios(prev => [...prev, newScenario]);
    runScenarioSimulation(newScenario.id, newScenario.inputs);
  };

  const toggleScenarioSelection = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(prev => prev.filter(sid => sid !== id));
    } else if (selectedScenarios.length < 4) {
      setSelectedScenarios(prev => [...prev, id]);
    }
  };

  const selectedScenarioData = scenarios.filter(s =>
    selectedScenarios.includes(s.id) && s.results?.success
  );

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">What-If Scenario Analysis</h1>
          <p className="mt-2 text-gray-600">
            Compare different retirement strategies and see which works best for you
          </p>
        </div>
        <div className="flex gap-3">
          {!baselineLoaded && (
            <button
              onClick={loadBaselineFromSimulation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Load Current Plan
            </button>
          )}
          {baselineLoaded && (
            <>
              <button
                onClick={() => {
                  setShowCustomBuilder(!showCustomBuilder);
                  setShowQuickWhatIf(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Custom Scenario
              </button>
              <button
                onClick={() => {
                  setShowQuickWhatIf(!showQuickWhatIf);
                  setShowCustomBuilder(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Quick What-If
              </button>
            </>
          )}
        </div>
      </div>

      {/* Custom Scenario Builder */}
      {showCustomBuilder && baselineLoaded && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Custom Scenario Builder</h2>
          <p className="text-sm text-gray-600 mb-6">
            Click buttons below to select options from each category, then create your combined scenario
          </p>

          <div className="space-y-6">
            {/* Withdrawal Strategy */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Withdrawal Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  onClick={() => setCustomStrategy('baseline')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customStrategy === 'baseline'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Keep Baseline</div>
                  <div className="text-xs text-gray-700">No change</div>
                </button>
                {strategyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomStrategy(option.value)}
                    className={`text-left p-3 border-2 rounded-lg transition-colors ${
                      customStrategy === option.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-700">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Government Benefits Timing */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Government Benefits Timing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
                <button
                  onClick={() => setCustomBenefitsTiming('baseline')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customBenefitsTiming === 'baseline'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Keep Baseline</div>
                  <div className="text-xs text-gray-700">No change</div>
                </button>
                <button
                  onClick={() => setCustomBenefitsTiming('65')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customBenefitsTiming === '65'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">CPP & OAS at 65</div>
                  <div className="text-xs text-gray-700">Standard age</div>
                </button>
                <button
                  onClick={() => setCustomBenefitsTiming('70')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customBenefitsTiming === '70'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Delay Both to 70</div>
                  <div className="text-xs text-gray-700">Max benefits</div>
                </button>
                <button
                  onClick={() => setCustomBenefitsTiming('70-65')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customBenefitsTiming === '70-65'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">CPP at 70, OAS at 65</div>
                  <div className="text-xs text-gray-700">Hybrid approach</div>
                </button>
                <button
                  onClick={() => setCustomBenefitsTiming('60-65')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customBenefitsTiming === '60-65'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">CPP at 60, OAS at 65</div>
                  <div className="text-xs text-gray-700">Early cash flow</div>
                </button>
              </div>
            </div>

            {/* Spending Level */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Spending Level</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  onClick={() => setCustomSpending('baseline')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customSpending === 'baseline'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Keep Baseline</div>
                  <div className="text-xs text-gray-700">No change</div>
                </button>
                <button
                  onClick={() => setCustomSpending('reduce')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customSpending === 'reduce'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Reduce by 20%</div>
                  <div className="text-xs text-gray-700">More conservative</div>
                </button>
                <button
                  onClick={() => setCustomSpending('increase')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customSpending === 'increase'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Increase by 20%</div>
                  <div className="text-xs text-gray-700">More spending</div>
                </button>
              </div>
            </div>

            {/* TFSA Strategy */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">TFSA Contribution Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  onClick={() => setCustomTFSA('baseline')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customTFSA === 'baseline'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Keep Baseline</div>
                  <div className="text-xs text-gray-700">No change</div>
                </button>
                <button
                  onClick={() => setCustomTFSA('none')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customTFSA === 'none'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">No TFSA Contributions</div>
                  <div className="text-xs text-gray-700">Keep in taxable</div>
                </button>
                <button
                  onClick={() => setCustomTFSA('maximize')}
                  className={`text-left p-3 border-2 rounded-lg transition-colors ${
                    customTFSA === 'maximize'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Maximize TFSA</div>
                  <div className="text-xs text-gray-700">$7,000/year per person</div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {customStrategy === 'baseline' &&
                customBenefitsTiming === 'baseline' &&
                customSpending === 'baseline' &&
                customTFSA === 'baseline' ? (
                <span className="text-amber-600">Select at least one option above</span>
              ) : (
                <span className="text-green-600">
                  {[
                    customStrategy !== 'baseline' && (strategyOptions.find(s => s.value === customStrategy)?.label || customStrategy),
                    customBenefitsTiming !== 'baseline' && 'Benefits timing',
                    customSpending !== 'baseline' && 'Spending',
                    customTFSA !== 'baseline' && 'TFSA'
                  ].filter(Boolean).join(' + ')} selected
                </span>
              )}
            </div>
            <button
              onClick={createCustomScenario}
              disabled={
                customStrategy === 'baseline' &&
                customBenefitsTiming === 'baseline' &&
                customSpending === 'baseline' &&
                customTFSA === 'baseline'
              }
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Custom Scenario
            </button>
          </div>
        </div>
      )}

      {/* Quick What-If Builder */}
      {showQuickWhatIf && baselineLoaded && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick What-If Scenarios</h2>
          <p className="text-sm text-gray-600 mb-6">
            Click any option below to instantly create and run that scenario
          </p>

          <div className="space-y-6">
            {quickWhatIfScenarios.map((category) => (
              <div key={category.category}>
                <h3 className="text-sm font-medium text-gray-700 mb-3">{category.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.options.map((option) => (
                    <button
                      key={option.name}
                      onClick={() => createWhatIfScenario(option.name, option.description, option.modifier)}
                      className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{option.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenarios Grid */}
      {scenarios.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const isSelected = selectedScenarios.includes(scenario.id);
            const summary = scenario.results?.summary;

            return (
              <div
                key={scenario.id}
                className={`bg-white shadow rounded-lg p-6 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => toggleScenarioSelection(scenario.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{scenario.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{scenario.description}</p>
                  </div>
                  {isSelected && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Selected
                    </span>
                  )}
                </div>

                {scenario.isRunning && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {!scenario.isRunning && summary && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Strategy:</span>
                      <span className="font-medium text-purple-600">
                        {strategyOptions.find(s => s.value === scenario.inputs.strategy)?.label || scenario.inputs.strategy}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Years Funded:</span>
                      <span className={`font-medium ${summary.years_funded === summary.years_simulated ? 'text-green-600' : 'text-yellow-600'}`}>
                        {summary.years_funded}/{summary.years_simulated}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Tax:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(summary.total_tax_paid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Final Estate:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(summary.final_estate_after_tax)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Health Score:</span>
                      <span className={`font-medium ${
                        summary.health_score >= 80 ? 'text-green-600' :
                        summary.health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {summary.health_score}/100 ({summary.health_rating})
                      </span>
                    </div>
                  </div>
                )}

                {!scenario.isRunning && !summary && (
                  <div className="flex items-center justify-center py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        runScenarioSimulation(scenario.id, scenario.inputs);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4" />
                      Run Simulation
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  {!scenario.isSaved ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveScenario(scenario.id);
                      }}
                      className="flex-1 px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 flex items-center justify-center gap-1"
                      title="Save this scenario to database"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  ) : (
                    <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-50 flex items-center justify-center gap-1 cursor-default">
                      <BookmarkCheck className="w-4 h-4" />
                      Saved
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateScenario(scenario.id);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScenario(scenario.id);
                    }}
                    className="flex-1 px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No scenarios yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Load your current plan to start creating what-if scenarios.
            </p>
            <div className="mt-6">
              <button
                onClick={loadBaselineFromSimulation}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Load Current Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Comparison */}
      {selectedScenarioData.length > 1 && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900">
              Comparing {selectedScenarioData.length} Scenarios
            </h3>
            <p className="text-xs text-blue-700 mt-1">
              Click on scenarios above to select up to 4 for comparison
            </p>
          </div>

          {/* Key Metrics Comparison Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Key Metrics Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    {selectedScenarioData.map(scenario => (
                      <th key={scenario.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {scenario.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Years Funded */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Years Funded</td>
                    {selectedScenarioData.map(scenario => {
                      const allYearsFunded = scenario.results!.summary!.years_funded === scenario.results!.summary!.years_simulated;
                      return (
                        <td key={scenario.id} className="px-6 py-4 text-sm">
                          <span className={`font-medium text-lg ${allYearsFunded ? 'text-green-600' : 'text-yellow-600'}`}>
                            {scenario.results!.summary!.years_funded}/{scenario.results!.summary!.years_simulated}
                          </span>
                          <div className="text-xs text-gray-500">
                            {allYearsFunded ? 'Fully funded' : `${scenario.results!.summary!.years_simulated - scenario.results!.summary!.years_funded} years short`}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Tax Analysis */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Tax Paid</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm font-medium text-red-600">
                        {formatCurrency(scenario.results!.summary!.total_tax_paid)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Avg Effective Tax Rate</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {formatPercent(scenario.results!.summary!.avg_effective_tax_rate)}
                      </td>
                    ))}
                  </tr>

                  {/* Estate */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Final Estate (After-Tax)</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm font-medium text-blue-600">
                        {formatCurrency(scenario.results!.summary!.final_estate_after_tax)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Tax at Death</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm font-medium text-orange-600">
                        {scenario.results?.estate_summary?.taxes_at_death
                          ? formatCurrency(scenario.results.estate_summary.taxes_at_death)
                          : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Government Benefits */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Govt Benefits</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm font-medium text-green-600">
                        {formatCurrency(scenario.results!.summary!.total_government_benefits)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 pl-12">- CPP Total</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {formatCurrency(scenario.results!.summary!.total_cpp)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 pl-12">- OAS Total</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {formatCurrency(scenario.results!.summary!.total_oas)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 pl-12">- GIS Total</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {formatCurrency(scenario.results!.summary!.total_gis)}
                      </td>
                    ))}
                  </tr>

                  {/* Health Score */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Health Score</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm">
                        <span className={`font-medium ${
                          scenario.results!.summary!.health_score >= 80 ? 'text-green-600' :
                          scenario.results!.summary!.health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {scenario.results!.summary!.health_score}/100
                        </span>
                        <div className="text-xs text-gray-500">
                          {scenario.results!.summary!.health_rating}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Spending */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Spending</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {formatCurrency(scenario.results!.summary!.total_spending)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Worth Change */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Net Worth Change</td>
                    {selectedScenarioData.map(scenario => {
                      const change = scenario.results!.summary!.net_worth_change_pct;
                      return (
                        <td key={scenario.id} className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-1">
                            {change >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change >= 0 ? '+' : ''}{formatPercent(change)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {scenario.results!.summary!.net_worth_trend}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Key Parameters */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 bg-gray-100" colSpan={selectedScenarioData.length + 1}>
                      Key Parameters
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">CPP Start Age</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {scenario.inputs.p1.cpp_start_age}
                        {scenario.inputs.p1.cpp_start_age !== scenario.inputs.p2.cpp_start_age &&
                          ` / ${scenario.inputs.p2.cpp_start_age}`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">OAS Start Age</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {scenario.inputs.p1.oas_start_age}
                        {scenario.inputs.p1.oas_start_age !== scenario.inputs.p2.oas_start_age &&
                          ` / ${scenario.inputs.p2.oas_start_age}`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Withdrawal Strategy</td>
                    {selectedScenarioData.map(scenario => {
                      const strategyLabel = strategyOptions.find(s => s.value === scenario.inputs.strategy)?.label || scenario.inputs.strategy;
                      return (
                        <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                          {strategyLabel}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">TFSA Contribution (P1)</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {scenario.inputs.p1.tfsa_contribution_annual > 0
                          ? `${formatCurrency(scenario.inputs.p1.tfsa_contribution_annual)}/year`
                          : 'None'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">TFSA Contribution (P2)</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {scenario.inputs.p2.tfsa_contribution_annual > 0
                          ? `${formatCurrency(scenario.inputs.p2.tfsa_contribution_annual)}/year`
                          : 'None'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Go-Go Spending</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {formatCurrency(scenario.inputs.spending_go_go)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Comparison Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={selectedScenarioData.map(scenario => ({
                  name: scenario.name.length > 30 ? scenario.name.substring(0, 27) + '...' : scenario.name,
                  totalTax: scenario.results!.summary!.total_tax_paid,
                  avgRate: scenario.results!.summary!.avg_effective_tax_rate,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis
                  yAxisId="left"
                  label={{ value: 'Total Tax ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Avg Rate (%)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'totalTax') return formatCurrency(value);
                    return formatPercent(value);
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="totalTax" fill="#ef4444" name="Total Tax" />
                <Bar yAxisId="right" dataKey="avgRate" fill="#f59e0b" name="Avg Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Estate Value Comparison */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estate Value Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={selectedScenarioData.map(scenario => ({
                  name: scenario.name.length > 30 ? scenario.name.substring(0, 27) + '...' : scenario.name,
                  estate: scenario.results!.summary!.final_estate_after_tax,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis
                  label={{ value: 'Estate Value ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="estate" fill="#3b82f6" name="After-Tax Estate" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Government Benefits Comparison */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Government Benefits Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={selectedScenarioData.map(scenario => ({
                  name: scenario.name.length > 30 ? scenario.name.substring(0, 27) + '...' : scenario.name,
                  cpp: scenario.results!.summary!.total_cpp,
                  oas: scenario.results!.summary!.total_oas,
                  gis: scenario.results!.summary!.total_gis,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis
                  label={{ value: 'Benefits ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cpp" stackId="a" fill="#10b981" name="CPP" />
                <Bar dataKey="oas" stackId="a" fill="#3b82f6" name="OAS" />
                <Bar dataKey="gis" stackId="a" fill="#8b5cf6" name="GIS" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Help Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            How to Use What-If Analysis
          </h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4">
            What-If analysis helps you understand how different decisions affect your retirement:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Load Current Plan:</strong> Start with your baseline retirement plan from the simulation</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Quick What-If:</strong> Click any option to instantly create and run a variation</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Compare:</strong> Select up to 4 scenarios to see side-by-side comparisons</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Key Metrics:</strong> Focus on tax paid, estate value, and government benefits to make informed decisions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
