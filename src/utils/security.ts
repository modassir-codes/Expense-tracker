import { CategoryType, Expense, Income, IncomeSource } from '../types';
import { getTodayDateString } from './formatters';

const VALID_CATEGORIES: ReadonlyArray<CategoryType> = [
  'Food',
  'Travel',
  'Shopping',
  'Bills/Rent',
  'Medical',
  'Other',
];

const VALID_INCOME_SOURCES: ReadonlyArray<IncomeSource> = [
  'Salary',
  'Freelance',
  'Business',
  'Other',
];

const MAX_REMARK_LENGTH = 200;
const MAX_AMOUNT = 100_000_000; // 10 Crore limit to prevent overflow

/**
 * Strips non-printable control characters, trims, and bounds remark length.
 */
export function sanitizeRemark(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  // Remove control characters (ASCII 0-31, 127) except space and newline
  const cleaned = raw.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, MAX_REMARK_LENGTH);
}

/**
 * Validates expense amount: must be positive finite number up to MAX_AMOUNT.
 * Rounds to 2 decimal places. Returns null if invalid.
 */
export function validateExpenseAmount(raw: unknown): number | null {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw || ''));
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return null;
  }
  if (num <= 0 || num > MAX_AMOUNT) {
    return null;
  }
  return Math.round(num * 100) / 100;
}

/**
 * Validates category against approved canonical categories.
 */
export function validateCategory(raw: unknown): CategoryType {
  if (typeof raw === 'string') {
    const matched = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === raw.trim().toLowerCase()
    );
    if (matched) return matched;
  }
  return 'Other';
}

/**
 * Validates date string in YYYY-MM-DD format.
 */
export function validateDate(raw: unknown): string {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (regex.test(trimmed)) {
      const parts = trimmed.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return trimmed;
      }
    }
  }
  return getTodayDateString();
}

/**
 * Validates ID to ensure safe alphanumeric characters with dashes.
 */
export function validateExpenseId(raw: unknown, fallbackIndex = 0): string {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    // Keep only safe characters: letters, digits, dash, underscore
    const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (cleaned.length > 0) {
      return cleaned;
    }
  }
  return `exp-${Date.now()}-${fallbackIndex}`;
}

/**
 * Validates and sanitizes a complete expense record.
 */
export function sanitizeExpense(raw: unknown, index = 0): Expense | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const amount = validateExpenseAmount(item.amount);
  if (amount === null) return null;

  const id = validateExpenseId(item.id, index);
  if (id.startsWith('init-')) return null; // Reject demo data

  const category = validateCategory(item.category);
  const remark = sanitizeRemark(item.remark);
  const date = validateDate(item.date);
  const createdAt =
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)
      ? item.createdAt
      : Date.now();

  return {
    id,
    amount,
    category,
    remark,
    date,
    createdAt,
  };
}

/**
 * Validates income source against approved sources.
 */
export function validateIncomeSource(raw: unknown): IncomeSource {
  if (typeof raw === 'string') {
    const matched = VALID_INCOME_SOURCES.find(
      (s) => s.toLowerCase() === raw.trim().toLowerCase()
    );
    if (matched) return matched;
  }
  return 'Salary';
}

/**
 * Validates income ID to ensure safe alphanumeric characters.
 */
export function validateIncomeId(raw: unknown, fallbackIndex = 0): string {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (cleaned.length > 0) {
      return cleaned;
    }
  }
  return `inc-${Date.now()}-${fallbackIndex}`;
}

/**
 * Validates and sanitizes a complete income record.
 */
export function sanitizeIncome(raw: unknown, index = 0): Income | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const amount = validateExpenseAmount(item.amount);
  if (amount === null) return null;

  const id = validateIncomeId(item.id, index);
  if (id.startsWith('init-')) return null;

  const source = validateIncomeSource(item.source);
  const remark = sanitizeRemark(item.remark);
  const date = validateDate(item.date);
  const createdAt =
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)
      ? item.createdAt
      : Date.now();

  return {
    id,
    amount,
    source,
    remark,
    date,
    createdAt,
  };
}
