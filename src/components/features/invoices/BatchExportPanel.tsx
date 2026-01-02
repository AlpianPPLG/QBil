"use client";

import * as React from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Download, Layers } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@/lib/schema";
import { useExport } from "@/hooks/useExport";
import { batchZipName, safeFilename } from "@/lib/export/zip";

export function BatchExportPanel({
  selected,
  elementIdPrefix = "batch-export-",
}: {
  selected: Invoice[];
  elementIdPrefix?: string;
}) {
  const { exportElementAsPDFBlob } = useExport();
  const [working, setWorking] = React.useState<"zip" | "merged" | null>(null);

  const exportZip = async () => {
    if (selected.length === 0) {
      toast.message("Select invoices first");
      return;
    }

    setWorking("zip");
    const tId = toast.loading(`Generating ${selected.length} PDFs...`);

    try {
      const zip = new JSZip();

      for (let idx = 0; idx < selected.length; idx++) {
        const inv = selected[idx];
        const elementId = `${elementIdPrefix}${inv.id}`;
        await new Promise((r) => setTimeout(r, 0));

        const pdfBlob = await exportElementAsPDFBlob(elementId);
        zip.file(safeFilename(`${inv.referenceId || `invoice-${inv.id}`}.pdf`), pdfBlob);

        toast.loading(`Generating ${idx + 1}/${selected.length} PDFs...`, { id: tId });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${batchZipName("invoices")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.dismiss(tId);
      toast.success("ZIP downloaded");
    } catch (e) {
      console.error(e);
      toast.dismiss(tId);
      toast.error("Batch export ZIP failed");
    } finally {
      setWorking(null);
    }
  };

  const exportMergedPdf = async () => {
    if (selected.length === 0) {
      toast.message("Select invoices first");
      return;
    }

    setWorking("merged");
    const tId = toast.loading(`Preparing merged PDF (${selected.length} invoices)...`);

    try {
      const res = await fetch("/api/export/invoices/merged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected.map((i) => i.data)),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "Merge failed");
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${batchZipName("invoices")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.dismiss(tId);
      toast.success("Merged PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.dismiss(tId);
      toast.error("Merged PDF failed");
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="default"
        className="rounded-full px-5 font-bold shadow-lg shadow-primary/20"
        onClick={exportZip}
        disabled={selected.length === 0 || working !== null}
      >
        <Download className="w-4 h-4 mr-2" />
        Export ZIP ({selected.length || 0})
      </Button>
      <Button
        variant="secondary"
        className="rounded-full px-5 font-bold"
        onClick={exportMergedPdf}
        disabled={selected.length === 0 || working !== null}
      >
        <Layers className="w-4 h-4 mr-2" />
        Merged PDF ({selected.length || 0})
      </Button>
    </div>
  );
}
