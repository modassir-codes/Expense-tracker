import { AllBudgets, CategoryType, Expense, Income, MonthlyCategoryBudgets } from '../types';
import { getTodayDateString } from '../utils/formatters';
import { sanitizeExpense, sanitizeIncome } from '../utils/security';

const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 4;
const STORE_NAME = 'expenses';
const BUDGET_STORE_NAME = 'budgets';
const INCOME_STORE_NAME = 'income';
const LOCAL_STORAGE_KEY = 'offline_expenses_persistent_v1';
const LEGACY_STORAGE_KEY = 'offline_expenses_v1';
const BUDGET_LOCAL_STORAGE_KEY = 'offline_budgets_persistent_v1';
const INCOME_LOCAL_STORAGE_KEY = 'offline_income_persistent_v1';

let cachedDBPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (cachedDBPromise) {
    return cachedDBPromise;
  }

  cachedDBPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(BUDGET_STORE_NAME)) {
        db.createObjectStore(BUDGET_STORE_NAME, { keyPath: 'month' });
      }
      if (!db.objectStoreNames.contains(INCOME_STORE_NAME)) {
        const incStore = db.createObjectStore(INCOME_STORE_NAME, { keyPath: 'id' });
        incStore.createIndex('date', 'date', { unique: false });
        incStore.createIndex('source', 'source', { unique: false });
        incStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        cachedDBPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      cachedDBPromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('IndexedDB blocked');
    };
  });

  return cachedDBPromise;
}

// ----------------------
// BUDGET PERSISTENCE
// ----------------------

const VALID_CATEGORIES: CategoryType[] = [
  'Food',
  'Travel',
  'Shopping',
  'Bills/Rent',
  'Medical',
  'Other',
];

export function sanitizeBudgets(raw: unknown): AllBudgets {
  if (!raw || typeof raw !== 'object') return {};
  const clean: AllBudgets = {};

  for (const [monthKey, catObj] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}$/.test(monthKey) || !catObj || typeof catObj !== 'object') {
      continue;
    }
    const cleanMonth: MonthlyCategoryBudgets = {};
    let hasAny = false;
    for (const cat of VALID_CATEGORIES) {
      const val = (catObj as Record<string, unknown>)[cat];
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (Number.isFinite(num) && num > 0) {
        cleanMonth[cat] = Math.round(num * 100) / 100;
        hasAny = true;
      }
    }
    if (hasAny) {
      clean[monthKey] = cleanMonth;
    }
  }
  return clean;
}

// Read budgets from localStorage (immediate & synchronous)
export function getLocalStorageBudgets(): AllBudgets {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BUDGET_LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return sanitizeBudgets(parsed);
  } catch {
    return {};
  }
}

// Write budgets to localStorage
export function saveLocalStorageBudgets(budgets: AllBudgets): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = sanitizeBudgets(budgets);
    localStorage.setItem(BUDGET_LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to sync budgets to localStorage', err);
  }
}

// Load all budgets from IndexedDB, falling back to localStorage
export async function getAllBudgets(): Promise<AllBudgets> {
  const localBudgets = getLocalStorageBudgets();

  try {
    const db = await getDB();
    const idbRecords = await new Promise<{ month: string; categories: MonthlyCategoryBudgets }[]>(
      (resolve, reject) => {
        const tx = db.transaction(BUDGET_STORE_NAME, 'readonly');
        const store = tx.objectStore(BUDGET_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve((request.result as { month: string; categories: MonthlyCategoryBudgets }[]) || []);
        };
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      }
    );

    if (idbRecords.length > 0) {
      const idbBudgets: AllBudgets = {};
      for (const rec of idbRecords) {
        if (rec && rec.month && rec.categories) {
          idbBudgets[rec.month] = rec.categories;
        }
      }
      const clean = sanitizeBudgets(idbBudgets);
      saveLocalStorageBudgets(clean);
      return clean;
    } else if (Object.keys(localBudgets).length > 0) {
      // Sync localBudgets into IndexedDB
      try {
        const tx = db.transaction(BUDGET_STORE_NAME, 'readwrite');
        const store = tx.objectStore(BUDGET_STORE_NAME);
        for (const [month, categories] of Object.entries(localBudgets)) {
          store.put({ month, categories });
        }
      } catch (syncErr) {
        console.warn('Failed to backfill budgets to IndexedDB', syncErr);
      }
      return localBudgets;
    } else {
      return {};
    }
  } catch (err) {
    console.warn('IndexedDB budget load failed or unavailable, using localStorage:', err);
    return localBudgets;
  }
}

