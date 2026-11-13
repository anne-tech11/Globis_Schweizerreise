import React from 'react';
import { X, CheckCircle2, Circle, Lock } from 'lucide-react';
import { StationPage } from '../types';
import { soundEffects } from '../utils/audio';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: StationPage[];
  visiblePages: StationPage[];
  onSelectPage: (page: StationPage) => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  onClose,
  pages,
  visiblePages,
  onSelectPage,
}) => {
  if (!isOpen) return null;

  const total = pages.length;
  const doneCount = pages.filter((p) => p.isDoneInSheet).length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-[#fffdf5] rounded-2xl comic-box overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header in Globi Blue */}
        <div className="bg-[#1d5cb8] text-white px-4 py-3 flex items-center justify-between border-b-2 border-black">
          <h2 className="text-base font-bold font-comic tracking-wide text-white">
            Fortschritt
          </h2>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-lg bg-[#d92525] hover:bg-red-600 border border-black flex items-center justify-center text-white font-bold"
            aria-label="Schliessen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Globi Checkered Ribbon */}
        <div className="bg-globi-checkered h-2 w-full border-b border-black"></div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Progress Bar & Stats */}
          <div className="p-3 bg-stone-100 rounded-xl border-2 border-black">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1">
              <span>Erledigte Stationen</span>
              <span className="tabular-nums font-comic">
                {doneCount} von {total} ({percent}%)
              </span>
            </div>

            <div className="w-full h-3 bg-white rounded-full border border-black overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>

          {/* List of stations: visible pages show "Seite X", locked ones show ONLY "Gesperrte Station" */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {pages.map((p, idx) => {
              const isVisible = idx === 0 || pages[idx - 1].isDoneInSheet;
              const isDone = p.isDoneInSheet;

              if (!isVisible) {
                return (
                  <div
                    key={p.id}
                    className="w-full p-2.5 rounded-lg border-2 border-dashed border-stone-300 bg-stone-100 text-left flex items-center justify-between text-xs font-comic text-stone-500"
                  >
                    <span className="font-semibold text-stone-600">Gesperrte Station</span>
                    <span className="flex items-center gap-1 text-[11px] font-sans text-stone-400">
                      <Lock className="w-3.5 h-3.5" />
                      Gesperrt
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    soundEffects.playClick();
                    onSelectPage(p);
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-lg border-2 border-black text-left flex items-center justify-between text-xs font-comic font-bold transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-900'
                      : 'bg-white text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <span>Seite {p.pageNumber}</span>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-sans text-[11px] font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Erledigt
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-stone-400 font-sans text-[11px]">
                      <Circle className="w-3.5 h-3.5 text-stone-300" />
                      Offen
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
