"use client";

import * as React from "react";
import type { Invoice, InvoiceStatus, BillingData } from "@/lib/schema";
import { invoicesRepo } from "@/lib/storage/invoicesRepo";

const STORAGE_KEY = "qbilling_invoices_v1";

export function useInvoices() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);

  const refresh = React.useCallback(() => {
    setInvoices(invoicesRepo.list());
  }, []);

  React.useEffect(() => {
    refresh();

    // Cross-tab sync
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  const createInvoice = React.useCallback((data: BillingData) => {
    const inv = invoicesRepo.create({ data, status: "draft" });
    refresh();
    return inv;
  }, [refresh]);

  const updateInvoice = React.useCallback(
    (id: string, patch: Partial<{ status: InvoiceStatus; referenceId: string; data: BillingData }>) => {
      const inv = invoicesRepo.update(id, patch);
      refresh();
      return inv;
    },
    [refresh]
  );

  const removeInvoice = React.useCallback((id: string) => {
    invoicesRepo.remove(id);
    refresh();
  }, [refresh]);

  const duplicateInvoice = React.useCallback((id: string) => {
    const inv = invoicesRepo.duplicate(id);
    refresh();
    return inv;
  }, [refresh]);

  return { invoices, refresh, createInvoice, updateInvoice, removeInvoice, duplicateInvoice };
}
