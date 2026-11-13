import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, RotateCcw, MoveRight } from 'lucide-react';
import { StationPage } from '../types';
import { soundEffects } from '../utils/audio';

interface RiddleModalProps {
  page: StationPage | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordAttempt: (pageNumber: number) => void;
}

interface WordItem {
  id: string;
  word: string;
}

export const RiddleModal: React.FC<RiddleModalProps> = ({
  page,
  isOpen,
  onClose,
  onRecordAttempt,
}) => {
  const [inputWord, setInputWord] = useState('');
  const [evaluationState, setEvaluationState] = useState<'idle' | 'correct' | 'wrong' | 'empty_in_sheet'>('idle');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state for multi-word codewords (e.g. Zeile 4 / Seite 31)
  const [availableWords, setAvailableWords] = useState<WordItem[]>([]);
  const [placedWords, setPlacedWords] = useState<WordItem[]>([]);
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null);

  const rawWords = page?.codeWord ? page.codeWord.trim().split(/\s+/).filter(Boolean) : [];
  const isMultiWord =
    ((page?.sheetRowNumber === 4 || page?.pageNumber === 31) && rawWords.length > 1) ||
    rawWords.length >= 4;

  useEffect(() => {
    if (isOpen && page) {
      setInputWord('');
      setEvaluationState('idle');
      setIsShaking(false);

      if (isMultiWord) {
        // Prepare items with stable IDs
        const items = rawWords.map((word, idx) => ({
          id: `${word}-${idx}`,
          word,
        }));

        // Scramble words so they don't start in solved order
        const scrambled = [...items];
        for (let i = scrambled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
        }
        // If scramble happened to be identical to original, swap first two
        if (scrambled.map((s) => s.word).join(' ') === page.codeWord.trim() && scrambled.length > 1) {
          [scrambled[0], scrambled[1]] = [scrambled[1], scrambled[0]];
        }

        setAvailableWords(scrambled);
        setPlacedWords([]);
      } else {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }
    }
  }, [isOpen, page, page?.codeWord]);

  if (!isOpen || !page) return null;

  const normalize = (str: string) =>
    str
      .normalize('NFC')
      .trim()
      .toUpperCase()
      .replace(/[\s\-_\.'"\!\?]/g, '');

  const handleCheckCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let entered = '';
    if (isMultiWord) {
      if (placedWords.length === 0) return;
      entered = normalize(placedWords.map((w) => w.word).join(' '));
    } else {
      if (!inputWord.trim()) return;
      entered = normalize(inputWord);
    }

    onRecordAttempt(page.pageNumber);
    const target = normalize(page.codeWord);

    // If no codeword has been entered in Column B
    if (!target) {
      setEvaluationState('empty_in_sheet');
      soundEffects.playError();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    // Check against Column B of this row
    const isMatch = entered === target;

    if (isMatch) {
      setEvaluationState('correct');
      soundEffects.playSuccess();
    } else {
      setEvaluationState('wrong');
      soundEffects.playError();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  const handleRetry = () => {
    setEvaluationState('idle');
    soundEffects.playClick();

    if (isMultiWord) {
      // Return placed words back to available pool
      const items = rawWords.map((word, idx) => ({
        id: `${word}-${idx}`,
        word,
      }));
      const scrambled = [...items].sort(() => 0.5 - Math.random());
      setAvailableWords(scrambled);
      setPlacedWords([]);
    } else {
      setInputWord('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Click / Tap helpers for words
  const handleSelectWord = (item: WordItem) => {
    soundEffects.playClick();
    setAvailableWords((prev) => prev.filter((w) => w.id !== item.id));
    setPlacedWords((prev) => [...prev, item]);
  };

  const handleRemoveWord = (item: WordItem) => {
    soundEffects.playClick();
    setPlacedWords((prev) => prev.filter((w) => w.id !== item.id));
    setAvailableWords((prev) => [...prev, item]);
  };

  const handleResetWords = () => {
    soundEffects.playClick();
    setAvailableWords((prev) => [...prev, ...placedWords]);
    setPlacedWords([]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWordId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnAnswerArea = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedWordId;
    if (!id) return;

    // Check if dragging from available pool
    const itemInAvailable = availableWords.find((w) => w.id === id);
    if (itemInAvailable) {
      soundEffects.playClick();
      setAvailableWords((prev) => prev.filter((w) => w.id !== id));
      setPlacedWords((prev) => [...prev, itemInAvailable]);
      setDraggedWordId(null);
      return;
    }
    setDraggedWordId(null);
  };

  const handleDropOnItem = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData('text/plain') || draggedWordId;
    if (!id || id === targetId) return;

    // If coming from available pool
    const itemInAvailable = availableWords.find((w) => w.id === id);
    if (itemInAvailable) {
      soundEffects.playClick();
      setAvailableWords((prev) => prev.filter((w) => w.id !== id));
      setPlacedWords((prev) => {
        const targetIdx = prev.findIndex((w) => w.id === targetId);
        const next = [...prev];
        next.splice(targetIdx, 0, itemInAvailable);
        return next;
      });
      setDraggedWordId(null);
      return;
    }

    // If reordering within placedWords
    const itemInPlaced = placedWords.find((w) => w.id === id);
    if (itemInPlaced) {
      soundEffects.playClick();
      setPlacedWords((prev) => {
        const without = prev.filter((w) => w.id !== id);
        const targetIdx = without.findIndex((w) => w.id === targetId);
        const next = [...without];
        next.splice(targetIdx, 0, itemInPlaced);
        return next;
      });
      setDraggedWordId(null);
    }
  };

  const handleDropOnPool = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedWordId;
    if (!id) return;

    const itemInPlaced = placedWords.find((w) => w.id === id);
    if (itemInPlaced) {
      soundEffects.playClick();
      setPlacedWords((prev) => prev.filter((w) => w.id !== id));
      setAvailableWords((prev) => [...prev, itemInPlaced]);
      setDraggedWordId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-sm sm:max-w-md bg-[#fffdf5] rounded-2xl comic-box overflow-hidden my-auto transition-transform ${
          isShaking ? 'animate-comic-shake' : ''
        }`}
      >
        {/* Header in Globi Blue */}
        <div className="bg-[#1d5cb8] text-white px-4 py-3 flex items-center justify-between border-b-3 border-black">
          <h2 className="text-lg font-bold font-comic tracking-wide text-white leading-tight">
            Seite {page.pageNumber}
          </h2>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-[#d92525] hover:bg-red-600 border-2 border-black flex items-center justify-center text-white font-bold active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Schliessen"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Characteristic Globi Checkered Ribbon */}
        <div className="bg-globi-checkered h-2.5 w-full border-b border-black"></div>

        {/* Modal Content: ONLY input field or success/error result */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* 1. Correct State */}
          {evaluationState === 'correct' && (
            <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-600 text-center space-y-3 animate-comic-pop">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-600 border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_#000]">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-comic text-emerald-900">
                  Richtig!
                </h3>
                <p className="text-xs sm:text-sm font-medium text-emerald-950 bg-white/85 p-3 rounded-xl border border-emerald-300 leading-relaxed whitespace-pre-line text-left">
                  {page.successFeedback || 'Das Code-Wort ist korrekt.'}
                </p>
              </div>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-comic font-bold text-sm rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Fertig
              </button>
            </div>
          )}

          {/* 2. Wrong State */}
          {evaluationState === 'wrong' && (
            <div className="p-4 bg-red-50 rounded-xl border-2 border-red-600 text-center space-y-3 animate-comic-pop">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#d92525] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_#000]">
                <XCircle className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-comic text-red-900">
                  Falsch!
                </h3>
                <p className="text-xs text-red-800 font-medium">
                  Das Code-Wort ist nicht korrekt. Bitte streng dich mehr an und versuche es erneut.
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="w-full py-2.5 px-4 bg-[#d92525] hover:bg-red-700 text-white font-comic font-bold text-sm rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* 3. Empty in Sheet State */}
          {evaluationState === 'empty_in_sheet' && (
            <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-600 text-center space-y-3 animate-comic-pop">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500 border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_#000]">
                <AlertCircle className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-comic text-amber-950">
                  Kein Lösungswort hinterlegt
                </h3>
                <p className="text-xs text-amber-900 font-medium">
                  Für diese Buchseite ist noch kein Code-Wort hinterlegt.
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-comic font-bold text-sm rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                Zurück
              </button>
            </div>
          )}

          {/* 4. Input Mode: Drag and Drop (multi-word) OR Single-word text input */}
          {evaluationState === 'idle' && (
            <>
              {isMultiWord ? (
                /* MULTI-WORD DRAG & DROP INTERFACE (Zeile 4) */
                <div className="space-y-3.5">
                  {/* Dropzone: Antwortfeld */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold font-comic uppercase tracking-wider text-stone-700 mb-1.5">
                      <span>Antwortfeld (Reihenfolge anordnen):</span>
                      {placedWords.length > 0 && (
                        <button
                          type="button"
                          onClick={handleResetWords}
                          className="text-[11px] text-stone-500 hover:text-stone-800 font-sans flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Leeren</span>
                        </button>
                      )}
                    </div>

                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDropOnAnswerArea}
                      className="min-h-[72px] p-2.5 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_#1c1917] flex flex-wrap gap-2 items-center"
                    >
                      {placedWords.length === 0 ? (
                        <div className="w-full py-3 text-center text-xs font-medium text-stone-400 italic">
                          Wörter hierhin ziehen oder antippen
                        </div>
                      ) : (
                        placedWords.map((item, idx) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropOnItem(e, item.id)}
                            onClick={() => handleRemoveWord(item)}
                            title="Klicken zum Entfernen oder ziehen zum Verschieben"
                            className="bg-[#1d5cb8] hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg border-2 border-black font-comic font-bold text-xs sm:text-sm shadow-[1px_1px_0px_#000] cursor-pointer flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all select-none"
                          >
                            <span className="text-[10px] opacity-75 font-mono">{idx + 1}.</span>
                            <span>{item.word}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pool: Verfügbare Wörter */}
                  <div>
                    <span className="block text-xs font-bold font-comic uppercase tracking-wider text-stone-600 mb-1.5">
                      Verfügbare Wörter:
                    </span>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDropOnPool}
                      className="p-3 bg-amber-50 rounded-xl border-2 border-amber-300 min-h-[56px] flex flex-wrap gap-2 items-center justify-center"
                    >
                      {availableWords.length === 0 ? (
                        <span className="text-xs text-stone-400 italic">
                          Alle Wörter im Antwortfeld platziert
                        </span>
                      ) : (
                        availableWords.map((item) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={() => handleSelectWord(item)}
                            title="Antippen oder ins Antwortfeld ziehen"
                            className="bg-[#f9bc15] hover:bg-yellow-300 active:bg-yellow-400 text-stone-900 px-3 py-1.5 rounded-lg border-2 border-black font-comic font-bold text-xs sm:text-sm shadow-[2px_2px_0px_#000] cursor-grab active:cursor-grabbing active:translate-x-0.5 active:translate-y-0.5 transition-all select-none"
                          >
                            {item.word}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleCheckCode}
                    disabled={placedWords.length === 0}
                    className={`w-full py-3 px-4 rounded-xl font-comic font-bold text-sm border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                      placedWords.length > 0
                        ? 'bg-[#f9bc15] hover:bg-yellow-300 text-stone-900 cursor-pointer'
                        : 'bg-stone-200 text-stone-400 border-stone-400 shadow-none cursor-not-allowed'
                    }`}
                  >
                    Antwort prüfen
                  </button>
                </div>
              ) : (
                /* SINGLE-WORD TEXT INPUT */
                <form onSubmit={handleCheckCode} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold font-comic uppercase tracking-wider text-stone-700 mb-1.5">
                      Code-Wort
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputWord}
                      onChange={(e) => setInputWord(e.target.value)}
                      placeholder="Code-Wort eingeben..."
                      autoComplete="off"
                      spellCheck="false"
                      className="w-full px-4 py-3 text-base font-comic font-bold uppercase tracking-wider bg-white rounded-xl border-2 border-black focus:border-[#1d5cb8] outline-none shadow-[2px_2px_0px_#1c1917] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputWord.trim()}
                    className={`w-full py-3 px-4 rounded-xl font-comic font-bold text-sm border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                      inputWord.trim()
                        ? 'bg-[#f9bc15] hover:bg-yellow-300 text-stone-900 cursor-pointer'
                        : 'bg-stone-200 text-stone-400 border-stone-400 shadow-none cursor-not-allowed'
                    }`}
                  >
                    Prüfen
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
