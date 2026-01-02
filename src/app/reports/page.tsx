"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Receipt, RefreshCcw } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { buildTaxReport, taxReportToCsv } from "@/lib/reports/tax";
import type { ReportQuery } from "@/lib/schema";

export default function ReportsPage() {
  const { invoices } = useInvoices();

  const [query, setQuery] = React.useState<ReportQuery>({});

  const reports = React.useMemo(() => buildTaxReport(invoices, query), [invoices, query]);

  const downloadCsv = () => {
    const csv = taxReportToCsv(reports);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            REPORTS <span className="text-primary">& EXPORT</span>
          </h1>
          <p className="text-muted-foreground">
            Generate tax summaries, export CSV, and prepare batch PDF exports (coming next).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={downloadCsv} disabled={reports.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Tax Report Filters
          </CardTitle>
          <CardDescription>Filter by date range, currency, and invoice status.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>From (ISO)</Label>
            <Input
              placeholder="2026-01-01T00:00:00.000Z"
              value={query.from ?? ""}
              onChange={(e) => setQuery((q) => ({ ...q, from: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label>To (ISO)</Label>
            <Input
              placeholder="2026-12-31T23:59:59.999Z"
              value={query.to ?? ""}
              onChange={(e) => setQuery((q) => ({ ...q, to: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={query.status ?? "all"}
              onValueChange={(v) =>
                setQuery((q) => ({
                  ...q,
                  status: v === "all" ? undefined : (v as ReportQuery["status"]),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input
              placeholder="IDR / USD / EUR"
              value={query.currency ?? ""}
              onChange={(e) => setQuery((q) => ({ ...q, currency: e.target.value || undefined }))}
            />
          </div>

          <div className="md:col-span-4 flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setQuery({})}
              className="rounded-xl"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Badge variant="outline" className="ml-auto self-center border-dashed">
              {invoices.length} invoices loaded
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.length === 0 ? (
          <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                No data
              </CardTitle>
              <CardDescription>
                Create some invoices first, then come back to generate a tax report.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          reports.map((r) => (
            <Card key={r.currency} className="border-none bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="rounded-full">{r.currency}</Badge>
                  Tax Summary
                </CardTitle>
                <CardDescription>{r.invoiceCount} invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Subtotal" value={r.subtotal.toFixed(2)} />
                <Row label="Tax" value={r.tax.toFixed(2)} />
                <Row label="Total" value={r.total.toFixed(2)} />

                <div className="pt-4 border-t border-border/40 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">By tax rate</div>
                  {r.byRate.map((x) => (
                    <div key={x.taxRate} className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{x.taxRate}%</span>
                      <span className="text-muted-foreground">{x.invoiceCount} inv · {x.tax.toFixed(2)} tax</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-muted/20 border border-dashed border-border/60">
        <CardHeader>
          <CardTitle>Next up: Batch PDF</CardTitle>
          <CardDescription>
            I’ll add invoice selection + batch PDF generation (merged PDF or ZIP) using the existing jsPDF pipeline.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}
