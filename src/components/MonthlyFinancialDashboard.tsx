import React from 'react';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  PieChart,
  ArrowUpRight,
  PlusCircle,
  ListOrdered,
} from 'lucide-react';
import { MonthlyFinancialSummary } from '../types';
import { CATEGORY_MAP } from '../constants';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface MonthlyFinancialDashboardProps {
  summary: MonthlyFinancialSummary;
  currencySymbol?: string;
  onOpenAddIncome: () => void;
  onOpenIncomeManager: () => void;
  onOpenBudgetSetup: (monthKey: string) => void;
}

export const MonthlyFinancialDashboard: React.FC<MonthlyFinancialDashboardProps> = ({
  summary,
  currencySymbol = '₹',
  onOpenAddIncome,
  onOpenIncomeManager,
  onOpenBudgetSetup,
}) => {
  const { isDarkMode } = useTheme();
  const monthName = formatMonthYear(summary.monthKey);

  const topCategoryInfo = summary.topCategory
    ? CATEGORY_MAP[summary.topCategory.category]
    : null;

  return (
    <section id="monthly-financial-dashboard" className="space-y-3">
      {/* Dashboard Card Container */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border transition-all ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800/90 shadow-lg'
            : 'bg-white border-neutral-200/90 shadow-sm'
        }`}
      >
        {/* Header Row: Month Title & Income Actions */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800/30">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Financial Dashboard
              </span>
              <h3
                id="financial-dashboard-month-label"
                className={`text-sm sm:text-base font-bold ${
                  isDarkMode ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {monthName}
              </h3>
            </div>
          </div>

          {/* Quick Actions: + Income & Income Records */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="dashboard-open-income-list-btn"
              onClick={onOpenIncomeManager}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isDarkMode
                  ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title="Manage Income"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Records</span>
            </button>
            <button
              type="button"
              id="dashboard-add-income-btn"
              onClick={onOpenAddIncome}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-all shadow-sm shadow-emerald-500/15 touch-manipulation"
              title="Add Income"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Income</span>
            </button>
          </div>
        </div>

        {/* 2x2 Metric Grid: Income, Expenses, Balance, Savings */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-3">
          {/* Total Income */}
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-neutral-950/70 border-neutral-800/80'
                : 'bg-neutral-50 border-neutral-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Income
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span
              id="dashboard-total-income"
              className={`text-lg sm:text-xl font-bold tracking-tight block mt-1 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(summary.totalIncome, currencySymbol)}
            </span>
          </div>

          {/* Total Expenses */}
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-neutral-950/70 border-neutral-800/80'
                : 'bg-neutral-50 border-neutral-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Expenses
              </span>
              <span className="text-xs">💳</span>
            </div>
            <span
              id="dashboard-total-expenses"
              className={`text-lg sm:text-xl font-bold tracking-tight block mt-1 ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {formatCurrency(summary.totalExpenses, currencySymbol)}
            </span>
          </div>

          {/* Remaining Balance */}
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-neutral-950/70 border-neutral-800/80'
                : 'bg-neutral-50 border-neutral-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Balance
              </span>
              <ArrowUpRight
                className={`w-3.5 h-3.5 ${
                  summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              />
            </div>
            <span
              id="dashboard-remaining-balance"
              className={`text-lg sm:text-xl font-bold tracking-tight block mt-1 ${
                summary.balance >= 0
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-neutral-900'
                  : 'text-rose-400'
              }`}
            >
              {formatCurrency(summary.balance, currencySymbol)}
            </span>
          </div>

          {/* Savings & Savings % */}
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-neutral-950/70 border-neutral-800/80'
                : 'bg-neutral-50 border-neutral-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Savings
              </span>
              <PiggyBank className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between mt-1 gap-1">
              <span
                id="dashboard-savings-amount"
                className={`text-lg sm:text-xl font-bold tracking-tight truncate ${
                  summary.savings > 0
                    ? isDarkMode
                      ? 'text-emerald-400'
                      : 'text-emerald-600'
                    : isDarkMode
                    ? 'text-neutral-400'
                    : 'text-neutral-600'
                }`}
              >
                {formatCurrency(summary.savings, currencySymbol)}
              </span>
              <span
                id="dashboard-savings-percentage"
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                  summary.savingsPercentage > 0
                    ? isDarkMode
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-700'
                    : isDarkMode
                    ? 'bg-neutral-800 text-neutral-400'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {summary.savingsPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Highlights: Budget Usage & Top Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5">
          {/* Budget Usage */}
          <div
            className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between ${
              isDarkMode
                ? 'bg-neutral-950/50 border-neutral-800/70'
                : 'bg-neutral-50/80 border-neutral-200/70'
            }`}
          >
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  Budget Usage
                </span>
                <span
                  id="dashboard-budget-usage-text"
                  className={`text-xs font-semibold ${
                    isDarkMode ? 'text-neutral-200' : 'text-neutral-800'
                  }`}
                >
                  {summary.budgetSummary.hasAnyBudget
                    ? `${summary.budgetSummary.overallUsage}% of ${formatCurrency(
                        summary.budgetSummary.totalBudget,
                        currencySymbol
                      )}`
                    : 'No budget set'}
                </span>
              </div>
            </div>

            {!summary.budgetSummary.hasAnyBudget && (
              <button
                type="button"
                id="dashboard-set-budget-link-btn"
                onClick={() => onOpenBudgetSetup(summary.monthKey)}
                className="text-[11px] font-semibold text-emerald-400 hover:underline"
              >
                Set Limit
              </button>
            )}
          </div>

          {/* Top Spending Category */}
          <div
            className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between ${
              isDarkMode
                ? 'bg-neutral-950/50 border-neutral-800/70'
                : 'bg-neutral-50/80 border-neutral-200/70'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">
                {topCategoryInfo?.emoji || '🏷️'}
              </span>
              <div className="min-w-0">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  Top Category
                </span>
                <span
                  id="dashboard-top-category-text"
                  className={`text-xs font-semibold block truncate ${
                    isDarkMode ? 'text-neutral-200' : 'text-neutral-800'
                  }`}
                >
                  {summary.topCategory
                    ? `${summary.topCategory.category} — ${formatCurrency(
                        summary.topCategory.amount,
                        currencySymbol
                      )}`
                    : 'No expenses yet'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
