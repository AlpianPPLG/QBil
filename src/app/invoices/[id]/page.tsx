"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRPreview } from "@/components/features/billing/QRPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/features/invoices/InvoiceStatusBadge";
import { useInvoices } from "@/hooks/useInvoices";
import { useExport } from "@/hooks/useExport";
import { toast } from "sonner";
import { useTemplates } from "@/hooks/useTemplates";
import { InvoiceTemplateRenderer } from "@/components/features/templates/InvoiceTemplateRenderer";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { invoices, removeInvoice, duplicateInvoice, updateInvoice } = useInvoices();
  const { templates } = useTemplates();
  const { exportAsPNG, exportAsSVG, exportElementAsPDF, exportAsPDF } = useExport();

  const invoice = React.useMemo(() => invoices.find((i) => i.id === params.id) ?? null, [invoices, params.id]);

  const tpl = React.useMemo(() => {
    if (!invoice) return null;
    // For now: map preset templateId -> first template that contains that name, else first available.
    // Next milestone: store actual template UUID in invoice.data.
    const byName = templates.find((t) => t.name.toLowerCase().includes(invoice.data.templateId));
    return byName ?? templates[0] ?? null;
  }, [templates, invoice]);

  if (!invoice) {
    return (
      <div className="max-w-[1200px] mx-auto p-10">
        <div className="text-sm text-muted-foreground">Invoice not found.</div>
        <Button asChild className="mt-4">
          <Link href="/invoices">Back</Link>
        </Button>
      </div>
    );
  }

  const exportElementId = `invoice-export-${invoice.id}`;

  const onDownload = (format: "png" | "svg" | "pdf") => {
    if (format === "png") exportAsPNG("qr-code-element", invoice.referenceId);
    else if (format === "svg") exportAsSVG("qr-code-element", invoice.referenceId);
    else {
      // Prefer template-based output if templates exist; fallback to current jsPDF layout
      if (tpl) exportElementAsPDF(exportElementId, invoice.referenceId);
      else exportAsPDF(invoice.data);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Hidden/offscreen printable invoice for PDF export */}
      {tpl ? (
        <div className="fixed -left-[99999px] top-0">
          <InvoiceTemplateRenderer id={exportElementId} data={invoice.data} template={tpl} />
        </div>
      ) : null}

      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight font-mono text-primary">{invoice.referenceId}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <div className="text-xs text-muted-foreground">Created {new Date(invoice.createdAt).toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/invoices/${invoice.id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                const dup = duplicateInvoice(invoice.id);
                toast.success("Duplicated");
                router.push(`/invoices/${dup.id}`);
              }}
            >
              Duplicate
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => {
                removeInvoice(invoice.id);
                toast.success("Deleted");
                router.push("/invoices");
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={invoice.status === "draft" ? "default" : "outline"}
              onClick={() => updateInvoice(invoice.id, { status: "draft" })}
            >
              Draft
            </Button>
            <Button
              size="sm"
              variant={invoice.status === "sent" ? "default" : "outline"}
              onClick={() => updateInvoice(invoice.id, { status: "sent" })}
            >
              Sent
            </Button>
            <Button
              size="sm"
              variant={invoice.status === "paid" ? "default" : "outline"}
              onClick={() => updateInvoice(invoice.id, { status: "paid" })}
            >
              Paid
            </Button>
            <Button
              size="sm"
              variant={invoice.status === "void" ? "destructive" : "outline"}
              onClick={() => updateInvoice(invoice.id, { status: "void" })}
            >
              Void
            </Button>
          </CardContent>
        </Card>

        {tpl ? (
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Export</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="default" className="rounded-full" onClick={() => exportElementAsPDF(exportElementId, invoice.referenceId)}>
                Export PDF (Template)
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => exportAsPDF(invoice.data)}>
                Export PDF (Legacy)
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        <QRPreview data={invoice.data} onDownload={onDownload} />
      </div>
    </div>
  );
}

