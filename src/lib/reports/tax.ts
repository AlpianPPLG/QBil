import type { Invoice, ReportQuery, TaxReport } from "@/lib/schema";
import { calculateInvoiceTotals } from "@/lib/schema";

function withinRange(iso: string, from?: string, to?: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (from) {
    const f = new Date(from).getTime();
    if (!Number.isNaN(f) && t < f) return false;
  }
  if (to) {
    const tt = new Date(to).getTime();
    if (!Number.isNaN(tt) && t > tt) return false;
  }
  return true;
}

export function filterInvoicesForReport(invoices: Invoice[], query: ReportQuery): Invoice[] {
  return invoices.filter((inv) => {
    if (query.status && inv.status !== query.status) return false;
    if (query.currency && inv.data.currency !== query.currency) return false;
    // Prefer invoice updatedAt for reporting, fallback to createdAt
    const dateIso = inv.updatedAt || inv.createdAt;
    if (query.from || query.to) {
      if (!withinRange(dateIso, query.from, query.to)) return false;
    }

    return true;
  });
}

export function buildTaxReport(invoices: Invoice[], query: ReportQuery): TaxReport[] {
  const filtered = filterInvoicesForReport(invoices, query);

  // Group by currency
  const byCurrency = new Map<string, Invoice[]>();
  for (const inv of filtered) {
    const c = inv.data.currency;
    byCurrency.set(c, [...(byCurrency.get(c) ?? []), inv]);
  }

  const results: TaxReport[] = [];

  for (const [currency, list] of byCurrency.entries()) {
    let subtotal = 0;
    let tax = 0;
    let total = 0;

    const byRateMap = new Map<number, { invoiceCount: number; subtotal: number; tax: number; total: number }>();

    for (const inv of list) {
      const t = calculateInvoiceTotals(inv.data);
      subtotal += t.subtotal;
      tax += t.tax;
      total += t.total;

      const rate = inv.data.taxRate ?? 0;
      const prev = byRateMap.get(rate) ?? { invoiceCount: 0, subtotal: 0, tax: 0, total: 0 };
      byRateMap.set(rate, {
        invoiceCount: prev.invoiceCount + 1,
        subtotal: prev.subtotal + t.subtotal,
        tax: prev.tax + t.tax,
        total: prev.total + t.total,
      });
    }

    const byRate = [...byRateMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([taxRate, agg]) => ({ taxRate, ...agg }));

    results.push({
      query,
      currency,
      invoiceCount: list.length,
      subtotal,
      tax,
      total,
      byRate,
    });
  }

  return results.sort((a, b) => a.currency.localeCompare(b.currency));
}

export function taxReportToCsv(reports: TaxReport[]): string {
  const lines: string[] = [];
  lines.push(["currency", "invoiceCount", "subtotal", "tax", "total"].join(","));
  for (const r of reports) {
    lines.push([
      r.currency,
      String(r.invoiceCount),
      r.subtotal.toFixed(2),
      r.tax.toFixed(2),
      r.total.toFixed(2),
    ].join(","));
  }
  return lines.join("\n") + "\n";
}
