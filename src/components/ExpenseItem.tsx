import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Expense } from '../types';
import { CATEGORY_MAP } from '../constants';
import { formatCurrency, formatDateRelative } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  currencySymbol?: string;
  hideCategory?: boolean;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  onEdit,
  onDelete,
  currencySymbol = '₹',
  hideCategory = false,
}) => {
  const { isDarkMode } = useTheme();
  const cat = CATEGORY_MAP[expense.category] || CATEGORY_MAP['Other'];

  return (
    <div
      id={`expense-row-${expense.id}`}
      className={`group border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between transition-all duration-150 ${
        isDarkMode
          ? 'bg-neutral-900/90 hover:bg-neutral-850 border-neutral-800/80 hover:border-neutral-700/80'
          : 'bg-white hover:bg-neutral-50/80 border-neutral-200/90 hover:border-neutral-300 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* Category Icon Badge */}
        {!hideCategory && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border select-none shrink-0 ${
              isDarkMode ? cat.bgColor : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            {cat.emoji}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-base sm:text-lg font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {formatCurrency(expense.amount, currencySymbol)}
            </span>
            {!hideCategory && (
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-medium truncate ${
                  isDarkMode
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {expense.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            {expense.remark ? (
              <p
                className={`text-xs sm:text-sm truncate max-w-[170px] sm:max-w-[240px] ${
                  isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                {expense.remark}
              </p>
            ) : (
              <p
                className={`text-xs italic ${
                  isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              >
                No remark
              </p>
            )}
            <span
              className={`text-xs ${
                isDarkMode ? 'text-neutral-600' : 'text-neutral-300'
              }`}
            >
              •
            </span>
            <span
              className={`text-xs shrink-0 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              {formatDateRelative(expense.date)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons: Edit and Delete */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          id={`edit-expense-${expense.id}`}
          onClick={() => onEdit(expense)}
          className={`p-2 rounded-xl transition-colors ${
            isDarkMode
              ? 'text-neutral-400 hover:text-white hover:bg-neutral-800 active:bg-neutral-700'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200'
          }`}
          title="Edit"
          aria-label="Edit expense"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          id={`delete-expense-${expense.id}`}
          onClick={() => onDelete(expense)}
          className={`p-2 rounded-xl transition-colors ${
            isDarkMode
              ? 'text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20'
              : 'text-neutral-500 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100'
          }`}
          title="Delete"
          aria-label="Delete expense"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
