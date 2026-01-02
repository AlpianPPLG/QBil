"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { Rnd } from "react-rnd";
import { useRouter, useSearchParams } from "next/navigation";
import { useTemplates } from "@/hooks/useTemplates";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, LayoutGrid, Save } from "lucide-react";
import type { BillingData, TemplateBlock, TemplateBlockType } from "@/lib/schema";
import { InvoiceTemplateRenderer } from "@/components/features/templates/InvoiceTemplateRenderer";
import { Palette } from "@/components/features/templates/builder/Palette";
import { LayersPanel } from "@/components/features/templates/builder/LayersPanel";
import { AlignmentGuidesOverlay } from "@/components/features/templates/builder/AlignmentGuidesOverlay";
import { alignToPageCenter, type Guide } from "@/lib/templates/alignment";
import {
  clearSelection,
  ensureSingleSelection,
  nextSelectionFromClick,
  reorderBlocksById,
  selectedIds as selectedIdsFromMap,
  type SelectedMap,
} from "@/lib/templates/selection";

// v2: pixel-based A4 canvas (matches schema default ~A4 @ 96dpi)
const PAGE_W = 794;
const PAGE_H = 1123;
const GRID = 16; // px snap

let __idCounter = 0;
function makeClientId() {
  __idCounter += 1;
  return `blk_${Date.now()}_${__idCounter}`;
}

function snap(n: number) {
  return Math.max(0, Math.round(n / GRID) * GRID);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TemplateBuilderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-6 lg:p-12">
          <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle>Loading builder…</CardTitle>
              <CardDescription>Preparing templates and canvas.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <TemplateBuilderInner />
    </React.Suspense>
  );
}

function TemplateBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [guides, setGuides] = React.useState<Guide[]>([]);
  const clearGuides = React.useCallback(() => setGuides([]), []);

  const { templates, createTemplate, updateTemplate } = useTemplates();
  const { invoices } = useInvoices();
  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  const [name, setName] = React.useState("");

  // Multi-selection model:
  // - selected: map of selected ids
  // - activeId: the primary/last-selected id (used for inspector)
  // - anchorId: shift-range anchor
  const [selected, setSelected] = React.useState<SelectedMap>({});
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [anchorId, setAnchorId] = React.useState<string | null>(null);

  const [mode, setMode] = React.useState<"design" | "preview">("design");

  const defaultPreviewData = React.useMemo<BillingData>(
    () => ({
      merchantName: "QBilling Demo Store",
      merchantAddress: "Jl. Contoh No. 123\nJakarta, Indonesia",
      merchantEmail: "billing@qbilling.local",
      amount: "150000.00",
      currency: "IDR",
      referenceId: "INV-DEMO-2026-0001",
      note: "Terima kasih sudah berbelanja.\nPembayaran maksimal 7 hari.",
      qrColor: "#111827",
      backgroundColor: "#ffffff",
      errorCorrectionLevel: "M",
      logoUrl: "",
      standard: "generic",
      taxRate: 11,
      items: [
        { id: "i1", description: "Service A", quantity: 1, price: 100000 },
        { id: "i2", description: "Service B", quantity: 1, price: 50000 },
      ],
      templateId: "modern",
    }),
    []
  );

  // Invoice selected as preview source (optional)
  const [previewInvoiceId, setPreviewInvoiceId] = React.useState<string>("");

  const invoicePreviewData = React.useMemo(() => {
    if (!previewInvoiceId) return null;
    const inv = invoices.find((i) => i.id === previewInvoiceId);
    return inv?.data ?? null;
  }, [invoices, previewInvoiceId]);

  const [previewData, setPreviewData] = React.useState<BillingData>(() => defaultPreviewData);

  // When template changes, hydrate previewData from template.previewData (if any).
  // Also reset invoice override.
  React.useEffect(() => {
    setName(template?.name ?? "");
    setSelected(clearSelection());
    setActiveId(null);
    setAnchorId(null);
    setPreviewInvoiceId("");

    if (!template) {
      setPreviewData(defaultPreviewData);
      return;
    }

    setPreviewData(template.previewData ?? defaultPreviewData);
  }, [template, defaultPreviewData]);

  // If an invoice is selected for preview, override previewData using that invoice.
  React.useEffect(() => {
    if (invoicePreviewData) {
      setPreviewData(invoicePreviewData);
    } else if (template) {
      setPreviewData(template.previewData ?? defaultPreviewData);
    }
  }, [invoicePreviewData, template, defaultPreviewData]);

  const previewSubtotal = React.useMemo(() => {
    return (previewData.items ?? []).reduce((acc, it) => acc + it.price * it.quantity, 0);
  }, [previewData.items]);

  React.useEffect(() => {
    // Keep legacy amount field roughly in sync with items for nicer totals.
    setPreviewData((d) => ({ ...d, amount: String(previewSubtotal.toFixed(2)) }));
  }, [previewSubtotal]);

  const persistTemplatePreviewData = React.useCallback(
    (next: BillingData | ((prev: BillingData) => BillingData)) => {
      if (!template) return;

      // If preview is coming from an invoice selection, we don't persist edits to template data
      // to avoid surprising overwrites.
      if (previewInvoiceId) {
        setPreviewData(next as never);
        return;
      }

      setPreviewData((prev) => {
        const resolved = typeof next === "function" ? (next as (p: BillingData) => BillingData)(prev) : next;
        updateTemplate(template.id, { previewData: resolved });
        return resolved;
      });
    },
    [template, updateTemplate, previewInvoiceId]
  );

  const updatePreviewItem = (id: string, patch: Partial<{ description: string; quantity: number; price: number }>) => {
    persistTemplatePreviewData((d) => ({
      ...d,
      items: (d.items ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const addPreviewItem = () => {
    persistTemplatePreviewData((d) => {
      const idx = (d.items?.length ?? 0) + 1;
      const next = [...(d.items ?? []), { id: `i${Date.now()}`, description: `Item ${idx}`, quantity: 1, price: 0 }];
      return { ...d, items: next };
    });
  };

  const removePreviewItem = (id: string) => {
    persistTemplatePreviewData((d) => ({ ...d, items: (d.items ?? []).filter((it) => it.id !== id) }));
  };

  const blocks = React.useMemo(() => {
    return (template?.blocks ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [template?.blocks]);

  const orderedLayerIds = React.useMemo(() => {
    // LayersPanel renders reverse() so topmost is first; for shift-range we use that same order.
    return blocks
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .reverse()
      .map((b) => b.id);
  }, [blocks]);

  const selectedIds = React.useMemo(() => selectedIdsFromMap(selected), [selected]);

  const activeBlock = blocks.find((b) => b.id === activeId) ?? null;

  const canvasDragSnapshot = React.useRef<Record<string, { x: number; y: number }>>({});

  const shouldIgnoreGlobalShortcut = React.useCallback(() => {
    const el = globalThis.document?.activeElement as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el.isContentEditable) return true;
    return false;
  }, []);

  const getPropString = React.useCallback((props: unknown, key: string) => {
    if (!props || typeof props !== "object") return "";
    const v = (props as Record<string, unknown>)[key];
    return typeof v === "string" ? v : "";
  }, []);

  const setSingleSelection = React.useCallback(
    (id: string | null) => {
      if (!id) {
        setSelected(clearSelection());
        setActiveId(null);
        setAnchorId(null);
        return;
      }

      setSelected(ensureSingleSelection(id));
      setActiveId(id);
      setAnchorId(id);
    },
    []
  );

  const handlePanelSelectMeta = React.useCallback(
    (input: { id: string; metaKey: boolean; shiftKey: boolean }) => {
      const mode = input.shiftKey ? "range" : input.metaKey ? "toggle" : "single";
      const res = nextSelectionFromClick({
        orderedIds: orderedLayerIds,
        current: selected,
        anchorId,
        targetId: input.id,
        mode,
      });
      setSelected(res.selected);
      setActiveId(input.id);
      setAnchorId(res.anchorId);
    },
    [anchorId, orderedLayerIds, selected]
  );

  const renameBlock = React.useCallback(
    (id: string, nextName: string) => {
      const trimmed = nextName.trim();
      updateBlock(id, { name: trimmed });
    },
    // updateBlock is stable enough for our usage - it changes only if template changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [template?.id, blocks]
  );

  const duplicateBlocks = React.useCallback(
    (ids: string[]) => {
      if (!template) return;
      if (ids.length === 0) return;

      const idSet = new Set(ids);
      const toCopy = blocks.filter((b) => idSet.has(b.id));
      if (toCopy.length === 0) return;

      const maxOrder = blocks.reduce((m, b) => Math.max(m, b.order ?? 0), 0);

      // Keep relative stacking by duplicating in ascending order and giving new orders after current max.
      const sortedCopy = toCopy.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      let orderCounter = maxOrder;
      const clones: TemplateBlock[] = sortedCopy.map((b) => {
        orderCounter += 1;
        const id = globalThis.crypto?.randomUUID?.() ?? makeClientId();
        return {
          ...b,
          id,
          name: b.name ? `${b.name} (copy)` : "(copy)",
          x: clamp(snap(b.x + GRID), 0, PAGE_W - b.w),
          y: clamp(snap(b.y + GRID), 0, PAGE_H - b.h),
          order: orderCounter,
          locked: false,
          hidden: false,
        };
      });

      const next = [...blocks, ...clones];
      updateTemplate(template.id, { blocks: next });

      // Select duplicated set (makes it easy to move them right away)
      const nextSelected: SelectedMap = {};
      clones.forEach((c) => {
        nextSelected[c.id] = true;
      });
      setSelected(nextSelected);
      setActiveId(clones[clones.length - 1]?.id ?? null);
      setAnchorId(clones[0]?.id ?? null);
    },
    [blocks, template, updateTemplate]
  );

  const deleteSelected = React.useCallback(() => {
    if (!template) return;
    if (selectedIds.length === 0) return;

    const idSet = new Set(selectedIds);
    const next = blocks.filter((b) => !idSet.has(b.id));
    updateTemplate(template.id, { blocks: next });
    setSingleSelection(null);
  }, [blocks, selectedIds, setSingleSelection, template, updateTemplate]);

  const getMetaKeyFromMouseEvent = React.useCallback((ev: MouseEvent) => {
    // MouseEvent has metaKey in browsers, but keep it defensive for non-standard event shapes.
    const maybe = ev as unknown;
    const metaKey = typeof maybe === "object" && maybe !== null && "metaKey" in maybe ? Boolean((maybe as { metaKey?: unknown }).metaKey) : false;
    return metaKey || ev.ctrlKey;
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreGlobalShortcut()) return;

      const meta = e.metaKey || e.ctrlKey;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (meta && (e.key === "d" || e.key === "D") && selectedIds.length > 0) {
        e.preventDefault();
        duplicateBlocks(selectedIds);
        return;
      }

      if (meta && (e.key === "a" || e.key === "A") && blocks.length > 0) {
        e.preventDefault();
        const next: SelectedMap = {};
        blocks.forEach((b) => {
          next[b.id] = true;
        });
        setSelected(next);
        setActiveId(blocks[blocks.length - 1]?.id ?? null);
        setAnchorId(blocks[blocks.length - 1]?.id ?? null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [blocks, deleteSelected, duplicateBlocks, selectedIds, shouldIgnoreGlobalShortcut]);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle>Loading builder…</CardTitle>
            <CardDescription>Preparing templates and canvas.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const saveName = () => {
    if (!template) return;
    updateTemplate(template.id, { name });
  };

  const addBlock = (type: TemplateBlockType, at?: { x: number; y: number }) => {
    if (!template) return;
    const id = globalThis.crypto?.randomUUID?.() ?? makeClientId();

    // default size by type
    const defaults: Record<TemplateBlockType, { w: number; h: number; props?: Record<string, unknown> }> = {
      header: { w: 760, h: 80, props: { title: "INVOICE" } },
      merchant: { w: 420, h: 160 },
      items: { w: 760, h: 360 },
      totals: { w: 300, h: 160 },
      qr: { w: 260, h: 260 },
      note: { w: 420, h: 120 },
      footer: { w: 760, h: 60, props: { text: "Thank you" } },
      text: { w: 300, h: 100, props: { text: "Text" } },
    };

    const d = defaults[type];
    const maxOrder = blocks.reduce((m, b) => Math.max(m, b.order ?? 0), 0);

    const next: TemplateBlock[] = [
      ...blocks,
      {
        id,
        type,
        x: clamp(snap(at?.x ?? 16), 0, PAGE_W - d.w),
        y: clamp(snap(at?.y ?? 16), 0, PAGE_H - d.h),
        w: d.w,
        h: d.h,
        props: d.props ?? {},
        name: "",
        order: maxOrder + 1,
        locked: false,
        hidden: false,
      },
    ];

    updateTemplate(template.id, { blocks: next });
    setActiveId(id);
  };

  const updateBlock = (id: string, patch: Partial<Pick<TemplateBlock, "x" | "y" | "w" | "h" | "props" | "name" | "order" | "locked" | "hidden">>) => {
    if (!template) return;
    const next = blocks.map((b) => (b.id === id ? { ...b, ...patch, props: patch.props ?? b.props } : b));
    updateTemplate(template.id, { blocks: next });
  };

  const moveLayer = (id: string, dir: "up" | "down") => {
    if (!template) return;
    const sorted = blocks.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((b) => b.id === id);
    if (idx === -1) return;

    const swapWith = dir === "up" ? idx + 1 : idx - 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapWith];
    const next = sorted.map((blk) => {
      if (blk.id === a.id) return { ...blk, order: b.order ?? 0 };
      if (blk.id === b.id) return { ...blk, order: a.order ?? 0 };
      return blk;
    });

    updateTemplate(template.id, { blocks: next });
  };

  const toggleLock = (id: string) => {
    const blk = blocks.find((b) => b.id === id);
    if (!blk) return;
    updateBlock(id, { locked: !blk.locked });
  };

  const toggleHidden = (id: string) => {
    const blk = blocks.find((b) => b.id === id);
    if (!blk) return;
    updateBlock(id, { hidden: !blk.hidden });
  };

  // (moved selection/duplicate callbacks above early returns)

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">TEMPLATE <span className="text-primary">BUILDER</span></h1>
          <p className="text-muted-foreground">Drag blocks, resize them, and snap to a print-safe grid (v2).</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mode === "design" ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setMode("design")}
          >
            Design
          </Button>
          <Button
            variant={mode === "preview" ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setMode("preview")}
          >
            Preview
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              const tpl = createTemplate(`New Template ${templates.length + 1}`);
              router.replace(`/templates/builder?id=${tpl.id}`);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {!template ? (
        <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle>No templates</CardTitle>
            <CardDescription>Create one to start.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-4 border-none bg-card/40 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-primary" /> Template</CardTitle>
              <CardDescription>Add blocks and edit selected block.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</div>
                <div className="flex gap-2">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                  <Button onClick={saveName} className="rounded-xl">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">ID: <span className="font-mono">{template.id}</span></div>
              </div>

              <Separator />

              <Palette />

              <Separator />

              <LayersPanel
                blocks={blocks}
                selectedId={activeId}
                selectedIds={selected}
                onSelectAction={(id) => setSingleSelection(id)}
                onSelectWithMetaAction={handlePanelSelectMeta}
                onMoveAction={moveLayer}
                onToggleLockAction={toggleLock}
                onToggleHiddenAction={toggleHidden}
                onRenameAction={renameBlock}
                onDuplicateAction={(id) => duplicateBlocks([id])}
                onDuplicateSelectedAction={() => duplicateBlocks(selectedIds)}
                onReorderAction={({ fromId, toId }) => {
                  if (!template) return;
                  const next = reorderBlocksById({ blocks, fromId, toId });
                  updateTemplate(template.id, { blocks: next });
                }}
              />

              <Separator />

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add block (click)</div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    "header",
                    "merchant",
                    "items",
                    "totals",
                    "qr",
                    "note",
                    "footer",
                    "text",
                  ] as TemplateBlockType[]).map((t) => (
                    <Button key={t} variant="secondary" className="justify-start" onClick={() => addBlock(t)}>
                      + {t}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Selected</div>
                {activeBlock ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge>{activeBlock.type}</Badge>
                      <span className="font-mono text-xs text-muted-foreground truncate">{activeBlock.id}</span>
                      {selectedIds.length > 1 ? (
                        <span className="text-[10px] text-muted-foreground">({selectedIds.length} selected)</span>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">x</div>
                        <Input
                          value={String(activeBlock.x)}
                          onChange={(e) => updateBlock(activeBlock.id, { x: snap(Number(e.target.value) || 0) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">y</div>
                        <Input
                          value={String(activeBlock.y)}
                          onChange={(e) => updateBlock(activeBlock.id, { y: snap(Number(e.target.value) || 0) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">w</div>
                        <Input
                          value={String(activeBlock.w)}
                          onChange={(e) => updateBlock(activeBlock.id, { w: snap(Number(e.target.value) || GRID) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">h</div>
                        <Input
                          value={String(activeBlock.h)}
                          onChange={(e) => updateBlock(activeBlock.id, { h: snap(Number(e.target.value) || GRID) })}
                        />
                      </div>
                    </div>

                    {activeBlock.type === "header" && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">title</div>
                        <Input
                          value={getPropString(activeBlock.props, "title")}
                          onChange={(e) =>
                            updateBlock(activeBlock.id, {
                              props: { ...(activeBlock.props ?? {}), title: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}

                    {(activeBlock.type === "text" || activeBlock.type === "footer") && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">text</div>
                        <Input
                          value={getPropString(activeBlock.props, "text")}
                          onChange={(e) =>
                            updateBlock(activeBlock.id, {
                              props: { ...(activeBlock.props ?? {}), text: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}

                    <Button variant="destructive" onClick={deleteSelected} className="rounded-xl">
                      Delete {selectedIds.length > 1 ? `(${selectedIds.length}) blocks` : "block"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Click a block on the canvas to select.</div>
                )}
              </div>

              {mode === "preview" ? (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview data</div>

                    <div className="space-y-2">
                      <div className="text-[10px] text-muted-foreground">Preview from invoice (optional)</div>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={previewInvoiceId}
                        onChange={(e) => setPreviewInvoiceId(e.target.value)}
                      >
                        <option value="">(Use template sample data)</option>
                        {invoices.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.referenceId}   {inv.status}
                          </option>
                        ))}
                      </select>
                      {previewInvoiceId ? (
                        <div className="text-[10px] text-muted-foreground">
                          Using invoice data for preview. Clear selection to edit & save sample data per-template.
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground">
                          Editing below will be saved to this template as its sample preview data.
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground">merchantName</div>
                      <Input
                        value={previewData.merchantName}
                        onChange={(e) =>
                          persistTemplatePreviewData((d) => ({
                            ...d,
                            merchantName: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground">taxRate (%)</div>
                      <Input
                        value={String(previewData.taxRate)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          persistTemplatePreviewData((d) => ({
                            ...d,
                            taxRate: Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0,
                          }));
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">items</div>
                        <Button variant="secondary" size="sm" onClick={addPreviewItem}>
                          + Item
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {(previewData.items ?? []).map((it) => (
                          <div key={it.id} className="rounded-xl border border-border/40 p-3 space-y-2 bg-background/40">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs font-black truncate">{it.description || "(item)"}</div>
                              <Button variant="ghost" size="sm" onClick={() => removePreviewItem(it.id)} className="text-destructive">
                                Remove
                              </Button>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[10px] text-muted-foreground">description</div>
                              <Input
                                value={it.description}
                                onChange={(e) => updatePreviewItem(it.id, { description: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <div className="text-[10px] text-muted-foreground">qty</div>
                                <Input
                                  value={String(it.quantity)}
                                  onChange={(e) => {
                                    const n = Number(e.target.value);
                                    updatePreviewItem(it.id, { quantity: Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1 });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-muted-foreground">price</div>
                                <Input
                                  value={String(it.price)}
                                  onChange={(e) => {
                                    const n = Number(e.target.value);
                                    updatePreviewItem(it.id, { price: Number.isFinite(n) ? Math.max(0, n) : 0 });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground">
                      Subtotal: <span className="font-mono">{previewSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="lg:col-span-8 border-none bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>{mode === "design" ? "Canvas (A4)" : "Preview (A4)"}</CardTitle>
              <CardDescription>
                {mode === "design" ? `Drag + resize. Snap: ${GRID}px` : "Live preview using current blocks"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mode === "preview" ? (
                <div className="flex justify-center">
                  <div className="rounded-2xl border border-border/40 bg-white overflow-hidden">
                    <InvoiceTemplateRenderer
                      data={previewData}
                      template={{
                        ...template,
                        page: { ...template.page, width: PAGE_W, height: PAGE_H },
                        blocks,
                      }}
                      showSafeArea
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="relative rounded-2xl border border-border/40 bg-white overflow-hidden"
                  style={{ width: PAGE_W, height: PAGE_H }}
                  onMouseDown={() => setSingleSelection(null)}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes("application/qbilling-block")) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                    }
                  }}
                  onDrop={(e) => {
                    const raw = e.dataTransfer.getData("application/qbilling-block");
                    if (!raw) return;
                    e.preventDefault();

                    try {
                      const parsed = JSON.parse(raw) as { type?: TemplateBlockType };
                      if (!parsed.type) return;

                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      addBlock(parsed.type, { x, y });
                    } catch {
                      // ignore
                    }
                  }}
                >
                  {/* grid lines */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-15"
                    style={{
                      backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)` ,
                      backgroundSize: `${GRID}px ${GRID}px`,
                    }}
                  />

                  <AlignmentGuidesOverlay guides={guides} />

                  {blocks
                    .filter((b) => !b.hidden)
                    .map((b) => {
                      const active = !!selected[b.id];
                      const locked = b.locked;
                      return (
                        <Rnd
                          key={b.id}
                          size={{ width: b.w, height: b.h }}
                          position={{ x: b.x, y: b.y }}
                          bounds="parent"
                          enableResizing={!locked}
                          disableDragging={locked}
                          dragGrid={[GRID, GRID]}
                          resizeGrid={[GRID, GRID]}
                          onDragStart={(e) => {
                            // If this block is part of multi-selection, capture snapshot and drag as a group.
                            // Otherwise we behave like single selection.
                            const ev = e as unknown as MouseEvent;
                            const metaKey = getMetaKeyFromMouseEvent(ev);

                            if (selected[b.id] && selectedIds.length > 1) {
                              canvasDragSnapshot.current = {};
                              selectedIds.forEach((id) => {
                                const blk = blocks.find((x) => x.id === id);
                                if (!blk) return;
                                if (blk.locked) return; // locked blocks stay put
                                canvasDragSnapshot.current[id] = { x: blk.x, y: blk.y };
                              });
                              clearGuides();
                              return;
                            }

                            handlePanelSelectMeta({ id: b.id, metaKey, shiftKey: !!ev.shiftKey });
                            canvasDragSnapshot.current = { [b.id]: { x: b.x, y: b.y } };
                            clearGuides();
                          }}
                          onDrag={(_, d) => {
                            // Show guides based on the dragged block itself (primary)
                            const res = alignToPageCenter({ rect: { x: d.x, y: d.y, w: b.w, h: b.h }, page: { width: PAGE_W, height: PAGE_H } });
                            if (res.guides.length) setGuides(res.guides);
                            else clearGuides();

                            // If multi-drag, apply live preview positions to other selected blocks by committing temp updates.
                            if (selected[b.id] && selectedIds.length > 1) {
                              const base = canvasDragSnapshot.current[b.id];
                              if (!base) return;
                              const dx = d.x - base.x;
                              const dy = d.y - base.y;

                              const nextBlocks = blocks.map((blk) => {
                                if (!selected[blk.id]) return blk;
                                if (blk.locked) return blk;
                                const snap0 = canvasDragSnapshot.current[blk.id];
                                if (!snap0) return blk;
                                const nx = clamp(snap(snap0.x + dx), 0, PAGE_W - blk.w);
                                const ny = clamp(snap(snap0.y + dy), 0, PAGE_H - blk.h);
                                return { ...blk, x: nx, y: ny };
                              });

                              // Commit as we drag for a smooth group move.
                              if (template) updateTemplate(template.id, { blocks: nextBlocks });
                            }
                          }}
                          onDragStop={(_, d) => {
                            const snappedX = snap(d.x);
                            const snappedY = snap(d.y);

                            const res = alignToPageCenter({ rect: { x: snappedX, y: snappedY, w: b.w, h: b.h }, page: { width: PAGE_W, height: PAGE_H } });
                            const nxPrimary = snap(res.x ?? snappedX);
                            const nyPrimary = snap(res.y ?? snappedY);

                            if (selected[b.id] && selectedIds.length > 1) {
                              const base = canvasDragSnapshot.current[b.id];
                              if (!base || !template) {
                                clearGuides();
                                return;
                              }
                              const dx = nxPrimary - base.x;
                              const dy = nyPrimary - base.y;

                              const nextBlocks = blocks.map((blk) => {
                                if (!selected[blk.id]) return blk;
                                if (blk.locked) return blk;
                                const snap0 = canvasDragSnapshot.current[blk.id];
                                if (!snap0) return blk;
                                const nx = clamp(snap(snap0.x + dx), 0, PAGE_W - blk.w);
                                const ny = clamp(snap(snap0.y + dy), 0, PAGE_H - blk.h);
                                return { ...blk, x: nx, y: ny };
                              });

                              updateTemplate(template.id, { blocks: nextBlocks });
                              clearGuides();
                              return;
                            }

                            updateBlock(b.id, { x: clamp(nxPrimary, 0, PAGE_W - b.w), y: clamp(nyPrimary, 0, PAGE_H - b.h) });
                            clearGuides();
                          }}
                          onResizeStart={(e) => {
                            const ev = e as unknown as MouseEvent;
                            handlePanelSelectMeta({ id: b.id, metaKey: getMetaKeyFromMouseEvent(ev), shiftKey: !!ev.shiftKey });
                            clearGuides();
                          }}
                          onResize={(_, __, ref, ___, pos) => {
                            const w = ref.offsetWidth;
                            const h = ref.offsetHeight;
                            const res = alignToPageCenter({ rect: { x: pos.x, y: pos.y, w, h }, page: { width: PAGE_W, height: PAGE_H } });
                            if (res.guides.length) setGuides(res.guides);
                            else clearGuides();
                          }}
                          onResizeStop={(_, __, ref, ___, pos) => {
                            const nw0 = snap(ref.offsetWidth);
                            const nh0 = snap(ref.offsetHeight);
                            const nx0 = snap(pos.x);
                            const ny0 = snap(pos.y);

                            const res = alignToPageCenter({ rect: { x: nx0, y: ny0, w: nw0, h: nh0 }, page: { width: PAGE_W, height: PAGE_H } });
                            const nx = snap(res.x ?? nx0);
                            const ny = snap(res.y ?? ny0);

                            updateBlock(b.id, {
                              x: clamp(nx, 0, PAGE_W - nw0),
                              y: clamp(ny, 0, PAGE_H - nh0),
                              w: clamp(nw0, GRID, PAGE_W),
                              h: clamp(nh0, GRID, PAGE_H),
                            });
                            clearGuides();
                          }}
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handlePanelSelectMeta({ id: b.id, metaKey: e.metaKey || e.ctrlKey, shiftKey: e.shiftKey });
                            }}
                            className={
                              "h-full w-full rounded-xl border text-left p-2 text-xs font-bold shadow-sm transition-colors bg-background/80 " +
                              (active ? "border-primary ring-2 ring-primary/30" : "border-border/40") +
                              (locked ? " opacity-70" : "")
                            }
                          >
                            {b.type}{locked ? " (locked)" : ""}
                            <div className="text-[10px] font-mono opacity-60 truncate">{b.id}</div>
                          </button>
                        </Rnd>
                      );
                    })}
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-4">
                {mode === "design" ? "Tip: drag to move, drag corners to resize. Snap keeps layout print-friendly." : "Tip: switch back to Design to edit blocks."}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
