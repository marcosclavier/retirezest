import { CheckCircle2, Circle, ArrowRight, TrendingUp, DollarSign, Calendar, BarChart3, FileText } from 'lucide-react';

interface ActionPlanProps {
  readinessScore: number;
  savingsGap: number;
  additionalMonthlySavings: number;
  targetRetirementAge: number;
  currentAge: number;
  targetAgeFeasible: boolean;
  alternativeRetirementAge: number | null;
  recommendedContributions?: {
    rrspMonthly: number;
    rrspAnnual: number;
    tfsaMonthly: number;
    tfsaAnnual: number;
    nonRegisteredMonthly: number;
    nonRegisteredAnnual: number;
    totalMonthly: number;
    totalAnnual: number;
    warnings: string[];
    notes: string[];
  };
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  icon: any;
  link?: string;
}

export function ActionPlan({
  readinessScore,
  savingsGap,
  additionalMonthlySavings,
  targetRetirementAge,
  currentAge,
  targetAgeFeasible,
  alternativeRetirementAge,
  recommendedContributions,
}: ActionPlanProps) {
  const yearsToRetirement = targetRetirementAge - currentAge;

  // Detect life stage for context-appropriate recommendations
  const lifeStage = (() => {
    if (currentAge >= 65) return 'already_retired';
    if (currentAge >= 60 || yearsToRetirement <= 5) return 'near_retirement';
    if (targetRetirementAge < 55 || (currentAge < 40 && targetRetirementAge < 50)) return 'fire_seeker';
    if (currentAge >= 45 && yearsToRetirement <= 15) return 'mid_career_catchup';
    return 'standard';
  })();

  // Generate personalized action items based on user's situation
  const getActionItems = (): ActionItem[] => {
    const items: ActionItem[] = [];

    // SPECIAL CASE: Already at/past traditional retirement age
    if (lifeStage === 'already_retired') {
      // Focus on withdrawal strategy, not accumulation
      items.push({
        id: 'withdrawal-strategy',
        title: 'Optimize tax-efficient withdrawal strategy',
        description: `You're already at retirement age. Focus on withdrawing from accounts in the most tax-efficient order: Non-registered first (capital gains), then RRSP/RRIF (fully taxable), preserve TFSA for flexibility and estate planning.`,
        priority: 'high',
        completed: false,
        icon: DollarSign,
        link: '/simulation',
      });

      items.push({
        id: 'government-benefits-optimization',
        title: 'Maximize government benefits strategy',
        description: `At your age, CPP and OAS are key income sources. Consider optimal CPP start date (delaying to 70 increases benefits 42%). Watch for OAS clawback if income exceeds $90,997.`,
        priority: 'high',
        completed: false,
        icon: Calendar,
      });

      items.push({
        id: 'estate-planning',
        title: 'Review estate and beneficiary planning',
        description: `With substantial assets, ensure beneficiary designations are current, consider spousal rollovers, and plan for tax-efficient estate transfers.`,
        priority: 'medium',
        completed: false,
        icon: FileText,
      });

      // Skip savings recommendations - not relevant for retirees
      return items;
    }

    // SPECIAL CASE: FIRE seeker (retiring before 55)
    if (lifeStage === 'fire_seeker' && targetRetirementAge < 55) {
      items.push({
        id: 'tfsa-priority',
        title: '⚠️ Prioritize TFSA for early retirement flexibility',
        description: `Critical for FIRE: RRSP funds are locked until age 55 (except HBP/LLP). TFSA withdrawals are always tax-free and penalty-free. Build substantial TFSA to bridge ages ${targetRetirementAge}-55.`,
        priority: 'high',
        completed: false,
        icon: TrendingUp,
      });

      items.push({
        id: 'bridge-years-planning',
        title: `Plan for "bridge years" (age ${targetRetirementAge}-65)`,
        description: `Before government benefits start: CPP earliest at 60, OAS at 65. You'll need ${65 - targetRetirementAge} years of expenses from savings alone. Consider part-time work or semi-retirement.`,
        priority: 'high',
        completed: false,
        icon: Calendar,
      });
    }

    // NEAR RETIREMENT: Focus shifts to preservation and transition
    if (lifeStage === 'near_retirement') {
      items.push({
        id: 'risk-reduction',
        title: 'Review investment risk tolerance',
        description: `With ${yearsToRetirement} years to retirement, consider gradually shifting to more conservative allocations to protect against market downturns.`,
        priority: 'high',
        completed: false,
        icon: TrendingUp,
      });

      items.push({
        id: 'cpp-oas-planning',
        title: 'Finalize CPP/OAS claiming strategy',
        description: `Decide when to start CPP (60-70) and plan OAS timing. Delaying CPP past 65 adds 0.7%/month (8.4%/year). Run scenarios in full simulation.`,
        priority: 'high',
        completed: false,
        icon: Calendar,
        link: '/simulation',
      });
    }

    // High priority actions based on savings gap
    if (savingsGap > 0 && recommendedContributions) {
      // CRA-compliant account-specific recommendations
      const { rrspMonthly, tfsaMonthly, nonRegisteredMonthly, totalMonthly } = recommendedContributions;

      let description = `To close your savings gap, increase your monthly contributions:\n`;
      if (rrspMonthly > 0) {
        description += `\n• RRSP: $${Math.round(rrspMonthly)}/month (tax-deductible)`;
      }
      if (tfsaMonthly > 0) {
        description += `\n• TFSA: $${Math.round(tfsaMonthly)}/month (tax-free growth)`;
      }
      if (nonRegisteredMonthly > 0) {
        description += `\n• Non-Registered: $${Math.round(nonRegisteredMonthly)}/month (taxable)`;
      }
      description += `\n\nTotal: $${Math.round(totalMonthly)}/month. Consider automating these transfers.`;

      items.push({
        id: 'increase-savings',
        title: `Increase monthly savings (CRA-compliant breakdown)`,
        description,
        priority: 'high',
        completed: false,
        icon: DollarSign,
      });
    } else if (savingsGap > 0) {
      // Fallback for when recommendedContributions not available
      items.push({
        id: 'increase-savings',
        title: `Increase monthly savings to $${Math.round(additionalMonthlySavings)}`,
        description: `Add $${Math.round(additionalMonthlySavings)}/month to close your savings gap. Consider automating this transfer to make it effortless.`,
        priority: 'high',
        completed: false,
        icon: DollarSign,
      });
    }

    // RRSP optimization (context-aware)
    if (lifeStage !== 'fire_seeker' || targetRetirementAge >= 55) {
      items.push({
        id: 'maximize-rrsp',
        title: 'Maximize RRSP contributions',
        description: lifeStage === 'mid_career_catchup'
          ? 'Check your RRSP contribution room - you may have significant unused room from prior years. This provides immediate tax deductions while catching up on retirement savings.'
          : 'Check your RRSP contribution room and maximize tax-deferred savings. This reduces current taxes while building retirement wealth.',
        priority: savingsGap > 0 ? 'high' : 'medium',
        completed: false,
        icon: TrendingUp,
        link: '/profile',
      });
    }

    // TFSA optimization (context-aware priority)
    items.push({
      id: 'maximize-tfsa',
      title: lifeStage === 'fire_seeker' ? '🔥 Maximize TFSA (Critical for Early Retirement)' : 'Maximize TFSA contributions',
      description: lifeStage === 'fire_seeker'
        ? `HIGHEST PRIORITY for retiring at ${targetRetirementAge}: TFSA provides penalty-free access before age 55. Unlike RRSP, you can withdraw anytime without tax. Build this first for early retirement flexibility.`
        : 'Use your TFSA contribution room for tax-free growth. Ideal for early retirement since withdrawals are tax-free and don\'t affect OAS/GIS eligibility.',
      priority: lifeStage === 'fire_seeker' ? 'high' : 'medium',
      completed: false,
      icon: TrendingUp,
      link: '/profile',
    });

    // Government benefits optimization (skip if already handled in near_retirement section)
    if (targetRetirementAge < 65 && lifeStage !== 'near_retirement') {
      const bridgeYears = 65 - targetRetirementAge;
      items.push({
        id: 'cpp-strategy',
        title: 'Plan CPP/OAS claiming strategy',
        description: lifeStage === 'fire_seeker'
          ? `Critical: OAS doesn't start until 65, CPP earliest at 60. You'll need ${bridgeYears} years of expenses from savings alone (ages ${targetRetirementAge}-65). Consider semi-retirement or part-time work during this period.`
          : 'If retiring before 65, decide when to start CPP (60-70) and plan for OAS at 65. Delaying can increase benefits significantly.',
        priority: lifeStage === 'fire_seeker' ? 'high' : 'medium',
        completed: false,
        icon: Calendar,
        link: '/simulation',
      });
    }

    // Consider alternative retirement age (with reality check)
    if (!targetAgeFeasible && alternativeRetirementAge) {
      const yearsDelay = alternativeRetirementAge - targetRetirementAge;
      const isSignificantGap = savingsGap > 500000; // Large gap suggests major issues

      items.push({
        id: 'alternative-age',
        title: isSignificantGap
          ? `⚠️ Reality Check: Delay retirement to age ${alternativeRetirementAge}`
          : `Consider retiring at age ${alternativeRetirementAge}`,
        description: isSignificantGap
          ? `With a $${Math.round(savingsGap/1000)}K shortfall, retiring at ${targetRetirementAge} is not realistic with current savings. Delaying ${yearsDelay} years to age ${alternativeRetirementAge} makes retirement achievable. Alternative: dramatically increase savings or reduce expenses.`
          : `Retiring ${yearsDelay} years later allows your savings more time to grow, requiring less additional savings now. This could make early retirement much more comfortable.`,
        priority: isSignificantGap ? 'high' : 'medium',
        completed: false,
        icon: Calendar,
      });
    }

    // Run full simulation
    items.push({
      id: 'full-simulation',
      title: 'Run comprehensive retirement simulation',
      description: 'Get year-by-year projections, tax optimization strategies, and detailed cash flow analysis.',
      priority: readinessScore < 60 ? 'high' : 'low',
      completed: false,
      icon: BarChart3,
      link: '/simulation',
    });

    // Review expenses
    if (savingsGap > 0 && savingsGap > 100000) {
      items.push({
        id: 'review-expenses',
        title: 'Review and optimize expenses',
        description: 'Reducing planned retirement expenses by 10% could significantly close your savings gap.',
        priority: 'medium',
        completed: false,
        icon: FileText,
        link: '/profile',
      });
    }

    return items;
  };

  const actionItems = getActionItems();
  const highPriority = actionItems.filter(item => item.priority === 'high');
  const mediumPriority = actionItems.filter(item => item.priority === 'medium');
  const lowPriority = actionItems.filter(item => item.priority === 'low');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'medium':
        return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      default:
        return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
  };

  const renderActionItem = (item: ActionItem) => {
    const colors = getPriorityColor(item.priority);
    const Icon = item.icon;

    return (
      <div
        key={item.id}
        className={`border-2 ${colors.border} ${colors.bg} rounded-lg p-4 transition-all hover:shadow-md`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="mt-1">
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Icon */}
          <div className={`${colors.bg} rounded-lg p-2 border ${colors.border}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {item.title}
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              {item.description}
            </p>

            {/* Action Button */}
            {item.link && (
              <a
                href={item.link}
                className="mt-2 inline-flex items-center gap-1 h-8 px-3 text-sm rounded-md font-medium transition-colors border-2 border-current bg-transparent hover:bg-gray-50"
              >
                Take Action
                <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Priority Badge */}
          <div>
            <span className={`text-xs font-semibold ${colors.text} uppercase`}>
              {item.priority}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Your Early Retirement Action Plan
      </h2>
      <p className="text-gray-600 mb-6">
        Follow these personalized steps to achieve your early retirement goal at age {targetRetirementAge}
        ({yearsToRetirement} years from now).
      </p>

      {/* Summary Banner */}
      <div className={`rounded-lg p-4 mb-6 ${
        targetAgeFeasible
          ? 'bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200'
          : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300'
      }`}>
        <div className="flex items-start gap-3">
          {targetAgeFeasible ? (
            <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <TrendingUp className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {targetAgeFeasible
                ? "You're on track for early retirement!"
                : 'Action needed to reach your goal'}
            </h3>
            <p className="text-sm text-gray-700">
              {targetAgeFeasible ? (
                <>
                  Keep following your current plan. Focus on the actions below to optimize
                  your strategy and ensure a comfortable retirement.
                </>
              ) : (
                <>
                  {highPriority.length > 0
                    ? `Complete ${highPriority.length} high-priority ${highPriority.length === 1 ? 'action' : 'actions'} below to get back on track.`
                    : 'Follow the recommended actions below to improve your retirement readiness.'}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action Items by Priority */}
      <div className="space-y-6">
        {/* High Priority */}
        {highPriority.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                HIGH PRIORITY
              </span>
              Do These First
            </h3>
            <div className="space-y-3">
              {highPriority.map(renderActionItem)}
            </div>
          </div>
        )}

        {/* Medium Priority */}
        {mediumPriority.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
              <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                RECOMMENDED
              </span>
              Important Next Steps
            </h3>
            <div className="space-y-3">
              {mediumPriority.map(renderActionItem)}
            </div>
          </div>
        )}

        {/* Low Priority */}
        {lowPriority.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                OPTIONAL
              </span>
              Additional Optimization
            </h3>
            <div className="space-y-3">
              {lowPriority.map(renderActionItem)}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Track Your Progress
              </h4>
              <p className="text-sm text-gray-600">
                Return to this calculator regularly to monitor your progress and adjust your plan.
              </p>
            </div>
            <a
              href="/simulation"
              className="ml-4 inline-flex items-center justify-center h-10 py-2 px-4 rounded-md font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              Run Full Simulation
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
