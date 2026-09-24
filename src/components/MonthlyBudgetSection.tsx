import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Edit3,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { AllBudgets, Expense } from '../types';
import { CATEGORY_MAP } from '../constants';
import {
  formatCurrency,
  formatMonthYear,
  getCurrentMonthKey,
  getNextMonthKey,
  getPreviousMonthKey,
} from '../utils/formatters';
import { calculateMonthlyBudgetSummary } from '../utils/budgetCalculations';
import { useTheme } from '../context/ThemeContext';

interface MonthlyBudgetSectionProps {
  expenses: Expense[];
  allBudgets: AllBudgets;
  onOpenBudgetSetup: (monthKey: string) => void;
  currencySymbol?: string;
  selectedMonth?: string;
  onMonthChange?: (monthKey: string) => void;
}

export const MonthlyBudgetSection: React.FC<MonthlyBudgetSectionProps> = ({
  expenses,
  allBudgets,
  onOpenBudgetSetup,
  currencySymbol = '₹',
  selectedMonth: controlledMonth,
  onMonthChange,
}) => {
  const { isDarkMode } = useTheme();
  const currentActualMonth = getCurrentMonthKey();

  // State for the selected month (used if not controlled from parent)
  const [internalMonth, setInternalMonth] = useState<string>(currentActualMonth);
  const activeMonth = controlledMonth || internalMonth;

  const handleMonthChange = (newMonth: string) => {
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  // Compute summary automatically whenever expenses, budgets, or activeMonth changes
  const summary = useMemo(() => {
    return calculateMonthlyBudgetSummary(expenses, allBudgets, activeMonth);
  }, [expenses, allBudgets, activeMonth]);

  const monthLabel = formatMonthYear(activeMonth);

  return (
    <section id="monthly-budget-section" className="space-y-3 pt-1">
      {/* Section Header with Month Navigation and Edit Button */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              isDarkMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <h2
            className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
            }`}
          >
            {monthLabel} Budget
          </h2>
        </div>

        {/* Month Switcher Controls & Edit Shortcut */}
        <div className="flex items-center gap-1">
          {/* Previous Month */}
          <button
            type="button"
            id="budget-prev-month-home-btn"
            onClick={() => handleMonthChange(getPreviousMonthKey(activeMonth))}
            className={`p-1.5 rounded-lg border transition-colors touch-manipulation ${
              isDarkMode
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shadow-2xs'
            }`}
            title="Previous month"
            aria-label="Previous month budget"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Quick jump to current month if on a different month */}
          {activeMonth !== currentActualMonth && (
            <button
              type="button"
              id="budget-current-month-jump-btn"
              onClick={() => handleMonthChange(currentActualMonth)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                isDarkMode
                  ? 'bg-neutral-900 border-neutral-800 text-emerald-400 hover:bg-neutral-800'
                  : 'bg-white border-neutral-200 text-emerald-700 hover:bg-neutral-50 shadow-2xs'
              }`}
            >
              Current
            </button>
          )}

          {/* Next Month */}
          <button
            type="button"
            id="budget-next-month-home-btn"
            onClick={() => handleMonthChange(getNextMonthKey(activeMonth))}
            className={`p-1.5 rounded-lg border transition-colors touch-manipulation ${
              isDarkMode
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shadow-2xs'
            }`}
            title="Next month"
            aria-label="Next month budget"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Edit Budgets Shortcut */}
          <button
            type="button"
            id="home-edit-budgets-btn"
            onClick={() => onOpenBudgetSetup(activeMonth)}
            className={`p-1.5 ml-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDarkMode
                ? 'bg-neutral-900 border-neutral-800 text-emerald-400 hover:text-emerald-300 hover:bg-neutral-800'
                : 'bg-white border-neutral-200 text-emerald-600 hover:text-emerald-700 hover:bg-neutral-100 shadow-2xs'
            }`}
            title="Edit budgets"
            aria-label="Edit budgets"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </div>

      {/* Main Budget Card Area */}
      {!summary.hasAnyBudget ? (
        /* Empty State */
        <div
          id="budget-empty-state"
          className={`rounded-2xl p-6 border text-center transition-colors ${
            isDarkMode
              ? 'bg-neutral-900/60 border-neutral-800/90 shadow-md'
              : 'bg-white border-neutral-200/90 shadow-sm'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-xl mb-3 border ${
              isDarkMode
                ? 'bg-neutral-950 border-neutral-800 text-neutral-400'
                : 'bg-neutral-100 border-neutral-200 text-neutral-600'
            }`}
          >
            🎯
          </div>
          <h3
            className={`text-sm font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}
          >
            No monthly budgets set
          </h3>
          <p
            className={`text-xs mt-1 max-w-xs mx-auto ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            Set spending limits for {monthLabel} to track and control your category expenses.
          </p>

          <button
            type="button"
            id="set-monthly-budget-btn"
            onClick={() => onOpenBudgetSetup(activeMonth)}
            className="mt-4 inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/15 touch-manipulation"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Set Monthly Budget</span>
          </button>
        </div>
      ) : (
        /* Active Budgets View */
        <div className="space-y-3">
          {/* TOTAL MONTHLY BUDGET SUMMARY CARD */}
          <div
            id="total-budget-summary-card"
            className={`rounded-2xl p-4.5 border transition-all ${
              summary.isOverBudget
                ? isDarkMode
                  ? 'bg-gradient-to-br from-rose-950/30 via-neutral-900 to-neutral-900 border-rose-500/40 shadow-lg shadow-rose-950/20'
                  : 'bg-gradient-to-br from-rose-50 via-white to-white border-rose-300 shadow-sm'
                : isDarkMode
                ? 'bg-neutral-900 border-neutral-800/90 shadow-lg'
                : 'bg-white border-neutral-200/90 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Total Monthly Budget
              </span>

              {summary.isOverBudget ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                  <span>Over Budget</span>
                </span>
              ) : (
                <span
                  className={`text-xs font-semibold ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  {summary.overallUsage}% used
                </span>
              )}
            </div>

            {/* 3 Metric Columns: Total Budget | Total Spent | Remaining */}
            <div className="grid grid-cols-3 gap-2 py-1">
              {/* Total Budget */}
              <div className="min-w-0">
                <span
                  className={`text-[11px] font-medium block truncate ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  Total Budget
                </span>
                <span
                  id="total-monthly-budget-amount"
                  className={`text-base sm:text-lg font-bold tracking-tight block truncate mt-0.5 ${
                    isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {formatCurrency(summary.totalBudget, currencySymbol)}
                </span>
              </div>

              {/* Total Spent */}
              <div className="min-w-0">
                <span
                  className={`text-[11px] font-medium block truncate ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  Total Spent
                </span>
                <span
                  id="total-monthly-spent-amount"
                  className={`text-base sm:text-lg font-bold tracking-tight block truncate mt-0.5 ${
                    summary.isOverBudget
                      ? 'text-rose-400'
                      : isDarkMode
                      ? 'text-neutral-200'
                      : 'text-neutral-800'
                  }`}
                >
                  {formatCurrency(summary.totalSpent, currencySymbol)}
                </span>
              </div>

              {/* Remaining / Over Budget */}
              <div className="min-w-0 text-right">
                <span
                  className={`text-[11px] font-medium block truncate ${
                    summary.isOverBudget
                      ? 'text-rose-400 font-semibold'
                      : isDarkMode
                      ? 'text-neutral-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {summary.isOverBudget ? 'Over Budget' : 'Remaining'}
                </span>
                <span
                  id="total-monthly-remaining-amount"
                  className={`text-base sm:text-lg font-bold tracking-tight block truncate mt-0.5 ${
                    summary.isOverBudget
                      ? 'text-rose-400'
                      : 'text-emerald-500 dark:text-emerald-400'
                  }`}
                >
                  {summary.isOverBudget
                    ? `+${formatCurrency(summary.overAmount, currencySymbol)}`
                    : formatCurrency(summary.remaining, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-3.5 space-y-1.5">
              <div
                className={`w-full h-2 rounded-full overflow-hidden ${
                  isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'
                }`}
              >
                <div
                  id="total-monthly-progress-bar"
                  className={`h-full rounded-full transition-all duration-300 ${
                    summary.isOverBudget
                      ? 'bg-rose-500'
                      : summary.overallUsage > 80
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.overallUsage))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className={isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}>
                  Overall Usage
                </span>
                <span
                  className={`font-semibold ${
                    summary.isOverBudget
                      ? 'text-rose-400'
                      : isDarkMode
                      ? 'text-neutral-300'
                      : 'text-neutral-700'
                  }`}
                >
                  {summary.isOverBudget
                    ? `${summary.overallUsage}% used (${formatCurrency(
                        summary.overAmount,
                        currencySymbol
                      )} over limit)`
                    : `${summary.overallUsage}% used`}
                </span>
              </div>
            </div>
          </div>

          {/* CATEGORY BUDGET PROGRESS CARDS */}
          <div className="space-y-2">
            {summary.categories.map((catProgress) => {
              const catInfo = CATEGORY_MAP[catProgress.category];
              const cappedVisualPercent = Math.min(100, Math.max(0, catProgress.percentage));

              return (
                <div
                  key={catProgress.category}
                  id={`category-budget-card-${catProgress.category.toLowerCase().replace('/', '-')}`}
                  className={`rounded-2xl p-3.5 border transition-all ${
                    catProgress.isOverBudget
                      ? isDarkMode
                        ? 'bg-neutral-900 border-rose-500/40'
                        : 'bg-white border-rose-300 shadow-2xs'
                      : isDarkMode
                      ? 'bg-neutral-900 border-neutral-800/80 hover:border-neutral-700'
                      : 'bg-white border-neutral-200/80 hover:border-neutral-300 shadow-2xs'
                  }`}
                >
                  {/* Top row: Category emoji & name, and Remaining / Over budget status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{catInfo?.emoji || '📦'}</span>
                      <span
                        className={`text-sm font-bold truncate ${
                          isDarkMode ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        {catProgress.category}
                      </span>
                    </div>

                    {/* Status Badge / Text */}
                    <div className="shrink-0 text-right">
                      {catProgress.isOverBudget ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full">
                          <span>{formatCurrency(catProgress.overAmount, currencySymbol)} over budget</span>
                        </span>
                      ) : (
                        <span
                          className={`text-xs font-semibold ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`}
                        >
                          {formatCurrency(catProgress.remaining, currencySymbol)} remaining
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle row: Spent vs Budget Limit */}
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span
                      className={`font-medium ${
                        isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <strong className={catProgress.isOverBudget ? 'text-rose-400' : ''}>
                        {formatCurrency(catProgress.spent, currencySymbol)}
                      </strong>{' '}
                      spent / {formatCurrency(catProgress.budget, currencySymbol)} budget
                    </span>

                    <span
                      className={`font-bold ${
                        catProgress.isOverBudget
                          ? 'text-rose-400'
                          : isDarkMode
                          ? 'text-neutral-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      {catProgress.percentage}% used
                    </span>
                  </div>

                  {/* Visual Progress Bar (capped at 100% visually) */}
                  <div className="mt-2">
                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          catProgress.isOverBudget
                            ? 'bg-rose-500'
                            : catProgress.percentage > 80
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${cappedVisualPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
