export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QRSettings {
    color: string;
    backgroundColor: string;
    errorCorrectionLevel: ErrorCorrectionLevel;
    logo?: string;
}

export interface BillingInvoiceData {
    merchantName: string;
    amount: string;
    currency: string;
    referenceId: string;
    note?: string;
    date: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export interface Invoice {
    id: string;
    referenceId: string;
    status: InvoiceStatus;
    createdAt: string; // ISO
    updatedAt: string; // ISO
    data: import("@/lib/schema").BillingData;
}
