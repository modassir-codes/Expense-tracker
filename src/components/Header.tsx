import React from 'react';
import { Settings, ArrowLeft, Sun, Moon } from 'lucide-react';
import { ViewScreen } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentScreen: ViewScreen;
  onNavigate: (screen: ViewScreen) => void;
  onBack?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  title,
}) => {
  const isHome = currentScreen === 'home';
  const { isDarkMode, toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();

  return (
    <header
      className={`sticky top-0 z-20 w-full backdrop-blur-md px-4 py-3.5 transition-colors duration-200 border-b ${
        isDarkMode
          ? 'bg-neutral-950/90 border-neutral-800/80 text-white'
          : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-xs'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {!isHome ? (
            <button
              id="header-back-btn"
              onClick={onBack ? onBack : () => onNavigate('home')}
              className={`p-2 -ml-2 rounded-xl transition-colors shrink-0 ${
                isDarkMode
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}

          <div className="min-w-0">
            <h1
              className={`text-lg font-bold tracking-tight truncate flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {title || 'MR Expense Tracker'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Header PWA Install Button when installable */}
          <PWAInstallButton variant="header" />

          {/* Theme Quick Toggle in Header */}
          <button
            id="header-theme-toggle-btn"
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Subtle online / offline badge */}
          <div
            id="offline-status-badge"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              !isOnline
                ? isDarkMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
                : isDarkMode
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
            title={!isOnline ? 'Internet unavailable — Running in 100% offline mode' : 'Internet connected — All data saved locally'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                !isOnline
                  ? 'bg-amber-400 animate-pulse'
                  : isDarkMode
                    ? 'bg-emerald-400'
                    : 'bg-emerald-600'
              }`}
            />
            <span>{!isOnline ? 'Offline Mode' : 'Online'}</span>
          </div>

          {/* Settings button */}
          {currentScreen !== 'settings' && (
            <button
              id="header-settings-btn"
              onClick={() => onNavigate('settings')}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
