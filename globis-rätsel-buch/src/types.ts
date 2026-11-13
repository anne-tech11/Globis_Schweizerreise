export interface StationPage {
  id: string;
  pageNumber: number;
  sheetRowNumber: number; // Exact row number in Google Sheet
  codeWord: string; // Exact word from Spalte B of that row
  isDoneInSheet: boolean; // Spalte C === 'ja'
  successFeedback?: string; // Spalte D: "Rückmeldung, wenn korrekt"
  travelStationNumber?: string;
}

export interface ProgressState {
  solvedPageNumbers: number[];
  attempts: Record<number, number>;
}
