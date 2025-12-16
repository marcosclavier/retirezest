/**
 * Calculate dynamic profile completion percentage
 * Helps users understand what data they still need to provide
 */

interface ProfileData {
  // Personal Information (20%)
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  province: string | null;
  maritalStatus: string | null;

  // Income count (15%)
  incomeCount: number;

  // Assets count (20%)
  assetCount: number;

  // Expenses count (15%)
  expenseCount: number;

  // Retirement details (15%)
  hasRetirementAge?: boolean;
  hasLifeExpectancy?: boolean;

  // Benefits usage (15%)
  hasUsedCPPCalculator?: boolean;
  hasUsedOASCalculator?: boolean;
}

interface CompletionResult {
  percentage: number;
  completedSections: string[];
  missingSections: MissingSection[];
  breakdown: CompletionBreakdown;
}

interface MissingSection {
  title: string;
  description: string;
  weight: number;
  action?: string;
  link?: string;
}

interface CompletionBreakdown {
  personalInfo: { completed: boolean; weight: 20 };
  income: { completed: boolean; weight: 15 };
  assets: { completed: boolean; weight: 20 };
  expenses: { completed: boolean; weight: 15 };
  retirementDetails: { completed: boolean; weight: 15 };
  benefitsCalculators: { completed: boolean; weight: 15 };
}

/**
 * Calculate profile completion percentage and identify missing sections
 */
export function calculateProfileCompletion(data: ProfileData): CompletionResult {
  let totalPercentage = 0;
  const completedSections: string[] = [];
  const missingSections: MissingSection[] = [];

  // Personal Information (20%)
  const personalInfoComplete =
    !!data.firstName &&
    !!data.lastName &&
    !!data.dateOfBirth &&
    !!data.province &&
    !!data.maritalStatus;

  if (personalInfoComplete) {
    totalPercentage += 20;
    completedSections.push('Personal Information');
  } else {
    missingSections.push({
      title: 'Personal Information',
      description: 'Complete your profile with name, date of birth, province, and marital status',
      weight: 20,
      action: 'Complete Profile',
      link: '/profile',
    });
  }

  // Income Sources (15%)
  const hasIncome = data.incomeCount > 0;
  if (hasIncome) {
    totalPercentage += 15;
    completedSections.push('Income Sources');
  } else {
    missingSections.push({
      title: 'Income Sources',
      description: 'Add at least one income source to understand your cash flow',
      weight: 15,
      action: 'Add Income',
      link: '/profile/income',
    });
  }

  // Assets (20%)
  const hasAssets = data.assetCount > 0;
  if (hasAssets) {
    totalPercentage += 20;
    completedSections.push('Assets');
  } else {
    missingSections.push({
      title: 'Assets',
      description: 'Record your RRSP, TFSA, and other retirement assets',
      weight: 20,
      action: 'Add Assets',
      link: '/profile/assets',
    });
  }

  // Expenses (15%)
  const hasExpenses = data.expenseCount > 0;
  if (hasExpenses) {
    totalPercentage += 15;
    completedSections.push('Expenses');
  } else {
    missingSections.push({
      title: 'Expenses',
      description: 'Track your expenses to estimate retirement spending needs',
      weight: 15,
      action: 'Add Expenses',
      link: '/profile/expenses',
    });
  }

  // Retirement Details (15%)
  // This could come from user profile or projection inputs
  const hasRetirementDetails = data.hasRetirementAge && data.hasLifeExpectancy;
  if (hasRetirementDetails) {
    totalPercentage += 15;
    completedSections.push('Retirement Planning Details');
  } else {
    missingSections.push({
      title: 'Retirement Planning Details',
      description: 'Set your target retirement age and life expectancy',
      weight: 15,
      action: 'Update Profile',
      link: '/profile/settings',
    });
  }

  // Benefits Calculators (15%)
  const hasUsedBenefits = data.hasUsedCPPCalculator || data.hasUsedOASCalculator;
  if (hasUsedBenefits) {
    totalPercentage += 15;
    completedSections.push('Government Benefits');
  } else {
    missingSections.push({
      title: 'Government Benefits',
      description: 'Estimate your CPP and OAS benefits. Consult CRA (Canada Revenue Agency) for your personalized estimated amounts.',
      weight: 15,
      action: 'Calculate Benefits',
      link: '/benefits',
    });
  }

  return {
    percentage: Math.round(totalPercentage),
    completedSections,
    missingSections,
    breakdown: {
      personalInfo: { completed: personalInfoComplete, weight: 20 },
      income: { completed: hasIncome, weight: 15 },
      assets: { completed: hasAssets, weight: 20 },
      expenses: { completed: hasExpenses, weight: 15 },
      retirementDetails: { completed: hasRetirementDetails || false, weight: 15 },
      benefitsCalculators: { completed: hasUsedBenefits || false, weight: 15 },
    },
  };
}

/**
 * Get completion status level
 */
export function getCompletionLevel(percentage: number): {
  level: 'getting-started' | 'in-progress' | 'almost-there' | 'complete';
  label: string;
  color: string;
} {
  if (percentage < 25) {
    return {
      level: 'getting-started',
      label: 'Getting Started',
      color: 'red',
    };
  } else if (percentage < 60) {
    return {
      level: 'in-progress',
      label: 'In Progress',
      color: 'yellow',
    };
  } else if (percentage < 100) {
    return {
      level: 'almost-there',
      label: 'Almost There',
      color: 'blue',
    };
  } else {
    return {
      level: 'complete',
      label: 'Complete',
      color: 'green',
    };
  }
}

/**
 * Get next recommended action
 */
export function getNextAction(missingSections: MissingSection[]): MissingSection | null {
  // Sort by weight (importance) descending
  const sorted = [...missingSections].sort((a, b) => b.weight - a.weight);
  return sorted[0] || null;
}
