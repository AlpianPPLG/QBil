"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BillingForm } from "@/components/features/billing/BillingForm";
import { QRPreview } from "@/components/features/billing/QRPreview";
import type { BillingData } from "@/lib/schema";
import { useInvoices } from "@/hooks/useInvoices";
import { useExport } from "@/hooks/useExport";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateReferenceId } from "@/lib/id";

export default function NewInvoicePage() {
  const router = useRouter();
  const { createInvoice } = useInvoices();
  const { exportAsPNG, exportAsSVG, exportAsPDF } = useExport();

  const [initialReferenceId] = React.useState(() => generateReferenceId());

  const [billingData, setBillingData] = React.useState<BillingData>(() => ({
    merchantName: "",
    merchantAddress: "",
    merchantEmail: "",
    amount: "0.00",
    currency: "USD",
    referenceId: initialReferenceId,
    note: "",
    qrColor: "#000000",
    backgroundColor: "#ffffff",
    errorCorrectionLevel: "M",
    logoUrl: "",
    standard: "generic",
    taxRate: 0,
    items: [],
    templateId: "modern",
  }));

  const onDownload = (format: "png" | "svg" | "pdf") => {
    if (format === "png") exportAsPNG("qr-code-element", billingData.referenceId || "qr-billing");
    else if (format === "svg") exportAsSVG("qr-code-element", billingData.referenceId || "qr-billing");
    else exportAsPDF(billingData);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">New Invoice</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Create, preview, then save.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-full px-5 font-bold shadow-lg shadow-primary/20"
              onClick={() => {
                const inv = createInvoice(billingData);
                toast.success("Saved as draft");
                router.push(`/invoices/${inv.id}`);
              }}
            >
              Save Draft
            </Button>
          </div>
        </div>

        <BillingForm onChange={setBillingData} initialData={billingData} />
      </div>

      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        <QRPreview data={billingData} onDownload={onDownload} />
      </div>
    </div>
  );
}
