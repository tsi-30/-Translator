import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return (
      <div id="pwa-installed-badge" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Installed App</span>
      </div>
    );
  }

  // Chromium / Android flow with active deferredPrompt
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div id="pwa-install-banner" className="flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold">Install ፂዮን Translator</p>
              <p className="text-[11px] text-blue-700">Access instant translations anytime without internet</p>
            </div>
          </div>
          <button
            id="pwa-banner-install-btn"
            onClick={install}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            Install
          </button>
        </div>
      );
    }

    return (
      <button
        id="pwa-header-install-btn"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition"
        title="Install as Progressive Web App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-medium transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">1</span>
                  <p>Tap the <strong>Share</strong> button (box with an arrow) in the Safari toolbar at the bottom.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">2</span>
                  <p>Scroll down in the action sheet and select <strong>"Add to Home Screen"</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">3</span>
                  <p>Tap <strong>"Add"</strong> in the top-right corner to launch the standalone app!</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 text-white py-2 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback desktop / browser info button
  return (
    <>
      <button
        id="pwa-generic-install-btn"
        onClick={() => setShowDesktopGuide(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition"
        title="PWA Installation Info"
      >
        <Download className="w-3.5 h-3.5 text-blue-600" />
        <span>Install App</span>
      </button>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Install Offline App</h3>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <p>This web app is <strong>100% PWA compliant</strong> and works fully offline.</p>
              <p>To install directly in Google Chrome or Edge:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Look for the <strong>Install icon</strong> in your browser's address bar (right side).</li>
                <li>Or open the browser menu (⋮) and click <strong>"Install ፂዮን Translator"</strong>.</li>
                <li>On mobile Chrome, tap <strong>"Install app"</strong> from the menu.</li>
              </ul>
            </div>
            <button
              onClick={() => setShowDesktopGuide(false)}
              className="mt-5 w-full rounded-xl bg-blue-600 text-white py-2 text-xs font-semibold hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
