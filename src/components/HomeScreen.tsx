import React, { useState, useMemo } from 'react';
import {
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wallet,
} from 'lucide-react';
import { AllBudgets, CategoryType, Expense, Income } from '../types';
import { CATEGORIES } from '../constants';
import {
  formatCurrency,
  formatMonthYear,
  getCurrentMonthKey,
  getNextMonthKey,
  getPreviousMonthKey,
  getTodayDateString,
} from '../utils/formatters';
import { ExpenseItem } from './ExpenseItem';
import { MonthlyBudgetSection } from './MonthlyBudgetSection';
import { MonthlyFinancialDashboard } from './MonthlyFinancialDashboard';
import { BudgetAlertsSection } from './BudgetAlertsSection';
import { DailySpendingLimitCard } from './DailySpendingLimitCard';
import { SpendingTrendsSection } from './SpendingTrendsSection';
import { useTheme } from '../context/ThemeContext';
import {
  calculateMonthlyFinancialSummary,
  calculateBudgetAlerts,
  calculateDailySpendingLimit,
  calculateSpendingTrends,
} from '../utils/financialCalculations';

interface HomeScreenProps {
  expenses: Expense[];
  allBudgets: AllBudgets;
  income: Income[];
  onOpenAddExpense: (category?: CategoryType) => void;
  onOpenAddIncome: () => void;
  onOpenIncomeManager: () => void;
  onSelectCategory: (category: CategoryType) => void;
  onOpenAllExpenses: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onOpenBudgetSetup: (monthKey?: string) => void;
  currencySymbol?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  expenses,
  allBudgets,
  income,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenIncomeManager,
  onSelectCategory,
  onOpenAllExpenses,
  onEditExpense,
  onDeleteExpense,
  onOpenBudgetSetup,
  currencySymbol = '₹',
}) => {
  const { isDarkMode } = useTheme();
  const todayStr = getTodayDateString();
  const currentActualMonth = getCurrentMonthKey();

  // Unified Month Selector state that controls all monthly features
  const [selectedMonth, setSelectedMonth] = useState<string>(currentActualMonth);

  // 1. Calculate Today's Expense
  const todayExpense = useMemo(() => {
    return expenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  // 2. Calculate Selected Month's Expense (reflects the selected month)
  const selectedMonthExpense = useMemo(() => {
    return expenses
      .filter((e) => e.date && e.date.startsWith(selectedMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, selectedMonth]);

  // 3. Monthly Financial Dashboard summary
  const financialSummary = useMemo(() => {
    return calculateMonthlyFinancialSummary(selectedMonth, expenses, income, allBudgets);
  }, [selectedMonth, expenses, income, allBudgets]);

  // 5. Budget Alerts
  const budgetAlerts = useMemo(() => {
    return calculateBudgetAlerts(expenses, allBudgets, selectedMonth);
  }, [expenses, allBudgets, selectedMonth]);

  // 6. Daily Spending Limit
  const dailySpendingLimitInfo = useMemo(() => {
    return calculateDailySpendingLimit(selectedMonth, expenses, allBudgets);
  }, [selectedMonth, expenses, allBudgets]);

  // 7. Spending Trends
  const spendingTrend = useMemo(() => {
    return calculateSpendingTrends(selectedMonth, expenses);
  }, [selectedMonth, expenses]);

  // Category totals for the selected month for the category grid
  const categoryMonthlyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses
      .filter((e) => e.date && e.date.startsWith(selectedMonth))
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });
    return map;
  }, [expenses, selectedMonth]);

  // Recent Expenses (latest 5 entries)
  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-6 pb-14">
      {/* 1 & 2. Top Overview Cards: Today's Expense & This Month's Expense */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. Today's Expense Card */}
        <div
          id="today-expense-card"
          className={`rounded-2xl p-4 flex flex-col justify-between transition-colors border ${
            isDarkMode
              ? 'bg-neutral-900 border-neutral-800/90 shadow-lg'
              : 'bg-white border-neutral-200/90 shadow-sm'
          }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-wider block ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            Today's Expense
          </span>
          <div className="mt-2">
            <span
              id="today-expense-total"
              className={`text-2xl sm:text-3xl font-bold tracking-tight block ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(todayExpense, currencySymbol)}
            </span>
          </div>
        </div>

        {/* 2. This Month's Expense Card */}
        <div
          id="month-expense-card"
          className={`rounded-2xl p-4 flex flex-col justify-between transition-colors border ${
            isDarkMode
              ? 'bg-neutral-900 border-neutral-800/90 shadow-lg'
              : 'bg-white border-neutral-200/90 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider block ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              {selectedMonth === currentActualMonth ? 'This Month' : formatMonthYear(selectedMonth)}
            </span>
          </div>
          <div className="mt-2">
            <span
              id="month-expense-total"
              className={`text-2xl sm:text-3xl font-bold tracking-tight block ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {formatCurrency(selectedMonthExpense, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons: + Add Expense & + Add Income */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          id="home-add-expense-btn"
          type="button"
          onClick={() => onOpenAddExpense()}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-sm sm:text-base transition-all shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5 touch-manipulation group"
        >
          <Plus className="w-4 h-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
          <span>+ Expense</span>
        </button>

        <button
          id="home-add-income-btn"
          type="button"
          onClick={onOpenAddIncome}
          className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-1.5 touch-manipulation group ${
            isDarkMode
              ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-emerald-400 hover:border-emerald-500/40'
              : 'bg-white hover:bg-neutral-50 border-neutral-200 text-emerald-700 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <Wallet className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
          <span>+ Income</span>
        </button>
      </div>

      {/* Unified Month Selector Header */}
      <div
        id="unified-month-selector"
        className={`rounded-2xl p-2.5 sm:p-3 border flex items-center justify-between transition-colors ${
          isDarkMode
            ? 'bg-neutral-900/90 border-neutral-800/80'
            : 'bg-white border-neutral-200/90 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            Period:
          </span>
          <span className="text-sm font-bold">
            {formatMonthYear(selectedMonth)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            id="global-prev-month-btn"
            onClick={() => setSelectedMonth((m) => getPreviousMonthKey(m))}
            className={`p-1.5 rounded-lg border transition-colors touch-manipulation ${
              isDarkMode
                ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {selectedMonth !== currentActualMonth && (
            <button
              type="button"
              id="global-current-month-jump-btn"
              onClick={() => setSelectedMonth(currentActualMonth)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                isDarkMode
                  ? 'bg-neutral-950 border-neutral-800 text-emerald-400 hover:bg-neutral-800'
                  : 'bg-neutral-50 border-neutral-200 text-emerald-700 hover:bg-neutral-100'
              }`}
            >
              Current
            </button>
          )}

          <button
            type="button"
            id="global-next-month-btn"
            onClick={() => setSelectedMonth((m) => getNextMonthKey(m))}
            className={`p-1.5 rounded-lg border transition-colors touch-manipulation ${
              isDarkMode
                ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Monthly Financial Dashboard */}
      <MonthlyFinancialDashboard
        summary={financialSummary}
        currencySymbol={currencySymbol}
        onOpenAddIncome={onOpenAddIncome}
        onOpenIncomeManager={onOpenIncomeManager}
        onOpenBudgetSetup={onOpenBudgetSetup}
      />

      {/* 4. Monthly Budget */}
      <MonthlyBudgetSection
        expenses={expenses}
        allBudgets={allBudgets}
        onOpenBudgetSetup={onOpenBudgetSetup}
        currencySymbol={currencySymbol}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* 5. Budget Alerts (Displayed when any category hits 75%, 90%, or 100%+) */}
      {budgetAlerts.length > 0 && (
        <BudgetAlertsSection
          alerts={budgetAlerts}
          currencySymbol={currencySymbol}
        />
      )}

      {/* 6. Daily Spending Limit */}
      <DailySpendingLimitCard
        info={dailySpendingLimitInfo}
        currencySymbol={currencySymbol}
        onOpenBudgetSetup={onOpenBudgetSetup}
      />

      {/* 7. Spending Trends */}
      <SpendingTrendsSection
        trend={spendingTrend}
        currencySymbol={currencySymbol}
      />

      {/* Categories Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-0.5">
          <h2
            className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
            }`}
          >
            Categories ({formatMonthYear(selectedMonth).split(' ')[0]})
          </h2>
          <span
            className={`text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}
          >
            Tap to view details
          </span>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
          {CATEGORIES.map((cat) => {
            const catMonthTotal = categoryMonthlyTotals[cat.id] || 0;
            return (
              <button
                key={cat.id}
                id={`category-card-${cat.id.toLowerCase().replace('/', '-')}`}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`group flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-150 touch-manipulation active:scale-95 ${
                  isDarkMode
                    ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800/90 hover:border-neutral-700'
                    : 'bg-white hover:bg-neutral-50 border-neutral-200/90 hover:border-neutral-300 shadow-xs'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border mb-2 transition-transform group-hover:scale-105 ${
                    isDarkMode ? cat.bgColor : 'bg-neutral-100 border-neutral-200'
                  }`}
                >
                  {cat.emoji}
                </div>
                <span
                  className={`text-xs font-semibold truncate max-w-full ${
                    isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {cat.name}
                </span>
                <span
                  className={`text-[11px] mt-0.5 font-medium ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {catMonthTotal > 0 ? formatCurrency(catMonthTotal, currencySymbol) : '₹0'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Expenses Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-0.5">
          <h2
            className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
            }`}
          >
            Recent Expenses
          </h2>
          <button
            id="home-view-all-btn-link"
            type="button"
            onClick={onOpenAllExpenses}
            className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDarkMode
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div
            className={`text-center py-10 px-4 border border-dashed rounded-2xl ${
              isDarkMode
                ? 'bg-neutral-900/40 border-neutral-800'
                : 'bg-white/80 border-neutral-300'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              No expenses recorded yet
            </p>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? 'text-neutral-600' : 'text-neutral-400'
              }`}
            >
              Tap "+ Expense" above to start tracking
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={onEditExpense}
                onDelete={onDeleteExpense}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        )}

        {/* Prominent View All Expenses Button at the bottom */}
        {recentExpenses.length > 0 && (
          <button
            id="view-all-expenses-bottom-btn"
            type="button"
            onClick={onOpenAllExpenses}
            className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              isDarkMode
                ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-neutral-300 hover:text-white'
                : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700 hover:text-neutral-900 shadow-xs'
            }`}
          >
            <span>View All {expenses.length} Expenses</span>
            <ArrowRight
              className={`w-3.5 h-3.5 ${
                isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
};
