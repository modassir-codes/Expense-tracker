import React, { useState, useEffect, useCallback } from 'react';
import {
  AllBudgets,
  CategoryType,
  Expense,
  Income,
  MonthlyCategoryBudgets,
  ViewScreen,
} from './types';
import {
  getAllExpenses,
  saveExpenseToDB,
  deleteExpenseFromDB,
  importAllDataToDB,
  getLocalStorageExpenses,
  getAllBudgets,
  saveMonthBudgetToDB,
  getLocalStorageBudgets,
  getAllIncome,
  saveIncomeToDB,
  deleteIncomeFromDB,
  getLocalStorageIncome,
} from './storage/db';
import { getCurrentMonthKey } from './utils/formatters';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { CategoryDetailScreen } from './components/CategoryDetailScreen';
import { AllExpensesScreen } from './components/AllExpensesScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { BudgetSetupModal } from './components/BudgetSetupModal';
import { IncomeFormModal } from './components/IncomeFormModal';
import { IncomeManagerModal } from './components/IncomeManagerModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';

interface HistoryState {
  screen: ViewScreen;
  category?: CategoryType;
}

const parseHashToState = (): HistoryState => {
  if (typeof window === 'undefined') return { screen: 'home' };
  const hash = window.location.hash || '';
  if (hash.startsWith('#category/')) {
    const rawCat = decodeURIComponent(hash.slice('#category/'.length));
    const validCats: CategoryType[] = [
      'Food',
      'Travel',
      'Shopping',
      'Bills/Rent',
      'Medical',
      'Other',
    ];
    const matched = validCats.find(
      (c) => c.toLowerCase() === rawCat.toLowerCase()
    );
    return {
      screen: 'category',
      category: matched || (rawCat as CategoryType) || 'Food',
    };
  }
  if (hash === '#all-expenses') {
    return { screen: 'all-expenses' };
  }
  if (hash === '#settings') {
    return { screen: 'settings' };
  }
  return { screen: 'home' };
};

const getHashFromState = (state: HistoryState): string => {
  if (state.screen === 'category' && state.category) {
    return `#category/${encodeURIComponent(state.category)}`;
  }
  if (state.screen === 'all-expenses') {
    return '#all-expenses';
  }
  if (state.screen === 'settings') {
    return '#settings';
  }
  return '#home';
};

