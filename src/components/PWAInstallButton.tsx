import React, { useState } from 'react';
import { Download, Smartphone, Share, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Suppress completely if already running in standalone app mode
  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>App installed &amp; running in Standalone mode</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleClick}
          title="Install Study Quest on your Android or iPhone home screen"
          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/25 active:scale-95 transition-all ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
          <span>Install App</span>
        </button>
      ) : (
        <div className={`rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-4 ${className}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Install on Android or iPhone</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Launch full-screen like a native app with zero address bar distraction.
                </p>
              </div>
            </div>
            <button
              onClick={handleClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30 active:scale-95 transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstallable ? 'Install Now' : 'How to Install'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Installation Instructions Modal for iOS / Manual Android */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Install Study Quest App</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add to your home screen for the full 3D experience</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> button (<Share className="inline w-3.5 h-3.5 text-blue-500 mx-0.5" />) in Safari toolbar at the bottom or top.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                  <span>Scroll down the menu and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                  <span>Tap <strong>Add</strong> in the top right corner. Study Quest will appear on your home screen!</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                  <span>In <strong>Google Chrome</strong> on Android, tap the three dots <strong>(⋮)</strong> in the top right corner.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                  <span>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                  <span>Confirm by tapping <strong>Install</strong>. The Study Quest icon will be added to your app drawer and home screen.</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