// Save or update budgets for a specific month
export async function saveMonthBudgetToDB(
  monthKey: string,
  categoryBudgets: MonthlyCategoryBudgets
): Promise<AllBudgets> {
  const current = getLocalStorageBudgets();

  // Clean the month's budgets
  const cleanMonth: MonthlyCategoryBudgets = {};
  let hasAny = false;
  for (const cat of VALID_CATEGORIES) {
    const val = categoryBudgets[cat];
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
      cleanMonth[cat] = Math.round(val * 100) / 100;
      hasAny = true;
    }
  }

  if (hasAny) {
    current[monthKey] = cleanMonth;
  } else {
    delete current[monthKey];
  }

  // 1. Immediately sync to localStorage
  saveLocalStorageBudgets(current);

  // 2. Persist to IndexedDB
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BUDGET_STORE_NAME, 'readwrite');
      const store = tx.objectStore(BUDGET_STORE_NAME);

      if (hasAny) {
        store.put({ month: monthKey, categories: cleanMonth });
      } else {
        store.delete(monthKey);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveMonthBudget error:', err);
  }

  return current;
}

// Save all budgets in bulk (for import)
export async function saveAllBudgetsToDB(budgets: AllBudgets): Promise<void> {
  const clean = sanitizeBudgets(budgets);
  saveLocalStorageBudgets(clean);

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BUDGET_STORE_NAME, 'readwrite');
      const store = tx.objectStore(BUDGET_STORE_NAME);
      store.clear();
      for (const [month, categories] of Object.entries(clean)) {
        store.put({ month, categories });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveAllBudgets error:', err);
  }
}

// Read from localStorage (synchronous & immediate)
export function getLocalStorageExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    let raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // Check if user has data in legacy storage
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter, validate and sanitize all expenses
    const cleanList: Expense[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const sanitized = sanitizeExpense(parsed[i], i);
      if (sanitized) {
        cleanList.push(sanitized);
      }
    }

    return cleanList;
  } catch {
    return [];
  }
}

// Write to localStorage
export function saveLocalStorageExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Ensure no demo/sample expenses ever get saved
    const clean = expenses.filter(
      (item) => item && item.id && !String(item.id).startsWith('init-')
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
    // Clean up old legacy key if present
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to sync to localStorage', err);
  }
}

// Sort expenses descending by date, then createdAt
export function sortExpenses(list: Expense[]): Expense[] {
  return list.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });
}

// Load all expenses from IndexedDB, falling back to and syncing with localStorage
export async function getAllExpenses(): Promise<Expense[]> {
  // Always get fast local mirror first
  const localList = getLocalStorageExpenses();

  try {
    const db = await getDB();
    const idbExpenses = await new Promise<Expense[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawResult = (request.result as Expense[]) || [];
        // Delete any leftover sample expenses from IndexedDB
        for (const item of rawResult) {
          if (item && item.id && String(item.id).startsWith('init-')) {
            store.delete(item.id);
          }
        }
        resolve(rawResult);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });

    // Filter out any sample data
    const validIdb = idbExpenses.filter(
      (item) => item && item.id && !String(item.id).startsWith('init-')
    );

    // Merge strategy: if IndexedDB has user records, use them.
    // If IndexedDB had 0 records but localStorage had user records (e.g. from previous session),
    // sync them into IndexedDB!
    let finalExpenses: Expense[];

    if (validIdb.length > 0) {
      finalExpenses = validIdb;
    } else if (localList.length > 0) {
      // Sync localList into IndexedDB
      finalExpenses = localList;
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const item of localList) {
          store.put(item);
        }
      } catch (syncErr) {
        console.warn('Failed to backfill IndexedDB from localStorage', syncErr);
      }
    } else {
      finalExpenses = [];
    }

    sortExpenses(finalExpenses);
    saveLocalStorageExpenses(finalExpenses);
    return finalExpenses;
  } catch (err) {
    console.warn('IndexedDB load failed or unavailable, using localStorage:', err);
    sortExpenses(localList);
    return localList;
  }
}

