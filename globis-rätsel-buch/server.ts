import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = '12wkkbiAYl3sTvUpSYvCJq6KpPgnz0mbKUE_4LIm6Z6A';

async function fetchLiveGoogleSheetCSV(): Promise<string> {
  const timestamp = Date.now();
  const urls = [
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&t=${timestamp}`,
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&t=${timestamp}`,
  ];

  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        redirect: 'follow',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} from Google Sheets`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      // Guard against HTML login/redirect pages
      if (
        contentType.includes('text/html') ||
        text.trimStart().startsWith('<!DOCTYPE') ||
        text.trimStart().startsWith('<html')
      ) {
        lastError = new Error('Google Sheet returned HTML instead of CSV (check sharing permissions)');
        continue;
      }

      if (text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Failed to fetch Google Sheet CSV');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Live Google Sheet proxy endpoint (no CORS issues, zero caching)
  app.get('/api/sheet', async (_req, res) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });

    try {
      const csvText = await fetchLiveGoogleSheetCSV();
      res.type('text/csv; charset=utf-8').send(csvText);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching live Google Sheet:', message);
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
