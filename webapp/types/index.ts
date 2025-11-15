// User types
export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | null;
  province?: string | null;
  maritalStatus?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  incomeSources: Income[];
  assets: Asset[];
  expenses: Expense[];
  debts: Debt[];
}

// Financial types
export interface Income {
  id: string;
  userId: string;
  type: string;
  description?: string | null;
  amount: number;
  frequency: string;
  isTaxable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  userId: string;
  type: string;
  description?: string | null;
  currentValue: number;
  contributionRoom?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  category: string;
  description?: string | null;
  amount: number;
  frequency: string;
  isEssential: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Debt {
  id: string;
  userId: string;
  type: string;
  description?: string | null;
  currentBalance: number;
  interestRate: number;
  monthlyPayment?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Scenario and Projection types
export interface Scenario {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  retirementAge: number;
  lifeExpectancy: number;
  annualSpendingGoal: number;
  cppStartAge: number;
  oasStartAge: number;
  inflationRate: number;
  investmentReturn: number;
  isBaseline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Projection {
  id: string;
  userId: string;
  scenarioId: string;
  retirementAge: number;
  calculationDate: Date;
  results: string; // JSON string
  successProbability?: number | null;
  totalLifetimeIncome?: number | null;
  estateValue?: number | null;
  createdAt: Date;
}

export interface YearlyProjection {
  age: number;
  year: number;
  cppIncome: number;
  oasIncome: number;
  gisIncome: number;
  pensionIncome: number;
  tfsaWithdrawal: number;
  rrspWithdrawal: number;
  nonRegWithdrawal: number;
  expenses: number;
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  totalIncome: number;
  netIncome: number;
  rrspBalance: number;
  tfsaBalance: number;
  nonRegBalance: number;
  totalAssets: number;
}

// Government benefits types
export interface CPPContribution {
  year: number;
  pensionableEarnings: number;
  ympe: number;
  contributionAmount: number;
  monthsContributed: number;
}

export interface CPPEstimate {
  monthlyAmount: number;
  annualAmount: number;
  startAge: number;
  adjustmentFactor: number;
}

export interface OASEstimate {
  monthlyAmount: number;
  annualAmount: number;
  yearsInCanada: number;
  residencyRatio: number;
  clawback: number;
}

export interface GISEstimate {
  monthlyAmount: number;
  annualAmount: number;
  incomeTestAmount: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface IncomeForm {
  type: string;
  description?: string;
  amount: number;
  frequency: string;
  isTaxable: boolean;
}

export interface AssetForm {
  type: string;
  description?: string;
  currentValue: number;
  contributionRoom?: number;
}

export interface ExpenseForm {
  category: string;
  description?: string;
  amount: number;
  frequency: string;
  isEssential: boolean;
}

export interface DebtForm {
  type: string;
  description?: string;
  currentBalance: number;
  interestRate: number;
  monthlyPayment?: number;
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Constants
export const PROVINCES = [
  { code: 'ON', name: 'Ontario' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'AB', name: 'Alberta' },
  { code: 'QC', name: 'Quebec' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'YT', name: 'Yukon' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
] as const;

export const INCOME_TYPES = [
  { value: 'employment', label: 'Employment Income' },
  { value: 'pension', label: 'Pension Income' },
  { value: 'investment', label: 'Investment Income' },
  { value: 'rental', label: 'Rental Income' },
  { value: 'other', label: 'Other Income' },
] as const;

export const ASSET_TYPES = [
  { value: 'rrsp', label: 'RRSP' },
  { value: 'tfsa', label: 'TFSA' },
  { value: 'non_registered', label: 'Non-Registered Investment' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other', label: 'Other Asset' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'housing', label: 'Housing' },
  { value: 'food', label: 'Food & Groceries' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
] as const;

export const DEBT_TYPES = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'line_of_credit', label: 'Line of Credit' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'other', label: 'Other Debt' },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
] as const;

export const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'common_law', label: 'Common-law' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
] as const;