// Save or update an expense
export async function saveExpenseToDB(expense: Expense): Promise<void> {
  const sanitized = sanitizeExpense(expense);
  if (!sanitized) {
    return;
  }

  // 1. Immediately persist to localStorage (synchronous & guaranteed)
  const current = getLocalStorageExpenses().filter((e) => e.id !== sanitized.id);
  current.unshift(sanitized);
  sortExpenses(current);
  saveLocalStorageExpenses(current);

  // 2. Persist to IndexedDB
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(sanitized);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB put error, localStorage kept intact:', err);
  }
}

// Delete an expense
export async function deleteExpenseFromDB(id: string): Promise<void> {
  // 1. Immediately update localStorage
  const current = getLocalStorageExpenses().filter((e) => e.id !== id);
  saveLocalStorageExpenses(current);

  // 2. Delete from IndexedDB
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete error, localStorage kept intact:', err);
  }
}

// Import expenses from backup JSON
export async function importExpensesToDB(importedExpenses: Expense[]): Promise<void> {
  if (!Array.isArray(importedExpenses)) {
    throw new Error('Invalid backup file format: must be an array');
  }

  const validExpenses: Expense[] = [];
  for (let i = 0; i < importedExpenses.length; i++) {
    const sanitized = sanitizeExpense(importedExpenses[i], i);
    if (sanitized) {
      validExpenses.push(sanitized);
    }
  }

  sortExpenses(validExpenses);
  saveLocalStorageExpenses(validExpenses);

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const item of validExpenses) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB bulk write error:', e);
  }
}

// ----------------------
// INCOME PERSISTENCE
// ----------------------

// Read income from localStorage (synchronous & immediate)
export function getLocalStorageIncome(): Income[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INCOME_LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cleanList: Income[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const sanitized = sanitizeIncome(parsed[i], i);
      if (sanitized) {
        cleanList.push(sanitized);
      }
    }
    return cleanList;
  } catch {
    return [];
  }
}

// Write income to localStorage
export function saveLocalStorageIncome(incomeList: Income[]): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = incomeList.filter(
      (item) => item && item.id && !String(item.id).startsWith('init-')
    );
    localStorage.setItem(INCOME_LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to sync income to localStorage', err);
  }
}

// Sort income descending by date, then createdAt
export function sortIncome(list: Income[]): Income[] {
  return list.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });
}

