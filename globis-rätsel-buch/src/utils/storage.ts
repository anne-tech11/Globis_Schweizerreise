import { ProgressState } from '../types';

const STORAGE_KEY = 'globi_sheet_progress_v5';

export function loadProgress(sheetSolvedPages: number[] = []): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const userSolved: number[] = Array.isArray(parsed.solvedPageNumbers) ? parsed.solvedPageNumbers : [];
      const combined = Array.from(new Set([...sheetSolvedPages, ...userSolved]));
      return {
        solvedPageNumbers: combined,
        attempts: parsed.attempts || {},
      };
    }
  } catch (err) {
    console.error('Error loading progress from storage', err);
  }
  return {
    solvedPageNumbers: sheetSolvedPages,
    attempts: {},
  };
}

export function saveProgress(progress: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Error saving progress to storage', err);
  }
}

export function resetProgress(sheetSolvedPages: number[] = []): ProgressState {
  const reset: ProgressState = {
    solvedPageNumbers: sheetSolvedPages,
    attempts: {},
  };
  saveProgress(reset);
  return reset;
}
