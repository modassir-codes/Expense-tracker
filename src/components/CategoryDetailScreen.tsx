import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Calendar, ChevronDown, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryType, Expense } from '../types';
import { CATEGORY_MAP } from '../constants';
import {
  formatCurrency,
  formatDateHeading,
  formatMonthYear,
  getCurrentMonthKey,
} from '../utils/formatters';
import { ExpenseItem } from './ExpenseItem';
import { useTheme } from '../context/ThemeContext';

const PIE_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#e11d48', // rose
  '#0ea5e9', // sky
];

interface CategoryDetailScreenProps {
  category: CategoryType;
  expenses: Expense[];
  onBack: () => void;
  onAddExpenseForCategory: (category: CategoryType) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  currencySymbol?: string;
}

export const CategoryDetailScreen: React.FC<CategoryDetailScreenProps> = ({
  category,
  expenses,
  onBack,
  onAddExpenseForCategory,
  onEditExpense,
  onDeleteExpense,
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();
  const currentMonthKey = getCurrentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);

  const catMeta = CATEGORY_MAP[category] || CATEGORY_MAP['Other'];

  // Filter ONLY expenses for this category
  const categoryExpenses = useMemo(() => {
    return expenses.filter((e) => e.category === category);
  }, [expenses, category]);

  // Compute all available months from this category's expenses + current month
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey);
    categoryExpenses.forEach((e) => {
      const m = e.date.substring(0, 7);
      if (m) monthsSet.add(m);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [categoryExpenses, currentMonthKey]);

  // Filter expenses for selected month
  const monthExpenses = useMemo(() => {
    return categoryExpenses.filter((e) => e.date.startsWith(selectedMonth));
  }, [categoryExpenses, selectedMonth]);

  // Calculate monthly total and entries
  const monthTotal = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const totalEntries = monthExpenses.length;

  // Distribution chart data for selected category across the selected month
  const chartData = useMemo(() => {
    return monthExpenses.map((exp, index) => {
      const parts = exp.date.split('-');
      let dateLabel = exp.date;
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const dObj = new Date(`${exp.date}T00:00:00`);
        const mShort = dObj.toLocaleDateString('en-US', { month: 'short' });
        dateLabel = `${day} ${mShort}`;
      }
      const label = exp.remark ? exp.remark : `${dateLabel} Expense`;
      return {
        id: exp.id,
        name: label,
        value: exp.amount,
        date: exp.date,
        dateLabel,
      };
    });
  }, [monthExpenses]);

  // Group by date (descending)
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: Expense[] } = {};
    monthExpenses.forEach((exp) => {
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
  }, [monthExpenses]);

  const isCurrentMonthSelected = selectedMonth === currentMonthKey;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Back and Add */}
      <div className="flex items-center justify-between">
        <button
          id="category-back-btn"
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

        <button
          id="category-add-expense-btn"
          onClick={() => onAddExpenseForCategory(category)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
            isDarkMode
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add {catMeta.name}</span>
        </button>
      </div>

      {/* Category Header Card */}
      <div
        className={`border rounded-2xl p-5 space-y-4 transition-colors ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 shadow-lg'
            : 'bg-white border-neutral-200 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">{catMeta.emoji}</span>
            <div>
              <h2
                className={`text-xl font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {catMeta.name} Expenses
              </h2>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {isCurrentMonthSelected ? 'This Month' : formatMonthYear(selectedMonth)}
              </p>
            </div>
          </div>

          {/* Month Selector Dropdown */}
          <div className="relative">
            <button
              id="category-month-filter-dropdown"
              type="button"
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isDarkMode
                  ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <Calendar
                className={`w-3.5 h-3.5 ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              />
              <span>{formatMonthYear(selectedMonth)}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 ${
                  isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              />
            </button>

            {isMonthPickerOpen && (
              <div
                className={`absolute right-0 mt-1.5 w-48 border rounded-xl py-1.5 shadow-2xl z-30 ${
                  isDarkMode
                    ? 'bg-neutral-950 border-neutral-800'
                    : 'bg-white border-neutral-200 shadow-lg'
                }`}
              >
                <div
                  className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  Select Month
                </div>
                {availableMonths.map((mKey) => (
                  <button
                    key={mKey}
                    id={`select-month-${mKey}`}
                    onClick={() => {
                      setSelectedMonth(mKey);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                      selectedMonth === mKey
                        ? isDarkMode
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                          : 'bg-emerald-50 text-emerald-700 font-semibold'
                        : isDarkMode
                        ? 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <span>{formatMonthYear(mKey)}</span>
                    {mKey === currentMonthKey && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isDarkMode
                            ? 'bg-neutral-800 text-neutral-400'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Highlighted Stats Grid */}
        <div
          className={`grid grid-cols-2 gap-3 pt-2 border-t ${
            isDarkMode ? 'border-neutral-800/80' : 'border-neutral-100'
          }`}
        >
          <div
            className={`border rounded-xl p-3.5 ${
              isDarkMode
                ? 'bg-neutral-950/70 border-neutral-800/80'
                : 'bg-neutral-50/80 border-neutral-200'
            }`}
          >
            <span
              className={`text-[11px] font-medium uppercase tracking-wider block ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Total {catMeta.name} Expense
            </span>
            <span
              id="category-month-total"
              className={`text-2xl font-bold tracking-tight block mt-1 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(monthTotal, currencySymbol)}
            </span>
          </div>

          <div
            className={`border rounded-xl p-3.5 ${
              isDarkMode
                ? 'bg-neutral-950/70 border-neutral-800/80'
                : 'bg-neutral-50/80 border-neutral-200'
            }`}
          >
            <span
              className={`text-[11px] font-medium uppercase tracking-wider block ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Total Entries
            </span>
            <span
              id="category-month-entries"
              className={`text-2xl font-bold tracking-tight block mt-1 ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {totalEntries}
            </span>
          </div>
        </div>
      </div>

      {/* Expense Distribution Pie Chart */}
      <div
        id="category-pie-chart-card"
        className={`border rounded-2xl p-4 transition-colors ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 shadow-lg'
            : 'bg-white border-neutral-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <PieChartIcon
              className={`w-4 h-4 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            />
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              Expense Distribution
            </h3>
          </div>
          <span
            className={`text-xs font-medium ${
              isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            {formatMonthYear(selectedMonth)}
          </span>
        </div>

        {totalEntries === 0 ? (
          <div
            className={`py-8 text-center flex flex-col items-center justify-center border border-dashed rounded-xl ${
              isDarkMode
                ? 'border-neutral-800 bg-neutral-950/40'
                : 'border-neutral-200 bg-neutral-50/50'
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              No expenses to visualize
            </p>
            <p
              className={`text-xl font-bold mt-1 ${
                isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              {formatCurrency(0, currencySymbol)}
            </p>
          </div>
        ) : (
          <div>
            <div className="w-full h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={chartData.length > 1 ? 3 : 0}
                    isAnimationActive={true}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.id || index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke={isDarkMode ? '#171717' : '#ffffff'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      formatCurrency(Number(val), currencySymbol),
                      'Amount',
                    ]}
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                      borderColor: isDarkMode ? '#262626' : '#e5e5e5',
                      borderRadius: '0.75rem',
                      color: isDarkMode ? '#ffffff' : '#171717',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                    }}
                    itemStyle={{
                      color: isDarkMode ? '#34d399' : '#059669',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Segment Details & Simple Legend */}
            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {chartData.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-neutral-950/70 border-neutral-800/70'
                      : 'bg-neutral-50 border-neutral-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                      }}
                    />
                    <span
                      className={`truncate font-medium ${
                        isDarkMode ? 'text-neutral-200' : 'text-neutral-800'
                      }`}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] shrink-0 ${
                        isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      {item.dateLabel}
                    </span>
                  </div>
                  <span
                    className={`font-semibold shrink-0 ${
                      isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(item.value, currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expenses Grouped by Date */}
      <div className="space-y-5">
        {totalEntries === 0 ? (
          <div
            className={`text-center py-12 px-4 border border-dashed rounded-2xl ${
              isDarkMode
                ? 'bg-neutral-900/40 border-neutral-800'
                : 'bg-white/80 border-neutral-300'
            }`}
          >
            <span className="text-4xl block mb-3 select-none opacity-60">
              {catMeta.emoji}
            </span>
            <p
              className={`text-sm font-semibold ${
                isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              No {catMeta.name} expenses{' '}
              {isCurrentMonthSelected ? 'this month' : `in ${formatMonthYear(selectedMonth)}`}
            </p>
            <p
              className={`text-2xl font-bold mt-1 mb-4 ${
                isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              {formatCurrency(0, currencySymbol)}
            </p>
            <button
              id="category-empty-add-btn"
              onClick={() => onAddExpenseForCategory(category)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add {catMeta.name} Expense</span>
            </button>
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
                    hideCategory={true}
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
