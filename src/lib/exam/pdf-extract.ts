/**
 * Client-side PDF text extraction using pdf.js. Dynamically imported so the
 * library (and its worker) only load when a teacher actually imports a PDF.
 *
 * Returns the text of each page reconstructed into lines. Works on text-based
 * PDFs; scanned/image PDFs have no embedded text and yield nothing (the caller
 * surfaces that to the user).
 */
export interface ExtractedPdf {
  text: string;
  pages: number;
}

export async function extractPdfText(file: File): Promise<ExtractedPdf> {
  const pdfjs = await import("pdfjs-dist");
  // The worker file is copied to /public during setup and matches the lib version.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let line = "";
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      line += item.str;
      // pdf.js marks the end of a visual line on the item itself.
      if ((item as { hasEOL?: boolean }).hasEOL) {
        lines.push(line);
        line = "";
      }
    }
    if (line.trim()) lines.push(line);
    pages.push(lines.map((l) => l.replace(/\s+$/g, "")).join("\n"));
  }

  await doc.destroy();
  return { text: pages.join("\n"), pages: doc.numPages };
}
