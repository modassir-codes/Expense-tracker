import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { Income, IncomeSource } from '../types';
import { INCOME_SOURCES } from '../constants';
import { getTodayDateString } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { sanitizeRemark, validateExpenseAmount, validateDate } from '../utils/security';

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Omit<Income, 'id' | 'createdAt'>, id?: string) => void;
  initialIncome?: Income | null;
  currencySymbol?: string;
  defaultDate?: string;
}

export const IncomeFormModal: React.FC<IncomeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialIncome,
  currencySymbol = '₹',
  defaultDate,
}) => {
  const { isDarkMode } = useTheme();
  const [amount, setAmount] = useState<string>('');
  const [source, setSource] = useState<IncomeSource>('Salary');
  const [remark, setRemark] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate || getTodayDateString());
  const [error, setError] = useState<string>('');

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialIncome) {
        setAmount(String(initialIncome.amount));
        setSource(initialIncome.source);
        setRemark(initialIncome.remark || '');
        setDate(initialIncome.date || getTodayDateString());
      } else {
        setAmount('');
        setSource('Salary');
        setRemark('');
        setDate(defaultDate || getTodayDateString());
      }
      setError('');
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, initialIncome, defaultDate]);

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
        setError('Please enter a valid income amount greater than 0');
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
        source,
        remark: sanitizeRemark(remark),
        date: validDate,
      },
      initialIncome?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="income-modal-title"
    >
      <div
        className={`w-full max-w-lg rounded-t-3xl sm:rounded-2xl border p-5 sm:p-6 transition-all max-h-[92vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 text-white shadow-2xl'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h2 id="income-modal-title" className="text-base sm:text-lg font-bold">
              {initialIncome ? 'Edit Income' : 'Add Income'}
            </h2>
          </div>
          <button
            type="button"
            id="close-income-modal-btn"
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

        {error && (
          <div
            id="income-form-error"
            className="mt-3 p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Amount Input */}
          <div>
            <label
              htmlFor="income-amount-input"
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              Amount ({currencySymbol}) *
            </label>
            <div className="relative">
              <span
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                {currencySymbol}
              </span>
              <input
                ref={amountInputRef}
                id="income-amount-input"
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-xl font-bold tracking-tight outline-hidden transition-colors ${
                  isDarkMode
                    ? 'bg-neutral-950 border-neutral-800 focus:border-emerald-500 text-white placeholder-neutral-700'
                    : 'bg-neutral-50 border-neutral-300 focus:border-emerald-600 text-neutral-900 placeholder-neutral-400'
                }`}
                required
              />
            </div>
          </div>

          {/* Income Source Selection */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              Income Source *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INCOME_SOURCES.map((src) => {
                const isSelected = source === src.id;
                return (
                  <button
                    key={src.id}
                    id={`income-source-btn-${src.id.toLowerCase()}`}
                    type="button"
                    onClick={() => setSource(src.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all touch-manipulation ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                        : isDarkMode
                        ? 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xl mb-1">{src.emoji}</span>
                    <span className="text-xs font-semibold">{src.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remark / Note Input */}
          <div>
            <label
              htmlFor="income-remark-input"
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              Remark / Note (Optional)
            </label>
            <input
              id="income-remark-input"
              type="text"
              maxLength={200}
              placeholder="e.g. Monthly salary, Client project, Dividend"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition-colors ${
                isDarkMode
                  ? 'bg-neutral-950 border-neutral-800 focus:border-emerald-500 text-white placeholder-neutral-700'
                  : 'bg-neutral-50 border-neutral-300 focus:border-emerald-600 text-neutral-900 placeholder-neutral-400'
              }`}
            />
          </div>

          {/* Date Picker + Quick Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="income-date-input"
                className={`block text-xs font-bold uppercase tracking-wider ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                }`}
              >
                Date *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="income-date-today-btn"
                  onClick={() => setDate(todayStr)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                    date === todayStr
                      ? isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : isDarkMode
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  id="income-date-yesterday-btn"
                  onClick={() => setDate(yesterdayStr)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                    date === yesterdayStr
                      ? isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : isDarkMode
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              id="income-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition-colors ${
                isDarkMode
                  ? 'bg-neutral-950 border-neutral-800 focus:border-emerald-500 text-white'
                  : 'bg-neutral-50 border-neutral-300 focus:border-emerald-600 text-neutral-900'
              }`}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              id="cancel-income-btn"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-colors ${
                isDarkMode
                  ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                  : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-income-submit-btn"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{initialIncome ? 'Update Income' : 'Save Income'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
