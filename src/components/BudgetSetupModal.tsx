import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  Target,
  Sparkles,
} from 'lucide-react';
import { AllBudgets, CategoryType, MonthlyCategoryBudgets } from '../types';
import { CATEGORIES } from '../constants';
import {
  formatMonthYear,
  getPreviousMonthKey,
  getNextMonthKey,
  getCurrentMonthKey,
  formatCurrency,
} from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface BudgetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMonthKey?: string;
  allBudgets: AllBudgets;
  onSaveBudgets: (monthKey: string, categoryBudgets: MonthlyCategoryBudgets) => Promise<void>;
  currencySymbol?: string;
}

export const BudgetSetupModal: React.FC<BudgetSetupModalProps> = ({
  isOpen,
  onClose,
  initialMonthKey,
  allBudgets,
  onSaveBudgets,
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();
  const currentActualMonth = getCurrentMonthKey();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonthKey || currentActualMonth
  );

  // Form input values as strings to allow natural typing, clearing, and decimal input
  const [inputs, setInputs] = useState<Record<CategoryType, string>>({
    Food: '',
    Travel: '',
    Shopping: '',
    'Bills/Rent': '',
    Medical: '',
    Other: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Load budgets whenever modal opens or selectedMonth changes
  useEffect(() => {
    if (!isOpen) return;

    const monthBudgets = allBudgets[selectedMonth] || {};
    const newInputs: Record<CategoryType, string> = {
      Food: '',
      Travel: '',
      Shopping: '',
      'Bills/Rent': '',
      Medical: '',
      Other: '',
    };

    for (const cat of CATEGORIES) {
      const val = monthBudgets[cat.id];
      if (typeof val === 'number' && val > 0) {
        newInputs[cat.id] = String(val);
      }
    }

    setInputs(newInputs);
  }, [isOpen, selectedMonth, allBudgets]);

  // Synchronize initialMonthKey when modal is opened from parent
  useEffect(() => {
    if (initialMonthKey && isOpen) {
      setSelectedMonth(initialMonthKey);
    }
  }, [initialMonthKey, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (category: CategoryType, value: string) => {
    // Only allow positive numbers or empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputs((prev) => ({ ...prev, [category]: value }));
    }
  };

  const handleClearCategory = (category: CategoryType) => {
    setInputs((prev) => ({ ...prev, [category]: '' }));
  };

  const handleClearAll = () => {
    setInputs({
      Food: '',
      Travel: '',
      Shopping: '',
      'Bills/Rent': '',
      Medical: '',
      Other: '',
    });
  };

  const prevMonthKey = getPreviousMonthKey(selectedMonth);
  const prevMonthBudgets = allBudgets[prevMonthKey];
  const hasPrevMonthBudgets =
    prevMonthBudgets &&
    Object.values(prevMonthBudgets).some((v) => typeof v === 'number' && v > 0);

  const handleCopyFromPreviousMonth = () => {
    if (!prevMonthBudgets) return;

    const newInputs: Record<CategoryType, string> = { ...inputs };
    let copiedCount = 0;

    for (const cat of CATEGORIES) {
      const val = prevMonthBudgets[cat.id];
      if (typeof val === 'number' && val > 0) {
        newInputs[cat.id] = String(val);
        copiedCount++;
      }
    }

    setInputs(newInputs);
    setCopiedNotification(`Copied ${copiedCount} budgets from ${formatMonthYear(prevMonthKey)}`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const cleanBudgets: MonthlyCategoryBudgets = {};
      for (const cat of CATEGORIES) {
        const raw = inputs[cat.id]?.trim();
        if (raw) {
          const num = parseFloat(raw);
          if (Number.isFinite(num) && num > 0) {
            cleanBudgets[cat.id] = Math.round(num * 100) / 100;
          }
        }
      }

      await onSaveBudgets(selectedMonth, cleanBudgets);
      onClose();
    } catch (err) {
      console.error('Failed to save budgets:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate live preview total of the entered budgets
  const liveTotalBudget = CATEGORIES.reduce((sum, cat) => {
    const raw = inputs[cat.id]?.trim();
    if (!raw) return sum;
    const num = parseFloat(raw);
    return sum + (Number.isFinite(num) && num > 0 ? num : 0);
  }, 0);

  const activeCategoryCount = CATEGORIES.filter((cat) => {
    const raw = inputs[cat.id]?.trim();
    return raw && parseFloat(raw) > 0;
  }).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-setup-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-md max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl transition-colors overflow-hidden ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
            isDarkMode ? 'border-neutral-800 bg-neutral-900/90' : 'border-neutral-100 bg-white/90'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isDarkMode
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="budget-setup-title" className="text-base font-bold tracking-tight">
                Monthly Budgets
              </h2>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Set category spending limits
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isDarkMode
                ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900'
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Selector Bar */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
            isDarkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-100'
          }`}
        >
          <button
            type="button"
            id="budget-prev-month-btn"
            onClick={() => setSelectedMonth((m) => getPreviousMonthKey(m))}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDarkMode
                ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                : 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-700'
            }`}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span
              id="budget-selected-month-label"
              className="text-sm font-bold tracking-tight block"
            >
              {formatMonthYear(selectedMonth)}
            </span>
            {selectedMonth === currentActualMonth ? (
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">
                Current Month
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedMonth(currentActualMonth)}
                className="text-[10px] text-neutral-400 hover:text-emerald-400 underline transition-colors"
              >
                Jump to Current Month
              </button>
            )}
          </div>

          <button
            type="button"
            id="budget-next-month-btn"
            onClick={() => setSelectedMonth((m) => getNextMonthKey(m))}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDarkMode
                ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                : 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-700'
            }`}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Copy from previous month banner */}
        {hasPrevMonthBudgets && (
          <div
            className={`px-5 py-2.5 border-b flex items-center justify-between shrink-0 text-xs ${
              isDarkMode ? 'bg-neutral-950/40 border-neutral-800' : 'bg-neutral-50/80 border-neutral-100'
            }`}
          >
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Use previous month's limits?</span>
            </div>
            <button
              type="button"
              id="copy-prev-month-budgets-btn"
              onClick={handleCopyFromPreviousMonth}
              className={`inline-flex items-center gap-1 font-semibold px-2 py-1 rounded-md text-[11px] transition-colors ${
                isDarkMode
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-emerald-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <Copy className="w-3 h-3" />
              <span>Copy {formatMonthYear(prevMonthKey).split(' ')[0]}</span>
            </button>
          </div>
        )}

        {/* Notification Toast */}
        {copiedNotification && (
          <div className="px-5 py-2 bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20 text-xs font-medium flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Form Body - Scrollable category inputs */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <p
              className={`text-xs ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Leave empty if you don't want a budget limit for a category.
            </p>

            <div className="space-y-2.5">
              {CATEGORIES.map((cat) => {
                const val = inputs[cat.id];
                const hasValue = !!val && parseFloat(val) > 0;

                return (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      hasValue
                        ? isDarkMode
                          ? 'bg-neutral-950/80 border-emerald-500/30'
                          : 'bg-white border-emerald-400/50 shadow-xs'
                        : isDarkMode
                        ? 'bg-neutral-950/40 border-neutral-800/80'
                        : 'bg-neutral-50/70 border-neutral-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Category Label */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{cat.emoji}</span>
                        <div className="min-w-0">
                          <span
                            className={`text-sm font-semibold truncate block ${
                              isDarkMode ? 'text-neutral-200' : 'text-neutral-900'
                            }`}
                          >
                            {cat.name}
                          </span>
                          <span
                            className={`text-[11px] block ${
                              hasValue
                                ? 'text-emerald-400 font-medium'
                                : isDarkMode
                                ? 'text-neutral-500'
                                : 'text-neutral-400'
                            }`}
                          >
                            {hasValue ? 'Budget Active' : 'No budget set'}
                          </span>
                        </div>
                      </div>

                      {/* Input Box & Clear */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className={`flex items-center rounded-xl border px-2.5 py-1.5 transition-colors ${
                            isDarkMode
                              ? 'bg-neutral-900 border-neutral-700 focus-within:border-emerald-500'
                              : 'bg-white border-neutral-300 focus-within:border-emerald-500'
                          }`}
                        >
                          <span
                            className={`text-xs font-semibold mr-1 select-none ${
                              isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                            }`}
                          >
                            {currencySymbol}
                          </span>
                          <input
                            id={`budget-input-${cat.id.toLowerCase().replace('/', '-')}`}
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            value={inputs[cat.id]}
                            onChange={(e) => handleInputChange(cat.id, e.target.value)}
                            placeholder="0"
                            className={`w-20 sm:w-24 text-right text-sm font-bold bg-transparent outline-none ${
                              isDarkMode ? 'text-white' : 'text-neutral-900'
                            }`}
                          />
                        </div>

                        {/* Clear button */}
                        {hasValue && (
                          <button
                            type="button"
                            onClick={() => handleClearCategory(cat.id)}
                            className={`p-2 rounded-xl transition-colors ${
                              isDarkMode
                                ? 'text-neutral-500 hover:text-rose-400 hover:bg-neutral-800'
                                : 'text-neutral-400 hover:text-rose-600 hover:bg-neutral-100'
                            }`}
                            title={`Clear ${cat.name} budget`}
                            aria-label={`Clear ${cat.name} budget`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer - Live Summary and Save/Clear buttons */}
          <div
            className={`px-5 py-4 border-t space-y-3 shrink-0 ${
              isDarkMode ? 'border-neutral-800 bg-neutral-900/95' : 'border-neutral-100 bg-white/95'
            }`}
          >
            {/* Live Total Preview */}
            <div className="flex items-center justify-between text-xs">
              <span className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>
                Total Monthly Budget ({activeCategoryCount} categories):
              </span>
              <span
                id="budget-modal-total-preview"
                className={`text-sm font-bold ${
                  liveTotalBudget > 0 ? 'text-emerald-400' : isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                }`}
              >
                {formatCurrency(liveTotalBudget, currencySymbol)}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {activeCategoryCount > 0 && (
                <button
                  type="button"
                  id="budget-clear-all-btn"
                  onClick={handleClearAll}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-colors ${
                    isDarkMode
                      ? 'border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800 text-rose-400'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-rose-600'
                  }`}
                >
                  Clear All
                </button>
              )}

              <button
                type="submit"
                id="budget-save-btn"
                disabled={isSaving}
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save {formatMonthYear(selectedMonth)} Budgets</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
