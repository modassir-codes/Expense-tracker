import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Expense, TimeFilter } from '../types';
import {
  formatCurrency,
  formatDateHeading,
  getTodayDateString,
  isDateInThisMonth,
  isDateInThisWeek,
} from '../utils/formatters';
import { ExpenseItem } from './ExpenseItem';
import { useTheme } from '../context/ThemeContext';

interface AllExpensesScreenProps {
  expenses: Expense[];
  onBack: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  currencySymbol?: string;
}

export const AllExpensesScreen: React.FC<AllExpensesScreenProps> = ({
  expenses,
  onBack,
  onEditExpense,
  onDeleteExpense,
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();
  const [filter, setFilter] = useState<TimeFilter>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const todayStr = getTodayDateString();

  // Filter expenses by time filter
  const timeFilteredExpenses = useMemo(() => {
    switch (filter) {
      case 'today':
        return expenses.filter((e) => e.date === todayStr);
      case 'week':
        return expenses.filter((e) => isDateInThisWeek(e.date));
      case 'month':
        return expenses.filter((e) => isDateInThisMonth(e.date));
      case 'all':
      default:
        return expenses;
    }
  }, [expenses, filter, todayStr]);

  // Search filtering by remark and category name
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return timeFilteredExpenses;
    const query = searchQuery.toLowerCase().trim();
    return timeFilteredExpenses.filter((e) => {
      const matchRemark = (e.remark || '').toLowerCase().includes(query);
      const matchCategory = (e.category || '').toLowerCase().includes(query);
      return matchRemark || matchCategory;
    });
  }, [timeFilteredExpenses, searchQuery]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: Expense[] } = {};
    filteredExpenses.forEach((exp) => {
      if (!groups[exp.date]) {
        groups[exp.date] = [];
      }
      groups[exp.date].push(exp);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dateStr) => ({
        dateStr,
        heading: formatDateHeading(dateStr),
        items: groups[dateStr],
      }));
  }, [filteredExpenses]);

  const filterTabs: { id: TimeFilter; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="all-expenses-back-btn"
          onClick={onBack}
          className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
            isDarkMode
              ? 'text-neutral-400 hover:text-white'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <h2
          className={`text-base font-bold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-neutral-900'
          }`}
        >
          All Expenses
        </h2>
      </div>

      {/* Search Bar at the Top */}
      <div className="relative">
        <Search
          className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
            isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
          }`}
        />
        <input
          id="search-expenses-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by remark or category..."
          aria-label="Search expenses by remark or category"
          autoComplete="off"
          spellCheck={false}
          className={`w-full border rounded-xl py-2.5 pl-10 pr-9 text-xs outline-none transition-all ${
            isDarkMode
              ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50'
              : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs'
          }`}
        />
        {searchQuery && (
          <button
            id="clear-search-btn"
            onClick={() => setSearchQuery('')}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
              isDarkMode ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-800'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        className={`grid grid-cols-4 gap-1 p-1 border rounded-xl ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800'
            : 'bg-white border-neutral-200 shadow-xs'
        }`}
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            id={`filter-tab-${tab.id}`}
            onClick={() => setFilter(tab.id)}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              filter === tab.id
                ? isDarkMode
                  ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                : isDarkMode
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Banner */}
      <div
        className={`border rounded-2xl p-4 flex items-center justify-between ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800/80 shadow-sm'
            : 'bg-white border-neutral-200/90 shadow-xs'
        }`}
      >
        <div>
          <span
            className={`text-[11px] font-medium uppercase tracking-wider block ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            Filtered Total
          </span>
          <span
            className={`text-xs mt-0.5 block ${
              isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'}
          </span>
        </div>
        <span
          id="all-expenses-total-display"
          className={`text-2xl font-bold tracking-tight ${
            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
          }`}
        >
          {formatCurrency(totalAmount, currencySymbol)}
        </span>
      </div>

      {/* Expenses List */}
      <div className="space-y-5">
        {filteredExpenses.length === 0 ? (
          <div
            className={`text-center py-12 px-4 border border-dashed rounded-2xl ${
              isDarkMode
                ? 'bg-neutral-900/30 border-neutral-800'
                : 'bg-white/80 border-neutral-300'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              No expenses found
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-emerald-500 hover:underline"
              >
                Clear search query
              </button>
            )}
          </div>
        ) : (
          groupedByDate.map((group) => (
            <div key={group.dateStr} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {group.heading}
                </h3>
                <span
                  className={`text-xs font-medium ${
                    isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  {formatCurrency(
                    group.items.reduce((s, i) => s + i.amount, 0),
                    currencySymbol
                  )}
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((exp) => (
                  <ExpenseItem
                    key={exp.id}
                    expense={exp}
                    onEdit={onEditExpense}
                    onDelete={onDeleteExpense}
                    currencySymbol={currencySymbol}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
