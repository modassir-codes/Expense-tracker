export type CategoryType =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Bills/Rent'
  | 'Medical'
  | 'Other';

export interface CategoryInfo {
  id: CategoryType;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: CategoryType;
  remark: string;
  date: string; // "YYYY-MM-DD"
  createdAt: number; // timestamp ms
}

export type IncomeSource = 'Salary' | 'Freelance' | 'Business' | 'Other';

export interface Income {
  id: string;
  amount: number;
  source: IncomeSource;
  remark: string;
  date: string; // "YYYY-MM-DD"
  createdAt: number; // timestamp ms
}

export type ViewScreen = 'home' | 'category' | 'all-expenses' | 'settings';

export type TimeFilter = 'today' | 'week' | 'month' | 'all';

export interface AppSettings {
  currencySymbol: string;
  currencyCode: string;
  darkMode: boolean;
}

export type MonthlyCategoryBudgets = Partial<Record<CategoryType, number>>;
export type AllBudgets = Record<string, MonthlyCategoryBudgets>; // key is "YYYY-MM"

export interface CategoryBudgetProgress {
  category: CategoryType;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  overAmount: number;
}

export interface MonthlyBudgetSummary {
  monthKey: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  overallUsage: number;
  isOverBudget: boolean;
  overAmount: number;
  categories: CategoryBudgetProgress[];
  hasAnyBudget: boolean;
}

export interface MonthlyFinancialSummary {
  monthKey: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savings: number;
  savingsPercentage: number;
  topCategory: { category: CategoryType; amount: number } | null;
  budgetSummary: MonthlyBudgetSummary;
}

export type BudgetAlertSeverity = 'warning_75' | 'warning_90' | 'exceeded';

export interface BudgetAlert {
  category: CategoryType;
  percentage: number;
  severity: BudgetAlertSeverity;
  message: string;
  subMessage: string;
  isExceeded: boolean;
  amount: number;
}

export interface DailySpendingLimitInfo {
  monthKey: string;
  hasBudget: boolean;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  isOverBudget: boolean;
  overAmount: number;
  remainingDays: number;
  suggestedDailyLimit: number;
  status: 'normal' | 'over_budget' | 'no_budget' | 'past_month';
}

export interface CategoryTrendComparison {
  category: CategoryType;
  selectedAmount: number;
  previousAmount: number;
  difference: number;
  isIncrease: boolean;
  percentageChange: number | null;
}

export interface MonthlySpendingTrend {
  selectedMonthKey: string;
  previousMonthKey: string;
  selectedMonthTotal: number;
  previousMonthTotal: number;
  difference: number;
  isIncrease: boolean;
  hasPreviousData: boolean;
  categoryComparisons: CategoryTrendComparison[];
}

export interface BackupData {
  version?: number;
  exportedAt?: string;
  expenses: Expense[];
  income?: Income[];
  budgets?: AllBudgets;
}
