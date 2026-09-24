import {
  AllBudgets,
  BudgetAlert,
  CategoryType,
  DailySpendingLimitInfo,
  Expense,
  Income,
  MonthlyFinancialSummary,
  MonthlySpendingTrend,
  CategoryTrendComparison,
} from '../types';
import { CATEGORIES } from '../constants';
import { calculateMonthlyBudgetSummary } from './budgetCalculations';
import {
  getCurrentMonthKey,
  getPreviousMonthKey,
  getTodayDateString,
} from './formatters';

/**
 * Calculates Monthly Financial Summary:
 * - Total Income for the selected month
 * - Total Expenses for the selected month
 * - Balance = Total Income - Total Expenses
 * - Savings = Same as remaining balance when positive (0 otherwise)
 * - Savings % = (Savings ÷ Total Income) * 100 (safely handles zero income, never NaN or Infinity)
 * - Top Spending Category
 * - Budget Usage summary
 */
export function calculateMonthlyFinancialSummary(
  monthKey: string,
  expenses: Expense[],
  income: Income[],
  budgets: AllBudgets
): MonthlyFinancialSummary {
  // Filter records for selected month
  const monthExpenses = expenses.filter(
    (e) => typeof e?.date === 'string' && e.date.startsWith(monthKey)
  );
  const monthIncome = income.filter(
    (i) => typeof i?.date === 'string' && i.date.startsWith(monthKey)
  );

  const totalIncome = Math.round(
    monthIncome.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0) * 100
  ) / 100;

  const totalExpenses = Math.round(
    monthExpenses.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0) * 100
  ) / 100;

  const balance = Math.round((totalIncome - totalExpenses) * 100) / 100;
  const savings = balance > 0 ? balance : 0;

  let savingsPercentage = 0;
  if (totalIncome > 0 && savings > 0) {
    const rawSavingsPercent = (savings / totalIncome) * 100;
    savingsPercentage = Number.isFinite(rawSavingsPercent)
      ? Math.round(rawSavingsPercent * 10) / 10
      : 0;
  }

  // Calculate top spending category for the month
  const categoryTotals: Record<CategoryType, number> = {
    Food: 0,
    Travel: 0,
    Shopping: 0,
    'Bills/Rent': 0,
    Medical: 0,
    Other: 0,
  };

  monthExpenses.forEach((e) => {
    if (e.category && categoryTotals[e.category] !== undefined) {
      categoryTotals[e.category] += e.amount;
    }
  });

  let topCategory: { category: CategoryType; amount: number } | null = null;
  let maxSpent = 0;

  for (const cat of CATEGORIES) {
    const amt = categoryTotals[cat.id];
    if (amt > maxSpent) {
      maxSpent = amt;
      topCategory = { category: cat.id, amount: Math.round(amt * 100) / 100 };
    }
  }

  const budgetSummary = calculateMonthlyBudgetSummary(expenses, budgets, monthKey);

  return {
    monthKey,
    totalIncome,
    totalExpenses,
    balance,
    savings,
    savingsPercentage,
    topCategory,
    budgetSummary,
  };
}

/**
 * Calculates Budget Alerts for categories that have an active budget limit:
 * - At 75%: "{Category} budget is {usage}% used"
 * - At 90%: "{Category} budget is {usage}% used"
 * - At 100% or above: "{Category} budget exceeded"
 * Includes remaining amount or amount over budget.
 */
