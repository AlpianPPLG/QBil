import * as z from "zod";

// -----------------
// Billing
// -----------------

export interface BillingItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
}

export interface BillingData {
    merchantName: string;
    merchantAddress: string;
    merchantEmail: string;
    amount: string;
    currency: string;
    referenceId: string;
    note: string;
    qrColor: string;
    backgroundColor: string;
    errorCorrectionLevel: "L" | "M" | "Q" | "H";
    logoUrl: string;
    standard: "generic" | "epc" | "swiss" | "upi";
    taxRate: number;
    items: BillingItem[];
    templateId: "modern" | "classic" | "minimal" | "bold";
}

export const billingSchema = z.object({
    merchantName: z.string().min(2, "Merchant name is required"),
    merchantAddress: z.string().default(""),
    merchantEmail: z.string().email("Invalid email").or(z.literal("")),
    amount: z.string().default("0.00"),
    currency: z.string().min(1, "Currency is required"),
    referenceId: z.string().min(1, "Reference ID is required"),
    note: z.string().default(""),
    qrColor: z.string().default("#000000"),
    backgroundColor: z.string().default("#ffffff"),
    errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).default("M"),
    logoUrl: z.string().default(""),
    standard: z.enum(["generic", "epc", "swiss", "upi"]).default("generic"),
    taxRate: z.number().min(0).max(100).default(0),
    items: z.array(z.object({
        id: z.string(),
        description: z.string().min(1, "Required"),
        quantity: z.number().min(1),
        price: z.number().min(0),
    })).default([]),
    templateId: z.enum(["modern", "classic", "minimal", "bold"]).default("modern"),
});

export const invoiceStatusSchema = z.enum(["draft", "sent", "paid", "void"]);

export const invoiceSchema = z.object({
    id: z.string().min(1),
    referenceId: z.string().min(1),
    status: invoiceStatusSchema.default("draft"),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    data: billingSchema,
});

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;

export function calculateInvoiceTotals(data: BillingData) {
    const subtotal = (data.items ?? []).reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * ((data.taxRate ?? 0) / 100);
    const total = subtotal + tax;
    return {
        subtotal,
        tax,
        total,
    };
}

// -----------------
// Template Builder
// -----------------

export const templateBlockTypeSchema = z.enum([
  "header",
  "merchant",
  "items",
  "totals",
  "qr",
  "note",
  "footer",
  "text",
]);

export const templateBlockSchema = z.object({
  id: z.string().min(1),
  type: templateBlockTypeSchema,
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
  // Builder metadata (optional-but-defaulted for backwards compatibility)
  name: z.string().default(""),
  order: z.number().int().min(0).default(0),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
});

export const invoiceTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  page: z.object({
    width: z.number().min(1).default(794), // ~A4 @ 96dpi
    height: z.number().min(1).default(1123),
    background: z.string().default("#ffffff"),
  }),
  blocks: z.array(templateBlockSchema).default([]),
  // Optional sample data used by Template Builder preview.
  // Kept optional for backward compatibility with existing localStorage data.
  previewData: billingSchema.optional(),
});

export type TemplateBlockType = z.infer<typeof templateBlockTypeSchema>;
export type TemplateBlock = z.infer<typeof templateBlockSchema>;
export type InvoiceTemplate = z.infer<typeof invoiceTemplateSchema>;

// -----------------
// Reports
// -----------------

export const reportQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  currency: z.string().optional(),
  status: invoiceStatusSchema.optional(),
});

export const taxReportSchema = z.object({
  query: reportQuerySchema,
  currency: z.string(),
  invoiceCount: z.number().int().min(0),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  byRate: z.array(z.object({
    taxRate: z.number().min(0).max(100),
    invoiceCount: z.number().int().min(0),
    subtotal: z.number().min(0),
    tax: z.number().min(0),
    total: z.number().min(0),
  })).default([]),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type TaxReport = z.infer<typeof taxReportSchema>;

