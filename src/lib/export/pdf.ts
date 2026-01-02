import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PdfFromElementOptions {
  scale?: number;
  backgroundColor?: string;
  useCORS?: boolean;
}

/**
 * Create a PDF Blob from a DOM element by rendering it with html2canvas.
 * - Supports multi-page slicing (A4).
 * - Returns a Blob suitable for bundling into ZIP.
 */
export async function pdfBlobFromElement(
  element: HTMLElement,
  opts: PdfFromElementOptions = {}
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: opts.scale ?? 2,
    backgroundColor: opts.backgroundColor ?? "#ffffff",
    useCORS: opts.useCORS ?? true,
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidthMm = pageWidth;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  let y = 0;
  let remaining = imgHeightMm;

  while (remaining > 0) {
    const sourceY = (y * canvas.width) / imgWidthMm;
    const sourceH = Math.min(canvas.height - sourceY, (pageHeight * canvas.width) / imgWidthMm);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.max(1, Math.floor(sourceH));
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) break;

    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);

    const pageImg = pageCanvas.toDataURL("image/png");
    const pageImgHeightMm = (pageCanvas.height * imgWidthMm) / pageCanvas.width;

    if (y > 0) pdf.addPage();
    pdf.addImage(pageImg, "PNG", 0, 0, imgWidthMm, pageImgHeightMm);

    y += pageHeight;
    remaining -= pageHeight;
  }

  return pdf.output("blob");
}

