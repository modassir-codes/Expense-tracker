import React, { useState, useMemo } from 'react';
import { X, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Income } from '../types';
import { INCOME_SOURCE_MAP } from '../constants';
import {
  formatCurrency,
  formatDateRelative,
  formatMonthYear,
  getCurrentMonthKey,
  getNextMonthKey,
  getPreviousMonthKey,
} from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

export interface IncomeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomeList: Income[];
  selectedMonthKey?: string;
  onChangeMonth?: (monthKey: string) => void;
  onOpenAddIncome?: () => void;
  onAddNew?: () => void;
  onEditIncome?: (income: Income) => void;
  onEdit?: (income: Income) => void;
  onDeleteIncome?: (income: Income) => void;
  onDelete?: (id: string) => void;
  currencySymbol?: string;
}

export const IncomeManagerModal: React.FC<IncomeManagerModalProps> = ({
  isOpen,
  onClose,
  incomeList,
  selectedMonthKey,
  onChangeMonth,
  onOpenAddIncome,
  onAddNew,
  onEditIncome,
  onEdit,
  onDeleteIncome,
  onDelete,
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();
  const [internalMonth, setInternalMonth] = useState<string>(() => getCurrentMonthKey());
  const [filterMonthOnly, setFilterMonthOnly] = useState<boolean>(true);

  const activeMonthKey = selectedMonthKey || internalMonth;

  const handlePrevMonth = () => {
    const prev = getPreviousMonthKey(activeMonthKey);
    if (onChangeMonth) {
      onChangeMonth(prev);
    } else {
      setInternalMonth(prev);
    }
  };

  const handleNextMonth = () => {
    const next = getNextMonthKey(activeMonthKey);
    if (onChangeMonth) {
      onChangeMonth(next);
    } else {
      setInternalMonth(next);
    }
  };

  const handleAdd = () => {
    if (onAddNew) {
      onAddNew();
    } else if (onOpenAddIncome) {
      onOpenAddIncome();
    }
  };

  const handleEdit = (item: Income) => {
    if (onEdit) {
      onEdit(item);
    } else if (onEditIncome) {
      onEditIncome(item);
    }
  };

  const handleDelete = (item: Income) => {
    if (onDelete) {
      onDelete(item.id);
    } else if (onDeleteIncome) {
      onDeleteIncome(item);
    }
  };

  const displayedIncome = useMemo(() => {
    if (filterMonthOnly) {
      return incomeList.filter((i) => i.date && i.date.startsWith(activeMonthKey));
    }
    return incomeList;
  }, [incomeList, filterMonthOnly, activeMonthKey]);

  const monthTotal = useMemo(() => {
    return displayedIncome.reduce((sum, item) => sum + item.amount, 0);
  }, [displayedIncome]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="income-manager-title"
    >
      <div
        className={`w-full max-w-xl rounded-t-3xl sm:rounded-2xl border p-5 sm:p-6 transition-all max-h-[90vh] flex flex-col ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 text-white shadow-2xl'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <div>
              <h2 id="income-manager-title" className="text-base sm:text-lg font-bold">
                Income Records
              </h2>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Track earnings, freelance, and salary entries
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-income-manager-btn"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDarkMode
                ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Stepper & Total Banner */}
        <div className="pt-3 pb-2 shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="income-manager-prev-month-btn"
                onClick={handlePrevMonth}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-400'
                    : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-600'
                }`}
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-1.5">
                {formatMonthYear(activeMonthKey)}
              </span>
              <button
                type="button"
                id="income-manager-next-month-btn"
                onClick={handleNextMonth}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-400'
                    : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-600'
                }`}
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              id="income-filter-toggle-btn"
              onClick={() => setFilterMonthOnly(!filterMonthOnly)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                !filterMonthOnly
                  ? isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : isDarkMode
                  ? 'bg-neutral-800/80 border-neutral-700 text-neutral-400'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              {filterMonthOnly ? 'Showing Month' : 'Showing All'}
            </button>
          </div>

          {/* Month Total Card */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDarkMode
                ? 'bg-neutral-950/70 border-neutral-800/90'
                : 'bg-neutral-50 border-neutral-200/90'
            }`}
          >
            <div>
              <span
                className={`text-[11px] uppercase tracking-wider font-bold block ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {filterMonthOnly ? `Total Income (${formatMonthYear(activeMonthKey)})` : 'Total Income (All Time)'}
              </span>
              <span
                className={`text-xl font-bold tracking-tight mt-0.5 block ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                +{formatCurrency(monthTotal, currencySymbol)}
              </span>
            </div>

            <button
              type="button"
              id="income-manager-add-btn"
              onClick={handleAdd}
              className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 touch-manipulation"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Income</span>
            </button>
          </div>
        </div>

        {/* Income Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 -mr-1">
          {displayedIncome.length === 0 ? (
            <div
              className={`p-8 text-center border border-dashed rounded-2xl ${
                isDarkMode
                  ? 'bg-neutral-950/40 border-neutral-800 text-neutral-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-400'
              }`}
            >
              <span className="text-2xl block mb-2">💵</span>
              <p
                className={`text-xs font-semibold ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                }`}
              >
                No income recorded for this period
              </p>
              <button
                type="button"
                id="income-empty-add-btn"
                onClick={handleAdd}
                className="mt-3 py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                + Add First Income
              </button>
            </div>
          ) : (
            displayedIncome.map((item) => {
              const srcInfo = INCOME_SOURCE_MAP[item.source];
              return (
                <div
                  key={item.id}
                  id={`income-row-${item.id}`}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isDarkMode
                      ? 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                      : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 border ${
                        isDarkMode
                          ? srcInfo?.bgColor || 'bg-neutral-800 border-neutral-700'
                          : 'bg-neutral-100 border-neutral-200'
                      }`}
                    >
                      {srcInfo?.emoji || '💰'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">
                          {item.source}
                        </span>
                        <span
                          className={`text-[11px] flex items-center gap-1 ${
                            isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateRelative(item.date)}</span>
                        </span>
                      </div>
                      {item.remark && (
                        <p
                          className={`text-[11px] truncate max-w-xs ${
                            isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {item.remark}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    >
                      +{formatCurrency(item.amount, currencySymbol)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        id={`edit-income-${item.id}`}
                        onClick={() => handleEdit(item)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDarkMode
                            ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white'
                            : 'border-neutral-200 hover:bg-neutral-100 text-neutral-600'
                        }`}
                        title="Edit income"
                        aria-label="Edit income"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`delete-income-${item.id}`}
                        onClick={() => handleDelete(item)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDarkMode
                            ? 'border-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 hover:border-rose-500/40'
                            : 'border-neutral-200 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 hover:border-rose-200'
                        }`}
                        title="Delete income"
                        aria-label="Delete income"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800/40 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-colors ${
              isDarkMode
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-750'
                : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
