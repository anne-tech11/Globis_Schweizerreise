import { StationPage } from '../types';

// Updated data from Google Sheet attachment Stationen_Idageburi_6290d1ab:
// Spalte A = Seite, Spalte B = Lösungswort, Spalte C = Erledigt?, Spalte D = Rückmeldung, wenn korrekt
export const STATIC_SHEET_PAGES: StationPage[] = [
  {
    id: 'page-7',
    pageNumber: 7,
    sheetRowNumber: 2,
    codeWord: 'ONLINE',
    isDoneInSheet: false,
    successFeedback: 'Weiter gehts um 08.05 Uhr im IR 46. Frag Anne dann nach dem Couvert Nr. 27!',
  },
  {
    id: 'page-27',
    pageNumber: 27,
    sheetRowNumber: 3,
    codeWord: 'ALTDORF',
    isDoneInSheet: false,
    successFeedback: 'Wenn du Anne diese Nachricht zeigst, wird sie dir die nächsten Hinweise geben. ',
  },
  {
    id: 'page-31',
    pageNumber: 31,
    sheetRowNumber: 4,
    codeWord: 'heroische Überhöhung einer nie existenten Person',
    isDoneInSheet: false,
    successFeedback: 'Existent oder nicht, wir machen es wie globi und fliehen zur Tellsplatte! Zuerst nehmen wir aber den Bus nach Flüelen.',
  },
  {
    id: 'page-57',
    pageNumber: 57,
    sheetRowNumber: 5,
    codeWord: 'BOOT',
    isDoneInSheet: false,
    successFeedback: 'Ruderboot, nein Danke. Wir nehmen das Kursschiff um 13.16 Uhr. Das ist der Moment für ein erfrischendes Getränk und Seite 69!',
  },
  {
    id: 'page-69',
    pageNumber: 69,
    sheetRowNumber: 6,
    codeWord: 'VELO',
    isDoneInSheet: false,
    successFeedback: 'Frisch gestärkt gehts nun auf zur Velostation in Luzern!',
  },
  {
    id: 'page-19',
    pageNumber: 19,
    sheetRowNumber: 7,
    codeWord: 'INTERLAKEN',
    isDoneInSheet: false,
    successFeedback: 'Da steigen wir aus. Frag Anne nach Nummer 13!',
  },
  {
    id: 'page-13',
    pageNumber: 13,
    sheetRowNumber: 8,
    codeWord: 'Weisses Kreuz',
    isDoneInSheet: false,
    successFeedback: 'Ab ins Hotel! Google Maps führt uns dahin.',
  },
  {
    id: 'page-61',
    pageNumber: 61,
    sheetRowNumber: 9,
    codeWord: 'Bier',
    isDoneInSheet: false,
    successFeedback: 'Wir gehen ins "Hüsi" in Interlaken und schlagen uns den Bauch voll!',
  },
  {
    id: 'page-17',
    pageNumber: 17,
    sheetRowNumber: 10,
    codeWord: 'IR 65',
    isDoneInSheet: false,
    successFeedback: 'Um 11.12 Uhr gehts hier weiter. Vorher: Auf zum lesen in ein hübsches Café!',
  },
  {
    id: 'page-67',
    pageNumber: 67,
    sheetRowNumber: 11,
    codeWord: 'Spielen',
    isDoneInSheet: false,
    successFeedback: 'Fürs Spielen bleibt uns etwas Zeit. Danach: Auf zu Seite 89!',
  },
  {
    id: 'page-89',
    pageNumber: 89,
    sheetRowNumber: 12,
    codeWord: 'Camille Bloch',
    isDoneInSheet: false,
    successFeedback: 'Erst wenn du keine Schoggi mehr sehen kannst, gehts weiter mit Seite 22',
  },
  {
    id: 'page-22',
    pageNumber: 22,
    sheetRowNumber: 13,
    codeWord: 'Speisewagen',
    isDoneInSheet: false,
    successFeedback: 'Auf in den Speisewagen. Dort gibts noch die Nummer 91',
  },
  {
    id: 'page-91',
    pageNumber: 91,
    sheetRowNumber: 14,
    codeWord: 'Neun',
    isDoneInSheet: false,
    successFeedback: 'testii',
  },
];

export function parseCSV(text: string): StationPage[] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      lines.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    lines.push(currentRow);
  }

  if (lines.length < 2) return STATIC_SHEET_PAGES;

  // Header detection to dynamically locate matching columns
  const header = lines[0].map((h) => h.trim().toLowerCase());
  let pageCol = header.findIndex((h) => h.includes('seite'));
  let codeCol = header.findIndex((h) => h.includes('lösungswort') || h.includes('codewort'));
  let doneCol = header.findIndex((h) => h.includes('erledigt'));
  let feedbackCol = header.findIndex((h) => h.includes('rückmeldung'));
  let stationCol = header.findIndex((h) => h.includes('station reise') || h === 'station');

  // Fallbacks if header naming varies
  if (pageCol === -1) pageCol = 0;
  if (codeCol === -1) codeCol = 1;
  if (doneCol === -1) doneCol = 2;
  if (feedbackCol === -1) feedbackCol = 3;

  const results: StationPage[] = [];

  for (let r = 1; r < lines.length; r++) {
    const row = lines[r];
    if (!row || row.length === 0) continue;

    const pageRaw = row[pageCol]?.trim();
    if (!pageRaw) continue; // Ignore empty rows in Column A

    const pageNum = parseInt(pageRaw, 10);
    if (isNaN(pageNum)) continue;

    const sheetRowNumber = r + 1; // 1-based row number in Google Sheet
    // Spalte B (Lösungswort) strictly for this row
    const codeWord = (row[codeCol] || '').trim().replace(/^["']|["']$/g, '');
    // Spalte C (Erledigt?) is "ja" if completed
    const isDone = (row[doneCol] || '').trim().toLowerCase() === 'ja';
    // Spalte D (Rückmeldung)
    const successFeedback = (row[feedbackCol] || '').trim().replace(/^["']|["']$/g, '');
    const stationNumber = stationCol !== -1 ? (row[stationCol] || '').trim() : undefined;

    results.push({
      id: `page-${pageNum}`,
      pageNumber: pageNum,
      sheetRowNumber: sheetRowNumber,
      codeWord: codeWord,
      isDoneInSheet: isDone,
      successFeedback: successFeedback || undefined,
      travelStationNumber: stationNumber || undefined,
    });
  }

  return results.length > 0 ? results : STATIC_SHEET_PAGES;
}

export const SPREADSHEET_ID = '12wkkbiAYl3sTvUpSYvCJq6KpPgnz0mbKUE_4LIm6Z6A';

export async function fetchSheetPages(): Promise<StationPage[]> {
  const candidateUrls = [
    `/api/sheet?t=${Date.now()}`,
    `/assets/aistudio/Stationen_Idageburi_6290d1ab?t=${Date.now()}`,
    `/assets/aistudio/Stationen_Idageburi_latest.csv?t=${Date.now()}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const text = await res.text();
        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // try next candidate URL
    }
  }

  return STATIC_SHEET_PAGES;
}
