"use client";

import * as React from "react";
import type { BillingData, InvoiceTemplate, TemplateBlock } from "@/lib/schema";
import { calculateInvoiceTotals } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

const GRID_COLS = 12;

function blockToStyle(page: InvoiceTemplate["page"], b: TemplateBlock) {
  // Treat template grid as 12 columns. Height uses "row" units mapped to a baseline.
  // We keep this stable for export (html2canvas) by using absolute px.
  const colW = page.width / GRID_COLS;
  const rowH = 64; // px per grid row (tunable)
  return {
    left: b.x * colW,
    top: b.y * rowH,
    width: b.w * colW,
    height: b.h * rowH,
  } as React.CSSProperties;
}

function money(currency: string, value: number) {
  return `${currency} ${value.toFixed(2)}`;
}

function buildQrValue(data: BillingData) {
  const { merchantName, merchantEmail, amount, currency, referenceId, note, standard } = data;

  switch (standard) {
    case "epc":
      return `BCD\n002\n1\nSCT\n\n${merchantName}\n\n${currency}${amount}\n\n${referenceId}\n${note}`;
    case "upi":
      return `upi://pay?pa=${merchantEmail || "merchant@upi"}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
    case "swiss":
      return `SPC\n0200\n1\n\n\n${merchantName}\n\n\n\n\n${amount}\n${currency}\n\n${referenceId}\n\n${note}`;
    default:
      return JSON.stringify({
        merchant: merchantName,
        amount,
        currencyCode: currency,
        invoice: referenceId,
        memo: note,
        v: "1.0",
      });
  }
}

export interface InvoiceTemplateRendererProps {
  id?: string;
  className?: string;
  data: BillingData;
  template: InvoiceTemplate;
  showSafeArea?: boolean;
}

export function InvoiceTemplateRenderer({
  id,
  className,
  data,
  template,
  showSafeArea,
}: InvoiceTemplateRendererProps) {
  const totals = React.useMemo(() => calculateInvoiceTotals(data), [data]);
  const qrValue = React.useMemo(() => buildQrValue(data), [data]);

  return (
    <div
      id={id}
      className={cn("relative", className)}
      style={{
        width: template.page.width,
        height: template.page.height,
        background: template.page.background,
        color: "#111827",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      {showSafeArea && (
        <div
          className="absolute inset-8 border border-dashed border-border/60 pointer-events-none"
          aria-hidden
        />
      )}

      {template.blocks.map((b) => {
        const baseStyle = blockToStyle(template.page, b);
        return (
          <div
            key={b.id}
            className="absolute overflow-hidden"
            style={baseStyle}
            data-block-type={b.type}
          >
            <BlockRenderer block={b} data={data} qrValue={qrValue} totals={totals} />
          </div>
        );
      })}
    </div>
  );
}

function BlockShell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="h-full w-full rounded-xl border border-zinc-200 bg-white/90 p-4">
      {title ? <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">{title}</div> : null}
      {children}
    </div>
  );
}

function BlockRenderer({
  block,
  data,
  qrValue,
  totals,
}: {
  block: TemplateBlock;
  data: BillingData;
  qrValue: string;
  totals: { subtotal: number; tax: number; total: number };
}) {
  switch (block.type) {
    case "header": {
      const title = typeof block.props?.title === "string" ? block.props.title : "INVOICE";
      return (
        <div className="h-full w-full flex items-center">
          <div className="text-4xl font-black tracking-tight">{title}</div>
          <div className="ml-auto text-right">
            <div className="text-xs text-zinc-500">Ref</div>
            <div className="font-mono font-bold">{data.referenceId}</div>
          </div>
        </div>
      );
    }

    case "merchant":
      return (
        <BlockShell title="Merchant">
          <div className="font-black text-lg leading-tight">{data.merchantName || "-"}</div>
          <div className="text-sm text-zinc-600 whitespace-pre-line">{data.merchantAddress || ""}</div>
          <div className="text-sm text-zinc-600">{data.merchantEmail || ""}</div>
        </BlockShell>
      );

    case "items":
      return (
        <BlockShell title="Items">
          <div className="grid grid-cols-12 text-xs font-black text-zinc-500 pb-2 border-b border-zinc-100">
            <div className="col-span-7">DESCRIPTION</div>
            <div className="col-span-2 text-right">QTY</div>
            <div className="col-span-3 text-right">TOTAL</div>
          </div>
          <div className="mt-2 space-y-2">
            {(data.items?.length ?? 0) === 0 ? (
              <div className="text-sm text-zinc-700">Adjustment / Custom Billing</div>
            ) : (
              data.items.map((it) => (
                <div key={it.id} className="grid grid-cols-12 text-sm">
                  <div className="col-span-7 truncate">{it.description}</div>
                  <div className="col-span-2 text-right font-mono">{it.quantity}</div>
                  <div className="col-span-3 text-right font-mono">
                    {money(data.currency, it.quantity * it.price)}
                  </div>
                </div>
              ))
            )}
          </div>
        </BlockShell>
      );

    case "totals":
      return (
        <BlockShell title="Totals">
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-mono">{money(data.currency, totals.subtotal || Number(data.amount))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Tax ({data.taxRate}%)</span>
              <span className="font-mono">{money(data.currency, totals.tax)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="font-black">Total</span>
              <span className="font-mono font-black">{money(data.currency, totals.total || Number(data.amount))}</span>
            </div>
          </div>
        </BlockShell>
      );

    case "qr":
      return (
        <BlockShell title="Pay">
          <div className="flex items-center justify-center h-full">
            <div className="rounded-2xl p-4" style={{ backgroundColor: data.backgroundColor }}>
              <QRCodeSVG
                value={qrValue}
                size={200}
                fgColor={data.qrColor}
                bgColor={data.backgroundColor}
                level={data.errorCorrectionLevel}
              />
            </div>
          </div>
        </BlockShell>
      );

    case "note":
      return (
        <BlockShell title="Note">
          <div className="text-sm text-zinc-700 whitespace-pre-line">{data.note || ""}</div>
        </BlockShell>
      );

    case "footer": {
      const text = typeof block.props?.text === "string" ? block.props.text : "Generated via QBilling";
      return (
        <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
          {text}
        </div>
      );
    }

    case "text": {
      const text = typeof block.props?.text === "string" ? block.props.text : "";
      return <BlockShell>{text}</BlockShell>;
    }

    default:
      return <BlockShell title={block.type}>Unsupported block</BlockShell>;
  }
}
