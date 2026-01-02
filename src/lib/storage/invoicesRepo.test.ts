import { describe, it, expect, beforeEach } from "vitest";
import { invoicesRepo } from "@/lib/storage/invoicesRepo";
import type { BillingData } from "@/lib/schema";

function mockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

const base: BillingData = {
  merchantName: "Acme",
  merchantAddress: "",
  merchantEmail: "",
  amount: "0.00",
  currency: "USD",
  referenceId: "INV-1",
  note: "",
  qrColor: "#000000",
  backgroundColor: "#ffffff",
  errorCorrectionLevel: "M",
  logoUrl: "",
  standard: "generic",
  taxRate: 0,
  items: [],
  templateId: "modern",
};

describe("invoicesRepo", () => {
  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = globalThis.window ?? {};
    (globalThis as unknown as { localStorage: Storage }).localStorage = mockLocalStorage() as unknown as Storage;
  });

  it("creates and lists invoices", () => {
    const inv = invoicesRepo.create({ data: base });
    const list = invoicesRepo.list();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(inv.id);
    expect(list[0].referenceId).toBe("INV-1");
  });

  it("updates invoice and keeps referenceId in data", () => {
    const inv = invoicesRepo.create({ data: base });
    const updated = invoicesRepo.update(inv.id, { referenceId: "INV-2" });
    expect(updated.referenceId).toBe("INV-2");
    expect(updated.data.referenceId).toBe("INV-2");
  });

  it("duplicates invoice with a new id", () => {
    const inv = invoicesRepo.create({ data: base });
    const dup = invoicesRepo.duplicate(inv.id);
    expect(dup.id).not.toBe(inv.id);
    expect(dup.referenceId).toContain("COPY");
  });
});
