import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument, degrees } from 'pdf-lib';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Read only the first page for the card preview; PDF bytes never leave the browser.
export async function createThumbnail(file) {
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const pageCount = pdf.numPages;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.58 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const thumbnail = canvas.toDataURL('image/jpeg', 0.82);
  await pdf.destroy();
  return { thumbnail, pageCount };
}

// pdf-lib retains the original vector content and applies the chosen rotation to each page.
export async function mergePdfs(items, onProgress) {
  const merged = await PDFDocument.create();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const source = await PDFDocument.load(await item.file.arrayBuffer());
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => {
      if (item.rotation) page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
      merged.addPage(page);
    });
    onProgress(Math.round(((index + 1) / items.length) * 100));
  }
  return merged.save();
}

export function isPdf(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
