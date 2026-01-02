"use client";

import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/features/invoices/InvoiceStatusBadge";
import type { Invoice } from "@/lib/schema";
import { calculateInvoiceTotals } from "@/lib/schema";
import { MoreVertical, Copy, Trash2, Pencil, BadgeDollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTemplates } from "@/hooks/useTemplates";
import { InvoiceTemplateRenderer } from "@/components/features/templates/InvoiceTemplateRenderer";
import { useExport } from "@/hooks/useExport";
import { toast } from "sonner";
import { batchZipName, safeFilename } from "@/lib/export/zip";
import { BatchExportPanel } from "@/components/features/invoices/BatchExportPanel";

export function InvoiceListTable({
  invoices,
  onDuplicate,
  onDelete,
  onMarkPaid,
}: {
  invoices: Invoice[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});
  const { templates } = useTemplates();

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return invoices;
    return invoices.filter((i) => {
      const merchant = i.data.merchantName?.toLowerCase() ?? "";
      return i.referenceId.toLowerCase().includes(needle) || merchant.includes(needle);
    });
  }, [q, invoices]);

  const selected = React.useMemo(() => filtered.filter((i) => selectedIds[i.id]), [filtered, selectedIds]);

  const selectAllFiltered = () => {
    const next: Record<string, boolean> = { ...selectedIds };
    for (const inv of filtered) next[inv.id] = true;
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds({});

  const toggleOne = (id: string) => {
    setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
  };

  const tplForInvoice = React.useCallback(
    (inv: Invoice) => {
      // For now: map preset templateId -> first template that contains that name, else first available.
      const byName = templates.find((t) => t.name.toLowerCase().includes(inv.data.templateId));
      return byName ?? templates[0] ?? null;
    },
    [templates]
  );

  return (
    <Card className="border-none bg-card/60 backdrop-blur-md shadow-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black">Invoices</CardTitle>
          <div className="text-xs text-muted-foreground">
            {selected.length > 0 ? `${selected.length} selected` : "Select invoices to batch export"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by invoice # or merchant"
            className="w-[280px] bg-background/50"
          />
          <Button variant="outline" className="rounded-full" onClick={selectAllFiltered} disabled={filtered.length === 0}>
            Select all
          </Button>
          <Button variant="outline" className="rounded-full" onClick={clearSelection} disabled={selected.length === 0}>
            Clear
          </Button>

          <BatchExportPanel selected={selected} elementIdPrefix="batch-export-" />

          <Button asChild className="rounded-full px-5 font-bold shadow-lg shadow-primary/20">
            <Link href="/invoices/new">New invoice</Link>
          </Button>
        </div>
      </CardHeader>

      {/* Hidden renderers for batch export */}
      <div className="fixed -left-[99999px] top-0" aria-hidden>
        {selected.map((inv) => {
          const tpl = tplForInvoice(inv);
          if (!tpl) return null;
          return (
            <InvoiceTemplateRenderer
              key={inv.id}
              id={`batch-export-${inv.id}`}
              data={inv.data}
              template={tpl}
            />
          );
        })}
      </div>

      <CardContent className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground py-12 text-center">No invoices yet.</div>
        ) : (
          <div className="divide-y divide-border/40 rounded-xl border border-border/40 overflow-hidden">
            {filtered.map((inv) => {
              const totals = calculateInvoiceTotals(inv.data);
              const checked = !!selectedIds[inv.id];

              return (
                <div key={inv.id} className="p-4 flex items-center justify-between gap-4 bg-background/20 hover:bg-background/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => toggleOne(inv.id)}
                      aria-label={`Select ${inv.referenceId}`}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <Link href={`/invoices/${inv.id}`} className="font-mono text-sm text-primary hover:underline">
                          {inv.referenceId}
                        </Link>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {inv.data.merchantName || "(no merchant)"} • Updated {new Date(inv.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-black">
                        {inv.data.currency} {totals.total.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Items: {inv.data.items?.length ?? 0}</div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${inv.id}/edit`} className="gap-2">
                            <Pencil className="w-4 h-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(inv.id)} className="gap-2">
                          <Copy className="w-4 h-4" /> Duplicate
                        </DropdownMenuItem>
                        {inv.status !== "paid" && (
                          <DropdownMenuItem onClick={() => onMarkPaid(inv.id)} className="gap-2">
                            <BadgeDollarSign className="w-4 h-4" /> Mark paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(inv.id)} className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

