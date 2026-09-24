import React from 'react';
import { Trash2 } from 'lucide-react';
import { Expense } from '../types';
import { formatCurrency, formatDateRelative } from '../utils/formatters';
import { CATEGORY_MAP } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onCancel: () => void;
  onConfirm: () => void;
  currencySymbol?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  expense,
  onCancel,
  onConfirm,
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();
  if (!isOpen || !expense) return null;

  const cat = CATEGORY_MAP[expense.category];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className={`w-full max-w-sm border rounded-2xl p-5 shadow-2xl space-y-4 transition-colors ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDarkMode
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="delete-dialog-title"
              className={`text-base font-bold ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              Delete this expense?
            </h3>
            <p
              className={`text-xs ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Expense snippet preview */}
        <div
          className={`border rounded-xl p-3 flex items-center justify-between ${
            isDarkMode
              ? 'bg-neutral-950/80 border-neutral-800'
              : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl select-none">{cat?.emoji || '📦'}</span>
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold truncate ${
                  isDarkMode ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {expense.remark || expense.category}
              </p>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {expense.category} • {formatDateRelative(expense.date)}
              </p>
            </div>
          </div>
          <span
            className={`text-sm font-bold whitespace-nowrap ml-2 ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {formatCurrency(expense.amount, currencySymbol)}
          </span>
        </div>

        {/* Confirmation buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            id="cancel-delete-expense-btn"
            type="button"
            onClick={onCancel}
            className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
              isDarkMode
                ? 'border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            Cancel
          </button>
          <button
            id="confirm-delete-expense-btn"
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-sm font-semibold transition-all shadow-lg shadow-rose-600/15"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
