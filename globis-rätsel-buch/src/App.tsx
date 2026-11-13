import React, { useState, useEffect, useCallback } from 'react';
import { Award, RefreshCw, Lock } from 'lucide-react';
import { StationPage } from './types';
import { STATIC_SHEET_PAGES, fetchSheetPages } from './data/sheetData';
import { soundEffects } from './utils/audio';
import { RiddleModal } from './components/RiddleModal';
import { ProgressModal } from './components/ProgressModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPage } from './components/AdminPage';

export default function App() {
  const [pages, setPages] = useState<StationPage[]>(STATIC_SHEET_PAGES);
  const [activePage, setActivePage] = useState<StationPage | null>(null);
  const [isProgressOpen, setIsProgressOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'main' | 'admin'>('main');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Sync sheet pages from live Google Sheet with cache-busting
  const syncPages = useCallback(async () => {
    try {
      const fetchedPages = await fetchSheetPages();
      if (fetchedPages && fetchedPages.length > 0) {
        setPages((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(fetchedPages)) {
            return prev;
          }
          return fetchedPages;
        });
      }
      return fetchedPages;
    } catch (err) {
      console.warn('Error syncing pages from sheet', err);
      return [];
    }
  }, []);

  useEffect(() => {
    // Clear any previous persistent auth so password is always required
    try {
      sessionStorage.removeItem('globi_admin_auth');
    } catch {
      // ignore
    }

    // Immediate load upon page load/refresh
    syncPages();

    // Re-sync whenever tab is focused
    const handleFocus = () => {
      syncPages();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncPages();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibility);

    // Periodically re-check sheet so background file updates are picked up smoothly
    const interval = setInterval(syncPages, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [syncPages]);

  // When clicking a page button, re-fetch sheet immediately to ensure latest codeword is checked
  const handleSelectPage = async (page: StationPage) => {
    soundEffects.playClick();
    const freshPages = await syncPages();
    const freshPage = freshPages.find((p) => p.pageNumber === page.pageNumber) || page;
    setActivePage(freshPage);
  };

  // Explicit forced refresh triggered by user clicking the subtle bottom-right button
  const handleManualRefresh = async () => {
    soundEffects.playClick();
    setIsRefreshing(true);
    await syncPages();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Admin access handlers - always require password "anne"
  const handleOpenAdmin = () => {
    soundEffects.playClick();
    setIsAdminLoginOpen(true);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminLoginOpen(false);
    setCurrentView('admin');
  };

  const handleAdminExit = () => {
    soundEffects.playClick();
    setIsAdminAuthenticated(false);
    setCurrentView('main');
  };

  // If in admin view and authenticated, render the dedicated Admin Page
  if (currentView === 'admin' && isAdminAuthenticated) {
    return (
      <AdminPage
        pages={pages}
        onBack={handleAdminExit}
        onLogout={handleAdminExit}
        onRefresh={syncPages}
        isRefreshing={isRefreshing}
      />
    );
  }

  // Visibility logic:
  // First button (index 0) is always visible.
  // Any subsequent button (index i) is ONLY visible if the previous button (index i - 1) has 'ja' in Column C!
  const visiblePages = pages.filter((_, idx) => {
    if (idx === 0) return true;
    return pages[idx - 1].isDoneInSheet;
  });

  const doneCount = pages.filter((p) => p.isDoneInSheet).length;
  const totalCount = pages.length;

  return (
    <div className="min-h-screen bg-[#1d5cb8] text-stone-900 flex flex-col justify-between selection:bg-yellow-300">
      {/* Characteristic Globi Red-Black Checkered Header Ribbon */}
      <div className="w-full bg-globi-checkered h-3.5 border-b-2 border-black"></div>

      {/* Top Bar with Admin Link & Minimal Progress Menu Trigger */}
      <header className="max-w-2xl w-full mx-auto px-4 pt-3 flex items-center justify-between">
        <button
          onClick={handleOpenAdmin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-black font-comic font-bold text-xs text-stone-900 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 hover:bg-stone-50 transition-colors cursor-pointer"
          title="Adminbereich öffnen (Passwort geschützt)"
        >
          <Lock className="w-3.5 h-3.5 text-stone-700" />
          <span>Admin</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playClick();
            setIsProgressOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-black font-comic font-bold text-xs text-stone-900 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 hover:bg-stone-50 transition-colors cursor-pointer"
          title="Fortschritt anzeigen"
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Fortschritt:</span>
          <span className="tabular-nums">
            {doneCount}/{totalCount}
          </span>
        </button>
      </header>

      {/* Main Content Area: Comic Paper Board with Page Buttons */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 flex flex-col justify-center">
        <div className="bg-[#fffdf5] rounded-3xl comic-box p-4 sm:p-6 shadow-[5px_5px_0px_#000]">
          {/* Grid of Page Buttons (Only unlocked/visible stations) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {visiblePages.map((p) => {
              // Button is colored green ONLY if in that row's Spalte C it says 'ja'
              const isGreen = p.isDoneInSheet;

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPage(p)}
                  className={`h-20 sm:h-24 rounded-2xl comic-button flex items-center justify-center text-center cursor-pointer p-2 transition-all ${
                    isGreen
                      ? 'bg-emerald-600 text-white border-3 border-black shadow-[3px_3px_0px_#000] hover:bg-emerald-500'
                      : 'bg-white text-stone-900 hover:bg-stone-50 border-3 border-black shadow-[3px_3px_0px_#000]'
                  }`}
                >
                  <span className="text-lg sm:text-xl font-bold font-comic tracking-wide">
                    Seite {p.pageNumber}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer with Characteristic Globi Checkered Pattern */}
      <footer className="w-full relative">
        <div className="w-full bg-globi-checkered h-3.5 border-t-2 border-black"></div>
      </footer>

      {/* Unobtrusive forced sheet refresh button (Bottom Right) */}
      <button
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        title="Google Sheet jetzt neu abfragen"
        aria-label="Google Sheet jetzt neu abfragen"
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/70 hover:bg-white text-stone-600 hover:text-black border border-black/30 hover:border-black shadow-xs hover:shadow transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-xs opacity-70 hover:opacity-100"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 transition-transform ${
            isRefreshing ? 'animate-spin text-stone-900' : ''
          }`}
        />
      </button>

      {/* Modals */}
      {/* 1. Riddle Modal with ONLY Code-Word Input & no sheet row hints */}
      <RiddleModal
        page={activePage}
        isOpen={activePage !== null}
        onClose={() => setActivePage(null)}
        onRecordAttempt={() => {}}
      />

      {/* 2. Small Progress Menu */}
      <ProgressModal
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
        pages={pages}
        visiblePages={visiblePages}
        onSelectPage={(p) => handleSelectPage(p)}
      />

      {/* 3. Admin Login Modal with Password 'Anne' */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
