import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { MonthlySpendingTrend } from '../types';
import { CATEGORY_MAP } from '../constants';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface SpendingTrendsSectionProps {
  trend: MonthlySpendingTrend;
  currencySymbol?: string;
}

export const SpendingTrendsSection: React.FC<SpendingTrendsSectionProps> = ({
  trend,
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();
  const [isCategoryBreakdownOpen, setIsCategoryBreakdownOpen] = useState<boolean>(true);

  const selectedMonthName = formatMonthYear(trend.selectedMonthKey);
  const previousMonthName = formatMonthYear(trend.previousMonthKey);

  return (
    <div
      id="spending-trends-section"
      className={`rounded-2xl p-4 border transition-all ${
        isDarkMode
          ? 'bg-neutral-900 border-neutral-800/90 shadow-sm'
          : 'bg-white border-neutral-200/90 shadow-2xs'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/30">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              isDarkMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div>
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              Spending Trends
            </h3>
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold ${
            isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
          }`}
        >
          vs {previousMonthName}
        </span>
      </div>

      {!trend.hasPreviousData ? (
        /* No Previous Month Data Available */
        <div
          id="trends-no-prev-data"
          className="py-5 text-center px-4"
        >
          <span className="text-xl block mb-1">📊</span>
          <p
            className={`text-xs font-semibold ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            No previous-month data available
          </p>
          <p
            className={`text-[11px] mt-0.5 ${
              isDarkMode ? 'text-neutral-600' : 'text-neutral-400'
            }`}
          >
            Comparisons will automatically appear as you track expenses across consecutive months.
          </p>
        </div>
      ) : (
        /* Comparison Available */
        <div className="pt-3 space-y-3">
          {/* Total Expense Comparison Banner */}
          <div
            id="trends-total-comparison"
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDarkMode
                ? 'bg-neutral-950/70 border-neutral-800/80'
                : 'bg-neutral-50 border-neutral-200/80'
            }`}
          >
            {/* Columns: Selected Month vs Previous Month */}
            <div className="flex items-center gap-6">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {selectedMonthName}
                </span>
                <span
                  id="trends-selected-total"
                  className={`text-base sm:text-lg font-bold block mt-0.5 ${
                    isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {formatCurrency(trend.selectedMonthTotal, currencySymbol)}
                </span>
              </div>

              <div className="border-l pl-6 border-neutral-800/40">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {previousMonthName}
                </span>
                <span
                  id="trends-previous-total"
                  className={`text-base sm:text-lg font-bold block mt-0.5 ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                  }`}
                >
                  {formatCurrency(trend.previousMonthTotal, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Difference / Result */}
            <div className="sm:text-right flex items-center sm:block gap-2">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  trend.difference === 0
                    ? isDarkMode
                      ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      : 'bg-neutral-200 text-neutral-700 border-neutral-300'
                    : !trend.isIncrease
                    ? isDarkMode
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : isDarkMode
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-rose-50 text-rose-700 border-rose-300'
                }`}
              >
                {trend.difference === 0 ? (
                  <Minus className="w-3.5 h-3.5" />
                ) : !trend.isIncrease ? (
                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span id="trends-difference-text">
                  {trend.difference === 0
                    ? 'Same as last month'
                    : `${formatCurrency(trend.difference, currencySymbol)} ${
                        !trend.isIncrease ? 'less' : 'more'
                      } than last month`}
                </span>
              </div>
            </div>
          </div>

          {/* Category-Wise Comparison (Collapsible) */}
          <div className="space-y-2">
            <button
              type="button"
              id="trends-toggle-category-breakdown-btn"
              onClick={() => setIsCategoryBreakdownOpen(!isCategoryBreakdownOpen)}
              className={`w-full py-1.5 flex items-center justify-between text-xs font-bold transition-colors ${
                isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span>Category-Wise Breakdown</span>
              {isCategoryBreakdownOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isCategoryBreakdownOpen && (
              <div className="space-y-1.5">
                {trend.categoryComparisons.map((catComp) => {
                  const catInfo = CATEGORY_MAP[catComp.category];
                  const hasSpentAny =
                    catComp.selectedAmount > 0 || catComp.previousAmount > 0;
                  if (!hasSpentAny) return null;

                  return (
                    <div
                      key={catComp.category}
                      id={`trend-cat-${catComp.category.toLowerCase().replace('/', '-')}`}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                        isDarkMode
                          ? 'bg-neutral-950/50 border-neutral-800/70'
                          : 'bg-white border-neutral-200/70 shadow-2xs'
                      }`}
                    >
                      {/* Category icon and name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">
                          {catInfo?.emoji || '🏷️'}
                        </span>
                        <div className="min-w-0">
                          <span
                            className={`font-bold block truncate ${
                              isDarkMode ? 'text-neutral-200' : 'text-neutral-900'
                            }`}
                          >
                            {catComp.category}
                          </span>
                          <span
                            className={`text-[11px] ${
                              isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                            }`}
                          >
                            {selectedMonthName.split(' ')[0]}:{' '}
                            {formatCurrency(catComp.selectedAmount, currencySymbol)} vs{' '}
                            {previousMonthName.split(' ')[0]}:{' '}
                            {formatCurrency(catComp.previousAmount, currencySymbol)}
                          </span>
                        </div>
                      </div>

                      {/* Change indication */}
                      <div className="shrink-0 text-right">
                        {catComp.difference === 0 ? (
                          <span
                            className={`text-[11px] font-semibold ${
                              isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                            }`}
                          >
                            No change
                          </span>
                        ) : (
                          <div
                            className={`flex items-center justify-end gap-1 font-bold ${
                              !catComp.isIncrease
                                ? isDarkMode
                                  ? 'text-emerald-400'
                                  : 'text-emerald-600'
                                : isDarkMode
                                ? 'text-rose-400'
                                : 'text-rose-600'
                            }`}
                          >
                            {!catComp.isIncrease ? (
                              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                            <span>
                              {catComp.isIncrease ? '+' : '-'}
                              {formatCurrency(catComp.difference, currencySymbol)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
