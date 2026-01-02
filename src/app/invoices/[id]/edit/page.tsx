"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { BillingForm } from "@/components/features/billing/BillingForm";
import { QRPreview } from "@/components/features/billing/QRPreview";
import { useInvoices } from "@/hooks/useInvoices";
import { useExport } from "@/hooks/useExport";
import type { BillingData } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { invoices, updateInvoice } = useInvoices();
  const { exportAsPNG, exportAsSVG, exportAsPDF } = useExport();

  const invoice = React.useMemo(() => invoices.find((i) => i.id === params.id) ?? null, [invoices, params.id]);

  const [billingData, setBillingData] = React.useState<BillingData | null>(null);

  React.useEffect(() => {
    if (invoice) setBillingData(invoice.data);
  }, [invoice]);

  if (!invoice || !billingData) {
    return <div className="max-w-[1200px] mx-auto p-10 text-sm text-muted-foreground">Loading...</div>;
  }

  const onDownload = (format: "png" | "svg" | "pdf") => {
    if (format === "png") exportAsPNG("qr-code-element", billingData.referenceId);
    else if (format === "svg") exportAsSVG("qr-code-element", billingData.referenceId);
    else exportAsPDF(billingData);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Edit Invoice</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold font-mono">{invoice.referenceId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-full px-5 font-bold shadow-lg shadow-primary/20"
              onClick={() => {
                updateInvoice(invoice.id, { data: billingData, referenceId: billingData.referenceId });
                toast.success("Saved");
                router.push(`/invoices/${invoice.id}`);
              }}
            >
              Save
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => router.push(`/invoices/${invoice.id}`)}>
              Cancel
            </Button>
          </div>
        </div>

        <BillingForm onChange={(d) => setBillingData(d)} initialData={billingData} />
      </div>

      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        <QRPreview data={billingData} onDownload={onDownload} />
      </div>
    </div>
  );
}

