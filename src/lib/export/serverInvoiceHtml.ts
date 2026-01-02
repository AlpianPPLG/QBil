import type { BillingData } from "@/lib/schema";
import { calculateInvoiceTotals } from "@/lib/schema";

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderInvoiceHtml(data: BillingData) {
  const totals = calculateInvoiceTotals(data);
  const items = data.items ?? [];

  const rows = items.length
    ? items
        .map(
          (it) => `
          <tr>
            <td>${esc(it.description)}</td>
            <td class="num">${it.quantity}</td>
            <td class="num">${it.price.toFixed(2)}</td>
            <td class="num">${(it.quantity * it.price).toFixed(2)}</td>
          </tr>`
        )
        .join("\n")
    : `
        <tr>
          <td>Adjustment / Custom Billing</td>
          <td class="num">1</td>
          <td class="num">${esc(data.amount)}</td>
          <td class="num">${esc(data.amount)}</td>
        </tr>`;

  const tax = totals.tax;
  const subtotal = totals.subtotal || Number(data.amount);
  const total = totals.total || Number(data.amount);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(data.referenceId || "Invoice")}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #111827; }
  .header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom: 18px; }
  .title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
  .meta { text-align:right; font-size: 12px; color: #6b7280; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
  .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
  .label { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
  .merchant { font-weight: 800; font-size: 16px; }
  .muted { color: #6b7280; font-size: 12px; white-space: pre-line; }
  table { width:100%; border-collapse: collapse; }
  thead th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color:#6b7280; text-align:left; border-bottom:1px solid #e5e7eb; padding: 8px 6px; }
  tbody td { padding: 8px 6px; border-bottom:1px solid #f3f4f6; font-size: 12px; }
  .num { text-align:right; font-variant-numeric: tabular-nums; }
  .totals { margin-top: 12px; display:flex; justify-content:flex-end; }
  .totals table { width: 320px; }
  .totals td { border: none; padding: 6px 0; }
  .grand { font-weight: 900; font-size: 14px; }
  .footer { margin-top: 18px; font-size: 10px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="header">
    <div class="title">INVOICE</div>
    <div class="meta">
      <div><b>Ref:</b> ${esc(data.referenceId)}</div>
      <div><b>Date:</b> ${esc(new Date().toLocaleDateString())}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">Merchant</div>
      <div class="merchant">${esc(data.merchantName || "-")}</div>
      <div class="muted">${esc(data.merchantAddress || "")}</div>
      <div class="muted">${esc(data.merchantEmail || "")}</div>
    </div>
    <div class="card">
      <div class="label">Payment</div>
      <div class="muted">Scan QR in app (client export includes QR). Server merged export intentionally omits QR for reliability.</div>
      <div class="muted"><b>Currency:</b> ${esc(data.currency)} · <b>Tax:</b> ${esc(String(data.taxRate ?? 0))}%</div>
    </div>
  </div>

  <div class="card">
    <div class="label">Items</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Price</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td class="muted">Subtotal</td><td class="num">${esc(data.currency)} ${subtotal.toFixed(2)}</td></tr>
        <tr><td class="muted">Tax (${esc(String(data.taxRate ?? 0))}%)</td><td class="num">${esc(data.currency)} ${tax.toFixed(2)}</td></tr>
        <tr><td class="grand">Grand Total</td><td class="num grand">${esc(data.currency)} ${total.toFixed(2)}</td></tr>
      </table>
    </div>
  </div>

  ${data.note ? `<div class="card" style="margin-top: 12px;"><div class="label">Note</div><div class="muted">${esc(data.note)}</div></div>` : ""}

  <div class="footer">Generated via QBilling · Merged PDF export</div>
</body>
</html>`;
}

