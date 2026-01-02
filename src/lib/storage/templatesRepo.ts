import { v4 as uuidv4 } from "uuid";
import { invoiceTemplateSchema, type InvoiceTemplate, type TemplateBlock } from "@/lib/schema";

const STORAGE_KEY = "qbilling_templates_v1";

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

function readAll(): InvoiceTemplate[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<unknown[]>(localStorage.getItem(STORAGE_KEY)) ?? [];

  const templates: InvoiceTemplate[] = [];
  for (const item of parsed) {
    const res = invoiceTemplateSchema.safeParse(item);
    if (res.success) templates.push(res.data);
  }

  return templates.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function writeAll(templates: InvoiceTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  blocks?: TemplateBlock[];
}

export const templatesRepo = {
  list(): InvoiceTemplate[] {
    return readAll();
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getById(id: string): InvoiceTemplate | null {
    return readAll().find((t) => t.id === id) ?? null;
  },

  create(input: TemplateCreateInput): InvoiceTemplate {
    const templates = readAll();
    const createdAt = nowIso();

    const tpl: InvoiceTemplate = {
      id: uuidv4(),
      name: input.name.trim(),
      description: (input.description ?? "").trim(),
      createdAt,
      updatedAt: createdAt,
      page: {
        width: 794,
        height: 1123,
        background: "#ffffff",
      },
      blocks: input.blocks ?? [],
    };

    const parsed = invoiceTemplateSchema.parse(tpl);
    templates.unshift(parsed);
    writeAll(templates);
    return parsed;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: string, patch: Partial<Pick<InvoiceTemplate, "name" | "description" | "page" | "blocks">>): InvoiceTemplate {
    const templates = readAll();
    const idx = templates.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Template not found");

    const current = templates[idx];
    const next: InvoiceTemplate = {
      ...current,
      ...patch,
      name: (patch.name ?? current.name).trim(),
      description: (patch.description ?? current.description ?? "").trim(),
      updatedAt: nowIso(),
    };

    const parsed = invoiceTemplateSchema.parse(next);
    templates[idx] = parsed;
    writeAll(templates);
    return parsed;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  remove(id: string) {
    const templates = readAll().filter((t) => t.id !== id);
    writeAll(templates);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  seedDefaultsIfEmpty() {
    const templates = readAll();
    if (templates.length > 0) return;

    this.create({
      name: "Default - Modern",
      description: "A simple default layout",
      blocks: [
        { id: uuidv4(), type: "header", x: 0, y: 0, w: 12, h: 2, props: { title: "INVOICE" } },
        { id: uuidv4(), type: "merchant", x: 0, y: 2, w: 7, h: 3, props: {} },
        { id: uuidv4(), type: "qr", x: 7, y: 2, w: 5, h: 5, props: {} },
        { id: uuidv4(), type: "items", x: 0, y: 5, w: 12, h: 5, props: {} },
        { id: uuidv4(), type: "totals", x: 7, y: 10, w: 5, h: 2, props: {} },
        { id: uuidv4(), type: "note", x: 0, y: 10, w: 7, h: 2, props: {} },
        { id: uuidv4(), type: "footer", x: 0, y: 12, w: 12, h: 1, props: { text: "Thank you" } },
      ],
    });
  },
};

