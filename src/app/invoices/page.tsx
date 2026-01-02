"use client";

import React from "react";
import { toast } from "sonner";
import { InvoiceListTable } from "@/components/features/invoices/InvoiceListTable";
import { useInvoices } from "@/hooks/useInvoices";

export default function InvoicesPage() {
  const { invoices, duplicateInvoice, removeInvoice, updateInvoice } = useInvoices();

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10">
      <InvoiceListTable
        invoices={invoices}
        onDuplicate={(id) => {
          duplicateInvoice(id);
          toast.success("Invoice duplicated");
        }}
        onDelete={(id) => {
          removeInvoice(id);
          toast.success("Invoice deleted");
        }}
        onMarkPaid={(id) => {
          updateInvoice(id, { status: "paid" });
          toast.success("Marked as paid");
        }}
      />
    </div>
  );
}

