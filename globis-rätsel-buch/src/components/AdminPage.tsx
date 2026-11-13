import React, { useState } from 'react';
import {
  ArrowLeft,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { StationPage } from '../types';
import { soundEffects } from '../utils/audio';

interface AdminPageProps {
  pages: StationPage[];
  onBack: () => void;
  onLogout: () => void;
  onRefresh: () => Promise<StationPage[] | unknown>;
  isRefreshing: boolean;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  pages,
  onBack,
  onLogout,
  onRefresh,
  isRefreshing,
}) => {
  // Set of page numbers whose solution word is currently revealed
  const [revealedPages, setRevealedPages] = useState<Set<number>>(new Set());
  const [copiedPage, setCopiedPage] = useState<number | null>(null);

  const toggleReveal = (pageNumber: number) => {
    soundEffects.playClick();
    setRevealedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const handleRevealAll = () => {
    soundEffects.playClick();
    if (revealedPages.size === pages.length) {
      setRevealedPages(new Set());
    } else {
      setRevealedPages(new Set(pages.map((p) => p.pageNumber)));
    }
  };

  const copyToClipboard = (text: string, pageNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPage(pageNumber);
    soundEffects.playClick();
    setTimeout(() => {
      setCopiedPage(null);
    }, 1500);
  };

  const allRevealed = pages.length > 0 && revealedPages.size === pages.length;

  return (
    <div className="min-h-screen bg-[#1d5cb8] text-stone-900 flex flex-col justify-between selection:bg-yellow-300">
      {/* Top Checkered Ribbon */}
      <div className="w-full bg-globi-checkered h-3.5 border-b-2 border-black"></div>

      {/* Admin Header Bar */}
      <header className="max-w-3xl w-full mx-auto px-4 pt-3 flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-black font-comic font-bold text-xs text-stone-900 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 hover:bg-stone-50 transition-colors cursor-pointer"
          title="Zurück zur Rätselseite"
        >
          <ArrowLeft className="w-4 h-4 text-stone-700" />
          <span>Zurück zur Schnitzeljagd</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-black font-comic font-bold text-xs text-stone-900 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 hover:bg-stone-50 transition-colors cursor-pointer"
            title="Sheet-Daten neu laden"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : 'text-stone-700'}`}
            />
            <span className="hidden sm:inline">Sheet aktualisieren</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e23636] text-white border-2 border-black font-comic font-bold text-xs shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 hover:bg-[#c92a2a] transition-colors cursor-pointer"
            title="Abmelden"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Abmelden</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 flex flex-col justify-center">
        <div className="bg-[#fffdf5] rounded-3xl comic-box p-4 sm:p-6 shadow-[5px_5px_0px_#000]">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b-2 border-black/15 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-stone-900" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-comic font-black text-stone-900 tracking-wide">
                  Adminbereich: Lösungswörter
                </h1>
                <p className="text-xs sm:text-sm font-comic text-stone-600">
                  Klicke auf eine Seitenzahl, um das Lösungswort direkt anzuzeigen.
                </p>
              </div>
            </div>

            {/* Quick action: reveal all / hide all */}
            <button
              onClick={handleRevealAll}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 border-2 border-black font-comic font-bold text-xs text-stone-900 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer"
            >
              {allRevealed ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Alle verbergen</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Alle Lösungswörter anzeigen</span>
                </>
              )}
            </button>
          </div>

          {/* Grid of Stations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {pages.map((p) => {
              const isRevealed = revealedPages.has(p.pageNumber);
              const hasCodeWord = p.codeWord && p.codeWord.trim().length > 0;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border-3 border-black transition-all ${
                    isRevealed
                      ? 'bg-amber-50 shadow-[4px_4px_0px_#000]'
                      : 'bg-white shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000]'
                  }`}
                >
                  {/* Clickable Header Button: Clicking on the page number reveals solution word */}
                  <button
                    onClick={() => toggleReveal(p.pageNumber)}
                    className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer focus:outline-hidden"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`px-3 py-1 rounded-xl border-2 border-black font-comic font-black text-base ${
                          p.isDoneInSheet
                            ? 'bg-emerald-500 text-white shadow-[2px_2px_0px_#000]'
                            : 'bg-stone-100 text-stone-900 shadow-[2px_2px_0px_#000]'
                        }`}
                      >
                        Seite {p.pageNumber}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-comic font-bold text-stone-500">
                        <span>Zeile {p.sheetRowNumber}</span>
                        {p.travelStationNumber && (
                          <span className="px-1.5 py-0.2 bg-stone-200 rounded border border-black/30 text-stone-700">
                            St. {p.travelStationNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.isDoneInSheet ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-comic font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>ja</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-comic font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-300">
                          <XCircle className="w-3 h-3 text-stone-400" />
                          <span>offen</span>
                        </span>
                      )}

                      <div className="p-1.5 rounded-lg bg-stone-100 border border-black/30 text-stone-700">
                        {isRevealed ? (
                          <EyeOff className="w-4 h-4 text-stone-800" />
                        ) : (
                          <Eye className="w-4 h-4 text-stone-600" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Revealed Solution Word Area */}
                  {isRevealed && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t-2 border-dashed border-black/20 bg-amber-100/60 rounded-b-2xl animate-in fade-in duration-150">
                      <div className="flex items-start justify-between gap-2 mt-1">
                        <div className="flex-1">
                          <span className="block text-[11px] font-comic font-bold uppercase tracking-wider text-stone-600 mb-1">
                            Lösungswort (Spalte B):
                          </span>
                          {hasCodeWord ? (
                            <div className="p-2.5 rounded-xl bg-white border-2 border-black font-comic font-black text-stone-900 text-sm sm:text-base break-words shadow-[2px_2px_0px_#000] select-all">
                              {p.codeWord}
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl bg-stone-100 border border-black/20 text-stone-500 italic text-xs font-comic">
                              (Kein Lösungswort in Spalte B eingetragen)
                            </div>
                          )}
                        </div>

                        {hasCodeWord && (
                          <button
                            onClick={(e) => copyToClipboard(p.codeWord, p.pageNumber, e)}
                            className="mt-6 p-2 rounded-xl bg-white hover:bg-stone-100 border-2 border-black text-stone-800 shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer shrink-0"
                            title="Lösungswort kopieren"
                          >
                            {copiedPage === p.pageNumber ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-stone-700" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Success Feedback text from column D if present */}
                      {p.successFeedback && (
                        <div className="mt-2.5 pt-2 border-t border-black/10">
                          <span className="block text-[10px] font-comic font-bold uppercase tracking-wider text-stone-500 mb-0.5">
                            Rückmeldung bei Erfolg (Spalte D):
                          </span>
                          <p className="text-xs font-comic text-stone-700 bg-white/70 p-2 rounded-lg border border-black/15">
                            {p.successFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Bottom Checkered Ribbon */}
      <footer className="w-full relative">
        <div className="w-full bg-globi-checkered h-3.5 border-t-2 border-black"></div>
      </footer>
    </div>
  );
};
