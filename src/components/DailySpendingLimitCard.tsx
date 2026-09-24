import React from 'react';
import { CalendarClock, AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import { DailySpendingLimitInfo } from '../types';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface DailySpendingLimitCardProps {
  info: DailySpendingLimitInfo;
  currencySymbol?: string;
  onOpenBudgetSetup: (monthKey: string) => void;
}

export const DailySpendingLimitCard: React.FC<DailySpendingLimitCardProps> = ({
  info,
  currencySymbol = '₹',
  onOpenBudgetSetup,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      id="daily-spending-limit-card"
      className={`rounded-2xl p-4 border transition-all ${
        info.status === 'over_budget'
          ? isDarkMode
            ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
            : 'bg-rose-50 border-rose-200 shadow-2xs'
          : isDarkMode
          ? 'bg-neutral-900 border-neutral-800/90 shadow-sm'
          : 'bg-white border-neutral-200/90 shadow-2xs'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800/30">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              info.status === 'over_budget'
                ? isDarkMode
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-rose-100 text-rose-700 border-rose-300'
                : isDarkMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div>
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              Daily Spending Limit
            </h3>
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold ${
            isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
          }`}
        >
          {formatMonthYear(info.monthKey)}
        </span>
      </div>

      {/* Content based on status */}
      <div className="pt-3">
        {info.status === 'no_budget' ? (
          /* No Budget Set */
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <p
                id="daily-limit-no-budget-msg"
                className={`font-medium ${
                  isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                Set a monthly budget to calculate your daily limit
              </p>
            </div>
            <button
              type="button"
              id="daily-limit-set-budget-btn"
              onClick={() => onOpenBudgetSetup(info.monthKey)}
              className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Set Budget</span>
            </button>
          </div>
        ) : info.status === 'over_budget' ? (
          /* Budget Exceeded */
          <div className="flex items-center justify-between gap-2">
            <div>
              <span
                id="daily-limit-exceeded-msg"
                className="text-sm sm:text-base font-bold text-rose-400 block"
              >
                Budget exceeded by {formatCurrency(info.overAmount, currencySymbol)}
              </span>
              <p
                className={`text-[11px] mt-0.5 ${
                  isDarkMode ? 'text-rose-400/80' : 'text-rose-600'
                }`}
              >
                {formatCurrency(info.totalSpent, currencySymbol)} spent out of{' '}
                {formatCurrency(info.totalBudget, currencySymbol)} limit
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                0 remaining
              </span>
            </div>
          </div>
        ) : info.status === 'past_month' ? (
          /* Past Month */
          <div className="flex items-center justify-between text-xs">
            <div>
              <span
                className={`font-bold block ${
                  isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                Month Completed
              </span>
              <p
                className={`text-[11px] mt-0.5 ${
                  isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              >
                Final remaining budget was {formatCurrency(info.remainingBudget, currencySymbol)}
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                isDarkMode
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              Past Month
            </span>
          </div>
        ) : (
          /* Active Normal Daily Limit */
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span
                  className={`text-xs font-medium ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                  }`}
                >
                  Suggested Daily Limit:
                </span>
                <span
                  id="suggested-daily-limit-amount"
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                >
                  {formatCurrency(info.suggestedDailyLimit, currencySymbol)}/day
                </span>
              </div>
              <p
                id="daily-limit-remaining-budget"
                className={`text-[11px] font-semibold mt-0.5 ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {formatCurrency(info.remainingBudget, currencySymbol)} remaining for{' '}
                {info.remainingDays} {info.remainingDays === 1 ? 'day' : 'days'}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              <span
                className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                  isDarkMode
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {info.remainingDays} {info.remainingDays === 1 ? 'Day Left' : 'Days Left'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
