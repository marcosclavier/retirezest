'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useDebouncedCallback } from '@/lib/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Play, UserPlus, UserMinus, RefreshCw } from 'lucide-react';
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
import { HealthScoreCard } from '@/components/simulation/HealthScoreCard';
import { YearByYearTable } from '@/components/simulation/YearByYearTable';
import { SmartStartCard } from '@/components/simulation/SmartStartCard';
import { PlanSnapshotCard } from '@/components/simulation/PlanSnapshotCard';
import { FloatingCTA } from '@/components/simulation/FloatingCTA';
import { PrefillStatusBanner } from '@/components/simulation/PrefillStatusBanner';

// Dynamically import chart components to reduce initial bundle size
const PortfolioChart = dynamic(() => import('@/components/simulation/PortfolioChart').then(mod => ({ default: mod.PortfolioChart })), {
  loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading chart...</div>,
  ssr: false
});

const TaxChart = dynamic(() => import('@/components/simulation/TaxChart').then(mod => ({ default: mod.TaxChart })), {
  loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading chart...</div>,
  ssr: false
});

const SpendingChart = dynamic(() => import('@/components/simulation/SpendingChart').then(mod => ({ default: mod.SpendingChart })), {
  loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading chart...</div>,
  ssr: false
});

const GovernmentBenefitsChart = dynamic(() => import('@/components/simulation/GovernmentBenefitsChart').then(mod => ({ default: mod.GovernmentBenefitsChart })), {
  loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading chart...</div>,
  ssr: false
});

const IncomeCompositionChart = dynamic(() => import('@/components/simulation/IncomeCompositionChart').then(mod => ({ default: mod.IncomeCompositionChart })), {
  loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading chart...</div>,
  ssr: false
});

