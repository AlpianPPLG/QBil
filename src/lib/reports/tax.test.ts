import { describe, it, expect } from "vitest";
import { buildTaxReport, taxReportToCsv } from "@/lib/reports/tax";
import type { Invoice } from "@/lib/schema";

function inv(partial: Partial<Invoice>): Invoice {
  return {
    id: partial.id ?? "id",
    referenceId: partial.referenceId ?? "INV-1",
    status: partial.status ?? "draft",
    createdAt: partial.createdAt ?? new Date("2026-01-01T00:00:00.000Z").toISOString(),
    updatedAt: partial.updatedAt ?? new Date("2026-01-01T00:00:00.000Z").toISOString(),
    data: partial.data as Invoice["data"],
  };
}

describe("buildTaxReport", () => {
  it("groups by currency and taxRate", () => {
    const invoices: Invoice[] = [
      inv({
        id: "1",
        referenceId: "INV-1",
        status: "paid",
        data: {
          merchantName: "A",
          merchantAddress: "",
          merchantEmail: "a@a.com",
          amount: "0.00",
          currency: "IDR",
          referenceId: "INV-1",
          note: "",
          qrColor: "#000",
          backgroundColor: "#fff",
          errorCorrectionLevel: "M",
          logoUrl: "",
          standard: "generic",
          taxRate: 10,
          items: [{ id: "i1", description: "X", quantity: 2, price: 100 }],
          templateId: "modern",
        },
      }),
      inv({
        id: "2",
        referenceId: "INV-2",
        status: "paid",
        data: {
          merchantName: "B",
          merchantAddress: "",
          merchantEmail: "b@b.com",
          amount: "0.00",
          currency: "IDR",
          referenceId: "INV-2",
          note: "",
          qrColor: "#000",
          backgroundColor: "#fff",
          errorCorrectionLevel: "M",
          logoUrl: "",
          standard: "generic",
          taxRate: 0,
          items: [{ id: "i2", description: "Y", quantity: 1, price: 50 }],
          templateId: "modern",
        },
      }),
      inv({
        id: "3",
        referenceId: "INV-3",
        status: "paid",
        data: {
          merchantName: "C",
          merchantAddress: "",
          merchantEmail: "c@c.com",
          amount: "0.00",
          currency: "USD",
          referenceId: "INV-3",
          note: "",
          qrColor: "#000",
          backgroundColor: "#fff",
          errorCorrectionLevel: "M",
          logoUrl: "",
          standard: "generic",
          taxRate: 10,
          items: [{ id: "i3", description: "Z", quantity: 1, price: 10 }],
          templateId: "modern",
        },
      }),
    ];

    const r = buildTaxReport(invoices, { status: "paid" });
    expect(r.length).toBe(2);

    const idr = r.find((x) => x.currency === "IDR")!;
    expect(idr.invoiceCount).toBe(2);
    expect(idr.subtotal).toBe(250);
    expect(idr.tax).toBe(20);
    expect(idr.total).toBe(270);
    expect(idr.byRate.map((x) => x.taxRate)).toEqual([0, 10]);

    const csv = taxReportToCsv(r);
    expect(csv).toContain("currency,invoiceCount,subtotal,tax,total");
    expect(csv).toContain("IDR,2,250.00,20.00,270.00");
  });
});