// Load all income from IndexedDB, syncing with localStorage
export async function getAllIncome(): Promise<Income[]> {
  const localList = getLocalStorageIncome();

  try {
    const db = await getDB();
    const idbIncome = await new Promise<Income[]>((resolve, reject) => {
      const tx = db.transaction(INCOME_STORE_NAME, 'readwrite');
      const store = tx.objectStore(INCOME_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawResult = (request.result as Income[]) || [];
        for (const item of rawResult) {
          if (item && item.id && String(item.id).startsWith('init-')) {
            store.delete(item.id);
          }
        }
        resolve(rawResult);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });

    const validIdb = idbIncome.filter(
      (item) => item && item.id && !String(item.id).startsWith('init-')
    );

    let finalIncome: Income[];
    if (validIdb.length > 0) {
      finalIncome = validIdb;
    } else if (localList.length > 0) {
      finalIncome = localList;
      try {
        const tx = db.transaction(INCOME_STORE_NAME, 'readwrite');
        const store = tx.objectStore(INCOME_STORE_NAME);
        for (const item of localList) {
          store.put(item);
        }
      } catch (syncErr) {
        console.warn('Failed to backfill IndexedDB income from localStorage', syncErr);
      }
    } else {
      finalIncome = [];
    }

    sortIncome(finalIncome);
    saveLocalStorageIncome(finalIncome);
    return finalIncome;
  } catch (err) {
    console.warn('IndexedDB income load failed, using localStorage:', err);
    sortIncome(localList);
    return localList;
  }
}

// Save or update an income record
export async function saveIncomeToDB(income: Income): Promise<void> {
  const sanitized = sanitizeIncome(income);
  if (!sanitized) return;

  // 1. Immediately persist to localStorage
  const current = getLocalStorageIncome().filter((i) => i.id !== sanitized.id);
  current.unshift(sanitized);
  sortIncome(current);
  saveLocalStorageIncome(current);

  // 2. Persist to IndexedDB
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(INCOME_STORE_NAME, 'readwrite');
      const store = tx.objectStore(INCOME_STORE_NAME);
      store.put(sanitized);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB put income error:', err);
  }
}

// Delete an income record
export async function deleteIncomeFromDB(id: string): Promise<void> {
  const current = getLocalStorageIncome().filter((i) => i.id !== id);
  saveLocalStorageIncome(current);

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(INCOME_STORE_NAME, 'readwrite');
      const store = tx.objectStore(INCOME_STORE_NAME);
      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete income error:', err);
  }
}

// Bulk save income (for import)
export async function saveAllIncomeToDB(incomes: Income[]): Promise<void> {
  const validIncome: Income[] = [];
  for (let i = 0; i < incomes.length; i++) {
    const sanitized = sanitizeIncome(incomes[i], i);
    if (sanitized) {
      validIncome.push(sanitized);
    }
  }

  sortIncome(validIncome);
  saveLocalStorageIncome(validIncome);

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(INCOME_STORE_NAME, 'readwrite');
      const store = tx.objectStore(INCOME_STORE_NAME);
      store.clear();
      for (const item of validIncome) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB bulk income write error:', e);
  }
}

// Import all data (expenses + budgets + income) supporting backwards compatibility
export async function importAllDataToDB(
  importedExpenses: Expense[],
  importedBudgets?: AllBudgets,
  importedIncome?: Income[]
): Promise<{ expenses: Expense[]; budgets: AllBudgets; income: Income[] }> {
  let validExpenses: Expense[] = [];
  if (Array.isArray(importedExpenses)) {
    for (let i = 0; i < importedExpenses.length; i++) {
      const sanitized = sanitizeExpense(importedExpenses[i], i);
      if (sanitized) {
        validExpenses.push(sanitized);
      }
    }
    sortExpenses(validExpenses);
    saveLocalStorageExpenses(validExpenses);

    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        for (const item of validExpenses) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB bulk write error:', e);
    }
  } else {
    validExpenses = getLocalStorageExpenses();
  }

  let finalBudgets: AllBudgets = getLocalStorageBudgets();
  if (importedBudgets && typeof importedBudgets === 'object') {
    const cleanBudgets = sanitizeBudgets(importedBudgets);
    await saveAllBudgetsToDB(cleanBudgets);
    finalBudgets = cleanBudgets;
  }

  let finalIncome: Income[] = getLocalStorageIncome();
  if (Array.isArray(importedIncome)) {
    const cleanIncome: Income[] = [];
    for (let i = 0; i < importedIncome.length; i++) {
      const sanitized = sanitizeIncome(importedIncome[i], i);
      if (sanitized) {
        cleanIncome.push(sanitized);
      }
    }
    await saveAllIncomeToDB(cleanIncome);
    finalIncome = cleanIncome;
  }

  return { expenses: validExpenses, budgets: finalBudgets, income: finalIncome };
}

// Clear all data
export async function clearAllExpensesFromDB(): Promise<void> {
  saveLocalStorageExpenses([]);

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB clear error:', e);
  }
}
