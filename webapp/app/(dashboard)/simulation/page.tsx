'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from '@/lib/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Play, UserPlus, UserMinus, RefreshCw, Mail, CheckCircle, ArrowDown, X, Lightbulb } from 'lucide-react';
import { runSimulation, healthCheck } from '@/lib/api/simulation-client';
import {
  defaultHouseholdInput,
  defaultPersonInput,
  type HouseholdInput,
  type PersonInput,
  type SimulationResponse,
  type OptimizationResult,
  type WithdrawalStrategy,
  getStrategyDisplayName,
} from '@/lib/types/simulation';
import { emptyPersonInput } from '@/lib/types/emptyPersonInput';
import { PersonForm } from '@/components/simulation/PersonForm';
import { HouseholdForm } from '@/components/simulation/HouseholdForm';
import { Collapsible } from '@/components/ui/collapsible';
import { ResultsDashboard } from '@/components/simulation/ResultsDashboard';
import { HealthScoreCard } from '@/components/simulation/HealthScoreCard';
import { YearByYearTable } from '@/components/simulation/YearByYearTable';
import { SmartStartCard } from '@/components/simulation/SmartStartCard';
import { PlanSnapshotCard } from '@/components/simulation/PlanSnapshotCard';
import { FloatingCTA } from '@/components/simulation/FloatingCTA';
import { SimulationWizard } from '@/components/simulation/SimulationWizard';
import { UpgradeModal } from '@/components/modals/UpgradeModal';
import { PostSimulationFeedbackModal } from '@/components/feedback/PostSimulationFeedbackModal';
import { StaleDataAlert } from '@/components/simulation/StaleDataAlert';
import { LowSuccessRateWarning } from '@/components/modals/LowSuccessRateWarning';
import { analyzeFailureReasons, type FailureAnalysis } from '@/lib/analysis/failureReasons';
import { OptimizationSuggestion } from '@/components/OptimizationSuggestion';

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
  const searchParams = useSearchParams();
  const [household, setHousehold] = useState<HouseholdInput>({
    ...defaultHouseholdInput,
    p1: { ...defaultPersonInput, name: 'Me' },
  });
  const [includePartner, setIncludePartner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [showGuidanceBanner, setShowGuidanceBanner] = useState(false);
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
  const [showSmartStart, setShowSmartStart] = useState(true);
  const [, setShowDetailedInputs] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'csv' | 'pdf' | 'export' | 'early-retirement' | 'general'>('general');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  const [isWizardMode, setIsWizardMode] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(true); // Default true, will check on load
  const [freeSimulationsRemaining, setFreeSimulationsRemaining] = useState<number | undefined>(undefined);
  const [dailySimulationsRemaining, setDailySimulationsRemaining] = useState<number | undefined>(undefined);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [lastProfileUpdate] = useState<Date | null>(null);
  const [lastSimulationLoad] = useState<Date | null>(null);
  const [failureAnalysis, setFailureAnalysis] = useState<FailureAnalysis | null>(null);
  const [showLowSuccessWarning, setShowLowSuccessWarning] = useState(false);
  const [showOptimizationSuggestion, setShowOptimizationSuggestion] = useState(true);

  // Initialize component - localStorage will be merged with database data in the prefill logic below
  // DO NOT load localStorage here - it should not override fresh database data
  useEffect(() => {
    console.log('🔧 Simulation page initialized - database data will load first');
    setIsInitialized(true);

    // Check if user has already submitted or skipped post-simulation feedback
    const hasSkipped = localStorage.getItem('post_simulation_feedback_skipped') === 'true';
    const hasSubmitted = localStorage.getItem('post_simulation_feedback_submitted') === 'true';
    if (hasSkipped || hasSubmitted) {
      setHasShownFeedback(true);
    }
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

  // Debounced function to save inflation rates to baseline scenario (1000ms delay)
  const debouncedSaveInflationRates = useDebouncedCallback(
    async (spendingInflation: number, generalInflation: number) => {
      if (!csrfToken) return;

      try {
        console.log('💾 Saving inflation rates to baseline scenario:', { spendingInflation, generalInflation });
        const response = await fetch('/api/scenarios/inflation', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({
            expenseInflationRate: spendingInflation,
            inflationRate: generalInflation,
          }),
        });

        if (!response.ok) {
          console.error('Failed to save inflation rates:', await response.text());
        } else {
          console.log('✅ Inflation rates saved successfully');
        }
      } catch (error) {
        console.error('Error saving inflation rates:', error);
      }
    },
    1000
  );

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

  // Save inflation rates to baseline scenario whenever they change (but not during initial load)
  useEffect(() => {
    if (isInitialized && prefillAttempted && csrfToken) {
      debouncedSaveInflationRates(household.spending_inflation, household.general_inflation);
    }
  }, [household.spending_inflation, household.general_inflation, isInitialized, prefillAttempted, csrfToken, debouncedSaveInflationRates]);

  // Fetch subscription status on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setIsPremium(data.isPremium || false);
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        // Default to free tier on error
        setIsPremium(false);
      }
    };

    fetchSubscription();
  }, []);

  // US-067: Check if user should see guidance banner
  useEffect(() => {
    // Show guidance if:
    // 1. Just completed onboarding (URL param)
    // 2. Never ran simulation before (localStorage check)
    // 3. No simulation results currently displayed
    const onboardingComplete = searchParams.get('onboarding') === 'complete';
    const hasRunSimulation = localStorage.getItem('has_run_simulation') === 'true';
    const guidanceDismissed = localStorage.getItem('guidance_banner_dismissed') === 'true';

    if (!result && !guidanceDismissed && (onboardingComplete || !hasRunSimulation)) {
      setShowGuidanceBanner(true);
    } else {
      setShowGuidanceBanner(false);
    }
  }, [result, searchParams]);

  // Check API health, fetch CSRF token, load profile settings, and load prefill data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    healthCheck().then(setApiHealthy);

    // Fetch CSRF token first, then load prefill data
    const initializeData = async () => {
      try {
        // Fetch CSRF token
        const csrfRes = await fetch('/api/csrf');
        const csrfData = await csrfRes.json();
        const token = csrfData.token || null;
        setCsrfToken(token);

        // Fetch profile settings to get couples planning preference and email verification status
        // Always use database value, not localStorage (database is source of truth)
        try {
          const settingsRes = await fetch('/api/profile/settings');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            if (settingsData?.includePartner !== undefined) {
              console.log('🔧 Using includePartner from database:', settingsData.includePartner);
              setIncludePartner(settingsData.includePartner);
            }
            // Check email verification status
            if (settingsData?.emailVerified !== undefined) {
              console.log('📧 Email verification status:', settingsData.emailVerified);
              setEmailVerified(settingsData.emailVerified);

              // Fetch free simulation count for unverified users
              if (!settingsData.emailVerified) {
                try {
                  const freeSimRes = await fetch('/api/user/free-simulations');
                  if (freeSimRes.ok) {
                    const freeSimData = await freeSimRes.json();
                    console.log('🎯 Free simulations remaining:', freeSimData.freeSimulationsRemaining);
                    setFreeSimulationsRemaining(freeSimData.freeSimulationsRemaining);
                  }
                } catch (freeSimErr) {
                  console.error('Failed to fetch free simulation count:', freeSimErr);
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch profile settings:', err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          console.log('🚀 Sending quick-start request to API...');

          // Prepare headers with CSRF token if available
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (csrfToken) {
            headers['x-csrf-token'] = csrfToken;
            console.log('🔐 Including CSRF token in request');
          } else {
            console.warn('⚠️ No CSRF token available');
          }

          const response = await fetch('/api/simulation/quick-start', {
            method: 'POST',
            headers,
          });

          console.log('📡 Quick-start API response status:', response.status, response.statusText);

          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ Response is not JSON:', contentType);
            throw new Error('Server returned non-JSON response');
          }

          const data = await response.json();
          console.log('📦 Quick-start API response data:', data);

          if (response.ok && data.success) {
            console.log('✅ Quick simulation completed:', data);
            setResult(data);
            setActiveTab('results');

            // Update household input with the values used
            if (data.household_input) {
              setHousehold(data.household_input);
              setIncludePartner(data.household_input.include_partner ?? !!data.household_input.p2?.name);
            }
          } else {
            console.error('❌ Quick simulation failed:', data);
            // Show error but stay on input tab so user can try manual simulation
            const errorMessage = data.message || data.error || 'Quick simulation failed. Please try entering your details manually.';
            alert(errorMessage);
          }
        } catch (error) {
          console.error('❌ Quick simulation error:', error);
          alert(`Failed to run quick simulation: ${error instanceof Error ? error.message : 'Unknown error'}. Please try entering your details manually.`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkQuickStart();
  }, [isInitialized, prefillAttempted, quickStartAttempted, csrfToken]);

  const loadPrefillDataWithMerge = async (
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
        // NOTE: Government benefits are NOT included here so users can customize them in simulation
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
          // CRITICAL FIX: Include income arrays from database
          // Bug fix for Marc's issue: employment/pension income was being dropped during merge
          'pension_incomes',
          'other_incomes',
          'cpp_start_age',
          'cpp_annual_at_start',
          'oas_start_age',
          'oas_annual_at_start',
        ];

        // Helper to merge person data: use fresh assets, preserve custom settings
        const mergePerson = (savedPerson: PersonInput, freshPerson: PersonInput): PersonInput => {
          const merged = { ...savedPerson };

          // Update asset balances and government benefits from database (always fresh)
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

          // VALIDATION: Log income arrays to help debug if they're ever missing
          if (freshPerson.pension_incomes && freshPerson.pension_incomes.length > 0) {
            console.log('✅ Merged pension_incomes:', freshPerson.pension_incomes.length, 'items');
          }
          if (freshPerson.other_incomes && freshPerson.other_incomes.length > 0) {
            console.log('✅ Merged other_incomes:', freshPerson.other_incomes.length, 'items');
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

        // Calculate spending phases from total annual spending (always use fresh data from expenses)
        const hasExpenseData = data.totalAnnualSpending && data.totalAnnualSpending > 0;
        let spendingUpdate = {};

        if (hasExpenseData) {
          console.log('🔍 Using expense data from profile (merge mode):', data.totalAnnualSpending);
          // Use current spending as go-go phase
          // Reduce by 20% for slow-go phase (common retirement planning assumption)
          // Reduce by 30% for no-go phase (common retirement planning assumption)
          spendingUpdate = {
            spending_go_go: Math.round(data.totalAnnualSpending),
            spending_slow_go: Math.round(data.totalAnnualSpending * 0.8),
            spending_no_go: Math.round(data.totalAnnualSpending * 0.7),
          };
        }

        // Update household with merged data
        setHousehold(prev => ({
          ...prev,
          province: data.province || prev.province,
          start_year: data.calculatedStartYear || prev.start_year, // Use calculated start year based on retirement age
          end_age: data.lifeExpectancy || prev.end_age, // Use life expectancy from profile
          strategy: data.recommendedStrategy || prev.strategy, // Use smart recommended strategy
          spending_inflation: data.spendingInflation !== undefined ? data.spendingInflation : prev.spending_inflation, // From scenario
          general_inflation: data.generalInflation !== undefined ? data.generalInflation : prev.general_inflation, // From scenario
          ...spendingUpdate, // Always update spending from fresh expense data
          p1: mergedP1,
          p2: partnerData,
          include_partner: shouldIncludePartner,
        }));

        setIncludePartner(shouldIncludePartner);
        setUserProfileProvince(data.userProfileProvince || null);
        setPrefillAvailable(true);
        console.log('✅ Profile data merged successfully - asset balances updated, custom settings preserved');
        if (data.recommendedStrategy) {
          console.log('✨ Using smart recommended strategy:', data.recommendedStrategy);
        }
      }
    } catch (error) {
      console.error('Failed to load and merge prefill data:', error);
    } finally {
      setPrefillLoading(false);
    }
  };

  const loadPrefillData = async (token: string | null = csrfToken) => {
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
            // Reduce by 30% for no-go phase (common retirement planning assumption)
            spendingUpdate = {
              spending_go_go: Math.round(data.totalAnnualSpending),
              spending_slow_go: Math.round(data.totalAnnualSpending * 0.8),
              spending_no_go: Math.round(data.totalAnnualSpending * 0.7),
            };
          }

          // Update household with all prefilled data in a single setState call
          setHousehold(prev => ({
            ...prev,
            province: data.province || prev.province,
            start_year: data.calculatedStartYear || prev.start_year, // Use calculated start year based on retirement age
            end_age: data.lifeExpectancy || prev.end_age, // Use life expectancy from profile
            strategy: data.recommendedStrategy || prev.strategy, // Use smart recommended strategy
            spending_inflation: data.spendingInflation !== undefined ? data.spendingInflation : prev.spending_inflation, // From scenario
            general_inflation: data.generalInflation !== undefined ? data.generalInflation : prev.general_inflation, // From scenario
            ...spendingUpdate, // Apply spending data if available
            p1: {
              ...prev.p1,
              ...data.person1Input,
            },
            p2: {
              ...prev.p2,
              ...partnerData,
            },
            include_partner: shouldIncludePartner,
          }));

          setIncludePartner(shouldIncludePartner);
          setUserProfileProvince(data.userProfileProvince || null);
          setPrefillAvailable(true);
          console.log('🔍 Prefill data applied successfully');
          if (data.recommendedStrategy) {
            console.log('✨ Using smart recommended strategy:', data.recommendedStrategy);
          }
        } else {
          console.log('⚠️ Prefill data NOT applied - condition failed (hasAssets=false AND start_age=65 AND hasExpenses=false)');
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
      include_partner: true,
      p2: { ...defaultPersonInput, name: 'Partner' },
    }));
  };

  const handleRemovePartner = () => {
    setIncludePartner(false);
    setHousehold((prev) => ({
      ...prev,
      include_partner: false,
      p2: emptyPersonInput, // Use empty input with zero CPP/OAS
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

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setResendSuccess(true);
        // Reset success message after 5 seconds
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        console.error('Failed to resend verification email');
        alert('Failed to resend verification email. Please try again later.');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      alert('Failed to resend verification email. Please try again later.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleUpgradeClick = (feature: 'csv' | 'pdf' | 'export' | 'early-retirement' | 'general' = 'general') => {
    setUpgradeFeature(feature);
    setShowUpgradeModal(true);
  };

  // Optimization suggestion handlers
  const handleAcceptOptimization = () => {
    if (result?.optimization_result) {
      console.log('✨ User accepted optimization suggestion');
      // Update household strategy to the suggested one
      setHousehold(prev => ({
        ...prev,
        strategy: result.optimization_result!.optimized_strategy as WithdrawalStrategy
      }));
      // Hide the suggestion
      setShowOptimizationSuggestion(false);
      // Auto-run simulation with new strategy
      setTimeout(() => {
        handleRunSimulation();
      }, 100);
    }
  };

  const handleDismissOptimization = () => {
    console.log('❌ User dismissed optimization suggestion');
    setShowOptimizationSuggestion(false);
  };

  const handleRunSimulation = async () => {
    console.log('🎯 RUN SIMULATION BUTTON CLICKED');
    console.log('🔍 Button state - isLoading:', isLoading, 'prefillLoading:', prefillLoading, 'apiHealthy:', apiHealthy);
    setIsLoading(true);
    setResult(null);

    // If no partner, use emptyPersonInput which has all zeros for CPP/OAS
    const simulationData: HouseholdInput = includePartner
      ? { ...household, include_partner: true }
      : {
          ...household,
          include_partner: false,
          p2: emptyPersonInput, // Use empty input with zero CPP/OAS for single person
        };

    try {
      // VALIDATION: Ensure income arrays are present (helps debug Marc's issue)
      console.log('🔍 VALIDATION - Income arrays check:');
      console.log('  P1 pension_incomes:', simulationData.p1.pension_incomes?.length || 0, 'items');
      console.log('  P1 other_incomes:', simulationData.p1.other_incomes?.length || 0, 'items');
      console.log('  P2 pension_incomes:', simulationData.p2.pension_incomes?.length || 0, 'items');
      console.log('  P2 other_incomes:', simulationData.p2.other_incomes?.length || 0, 'items');

      console.log('📡 Calling runSimulation...');
      const response = await runSimulation(simulationData, csrfToken);
      console.log('📥 Received response from runSimulation:', response.success ? 'SUCCESS' : 'FAILED');
      console.log('📊 Response object:', response);

      if (!response.success) {
        console.error('❌ SIMULATION FAILED');
        console.error('Error message:', response.message);
        console.error('Error details:', response.error);
        console.error('Error_details:', response.error_details);
        console.error('Full response:', JSON.stringify(response, null, 2));
      }

      // Debug logging
      if (response.success && response.year_by_year && response.year_by_year.length > 0) {
        console.log('=== SIMULATION PAGE - API RESPONSE ===');
        console.log('Year 2025 total_tax from API:', response.year_by_year[0].total_tax);
        console.log('Year 2025 total_tax_p1:', response.year_by_year[0].total_tax_p1);
        console.log('Year 2025 total_tax_p2:', response.year_by_year[0].total_tax_p2);
        console.log('======================================');
      }

      setResult(response);

      // Show optimization suggestion for new simulations
      setShowOptimizationSuggestion(true);

      // Update free simulations remaining count if present in response
      if (response.freeSimulationsRemaining !== undefined) {
        setFreeSimulationsRemaining(response.freeSimulationsRemaining);
      }

      // Update daily simulations remaining count if present in response
      if (response.dailySimulationsRemaining !== undefined) {
        setDailySimulationsRemaining(response.dailySimulationsRemaining);
      }

      // Switch to results tab if simulation succeeded
      if (response.success) {
        setActiveTab('results');

        // Mark that user has run a simulation (US-067)
        localStorage.setItem('has_run_simulation', 'true');

        // Analyze for low success rate and failure reasons
        const analysis = analyzeFailureReasons(response, simulationData);
        setFailureAnalysis(analysis);

        // Show low success rate warning FIRST if applicable (high priority)
        if (analysis.hasLowSuccessRate) {
          setTimeout(() => {
            setShowLowSuccessWarning(true);
          }, 1500); // Show after 1.5s to let results load
        } else {
          // Show post-simulation feedback modal if not shown before (only if no critical warning)
          if (!hasShownFeedback) {
            // Delay modal appearance by 2 seconds to let user see results first
            setTimeout(() => {
              setShowFeedbackModal(true);
            }, 2000);
          }
        }
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
            <h1 className="text-3xl font-bold text-blue-600">
              {result?.household_input?.p1?.name && result?.household_input?.p2?.name
                ? `Retirement Simulation for ${result.household_input.p1.name} and ${result.household_input.p2.name}`
                : result?.household_input?.p1?.name
                ? `Retirement Simulation for ${result.household_input.p1.name}`
                : 'Retirement Simulation'}
            </h1>
            <p className="text-gray-700">
              {result?.household_input?.strategy && (() => {
                const strategyMap: Record<string, string> = {
                  'minimize-income': 'Minimize Income',
                  'balanced': 'Balanced',
                  'Balanced': 'Balanced (Minimum Only)',
                  'rrif-splitting': 'RRIF Splitting',
                  'rrif-frontload': 'RRSP/RRIF Focused',
                  'corporate-optimized': 'Corporate Optimized',
                  'capital-gains-optimized': 'Capital Gains Optimized',
                  'tfsa-first': 'TFSA First',
                  'manual': 'Manual'
                };
                const strategyName = strategyMap[result.household_input.strategy] || result.household_input.strategy;
                return `Strategy: ${strategyName} • `;
              })()}
              Run comprehensive retirement projections with tax optimization
            </p>
          </div>

          {/* Wizard Mode Toggle */}
          {!result && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={async () => {
                    // Ensure prefill data is loaded before opening wizard
                    if (!prefillAttempted || prefillLoading) {
                      console.log('⏳ Waiting for prefill data to load...');
                      return;
                    }

                    // If no prefill data available, try loading it again
                    if (!prefillAvailable) {
                      console.log('🔄 Loading prefill data for wizard...');
                      await loadPrefillData(csrfToken);
                    }

                    setIsWizardMode(true);
                  }}
                  disabled={prefillLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isWizardMode
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } ${prefillLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🧭 Guided
                </button>
                <button
                  onClick={() => setIsWizardMode(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    !isWizardMode
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ⚡ Express
                </button>
              </div>
            </div>
          )}
        </div>

        {/* US-067: Inline Guidance Banner for New Users */}
        {showGuidanceBanner && !isLoading && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  🎉 Ready to see your retirement plan?
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Click the <strong>"Run Simulation"</strong> button below to generate your personalized retirement projection with:
                </p>
                <ul className="text-sm text-blue-800 space-y-1.5 mb-4 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span>Year-by-year cash flow analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span>Tax-optimized withdrawal strategy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span>Government benefits projections (CPP, OAS, GIS)</span>
                  </li>
                </ul>

                {/* Arrow pointing down */}
                <div className="flex items-center gap-2 text-blue-600 font-medium animate-bounce">
                  <ArrowDown className="h-5 w-5" />
                  <span>Scroll down and click "Run Simulation"</span>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => {
                  localStorage.setItem('guidance_banner_dismissed', 'true');
                  setShowGuidanceBanner(false);
                }}
                className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
                aria-label="Dismiss guidance"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Hero CTA - Prominent call-to-action when user has data but no results */}
        {!result && !prefillLoading && prefillAvailable && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-3">Ready to See Your Retirement Plan?</h2>
            <p className="text-blue-100 mb-6">
              We've loaded your financial profile with $
              {((household.p1.tfsa_balance || 0) + (household.p1.rrsp_balance || 0) + (household.p1.rrif_balance || 0) +
                (household.p1.nr_cash || 0) + (household.p1.nr_gic || 0) + (household.p1.nr_invest || 0) +
                (household.p1.corp_cash_bucket || 0) + (household.p1.corp_gic_bucket || 0) + (household.p1.corp_invest_bucket || 0) +
                (household.p2.tfsa_balance || 0) + (household.p2.rrsp_balance || 0) + (household.p2.rrif_balance || 0) +
                (household.p2.nr_cash || 0) + (household.p2.nr_gic || 0) + (household.p2.nr_invest || 0) +
                (household.p2.corp_cash_bucket || 0) + (household.p2.corp_gic_bucket || 0) + (household.p2.corp_invest_bucket || 0)
              ).toLocaleString()} in assets.
              {' '}Click below to generate your personalized retirement projection with our smart {household.strategy} strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={handleRunSimulation}
                disabled={isLoading || prefillLoading}
                className="text-lg font-semibold !bg-white !text-blue-600 hover:!bg-blue-50"
              >
                {prefillLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading Profile...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Generate My Retirement Plan
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setShowSmartStart(false);
                  setShowDetailedInputs(true);
                }}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                Customize Settings First
              </Button>
            </div>
          </div>
        )}

        {/* Smart Start Card - Shown on first visit or when no results */}
        {showSmartStart && !result && !prefillLoading && !prefillAvailable && (
          <SmartStartCard
            onQuickStart={async () => {
              setShowSmartStart(false);
              await handleRunSimulation();
            }}
            onCustomize={() => {
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
        {prefillAvailable && !prefillLoading && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-900">
              ✓ Your financial profile and assets have been automatically loaded. Review and adjust the values below before running your simulation.
            </AlertDescription>
          </Alert>
        )}

        {/* Stale Data Alert - Phase 2.4: Smart Refresh Prompts */}
        {lastProfileUpdate && lastSimulationLoad && (
          <StaleDataAlert
            lastProfileUpdate={lastProfileUpdate}
            lastSimulationLoad={lastSimulationLoad}
            onRefresh={handleReloadFromProfile}
            isRefreshing={prefillLoading}
          />
        )}

        {/* API Health Warning - Informational only, doesn't block simulation */}
        {apiHealthy === false && (
          <Alert variant="default" className="border-yellow-300 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              Backend health check did not respond. You can still run simulations - if there are issues, you'll see an error message.
            </AlertDescription>
          </Alert>
        )}

        {/* Email Verification Banner - Shows free simulations remaining or verification required */}
        {!emailVerified && !prefillLoading && freeSimulationsRemaining !== undefined && (
          <Alert variant="default" className="border-orange-300 bg-orange-50">
            <Mail className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900">
              {freeSimulationsRemaining > 0
                ? `${freeSimulationsRemaining} Free Simulation${freeSimulationsRemaining === 1 ? '' : 's'} Remaining`
                : 'Email Verification Required'}
            </AlertTitle>
            <AlertDescription className="text-orange-800">
              <p className="mb-3">
                {freeSimulationsRemaining > 0 ? (
                  <>
                    You have {freeSimulationsRemaining} free simulation{freeSimulationsRemaining === 1 ? '' : 's'} remaining.
                    Verify your email to unlock unlimited simulations.
                  </>
                ) : (
                  <>
                    You&apos;ve used your 3 free simulations. Please verify your email to continue.
                    Check your inbox for the verification link we sent you.
                  </>
                )}
              </p>
              <Button
                onClick={handleResendVerification}
                disabled={resendingEmail}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-orange-50 border-orange-300 text-orange-900"
              >
                {resendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Email Sent! Check Your Inbox
                  </>
                ) : (
                  freeSimulationsRemaining > 0 ? 'Verify Now' : 'Resend Verification Email'
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Daily Simulation Limit Banner - Shows for free tier users (verified email) */}
        {emailVerified && dailySimulationsRemaining !== undefined && dailySimulationsRemaining !== -1 && dailySimulationsRemaining <= 5 && !prefillLoading && (
          <Alert variant="default" className="border-blue-300 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">
              {dailySimulationsRemaining > 0
                ? `${dailySimulationsRemaining} Simulation${dailySimulationsRemaining === 1 ? '' : 's'} Remaining Today`
                : 'Daily Limit Reached'}
            </AlertTitle>
            <AlertDescription className="text-blue-800">
              {dailySimulationsRemaining > 0 ? (
                <p>
                  You have {dailySimulationsRemaining} simulation{dailySimulationsRemaining === 1 ? '' : 's'} remaining today (free tier: 10/day).
                  Upgrade to Premium for unlimited simulations and advanced features.
                </p>
              ) : (
                <p>
                  You&apos;ve used all 10 simulations for today. Your limit resets tomorrow.
                  Upgrade to Premium for unlimited simulations anytime.
                </p>
              )}
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
                    <span>{includePartner ? (household.p1.start_age || '—') : (household.p1.name || '—')}</span>
                  </div>
                  {!includePartner && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Age:</span>
                      <span>{household.p1.start_age || '—'}</span>
                    </div>
                  )}
                </div>

                {/* Person 2 - Only if couple */}
                {includePartner && household.p2.name && (
                  <div className="text-sm">
                    <p className="font-medium text-gray-700 mb-2">{household.p2.name}</p>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span>{household.p2.start_age || '—'}</span>
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

      {/* Run Simulation Button */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        <Button
          onClick={handleRunSimulation}
          disabled={isLoading || prefillLoading}
          size="lg"
          className="w-full sm:w-auto sm:min-w-[200px]"
        >
          {prefillLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="hidden sm:inline">Loading Profile...</span>
              <span className="sm:hidden">Loading...</span>
            </>
          ) : isLoading ? (
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

      {/* Wizard Mode or Tabs */}
      {isWizardMode && !result ? (
        <SimulationWizard
          household={household}
          onUpdate={(updates) => setHousehold((prev) => ({ ...prev, ...updates }))}
          onComplete={async () => {
            setIsWizardMode(false);
            await handleRunSimulation();
          }}
          onCancel={() => setIsWizardMode(false)}
          includePartner={includePartner}
        />
      ) : (
        <>
          {/* Tabs for Input and Results - Desktop only, hidden on mobile */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="hidden md:grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="results">
            Results
          </TabsTrigger>
        </TabsList>

        {/* Input Tab - Desktop: Tab content, Mobile: Always visible */}
        <TabsContent value="input" className="md:space-y-6 space-y-6 md:data-[state=inactive]:hidden">
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
                planningAge={household.p1.start_age}
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

        {/* Results Tab - Desktop: Tab content, Mobile: Always visible below input */}
        <TabsContent value="results" className="md:space-y-6 space-y-6 md:data-[state=inactive]:hidden">
          {/* Mobile: Section header when results exist */}
          {result && (
            <div className="md:hidden">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pt-6 border-t-2 border-gray-200">
                Your Results
              </h2>
            </div>
          )}
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

          {/* US-068: Empty State when no results exist yet */}
          {!result && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-gray-100 rounded-full p-6 mb-6">
                <Play className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No simulation results yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Click the <strong>"Run Simulation"</strong> button above to generate your personalized retirement projection with year-by-year analysis, tax optimization, and government benefits.
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-medium mb-6">
                <ArrowDown className="h-5 w-5 animate-bounce" />
                <span>Scroll up and click "Run Simulation"</span>
              </div>
              <Button
                onClick={() => {
                  // Scroll to top where Run Simulation button is
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  // Switch to Input tab on mobile
                  if (window.innerWidth < 768) {
                    setActiveTab('input');
                  }
                }}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-5 w-5 mr-2" />
                Go to Input Tab
              </Button>
            </div>
          )}

          {result ? (
            <>
              {/* US-044: Strategy Optimization Suggestion */}
              {result.optimization_result && result.optimization_result.optimized && showOptimizationSuggestion && (
                <OptimizationSuggestion
                  optimization={result.optimization_result}
                  onAccept={handleAcceptOptimization}
                  onDismiss={handleDismissOptimization}
                />
              )}

              {/* Health Score Card - Prominent Position */}
              {result.success && result.summary && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Mobile: Health score first for immediate impact */}
                  <div className="lg:col-span-1 order-1 lg:order-1">
                    <HealthScoreCard summary={result.summary} />
                  </div>
                  <div className="lg:col-span-2 order-2 lg:order-2">
                    <ResultsDashboard
                      result={result}
                      isPremium={isPremium}
                      onUpgradeClick={() => handleUpgradeClick('pdf')}
                    />
                  </div>
                </div>
              )}

              {/* Fallback if no summary */}
              {result.success && !result.summary && (
                <ResultsDashboard
                  result={result}
                  isPremium={isPremium}
                  onUpgradeClick={() => handleUpgradeClick('pdf')}
                />
              )}

              {/* Error state */}
              {!result.success && (
                <ResultsDashboard
                  result={result}
                  isPremium={isPremium}
                  onUpgradeClick={() => handleUpgradeClick('pdf')}
                />
              )}

              {/* Charts Section */}
              {result.success && result.year_by_year && result.year_by_year.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>Visualizations</h2>

                  {/* Portfolio Chart - Full width, optimized for all screens */}
                  <PortfolioChart
                    yearByYear={result.year_by_year}
                    isSinglePerson={!result.household_input?.include_partner}
                    personOneName={result.household_input?.p1?.name || 'Person 1'}
                    personTwoName={result.household_input?.p2?.name || 'Person 2'}
                  />

                  {/* Tax and Spending Charts - Stack on mobile, side-by-side on desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <TaxChart
                      yearByYear={result.year_by_year}
                      isSinglePerson={!result.household_input?.include_partner}
                      personOneName={result.household_input?.p1?.name || 'Person 1'}
                      personTwoName={result.household_input?.p2?.name || 'Person 2'}
                    />
                    <SpendingChart
                      yearByYear={result.year_by_year}
                      isSinglePerson={!result.household_input?.include_partner}
                      personOneName={result.household_input?.p1?.name || 'Person 1'}
                      personTwoName={result.household_input?.p2?.name || 'Person 2'}
                    />
                  </div>

                  {/* Additional Charts from chart_data */}
                  {result.chart_data?.data_points && result.chart_data.data_points.length > 0 && (
                    <>
                      {/* Government Benefits and Withdrawals - Stack on mobile */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        <GovernmentBenefitsChart
                          chartData={result.chart_data.data_points}
                          reinvestNonregDist={result.household_input?.reinvest_nonreg_dist ?? true}
                          isSinglePerson={!result.household_input?.include_partner}
                          personOneName={result.household_input?.p1?.name || 'Person 1'}
                          personTwoName={result.household_input?.p2?.name || 'Person 2'}
                        />
                        <WithdrawalsBySourceChart
                          chartData={result.chart_data.data_points}
                          isSinglePerson={!result.household_input?.include_partner}
                          personOneName={result.household_input?.p1?.name || 'Person 1'}
                          personTwoName={result.household_input?.p2?.name || 'Person 2'}
                        />
                      </div>
                      {/* Income Composition - Full width */}
                      <IncomeCompositionChart
                        chartData={result.chart_data.data_points}
                        isSinglePerson={!result.household_input?.include_partner}
                        personOneName={result.household_input?.p1?.name || 'Person 1'}
                        personTwoName={result.household_input?.p2?.name || 'Person 2'}
                      />
                    </>
                  )}

                  {/* Year-by-Year Table */}
                  <YearByYearTable
                    yearByYear={result.year_by_year}
                    reinvestNonregDist={result.household_input?.reinvest_nonreg_dist ?? true}
                    isPremium={isPremium}
                    onUpgradeClick={() => handleUpgradeClick('csv')}
                    isSinglePerson={!result.household_input?.include_partner}
                    personOneName={result.household_input?.p1?.name || 'Person 1'}
                    personTwoName={result.household_input?.p2?.name || 'Person 2'}
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
        </>
      )}

      {/* Floating CTA - Show on all devices, always visible on mobile (continuous scroll) */}
      {!isWizardMode && (
        <FloatingCTA
          household={household}
          includePartner={includePartner}
          onRunSimulation={handleRunSimulation}
          isLoading={isLoading}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />

      {/* Post-Simulation Feedback Modal */}
      <PostSimulationFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setHasShownFeedback(true);
        }}
        onSubmit={() => {
          setHasShownFeedback(true);
          localStorage.setItem('post_simulation_feedback_submitted', 'true');
        }}
      />

      {/* Low Success Rate Warning Modal - US-046 */}
      {failureAnalysis && (
        <LowSuccessRateWarning
          analysis={failureAnalysis}
          open={showLowSuccessWarning}
          onAdjustPlan={() => {
            setShowLowSuccessWarning(false);
            setActiveTab('input');
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onDismiss={() => {
            setShowLowSuccessWarning(false);
            // Show feedback modal after dismissing warning (if not shown before)
            if (!hasShownFeedback) {
              setTimeout(() => {
                setShowFeedbackModal(true);
              }, 500);
            }
          }}
        />
      )}
    </div>
  );
}
