import React from 'react';
import { AlertCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { BudgetAlert } from '../types';
import { CATEGORY_MAP } from '../constants';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface BudgetAlertsSectionProps {
  alerts: BudgetAlert[];
  currencySymbol?: string;
}

export const BudgetAlertsSection: React.FC<BudgetAlertsSectionProps> = ({
  alerts,
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div id="budget-alerts-section" className="space-y-2">
      <div className="flex items-center gap-1.5 px-0.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
        <h3
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
          }`}
        >
          Budget Alerts ({alerts.length})
        </h3>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => {
          const catInfo = CATEGORY_MAP[alert.category];
          const isExceeded = alert.severity === 'exceeded';
          const is90 = alert.severity === 'warning_90';

          return (
            <div
              key={alert.category}
              id={`budget-alert-${alert.category.toLowerCase().replace('/', '-')}`}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                isExceeded
                  ? isDarkMode
                    ? 'bg-rose-950/25 border-rose-500/40 text-rose-300'
                    : 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                  : is90
                  ? isDarkMode
                    ? 'bg-orange-950/25 border-orange-500/40 text-orange-300'
                    : 'bg-orange-50 border-orange-300 text-orange-900 shadow-2xs'
                  : isDarkMode
                  ? 'bg-amber-950/25 border-amber-500/40 text-amber-300'
                  : 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 text-base">
                  {catInfo?.emoji || '📦'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold truncate">
                      {alert.message}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                        isExceeded
                          ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                          : is90
                          ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                          : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {alert.percentage}%
                    </span>
                  </div>
                  <p
                    className={`text-[11px] font-medium mt-0.5 ${
                      isExceeded
                        ? isDarkMode ? 'text-rose-400' : 'text-rose-700'
                        : is90
                        ? isDarkMode ? 'text-orange-400' : 'text-orange-700'
                        : isDarkMode ? 'text-amber-400' : 'text-amber-700'
                    }`}
                  >
                    {isExceeded
                      ? `Exceeded by ${formatCurrency(alert.amount, currencySymbol)}`
                      : `${formatCurrency(alert.amount, currencySymbol)} remaining`}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {isExceeded ? (
                  <AlertOctagon className="w-4 h-4 text-rose-400 stroke-[2.5]" />
                ) : is90 ? (
                  <AlertCircle className="w-4 h-4 text-orange-400 stroke-[2.2]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 stroke-[2.2]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