function ExpenseTrackerApp() {
  const { isDarkMode } = useTheme();

  // Navigation state derived from URL hash or default to home
  const initialNav = parseHashToState();
  const [currentScreen, setCurrentScreen] = useState<ViewScreen>(initialNav.screen);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(
    initialNav.category || 'Food'
  );

  // Initialize expenses, budgets, and income immediately from synchronous storage to avoid empty state flash on refresh
  const [expenses, setExpenses] = useState<Expense[]>(() => getLocalStorageExpenses());
  const [allBudgets, setAllBudgets] = useState<AllBudgets>(() => getLocalStorageBudgets());
  const [income, setIncome] = useState<Income[]>(() => getLocalStorageIncome());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Expense Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [modalDefaultCategory, setModalDefaultCategory] = useState<CategoryType>('Food');

  // Budget modal state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [budgetModalMonth, setBudgetModalMonth] = useState<string>(() => getCurrentMonthKey());

  // Income Modal states
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState<boolean>(false);
  const [isIncomeManagerOpen, setIsIncomeManagerOpen] = useState<boolean>(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const currencySymbol = '₹';

  // Synchronize browser history and handle Android / Browser back gestures
  useEffect(() => {
    const initial = parseHashToState();
    if (initial.screen !== 'home') {
      // Direct access on a sub-screen: put Home at root of history so Android Back returns to Home
      window.history.replaceState({ screen: 'home' }, '', '#home');
      window.history.pushState(initial, '', getHashFromState(initial));
    } else {
      window.history.replaceState({ screen: 'home' }, '', '#home');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as HistoryState | null;
      if (state && state.screen) {
        setCurrentScreen(state.screen);
        if (state.category) {
          setSelectedCategory(state.category);
        }
      } else {
        const parsed = parseHashToState();
        setCurrentScreen(parsed.screen);
        if (parsed.category) {
          setSelectedCategory(parsed.category);
        }
      }

      // Close open modals when back button is pressed
      setIsAddModalOpen(false);
      setEditingExpense(null);
      setDeletingExpense(null);
      setIsBudgetModalOpen(false);
      setIsIncomeFormOpen(false);
      setIsIncomeManagerOpen(false);
      setEditingIncome(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Internal navigation creating proper history entries
  const navigateTo = useCallback(
    (screen: ViewScreen, category?: CategoryType) => {
      const targetCategory = category || (screen === 'category' ? selectedCategory : undefined);

      if (
        currentScreen === screen &&
        (screen !== 'category' || selectedCategory === targetCategory)
      ) {
        return;
      }

      const nextState: HistoryState = {
        screen,
        category: targetCategory,
      };

      setCurrentScreen(screen);
      if (targetCategory) {
        setSelectedCategory(targetCategory);
      }

      window.history.pushState(nextState, '', getHashFromState(nextState));
    },
    [currentScreen, selectedCategory]
  );

  // Unified back handler for custom UI back buttons
  const handleBack = useCallback(() => {
    if (currentScreen === 'home') {
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      setCurrentScreen('home');
      window.history.replaceState({ screen: 'home' }, '', '#home');
    }
  }, [currentScreen]);

  // Load and synchronize expenses, budgets, and income from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [loadedExpenses, loadedBudgets, loadedIncome] = await Promise.all([
          getAllExpenses(),
          getAllBudgets(),
          getAllIncome(),
        ]);
        if (isMounted) {
          if (loadedExpenses) {
            setExpenses(loadedExpenses);
          }
          if (loadedBudgets) {
            setAllBudgets(loadedBudgets);
          }
          if (loadedIncome) {
            setIncome(loadedIncome);
          }
        }
      } catch (err) {
        console.error('Failed to load expenses/budgets/income from IndexedDB:', err);
        if (isMounted) {
          setExpenses(getLocalStorageExpenses());
          setAllBudgets(getLocalStorageBudgets());
          setIncome(getLocalStorageIncome());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save (create or update) expense
  const handleSaveExpense = useCallback(
    async (
      data: Omit<Expense, 'id' | 'createdAt'>,
      existingId?: string
    ) => {
      let savedExpense: Expense;

      if (existingId) {
        const existing = expenses.find((e) => e.id === existingId);
        savedExpense = {
          id: existingId,
          amount: data.amount,
          category: data.category,
          remark: data.remark,
          date: data.date,
          createdAt: existing?.createdAt || Date.now(),
        };
      } else {
        const newId = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        savedExpense = {
          id: newId,
          amount: data.amount,
          category: data.category,
          remark: data.remark,
          date: data.date,
          createdAt: Date.now(),
        };
      }

      // Update state immediately
      setExpenses((prev) => {
        const filtered = prev.filter((e) => e.id !== savedExpense.id);
        const next = [savedExpense, ...filtered];
        next.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return b.createdAt - a.createdAt;
        });
        return next;
      });

      // Persist to both IndexedDB and localStorage
      await saveExpenseToDB(savedExpense);

      setEditingExpense(null);
      setIsAddModalOpen(false);
    },
    [expenses]
  );

  // Confirm and delete expense
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingExpense) return;
    const idToDelete = deletingExpense.id;

    // Update state immediately
    setExpenses((prev) => prev.filter((e) => e.id !== idToDelete));
    setDeletingExpense(null);

    // Remove from IndexedDB and localStorage
    await deleteExpenseFromDB(idToDelete);
  }, [deletingExpense]);

  // Open modal to add expense
  const handleOpenAddExpense = (cat?: CategoryType) => {
    setEditingExpense(null);
    setModalDefaultCategory(cat || 'Food');
    setIsAddModalOpen(true);
  };

  // Open modal to edit expense
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setModalDefaultCategory(expense.category);
    setIsAddModalOpen(true);
  };

  // Open category detail screen
  const handleSelectCategory = (category: CategoryType) => {
    navigateTo('category', category);
  };

  // Open modal to configure monthly budgets
  const handleOpenBudgetSetup = useCallback((monthKey?: string) => {
    setBudgetModalMonth(monthKey || getCurrentMonthKey());
    setIsBudgetModalOpen(true);
  }, []);

  // Save category budgets for a specific month
  const handleSaveBudgets = useCallback(
    async (monthKey: string, categoryBudgets: MonthlyCategoryBudgets) => {
      const updatedBudgets = await saveMonthBudgetToDB(monthKey, categoryBudgets);
      setAllBudgets({ ...updatedBudgets });
    },
    []
  );

  // Income Operations: Save (Create/Update)
  const handleSaveIncome = useCallback(
    async (
      data: Omit<Income, 'id' | 'createdAt'>,
      existingId?: string
    ) => {
      let savedIncome: Income;
      if (existingId) {
        const existing = income.find((i) => i.id === existingId);
        savedIncome = {
          id: existingId,
          amount: data.amount,
          source: data.source,
          remark: data.remark,
          date: data.date,
          createdAt: existing?.createdAt || Date.now(),
        };
      } else {
        const newId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        savedIncome = {
          id: newId,
          amount: data.amount,
          source: data.source,
          remark: data.remark,
          date: data.date,
          createdAt: Date.now(),
        };
      }

      setIncome((prev) => {
        const filtered = prev.filter((i) => i.id !== savedIncome.id);
        const next = [savedIncome, ...filtered];
        next.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return b.createdAt - a.createdAt;
        });
        return next;
      });

      await saveIncomeToDB(savedIncome);
      setEditingIncome(null);
      setIsIncomeFormOpen(false);
    },
    [income]
  );

  // Income Operations: Delete
  const handleDeleteIncome = useCallback(async (id: string) => {
    setIncome((prev) => prev.filter((i) => i.id !== id));
    await deleteIncomeFromDB(id);
  }, []);

  const handleOpenAddIncome = useCallback(() => {
    setEditingIncome(null);
    setIsIncomeFormOpen(true);
  }, []);

  const handleEditIncome = useCallback((inc: Income) => {
    setEditingIncome(inc);
    setIsIncomeFormOpen(true);
  }, []);

  const handleOpenIncomeManager = useCallback(() => {
    setIsIncomeManagerOpen(true);
  }, []);

  // Import backup handler (supporting legacy, v2, and v3 formats)
  const handleImportBackup = async (
    importedData: Expense[],
    importedBudgets?: AllBudgets,
    importedIncome?: Income[]
  ) => {
    const result = await importAllDataToDB(importedData, importedBudgets, importedIncome);
    setExpenses(result.expenses);
    setAllBudgets(result.budgets);
    setIncome(result.income);
  };

  // Compute screen title
  let screenTitle = 'MR Expense Tracker';
  if (currentScreen === 'category') {
    screenTitle = `${selectedCategory}`;
  } else if (currentScreen === 'all-expenses') {
    screenTitle = 'All Expenses';
  } else if (currentScreen === 'settings') {
    screenTitle = 'Settings';
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
        isDarkMode
          ? 'bg-neutral-950 text-neutral-100 selection:bg-emerald-500/20 selection:text-emerald-300'
          : 'bg-neutral-100 text-neutral-900 selection:bg-emerald-500/30 selection:text-emerald-900'
      }`}
    >
      {/* Sticky Top Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        onBack={handleBack}
        title={screenTitle}
      />

      {/* Main Screen Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <p
              className={`text-xs font-medium ${
                isDarkMode ? 'text-neutral-500' : 'text-neutral-600'
              }`}
            >
              Loading offline storage...
            </p>
          </div>
        ) : (
          <>
            {currentScreen === 'home' && (
              <HomeScreen
                expenses={expenses}
                allBudgets={allBudgets}
                income={income}
                onOpenAddExpense={handleOpenAddExpense}
                onOpenAddIncome={handleOpenAddIncome}
                onOpenIncomeManager={handleOpenIncomeManager}
                onSelectCategory={handleSelectCategory}
                onOpenAllExpenses={() => navigateTo('all-expenses')}
                onEditExpense={handleEditExpense}
                onDeleteExpense={setDeletingExpense}
                onOpenBudgetSetup={handleOpenBudgetSetup}
                currencySymbol={currencySymbol}
              />
            )}

            {currentScreen === 'category' && (
              <CategoryDetailScreen
                category={selectedCategory}
                expenses={expenses}
                onBack={handleBack}
                onAddExpenseForCategory={(cat) => handleOpenAddExpense(cat)}
                onEditExpense={handleEditExpense}
                onDeleteExpense={setDeletingExpense}
                currencySymbol={currencySymbol}
              />
            )}

            {currentScreen === 'all-expenses' && (
              <AllExpensesScreen
                expenses={expenses}
                onBack={handleBack}
                onEditExpense={handleEditExpense}
                onDeleteExpense={setDeletingExpense}
                currencySymbol={currencySymbol}
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsScreen
                expenses={expenses}
                allBudgets={allBudgets}
                income={income}
                onBack={handleBack}
                onOpenBudgetSetup={handleOpenBudgetSetup}
                onImportBackup={handleImportBackup}
                currencySymbol={currencySymbol}
              />
            )}
          </>
        )}
      </main>

      {/* Add / Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialExpense={editingExpense}
        defaultCategory={modalDefaultCategory}
        currencySymbol={currencySymbol}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingExpense}
        expense={deletingExpense}
        onCancel={() => setDeletingExpense(null)}
        onConfirm={handleConfirmDelete}
        currencySymbol={currencySymbol}
      />

      {/* Monthly Budget Setup Modal */}
      <BudgetSetupModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        initialMonthKey={budgetModalMonth}
        allBudgets={allBudgets}
        onSaveBudgets={handleSaveBudgets}
        currencySymbol={currencySymbol}
      />

      {/* Add / Edit Income Modal */}
      <IncomeFormModal
        isOpen={isIncomeFormOpen}
        onClose={() => {
          setIsIncomeFormOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        initialIncome={editingIncome}
        currencySymbol={currencySymbol}
      />

      {/* View & Manage Income Records Modal */}
      <IncomeManagerModal
        isOpen={isIncomeManagerOpen}
        onClose={() => setIsIncomeManagerOpen(false)}
        incomeList={income}
        onAddNew={handleOpenAddIncome}
        onEdit={handleEditIncome}
        onDelete={handleDeleteIncome}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ExpenseTrackerApp />
    </ThemeProvider>
  );
}
