import { v4 as uuidv4 } from "uuid";
import { invoiceSchema, type Invoice, type InvoiceStatus, type BillingData } from "@/lib/schema";

const STORAGE_KEY = "qbilling_invoices_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function readAll(): Invoice[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<unknown[]>(localStorage.getItem(STORAGE_KEY)) ?? [];

  const invoices: Invoice[] = [];
  for (const item of parsed) {
    const res = invoiceSchema.safeParse(item);
    if (res.success) invoices.push(res.data);
  }

  return invoices.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function writeAll(invoices: Invoice[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

export interface InvoiceCreateInput {
  referenceId?: string;
  status?: InvoiceStatus;
  data: BillingData;
}

export const invoicesRepo = {
  list(): Invoice[] {
    return readAll();
  },

  getById(id: string): Invoice | null {
    return readAll().find((i) => i.id === id) ?? null;
  },

  create(input: InvoiceCreateInput): Invoice {
    const invoices = readAll();

    const id = uuidv4();
    const ref = (input.referenceId ?? input.data.referenceId ?? `INV-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(-6)}`).trim();

    // ensure referenceId uniqueness (soft rule)
    const collision = invoices.some((i) => i.referenceId === ref);
    const referenceId = collision ? `${ref}-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(-4)}` : ref;

    const createdAt = nowIso();
    const invoice: Invoice = {
      id,
      referenceId,
      status: input.status ?? "draft",
      createdAt,
      updatedAt: createdAt,
      data: {
        ...input.data,
        referenceId,
      },
    };

    invoices.unshift(invoice);
    writeAll(invoices);
    return invoice;
  },

  update(id: string, patch: Partial<Pick<Invoice, "status" | "referenceId" | "data">>): Invoice {
    const invoices = readAll();
    const idx = invoices.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Invoice not found");

    const current = invoices[idx];
    const updatedAt = nowIso();

    const referenceId = (patch.referenceId ?? patch.data?.referenceId ?? current.referenceId).trim();

    const next: Invoice = {
      ...current,
      ...patch,
      referenceId,
      updatedAt,
      data: {
        ...(patch.data ?? current.data),
        referenceId,
      },
    };

    // validate shape before writing (guards against corrupt saves)
    const parsed = invoiceSchema.parse(next);

    invoices[idx] = parsed;
    writeAll(invoices);
    return parsed;
  },

  remove(id: string) {
    const invoices = readAll().filter((i) => i.id !== id);
    writeAll(invoices);
  },

  duplicate(id: string): Invoice {
    const original = this.getById(id);
    if (!original) throw new Error("Invoice not found");

    const data: BillingData = {
      ...original.data,
      referenceId: `${original.referenceId}-COPY`,
    };

    return this.create({
      data,
      status: "draft",
      referenceId: data.referenceId,
    });
  },
};
