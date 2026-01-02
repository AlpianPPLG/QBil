import jsPDF from "jspdf";

export interface MergePdfInput {
  name: string;
  pdfBlob: Blob;
}

async function readAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return await blob.arrayBuffer();
}

/**
 * Merge multiple PDF blobs into a single PDF blob.
 *
 * Note: jsPDF's PDF import requires `jsPDF.API.processPDF` (added by the plugin).
 * We ship the plugin alongside this util.
 */
export async function mergePdfBlobs(inputs: MergePdfInput[]): Promise<Blob> {
  if (inputs.length === 0) {
    // Return an empty 1-page PDF to avoid throwing in the UI.
    const doc = new jsPDF("p", "mm", "a4");
    return doc.output("blob");
  }

  // Import plugin side-effect.
  await import("@/lib/export/pdfImportPlugin");

  const out = new jsPDF();
  // remove auto first blank page
  out.deletePage(1);

  for (const item of inputs) {
    const ab = await readAsArrayBuffer(item.pdfBlob);

    // `processPDF` will insert all pages from source into `out`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDoc: any = out;
    if (typeof anyDoc.processPDF !== "function") {
      throw new Error("PDF import plugin not loaded (processPDF missing)");
    }

    anyDoc.processPDF(ab);
  }

  return out.output("blob");
}