export function calculateBudgetAlerts(
  expenses: Expense[],
  budgets: AllBudgets,
  monthKey: string
): BudgetAlert[] {
  const summary = calculateMonthlyBudgetSummary(expenses, budgets, monthKey);
  if (!summary.hasAnyBudget) {
    return [];
  }

  const alerts: BudgetAlert[] = [];

  for (const catProgress of summary.categories) {
    if (catProgress.budget <= 0) continue;

    if (catProgress.isOverBudget || catProgress.percentage >= 100) {
      alerts.push({
        category: catProgress.category,
        percentage: catProgress.percentage,
        severity: 'exceeded',
        message: `${catProgress.category} budget exceeded`,
        subMessage: `${catProgress.percentage}% used`,
        isExceeded: true,
        amount: catProgress.overAmount,
      });
    } else if (catProgress.percentage >= 90) {
      alerts.push({
        category: catProgress.category,
        percentage: catProgress.percentage,
        severity: 'warning_90',
        message: `${catProgress.category} budget is ${catProgress.percentage}% used`,
        subMessage: `${catProgress.remaining} remaining`,
        isExceeded: false,
        amount: catProgress.remaining,
      });
    } else if (catProgress.percentage >= 75) {
      alerts.push({
        category: catProgress.category,
        percentage: catProgress.percentage,
        severity: 'warning_75',
        message: `${catProgress.category} budget is ${catProgress.percentage}% used`,
        subMessage: `${catProgress.remaining} remaining`,
        isExceeded: false,
        amount: catProgress.remaining,
      });
    }
  }

  // Sort: exceeded first, then 90%, then 75%
  return alerts.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Calculates Daily Spending Limit based on monthly budget:
 * Suggested Daily Limit = Remaining Budget ÷ Remaining Days in Month
 * 
 * Rules:
 * - If no budget set -> status: 'no_budget'
 * - If budget exceeded -> status: 'over_budget'
 * - If past month -> status: 'past_month'
 * - Handles final day of month (remainingDays = 1)
 * - Safe against negative or invalid numbers
 */
export function calculateDailySpendingLimit(
  monthKey: string,
  expenses: Expense[],
  budgets: AllBudgets,
  referenceDateStr?: string
): DailySpendingLimitInfo {
  const summary = calculateMonthlyBudgetSummary(expenses, budgets, monthKey);
  const currentActualMonth = getCurrentMonthKey();
  const todayStr = referenceDateStr || getTodayDateString();

  if (!summary.hasAnyBudget || summary.totalBudget <= 0) {
    return {
      monthKey,
      hasBudget: false,
      totalBudget: 0,
      totalSpent: summary.totalSpent,
      remainingBudget: 0,
      isOverBudget: false,
      overAmount: 0,
      remainingDays: 0,
      suggestedDailyLimit: 0,
      status: 'no_budget',
    };
  }

  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  // Total days in the selected month
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  let remainingDays = 0;
  let status: 'normal' | 'over_budget' | 'no_budget' | 'past_month' = 'normal';

  if (monthKey === currentActualMonth) {
    const todayParts = todayStr.split('-');
    const currentDay = parseInt(todayParts[2], 10);
    // Include today in remaining days: on the 30th of 30 days, remaining is 1 day
    remainingDays = Math.max(1, totalDaysInMonth - currentDay + 1);
  } else if (monthKey > currentActualMonth) {
    // Future month: entire month remains
    remainingDays = totalDaysInMonth;
  } else {
    // Past month
    remainingDays = 0;
    status = 'past_month';
  }

  if (summary.isOverBudget) {
    status = 'over_budget';
    return {
      monthKey,
      hasBudget: true,
      totalBudget: summary.totalBudget,
      totalSpent: summary.totalSpent,
      remainingBudget: 0,
      isOverBudget: true,
      overAmount: summary.overAmount,
      remainingDays,
      suggestedDailyLimit: 0,
      status,
    };
  }

  if (status === 'past_month') {
    return {
      monthKey,
      hasBudget: true,
      totalBudget: summary.totalBudget,
      totalSpent: summary.totalSpent,
      remainingBudget: summary.remaining,
      isOverBudget: false,
      overAmount: 0,
      remainingDays: 0,
      suggestedDailyLimit: 0,
      status: 'past_month',
    };
  }

  const rawDailyLimit = remainingDays > 0 ? summary.remaining / remainingDays : 0;
  const suggestedDailyLimit = Number.isFinite(rawDailyLimit)
    ? Math.max(0, Math.round(rawDailyLimit))
    : 0;

  return {
    monthKey,
    hasBudget: true,
    totalBudget: summary.totalBudget,
    totalSpent: summary.totalSpent,
    remainingBudget: summary.remaining,
    isOverBudget: false,
    overAmount: 0,
    remainingDays,
    suggestedDailyLimit,
    status: 'normal',
  };
}

/**
 * Calculates Spending Trends comparing selected month to previous month:
 * - Total expense comparison (more or less)
 * - Category-wise comparison
 * - Clear detection of no previous-month data available
 */
export function calculateSpendingTrends(
  selectedMonthKey: string,
  expenses: Expense[]
): MonthlySpendingTrend {
  const previousMonthKey = getPreviousMonthKey(selectedMonthKey);

  const selectedExpenses = expenses.filter(
    (e) => typeof e?.date === 'string' && e.date.startsWith(selectedMonthKey)
  );
  const previousExpenses = expenses.filter(
    (e) => typeof e?.date === 'string' && e.date.startsWith(previousMonthKey)
  );

  const hasPreviousData = previousExpenses.length > 0;

  const selectedMonthTotal = Math.round(
    selectedExpenses.reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0) * 100
  ) / 100;

  const previousMonthTotal = Math.round(
    previousExpenses.reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0) * 100
  ) / 100;

  const difference = Math.round((selectedMonthTotal - previousMonthTotal) * 100) / 100;
  const isIncrease = difference > 0;

  // Category comparisons
  const categoryComparisons: CategoryTrendComparison[] = CATEGORIES.map((cat) => {
    const selCatSpent = Math.round(
      selectedExpenses
        .filter((e) => e.category === cat.id)
        .reduce((sum, e) => sum + e.amount, 0) * 100
    ) / 100;

    const prevCatSpent = Math.round(
      previousExpenses
        .filter((e) => e.category === cat.id)
        .reduce((sum, e) => sum + e.amount, 0) * 100
    ) / 100;

    const catDiff = Math.round((selCatSpent - prevCatSpent) * 100) / 100;
    const catIsIncrease = catDiff > 0;

    let catPctChange: number | null = null;
    if (prevCatSpent > 0) {
      const rawPct = (Math.abs(catDiff) / prevCatSpent) * 100;
      catPctChange = Number.isFinite(rawPct) ? Math.round(rawPct * 10) / 10 : null;
    }

    return {
      category: cat.id,
      selectedAmount: selCatSpent,
      previousAmount: prevCatSpent,
      difference: Math.abs(catDiff),
      isIncrease: catIsIncrease,
      percentageChange: catPctChange,
    };
  });

  return {
    selectedMonthKey,
    previousMonthKey,
    selectedMonthTotal,
    previousMonthTotal,
    difference: Math.abs(difference),
    isIncrease,
    hasPreviousData,
    categoryComparisons,
  };
}
