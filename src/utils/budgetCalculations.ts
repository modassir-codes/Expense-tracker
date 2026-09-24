import { CategoryType, Expense, AllBudgets, MonthlyBudgetSummary, CategoryBudgetProgress } from '../types';
import { CATEGORIES } from '../constants';

/**
 * Calculates budget progress for a specific month and category,
 * ensuring no NaN, Infinity, negative values or broken UI.
 */
export function calculateCategoryBudgetProgress(
  expenses: Expense[],
  monthKey: string,
  category: CategoryType,
  budgetLimit: number
): CategoryBudgetProgress {
  const safeBudget = Number.isFinite(budgetLimit) && budgetLimit > 0 ? budgetLimit : 0;

  // Filter expenses strictly belonging to the given month and category
  const categoryExpenses = expenses.filter(
    (e) => e && e.category === category && typeof e.date === 'string' && e.date.startsWith(monthKey)
  );

  const spent = categoryExpenses.reduce((sum, e) => {
    const amt = typeof e.amount === 'number' && Number.isFinite(e.amount) ? e.amount : 0;
    return sum + amt;
  }, 0);

  const roundedSpent = Math.round(spent * 100) / 100;
  const isOverBudget = safeBudget > 0 ? roundedSpent > safeBudget : false;
  const overAmount = isOverBudget ? Math.round((roundedSpent - safeBudget) * 100) / 100 : 0;
  const remaining = isOverBudget ? 0 : Math.round((safeBudget - roundedSpent) * 100) / 100;

  let rawPercentage = 0;
  if (safeBudget > 0) {
    rawPercentage = (roundedSpent / safeBudget) * 100;
  }
  const percentage = Number.isFinite(rawPercentage) ? Math.round(rawPercentage * 10) / 10 : 0;

  return {
    category,
    budget: safeBudget,
    spent: roundedSpent,
    remaining,
    percentage,
    isOverBudget,
    overAmount,
  };
}

/**
 * Computes full monthly budget summary for a given monthKey.
 */
export function calculateMonthlyBudgetSummary(
  expenses: Expense[],
  budgets: AllBudgets,
  monthKey: string
): MonthlyBudgetSummary {
  const monthBudgets = budgets[monthKey] || {};
  const categoriesProgress: CategoryBudgetProgress[] = [];

  let totalBudget = 0;
  let totalSpent = 0;

  for (const cat of CATEGORIES) {
    const rawLimit = monthBudgets[cat.id];
    if (typeof rawLimit === 'number' && Number.isFinite(rawLimit) && rawLimit > 0) {
      const progress = calculateCategoryBudgetProgress(expenses, monthKey, cat.id, rawLimit);
      categoriesProgress.push(progress);
      totalBudget += progress.budget;
      totalSpent += progress.spent;
    }
  }

  totalBudget = Math.round(totalBudget * 100) / 100;
  totalSpent = Math.round(totalSpent * 100) / 100;

  const hasAnyBudget = categoriesProgress.length > 0;
  const isOverBudget = hasAnyBudget && totalSpent > totalBudget;
  const overAmount = isOverBudget ? Math.round((totalSpent - totalBudget) * 100) / 100 : 0;
  const remaining = isOverBudget ? 0 : Math.round((totalBudget - totalSpent) * 100) / 100;

  let rawOverallUsage = 0;
  if (totalBudget > 0) {
    rawOverallUsage = (totalSpent / totalBudget) * 100;
  }
  const overallUsage = Number.isFinite(rawOverallUsage)
    ? Math.round(rawOverallUsage * 10) / 10
    : 0;

  return {
    monthKey,
    totalBudget,
    totalSpent,
    remaining,
    overallUsage,
    isOverBudget,
    overAmount,
    categories: categoriesProgress,
    hasAnyBudget,
  };
}
