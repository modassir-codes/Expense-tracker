import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTheme } from '../context/ThemeContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'settings' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { isDarkMode } = useTheme();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as a standalone PWA, show installed badge in settings, hide in header
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div
          id="pwa-installed-badge"
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left ${
            isDarkMode
              ? 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
              : 'bg-neutral-50 border-neutral-200 text-neutral-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                App Installed
              </p>
              <p className="text-xs text-neutral-400">
                Running in standalone offline mode
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-emerald-400">Active</span>
        </div>
      );
    }
    return null;
  }

  // Header compact button
  if (variant === 'header') {
    if (isInstallable) {
      return (
        <button
          id="header-pwa-install-btn"
          onClick={install}
          className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold ${
            isDarkMode
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
              : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Install MR Expense Tracker as PWA"
          aria-label="Install App"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Install</span>
        </button>
      );
    }
    return null;
  }

  // Settings Card version
  return (
    <>
      {isInstallable && (
        <button
          id="settings-pwa-install-btn"
          type="button"
          onClick={install}
          className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all group ${
            isDarkMode
              ? 'bg-neutral-950/70 hover:bg-neutral-950 border-emerald-500/30 hover:border-emerald-500/60'
              : 'bg-neutral-50 hover:bg-neutral-100 border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                isDarkMode
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                Install App (PWA)
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Install to home screen for 100% offline access
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
              isDarkMode
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-emerald-600 text-white'
            }`}
          >
            Install
          </span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <>
          <button
            id="settings-ios-install-btn"
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              isDarkMode
                ? 'bg-neutral-950/70 hover:bg-neutral-950 border-neutral-800'
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isDarkMode
                    ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                  Install on iPhone / iPad
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Add to Home Screen for offline use
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-neutral-400">Guide</span>
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div
                className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl space-y-4 ${
                  isDarkMode
                    ? 'bg-neutral-900 border-neutral-800 text-white'
                    : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">Install on iOS</h3>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2.5 text-xs text-neutral-300">
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400">1.</span>
                    Tap the <strong>Share</strong> button in the Safari toolbar (bottom on iPhone).
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400">2.</span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400">3.</span>
                    Tap <strong>Add</strong> at top right to complete installation.
                  </p>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition-colors"
                >
                  Got It
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