const WithdrawalsBySourceChart = dynamic(() => import('@/components/simulation/WithdrawalsBySourceChart').then(mod => ({ default: mod.WithdrawalsBySourceChart })), {
  loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading chart...</div>,
  ssr: false
});

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [prefillAttempted, setPrefillAttempted] = useState(false);
  const [userProfileProvince, setUserProfileProvince] = useState<string | null>(null);
  const [isQuickStart, setIsQuickStart] = useState(false);
  const [quickStartAttempted, setQuickStartAttempted] = useState(false);

  // Initialize showSmartStart by checking localStorage synchronously BEFORE first render
  const [showSmartStart, setShowSmartStart] = useState(() => {
    // This runs synchronously during initial render, preventing flicker
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('simulation_smart_start_dismissed');
      return dismissed !== 'true';
    }
    return false;
  });

  const [showDetailedInputs, setShowDetailedInputs] = useState(false);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedHousehold = localStorage.getItem('simulation_household');
    const savedIncludePartner = localStorage.getItem('simulation_includePartner');

    if (savedHousehold) {
      try {
        setHousehold(JSON.parse(savedHousehold));
      } catch (error) {
        console.error('Failed to parse saved household data:', error);
      }
    }

    if (savedIncludePartner) {
      setIncludePartner(savedIncludePartner === 'true');
    }

    setIsInitialized(true);
  }, []);

  // Debounced localStorage save functions (500ms delay to reduce writes)
  const debouncedSaveHousehold = useDebouncedCallback((householdData: HouseholdInput) => {
    console.log('💾 Saving household to localStorage (debounced)');
    localStorage.setItem('simulation_household', JSON.stringify(householdData));
  }, 500);

  const debouncedSaveIncludePartner = useDebouncedCallback((value: boolean) => {
    console.log('💾 Saving includePartner to localStorage (debounced)');
    localStorage.setItem('simulation_includePartner', value.toString());
  }, 500);

  // Save household data to localStorage whenever it changes (but not during initial load)
  useEffect(() => {
    if (isInitialized && prefillAttempted) {
      debouncedSaveHousehold(household);
    }
  }, [household, isInitialized, prefillAttempted, debouncedSaveHousehold]);

  // Save includePartner to localStorage whenever it changes (but not during initial load)
  useEffect(() => {
    if (isInitialized && prefillAttempted) {
      debouncedSaveIncludePartner(includePartner);
    }
  }, [includePartner, isInitialized, prefillAttempted, debouncedSaveIncludePartner]);

  // Prefill data loading functions - declared before the useEffect that uses them
  const loadPrefillData = useCallback(async (token: string | null = csrfToken) => {
    try {
      setPrefillLoading(true);

      const headers: Record<string, string> = {};
      if (token) {
        headers['x-csrf-token'] = token;
      }

      const response = await fetch('/api/simulation/prefill', { headers });

      console.log('🔍 PREFILL API Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 PREFILL DATA RECEIVED:', JSON.stringify(data, null, 2));
        console.log('🔍 hasAssets:', data.hasAssets);
        console.log('🔍 person1Input.start_age:', data.person1Input?.start_age);
        console.log('🔍 includePartner:', data.includePartner);
        console.log('🔍 person2Input:', data.person2Input);

        if (data.hasAssets || data.person1Input.start_age !== 65 || data.hasExpenses) {
          console.log('🔍 Applying prefill data to household state...');
          // Determine partner data first
          let partnerData = { ...defaultPersonInput, name: '' };
          let shouldIncludePartner = false;

          if (data.includePartner && data.person2Input) {
            console.log('🔍 Including partner with data:', data.person2Input.name);
            shouldIncludePartner = true;
            partnerData = {
              ...defaultPersonInput,
              ...data.person2Input,
            };
          } else if (data.includePartner) {
            // Married but no partner assets yet
            console.log('🔍 Including partner without assets');
            shouldIncludePartner = true;
            partnerData = { ...defaultPersonInput, name: 'Partner' };
          }

          // Calculate spending phases from total annual spending
          // If user has expense data, use it to populate spending phases
          const hasExpenseData = data.totalAnnualSpending && data.totalAnnualSpending > 0;
          let spendingUpdate = {};

          if (hasExpenseData) {
            console.log('🔍 Using expense data from profile:', data.totalAnnualSpending);
            // Use current spending as go-go phase
            // Reduce by 20% for slow-go phase (common retirement planning assumption)
            // Reduce by 40% for no-go phase (common retirement planning assumption)
            spendingUpdate = {
              spending_go_go: Math.round(data.totalAnnualSpending),
              spending_slow_go: Math.round(data.totalAnnualSpending * 0.8),
              spending_no_go: Math.round(data.totalAnnualSpending * 0.6),
            };
          }

          // Update household with all prefilled data in a single setState call
          setHousehold(prev => ({
            ...prev,
            province: data.province || prev.province,
            end_age: data.lifeExpectancy || prev.end_age, // Use life expectancy from profile
            ...spendingUpdate, // Apply spending data if available
            p1: {
              ...prev.p1,
              ...data.person1Input,
            },
            p2: {
              ...prev.p2,
              ...partnerData,
            },
          }));

          setIncludePartner(shouldIncludePartner);
          setUserProfileProvince(data.userProfileProvince || null);
          setPrefillAvailable(true);
          console.log('🔍 Prefill data applied successfully');
        } else {
          console.log('⚠️ Prefill data NOT applied - condition failed (hasAssets=false AND start_age=65 AND hasExpenses=false)');
        }
      }
    } catch (error) {
      console.error('Failed to load prefill data:', error);
    } finally {
      setPrefillLoading(false);
    }
  }, [csrfToken]);

  const loadPrefillDataWithMerge = useCallback(async (
    token: string | null = csrfToken,
    savedHousehold: HouseholdInput
  ) => {
    try {
      setPrefillLoading(true);

      const headers: Record<string, string> = {};
      if (token) {
        headers['x-csrf-token'] = token;
      }

      const response = await fetch('/api/simulation/prefill', { headers });

      console.log('🔍 PREFILL API Response Status (with merge):', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Merging fresh profile data with saved custom settings...');

        // Asset balance fields that should ALWAYS come from the database
        const assetFields = [
          'tfsa_balance',
          'rrsp_balance',
          'rrif_balance',
          'nonreg_balance',
          'corporate_balance',
          'tfsa_room_start',
          'nr_cash',
          'nr_gic',
          'nr_invest',
          'nonreg_acb',
          'corp_cash_bucket',
          'corp_gic_bucket',
          'corp_invest_bucket',
        ];

        // Custom fields that should be preserved from localStorage if user modified them
        const customFields = [
          'cpp_start_age',
          'cpp_annual_at_start',
          'oas_start_age',
          'oas_annual_at_start',
          'y_nr_cash_interest',
          'y_nr_gic_interest',
          'y_nr_inv_total_return',
          'y_nr_inv_elig_div',
          'y_nr_inv_nonelig_div',
          'y_nr_inv_capg',
          'y_nr_inv_roc_pct',
          'y_corp_cash_interest',
          'y_corp_gic_interest',
          'y_corp_inv_total_return',
          'y_corp_inv_elig_div',
          'y_corp_inv_capg',
        ];

        // Helper to merge person data: use fresh assets, preserve custom settings
        const mergePerson = (savedPerson: PersonInput, freshPerson: PersonInput): PersonInput => {
          const merged = { ...savedPerson };

          // Update asset balances from database (always fresh)
          assetFields.forEach(field => {
            if (field in freshPerson) {
              // TypeScript: using any here is safe because we're copying values from PersonInput to PersonInput
              (merged as any)[field] = (freshPerson as any)[field];
            }
          });

          // Update age if it changed
          if (freshPerson.start_age !== savedPerson.start_age) {
            merged.start_age = freshPerson.start_age;
          }

          // Update name if it changed in profile
          if (freshPerson.name !== savedPerson.name && freshPerson.name) {
            merged.name = freshPerson.name;
          }

          return merged;
        };

        // Determine partner data
        let partnerData = { ...defaultPersonInput, name: '' };
        let shouldIncludePartner = false;

        if (data.includePartner && data.person2Input) {
          shouldIncludePartner = true;
          // If we have saved partner data, merge it with fresh data
          partnerData = mergePerson(savedHousehold.p2, data.person2Input);
        } else if (data.includePartner) {
          shouldIncludePartner = true;
          partnerData = { ...defaultPersonInput, name: 'Partner' };
        }

        // Merge person 1 data
        const mergedP1 = mergePerson(savedHousehold.p1, data.person1Input);

        // Update household with merged data
        setHousehold(prev => ({
          ...prev,
          province: data.province || prev.province,
          end_age: data.lifeExpectancy || prev.end_age, // Use life expectancy from profile
          p1: mergedP1,
          p2: partnerData,
        }));

        setIncludePartner(shouldIncludePartner);
        setUserProfileProvince(data.userProfileProvince || null);
        setPrefillAvailable(true);
        console.log('✅ Profile data merged successfully - asset balances updated, custom settings preserved');
      }
    } catch (error) {
      console.error('Failed to load and merge prefill data:', error);
    } finally {
      setPrefillLoading(false);
    }
  }, [csrfToken]);

  // Check API health, fetch CSRF token, load profile settings, and load prefill data on mount
  useEffect(() => {
    healthCheck().then(setApiHealthy);

    // Fetch CSRF token first, then load prefill data
    const initializeData = async () => {
      try {
        // Fetch CSRF token
        const csrfRes = await fetch('/api/csrf');
        const csrfData = await csrfRes.json();
        const token = csrfData.token || null;
        setCsrfToken(token);

        // Fetch profile settings to get couples planning preference
        const hasSavedIncludePartner = localStorage.getItem('simulation_includePartner');
        if (!hasSavedIncludePartner) {
          try {
            const settingsRes = await fetch('/api/profile/settings');
            if (settingsRes.ok) {
              const settingsData = await settingsRes.json();
              if (settingsData?.includePartner !== undefined) {
                setIncludePartner(settingsData.includePartner);
              }
            }
          } catch (err) {
            console.error('Failed to fetch profile settings:', err);
          }
        }

        // Always check prefill data to detect profile changes (like deleted assets)
        const hasSavedData = localStorage.getItem('simulation_household');
        console.log('🔍 localStorage simulation_household:', hasSavedData ? 'EXISTS' : 'EMPTY');

        if (hasSavedData) {
          console.log('🔍 Loading prefill to check for profile updates...');
          // Load prefill data, which will intelligently merge with localStorage
          // This ensures asset balances are always current from the database
          await loadPrefillDataWithMerge(token, JSON.parse(hasSavedData));
        } else {
          console.log('🔍 Loading prefill data because localStorage is empty...');
          await loadPrefillData(token);
        }

        // Mark that we've attempted prefill (whether we loaded it or skipped it)
        setPrefillAttempted(true);
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setPrefillLoading(false);
      }
    };

    initializeData();
  }, [loadPrefillData, loadPrefillDataWithMerge]);

  // Quick-start mode detection: Auto-run simulation with smart defaults
  useEffect(() => {
    const checkQuickStart = async () => {
      // Only run once, after initialization and prefill
      if (!isInitialized || !prefillAttempted || quickStartAttempted) {
        return;
      }

      // Check for ?mode=quick parameter
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');

      if (mode === 'quick') {
        console.log('🚀 Quick-start mode detected, running quick simulation...');
        setQuickStartAttempted(true);
        setIsQuickStart(true);
        setIsLoading(true);

        try {
          const response = await fetch('/api/simulation/quick-start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (response.ok && data.success) {
            console.log('✅ Quick simulation completed:', data);
            setResult(data);
            setActiveTab('results');

            // Update household input with the values used
            if (data.household_input) {
              setHousehold(data.household_input);
              setIncludePartner(!!data.household_input.p2?.name);
            }
          } else {
            console.error('❌ Quick simulation failed:', data);
            // Show error but stay on input tab so user can try manual simulation
            alert(data.message || 'Quick simulation failed. Please try entering your details manually.');
          }
        } catch (error) {
          console.error('❌ Quick simulation error:', error);
          alert('Failed to run quick simulation. Please try entering your details manually.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkQuickStart();
  }, [isInitialized, prefillAttempted, quickStartAttempted]);

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

  const handleReloadFromProfile = async () => {
    console.log('🔄 Reloading from profile...');

    // Save current custom settings that aren't in the database
    const currentHousehold = household;
    const customSettings = {
      // Government benefits (not in database)
      p1_cpp_start_age: currentHousehold.p1.cpp_start_age,
      p1_cpp_annual_at_start: currentHousehold.p1.cpp_annual_at_start,
      p1_oas_start_age: currentHousehold.p1.oas_start_age,
      p1_oas_annual_at_start: currentHousehold.p1.oas_annual_at_start,
      p2_cpp_start_age: currentHousehold.p2.cpp_start_age,
      p2_cpp_annual_at_start: currentHousehold.p2.cpp_annual_at_start,
      p2_oas_start_age: currentHousehold.p2.oas_start_age,
      p2_oas_annual_at_start: currentHousehold.p2.oas_annual_at_start,

      // Yields (not in database)
      p1_yields: {
        y_nr_cash_interest: currentHousehold.p1.y_nr_cash_interest,
        y_nr_gic_interest: currentHousehold.p1.y_nr_gic_interest,
        y_nr_inv_total_return: currentHousehold.p1.y_nr_inv_total_return,
        y_nr_inv_elig_div: currentHousehold.p1.y_nr_inv_elig_div,
        y_nr_inv_nonelig_div: currentHousehold.p1.y_nr_inv_nonelig_div,
        y_nr_inv_capg: currentHousehold.p1.y_nr_inv_capg,
        y_nr_inv_roc_pct: currentHousehold.p1.y_nr_inv_roc_pct,
        y_corp_cash_interest: currentHousehold.p1.y_corp_cash_interest,
        y_corp_gic_interest: currentHousehold.p1.y_corp_gic_interest,
        y_corp_inv_total_return: currentHousehold.p1.y_corp_inv_total_return,
        y_corp_inv_elig_div: currentHousehold.p1.y_corp_inv_elig_div,
        y_corp_inv_capg: currentHousehold.p1.y_corp_inv_capg,
      },
      p2_yields: {
        y_nr_cash_interest: currentHousehold.p2.y_nr_cash_interest,
        y_nr_gic_interest: currentHousehold.p2.y_nr_gic_interest,
        y_nr_inv_total_return: currentHousehold.p2.y_nr_inv_total_return,
        y_nr_inv_elig_div: currentHousehold.p2.y_nr_inv_elig_div,
        y_nr_inv_nonelig_div: currentHousehold.p2.y_nr_inv_nonelig_div,
        y_nr_inv_capg: currentHousehold.p2.y_nr_inv_capg,
        y_nr_inv_roc_pct: currentHousehold.p2.y_nr_inv_roc_pct,
        y_corp_cash_interest: currentHousehold.p2.y_corp_cash_interest,
        y_corp_gic_interest: currentHousehold.p2.y_corp_gic_interest,
        y_corp_inv_total_return: currentHousehold.p2.y_corp_inv_total_return,
        y_corp_inv_elig_div: currentHousehold.p2.y_corp_inv_elig_div,
        y_corp_inv_capg: currentHousehold.p2.y_corp_inv_capg,
      },

      // Spending & strategy (not in database)
      spending_go_go: currentHousehold.spending_go_go,
      go_go_end_age: currentHousehold.go_go_end_age,
      spending_slow_go: currentHousehold.spending_slow_go,
      slow_go_end_age: currentHousehold.slow_go_end_age,
      spending_no_go: currentHousehold.spending_no_go,
      spending_inflation: currentHousehold.spending_inflation,
      general_inflation: currentHousehold.general_inflation,
      strategy: currentHousehold.strategy,
      reinvest_nonreg_dist: currentHousehold.reinvest_nonreg_dist,
    };

    // Don't clear localStorage - we want to keep custom settings
    // localStorage.removeItem('simulation_household');
    // localStorage.removeItem('simulation_includePartner');

    // Reset to defaults
    setHousehold({
      ...defaultHouseholdInput,
      p1: { ...defaultPersonInput, name: 'Me' },
    });
    setIncludePartner(false);

    // Reload from profile (this will update asset balances from database)
    await loadPrefillData();

    // Restore custom settings that aren't in the database
    setHousehold((prev) => ({
      ...prev,
      // Restore P1 government benefits
      p1: {
        ...prev.p1,
        cpp_start_age: customSettings.p1_cpp_start_age,
        cpp_annual_at_start: customSettings.p1_cpp_annual_at_start,
        oas_start_age: customSettings.p1_oas_start_age,
        oas_annual_at_start: customSettings.p1_oas_annual_at_start,
        // Restore P1 yields
        ...customSettings.p1_yields,
      },
      // Restore P2 government benefits
      p2: {
        ...prev.p2,
        cpp_start_age: customSettings.p2_cpp_start_age,
        cpp_annual_at_start: customSettings.p2_cpp_annual_at_start,
        oas_start_age: customSettings.p2_oas_start_age,
        oas_annual_at_start: customSettings.p2_oas_annual_at_start,
        // Restore P2 yields
        ...customSettings.p2_yields,
      },
      // Restore household settings
      spending_go_go: customSettings.spending_go_go,
      go_go_end_age: customSettings.go_go_end_age,
      spending_slow_go: customSettings.spending_slow_go,
      slow_go_end_age: customSettings.slow_go_end_age,
      spending_no_go: customSettings.spending_no_go,
      spending_inflation: customSettings.spending_inflation,
      general_inflation: customSettings.general_inflation,
      strategy: customSettings.strategy,
      reinvest_nonreg_dist: customSettings.reinvest_nonreg_dist,
    }));

    // Mark prefill as attempted so future changes get saved
    setPrefillAttempted(true);
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

      // Debug logging
      if (response.success && response.year_by_year && response.year_by_year.length > 0) {
        console.log('=== SIMULATION PAGE - API RESPONSE ===');
        console.log('Year 2025 total_tax from API:', response.year_by_year[0].total_tax);
        console.log('Year 2025 total_tax_p1:', response.year_by_year[0].total_tax_p1);
        console.log('Year 2025 total_tax_p2:', response.year_by_year[0].total_tax_p2);
        console.log('======================================');
      }

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

        {/* Loading indicator while prefill data loads */}
        {prefillLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-gray-600">Loading your data...</p>
          </div>
        )}

        {/* Smart Start Card - Shown on first visit or when no results */}
        {!prefillLoading && showSmartStart && !result && (
          <SmartStartCard
            onQuickStart={async () => {
              localStorage.setItem('simulation_smart_start_dismissed', 'true');
              setShowSmartStart(false);
              await handleRunSimulation();
            }}
            onCustomize={() => {
              localStorage.setItem('simulation_smart_start_dismissed', 'true');
              setShowSmartStart(false);
              setShowDetailedInputs(true);
            }}
            household={household}
            includePartner={includePartner}
            prefillAvailable={prefillAvailable}
            isLoading={isLoading}
          />
        )}

        {/* Prefill Success Message */}
        {prefillAvailable && !prefillLoading && (() => {
          const totalAssets = (household.p1.tfsa_balance || 0) +
            (household.p1.rrsp_balance || 0) +
            (household.p1.rrif_balance || 0) +
            (household.p1.nr_cash || 0) +
            (household.p1.nr_gic || 0) +
            (household.p1.nr_invest || 0) +
            (household.p1.corp_cash_bucket || 0) +
            (household.p1.corp_gic_bucket || 0) +
            (household.p1.corp_invest_bucket || 0) +
            (household.p2.tfsa_balance || 0) +
            (household.p2.rrsp_balance || 0) +
            (household.p2.rrif_balance || 0) +
            (household.p2.nr_cash || 0) +
            (household.p2.nr_gic || 0) +
            (household.p2.nr_invest || 0) +
            (household.p2.corp_cash_bucket || 0) +
            (household.p2.corp_gic_bucket || 0) +
            (household.p2.corp_invest_bucket || 0);

          let accountCount = 0;
          [household.p1, household.p2].forEach(person => {
            if (person.tfsa_balance) accountCount++;
            if (person.rrsp_balance) accountCount++;
            if (person.rrif_balance) accountCount++;
            if (person.nr_cash || person.nr_gic || person.nr_invest) accountCount++;
            if (person.corp_cash_bucket || person.corp_gic_bucket || person.corp_invest_bucket) accountCount++;
          });

          return (
            <PrefillStatusBanner
              isPrefilled={true}
              totalAssets={totalAssets}
              itemsLoaded={accountCount}
              onRefresh={async () => await loadPrefillData()}
              lastUpdated={new Date()}
            />
          );
        })()}

        {/* API Health Warning */}
        {apiHealthy === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Python API is not responding. Make sure the backend is running on port 8000.
            </AlertDescription>
          </Alert>
        )}

        {/* Warning for incomplete financial data */}
        {prefillAvailable && !prefillLoading && (() => {
          const totalAssets = (household.p1.tfsa_balance || 0) +
            (household.p1.rrsp_balance || 0) +
            (household.p1.rrif_balance || 0) +
            (household.p1.nr_cash || 0) +
            (household.p1.nr_gic || 0) +
            (household.p1.nr_invest || 0) +
            (household.p1.corp_cash_bucket || 0) +
            (household.p1.corp_gic_bucket || 0) +
            (household.p1.corp_invest_bucket || 0);

          if (totalAssets === 0) {
            return (
              <Alert className="border-yellow-300 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <strong>Limited Financial Data:</strong> No asset balances detected.
                  <span className="ml-1">
                    To get meaningful projections, please{' '}
                    <a href="/profile" className="underline font-semibold hover:text-yellow-700">
                      add your financial information
                    </a>
                    {' '}or enter values in the form below.
                  </span>
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}
      </div>

      {/* Review Auto-Populated Values */}
      {prefillAvailable && !prefillLoading && (
        <Collapsible
          title="Review Auto-Populated Values"
          description="Verify the data loaded from your profile before running the simulation"
          defaultOpen={false}
        >
          <div className="space-y-4">
            {/* Household Information */}
            <div>
              <Label className="text-sm font-semibold">Household Information</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Province:</span>
                  <span>{household.province}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Planning Type:</span>
                  <span>{includePartner ? 'Couple' : 'Individual'}</span>
                </div>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Profile Information - Side by Side for Couples */}
            <div>
              <Label className="text-sm font-semibold">Profile Information</Label>
              <div className={`mt-2 gap-6 ${includePartner ? 'grid grid-cols-1 md:grid-cols-2' : ''}`}>
                {/* Person 1 */}
                <div className="text-sm">
                  {includePartner && <p className="font-medium text-gray-700 mb-2">{household.p1.name || 'You'}</p>}
                  <div className="flex justify-between">
                    <span className="text-gray-600">{includePartner ? 'Age:' : 'Name:'}</span>
                    <span>{includePartner ? household.p1.start_age : household.p1.name}</span>
                  </div>
                  {!includePartner && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Age:</span>
                      <span>{household.p1.start_age}</span>
                    </div>
                  )}
                </div>

                {/* Person 2 - Only if couple */}
                {includePartner && household.p2.name && (
                  <div className="text-sm">
                    <p className="font-medium text-gray-700 mb-2">{household.p2.name}</p>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span>{household.p2.start_age}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Account Balances - Side by Side for Couples */}
            <div>
              <Label className="text-sm font-semibold">Account Balances</Label>
              <div className={`mt-2 gap-6 ${includePartner ? 'grid grid-cols-1 md:grid-cols-2' : ''}`}>
                {/* Person 1 Balances */}
                <div className="space-y-1 text-sm">
                  {includePartner && <p className="font-medium text-gray-700 mb-2">{household.p1.name || 'You'}</p>}
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
                  <div className="flex justify-between border-t pt-1 mt-1 font-medium">
                    <span className="text-gray-700">Total:</span>
                    <span>${((household.p1.tfsa_balance || 0) + (household.p1.rrsp_balance || 0) + (household.p1.rrif_balance || 0) + (household.p1.nr_cash || 0) + (household.p1.nr_gic || 0) + (household.p1.nr_invest || 0) + (household.p1.corp_cash_bucket || 0) + (household.p1.corp_gic_bucket || 0) + (household.p1.corp_invest_bucket || 0)).toLocaleString()}</span>
                  </div>
                </div>

                {/* Person 2 Balances - Only if couple */}
                {includePartner && household.p2.name && (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-700 mb-2">{household.p2.name}</p>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TFSA:</span>
                      <span>${(household.p2.tfsa_balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RRSP:</span>
                      <span>${(household.p2.rrsp_balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RRIF:</span>
                      <span>${(household.p2.rrif_balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Non-Registered:</span>
                      <span>${((household.p2.nr_cash || 0) + (household.p2.nr_gic || 0) + (household.p2.nr_invest || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Corporate:</span>
                      <span>${((household.p2.corp_cash_bucket || 0) + (household.p2.corp_gic_bucket || 0) + (household.p2.corp_invest_bucket || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1 font-medium">
                      <span className="text-gray-700">Total:</span>
                      <span>${((household.p2.tfsa_balance || 0) + (household.p2.rrsp_balance || 0) + (household.p2.rrif_balance || 0) + (household.p2.nr_cash || 0) + (household.p2.nr_gic || 0) + (household.p2.nr_invest || 0) + (household.p2.corp_cash_bucket || 0) + (household.p2.corp_gic_bucket || 0) + (household.p2.corp_invest_bucket || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Combined Total for Couples */}
              {includePartner && household.p2.name && (
                <div className="mt-3 pt-3 border-t-2 border-gray-300">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-800">Combined Total:</span>
                    <span className="text-blue-600">
                      ${((household.p1.tfsa_balance || 0) + (household.p1.rrsp_balance || 0) + (household.p1.rrif_balance || 0) + (household.p1.nr_cash || 0) + (household.p1.nr_gic || 0) + (household.p1.nr_invest || 0) + (household.p1.corp_cash_bucket || 0) + (household.p1.corp_gic_bucket || 0) + (household.p1.corp_invest_bucket || 0) + (household.p2.tfsa_balance || 0) + (household.p2.rrsp_balance || 0) + (household.p2.rrif_balance || 0) + (household.p2.nr_cash || 0) + (household.p2.nr_gic || 0) + (household.p2.nr_invest || 0) + (household.p2.corp_cash_bucket || 0) + (household.p2.corp_gic_bucket || 0) + (household.p2.corp_invest_bucket || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
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

      {/* Warning about assumed values */}
      {prefillAvailable && !prefillLoading && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Important:</strong> Some values have been estimated and may affect accuracy:
            <ul className="list-disc list-inside mt-2 text-sm space-y-1">
              <li>Asset allocation (cash/GIC/investments) based on typical distributions</li>
              <li>Adjusted Cost Base (ACB) estimated at 80% of non-registered balance</li>
              <li>
                CPP and OAS amounts use default values ($15,000/year and $8,500/year)
                {(household.p1.cpp_annual_at_start === 15000 || household.p1.oas_annual_at_start === 8500) && (
                  <span className="ml-1">
                    — <a href="/benefits" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-orange-700">Calculate your actual benefits →</a>
                  </span>
                )}
              </li>
            </ul>
            <p className="mt-2 text-sm font-medium">
              Please review and adjust these values in the expandable sections below for more accurate results.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Run Simulation Button - Only show when Smart Start is dismissed */}
      {!showSmartStart && !prefillLoading && (
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button
            onClick={handleRunSimulation}
            disabled={isLoading || apiHealthy === false}
            size="lg"
            className="w-full sm:w-auto sm:min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="hidden sm:inline">Running Simulation...</span>
                <span className="sm:hidden">Running...</span>
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Run Simulation
              </>
            )}
          </Button>
          <Button
            onClick={handleReloadFromProfile}
            disabled={isLoading || prefillLoading}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-gray-700 hover:text-gray-900"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Reload from Profile</span>
            <span className="sm:hidden">Reload</span>
          </Button>
        </div>
      )}

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Area */}
            <div className="lg:col-span-2 space-y-6">
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
              <HouseholdForm
                household={household}
                onChange={updateHousehold}
                isPrefilled={prefillAvailable}
                userProfileProvince={userProfileProvince}
              />
            </div>

            {/* Sidebar - Plan Snapshot */}
            <div className="lg:col-span-1">
              <PlanSnapshotCard
                household={household}
                includePartner={includePartner}
              />
            </div>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {/* Quick Start Disclaimer */}
          {isQuickStart && result && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Quick Estimate:</strong> This simulation uses your actual data combined with smart defaults.
                For a more accurate projection, switch to the <strong>Input</strong> tab to review and customize all assumptions.
              </AlertDescription>
            </Alert>
          )}

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
                        <GovernmentBenefitsChart
                          chartData={result.chart_data.data_points}
                          reinvestNonregDist={result.household_input?.reinvest_nonreg_dist ?? true}
                        />
                        <WithdrawalsBySourceChart chartData={result.chart_data.data_points} />
                      </div>
                      <IncomeCompositionChart chartData={result.chart_data.data_points} />
                    </>
                  )}

                  {/* Year-by-Year Table */}
                  <YearByYearTable
                    yearByYear={result.year_by_year}
                    reinvestNonregDist={result.household_input?.reinvest_nonreg_dist ?? true}
                  />
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

      {/* Floating CTA - only show on input tab */}
      {activeTab === 'input' && (
        <FloatingCTA
          household={household}
          includePartner={includePartner}
          onRunSimulation={handleRunSimulation}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
