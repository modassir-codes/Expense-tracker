import { CategoryInfo, CategoryType } from './types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'Food',
    name: 'Food',
    emoji: '🍔',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20',
  },
  {
    id: 'Travel',
    name: 'Travel',
    emoji: '🚕',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20',
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    emoji: '🛍️',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20',
  },
  {
    id: 'Bills/Rent',
    name: 'Bills/Rent',
    emoji: '🏠',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20',
  },
  {
    id: 'Medical',
    name: 'Medical',
    emoji: '💊',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20',
  },
  {
    id: 'Other',
    name: 'Other',
    emoji: '📦',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
  },
];

export const CATEGORY_MAP: Record<CategoryType, CategoryInfo> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  },
  {} as Record<CategoryType, CategoryInfo>
);

export interface IncomeSourceInfo {
  id: import('./types').IncomeSource;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export const INCOME_SOURCES: IncomeSourceInfo[] = [
  {
    id: 'Salary',
    name: 'Salary',
    emoji: '💼',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20',
  },
  {
    id: 'Freelance',
    name: 'Freelance',
    emoji: '💻',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20',
  },
  {
    id: 'Business',
    name: 'Business',
    emoji: '🏢',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20',
  },
  {
    id: 'Other',
    name: 'Other',
    emoji: '🪙',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
  },
];

export const INCOME_SOURCE_MAP: Record<import('./types').IncomeSource, IncomeSourceInfo> =
  INCOME_SOURCES.reduce(
    (acc, src) => {
      acc[src.id] = src;
      return acc;
    },
    {} as Record<import('./types').IncomeSource, IncomeSourceInfo>
  );

export const DEFAULT_SETTINGS = {
  currencySymbol: '₹',
  currencyCode: 'INR',
  darkMode: true,
};
