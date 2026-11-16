import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';
import { parseDividendText } from './dividend-import';

GlobalWorkerOptions.workerSrc = pdfWorker;
export async function readDividendPdf(file: File, progress: (message: string) => void) {
  if (file.size > 20 * 1024 * 1024) throw new Error('Bitte eine PDF mit hÃ¶chstens 20 MB auswÃ¤hlen.');
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 5) throw new Error('Bitte nur eine einzelne Dividendenabrechnung mit hÃ¶chstens fÃ¼nf Seiten auswÃ¤hlen.');
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      progress(`Seite ${i} von ${pdf.numPages} wird gelesen â€¦`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let text = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
      if (!/Bruttodividende/i.test(text)) {
        progress(`Texterkennung fÃ¼r Seite ${i} von ${pdf.numPages} â€¦`);
        worker ??= await createWorker('deu', 1, { workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr', cacheMethod: 'none' });
        const viewport = page.getViewport({ scale: Math.min(3, 2500 / page.getViewport({ scale: 1 }).width) });
        const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        text = (await worker.recognize(canvas)).data.text;
        canvas.width = 0; canvas.height = 0;
      }
      pages.push(text);
    }
    const text = pages.join('\n');
    if ((text.match(/Ihre\s+Depotnummer/gi) || []).length > 1) throw new Error('Die PDF enthÃ¤lt mehrere Abrechnungen. Bitte jede einzeln importieren.');
    const draft = parseDividendText(text);
    if (!draft.quantity && draft.net === undefined) throw new Error('Keine Dividendenabrechnung erkannt. Bitte die Werte manuell erfassen.');
    return draft;
  } finally { await worker?.terminate(); await task.destroy(); }
}

