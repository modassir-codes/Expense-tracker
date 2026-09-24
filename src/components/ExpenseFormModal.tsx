import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { CategoryType, Expense } from '../types';
import { CATEGORIES } from '../constants';
import { getTodayDateString } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { sanitizeRemark, validateExpenseAmount, validateDate } from '../utils/security';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt'>, id?: string) => void;
  initialExpense?: Expense | null;
  defaultCategory?: CategoryType;
  currencySymbol?: string;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
  defaultCategory = 'Food',
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<CategoryType>(defaultCategory);
  const [remark, setRemark] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [error, setError] = useState<string>('');

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        setAmount(String(initialExpense.amount));
        setCategory(initialExpense.category);
        setRemark(initialExpense.remark || '');
        setDate(initialExpense.date || getTodayDateString());
      } else {
        setAmount('');
        setCategory(defaultCategory);
        setRemark('');
        setDate(getTodayDateString());
      }
      setError('');
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, initialExpense, defaultCategory]);

  if (!isOpen) return null;

  const todayStr = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validAmount = validateExpenseAmount(amount.trim());
    if (validAmount === null) {
      const parsed = parseFloat(amount.trim());
      if (parsed > 100_000_000) {
        setError('Amount cannot exceed ₹10,00,00,000');
      } else {
        setError('Please enter a valid expense amount greater than 0');
      }
      amountInputRef.current?.focus();
      return;
    }

    const validDate = validateDate(date);
    if (!validDate) {
      setError('Please select a valid date');
      return;
    }

    onSave(
      {
        amount: validAmount,
        category,
        remark: sanitizeRemark(remark),
        date: validDate,
      },
      initialExpense?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full max-w-md border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto transition-colors ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-4 border-b mb-5 ${
            isDarkMode ? 'border-neutral-800/80' : 'border-neutral-100'
          }`}
        >
          <h2
            id="modal-title"
            className={`text-lg font-bold ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {initialExpense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            id="close-expense-modal-btn"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount Field */}
          <div>
            <label
              htmlFor="expense-amount-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Amount
            </label>
            <div className="relative flex items-center">
              <span
                className={`absolute left-4 text-2xl sm:text-3xl font-bold select-none ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                {currencySymbol}
              </span>
              <input
                id="expense-amount-input"
                ref={amountInputRef}
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 text-3xl font-bold outline-none transition-all ${
                  isDarkMode
                    ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner'
                }`}
                autoComplete="off"
              />
            </div>
            {error && <p className="text-rose-500 text-xs mt-1.5 font-medium">{error}</p>}
          </div>

          {/* Category Selector */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    id={`category-btn-${cat.id.toLowerCase().replace('/', '-')}`}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-neutral-800 border-emerald-500/80 text-white ring-1 ring-emerald-500/50 shadow-sm'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500 shadow-xs'
                        : isDarkMode
                        ? 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remark Field */}
          <div>
            <label
              htmlFor="expense-remark-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Remark <span className="lowercase font-normal opacity-70">(optional)</span>
            </label>
            <input
              id="expense-remark-input"
              type="text"
              placeholder="e.g. Dinner with friends"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className={`w-full border rounded-xl py-2.5 px-3.5 text-sm outline-none transition-all ${
                isDarkMode
                  ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs'
              }`}
            />
          </div>

          {/* Date Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="expense-date-input"
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Date
              </label>
              {/* Quick Today / Yesterday presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="date-today-btn"
                  onClick={() => setDate(todayStr)}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                    date === todayStr
                      ? isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDarkMode
                      ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  id="date-yesterday-btn"
                  onClick={() => setDate(yesterdayStr)}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                    date === yesterdayStr
                      ? isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDarkMode
                      ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                id="expense-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full border rounded-xl py-2.5 px-3.5 text-sm outline-none transition-all ${
                  isDarkMode
                    ? 'bg-neutral-950 border-neutral-800 text-white [color-scheme:dark] focus:border-emerald-500'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 [color-scheme:light] focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              id="cancel-expense-btn"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                isDarkMode
                  ? 'border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
                  : 'border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-expense-btn"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
