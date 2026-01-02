"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { Rnd } from "react-rnd";
import { useRouter, useSearchParams } from "next/navigation";
import { useTemplates } from "@/hooks/useTemplates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, LayoutGrid, Save } from "lucide-react";
import type { BillingData, TemplateBlock, TemplateBlockType } from "@/lib/schema";
import { InvoiceTemplateRenderer } from "@/components/features/templates/InvoiceTemplateRenderer";

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

  const { templates, createTemplate, updateTemplate } = useTemplates();
  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  const [name, setName] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"design" | "preview">("design");

  const [previewData, setPreviewData] = React.useState<BillingData>(() => ({
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
  }));

  const previewSubtotal = React.useMemo(() => {
    return (previewData.items ?? []).reduce((acc, it) => acc + it.price * it.quantity, 0);
  }, [previewData.items]);

  React.useEffect(() => {
    // Keep legacy amount field roughly in sync with items for nicer totals.
    setPreviewData((d) => ({ ...d, amount: String(previewSubtotal.toFixed(2)) }));
  }, [previewSubtotal]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updatePreviewItem = (id: string, patch: Partial<{ description: string; quantity: number; price: number }>) => {
    setPreviewData((d) => ({
      ...d,
      items: (d.items ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addPreviewItem = () => {
    setPreviewData((d) => {
      const idx = (d.items?.length ?? 0) + 1;
      const next = [...(d.items ?? []), { id: `i${Date.now()}`, description: `Item ${idx}`, quantity: 1, price: 0 }];
      return { ...d, items: next };
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removePreviewItem = (id: string) => {
    setPreviewData((d) => ({ ...d, items: (d.items ?? []).filter((it) => it.id !== id) }));
  };

  React.useEffect(() => {
    setName(template?.name ?? "");
    setSelectedId(null);
  }, [template?.id, template?.name]);

  const blocks = template?.blocks ?? [];
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const getPropString = React.useCallback((props: unknown, key: string) => {
    if (!props || typeof props !== "object") return "";
    const v = (props as Record<string, unknown>)[key];
    return typeof v === "string" ? v : "";
  }, []);

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

  const addBlock = (type: TemplateBlockType) => {
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
    const next: TemplateBlock[] = [
      ...blocks,
      {
        id,
        type,
        x: 16,
        y: 16,
        w: d.w,
        h: d.h,
        props: d.props ?? {},
      },
    ];

    updateTemplate(template.id, { blocks: next });
    setSelectedId(id);
  };

  const updateBlock = (id: string, patch: Partial<Pick<TemplateBlock, "x" | "y" | "w" | "h" | "props">>) => {
    if (!template) return;
    const next = blocks.map((b) => (b.id === id ? { ...b, ...patch, props: patch.props ?? b.props } : b));
    updateTemplate(template.id, { blocks: next });
  };

  const deleteSelected = () => {
    if (!template || !selected) return;
    const next = blocks.filter((b) => b.id !== selected.id);
    updateTemplate(template.id, { blocks: next });
    setSelectedId(null);
  };

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

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add block</div>
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
                {selected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge>{selected.type}</Badge>
                      <span className="font-mono text-xs text-muted-foreground truncate">{selected.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">x</div>
                        <Input
                          value={String(selected.x)}
                          onChange={(e) => updateBlock(selected.id, { x: snap(Number(e.target.value) || 0) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">y</div>
                        <Input
                          value={String(selected.y)}
                          onChange={(e) => updateBlock(selected.id, { y: snap(Number(e.target.value) || 0) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">w</div>
                        <Input
                          value={String(selected.w)}
                          onChange={(e) => updateBlock(selected.id, { w: snap(Number(e.target.value) || GRID) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">h</div>
                        <Input
                          value={String(selected.h)}
                          onChange={(e) => updateBlock(selected.id, { h: snap(Number(e.target.value) || GRID) })}
                        />
                      </div>
                    </div>

                    {selected.type === "header" && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">title</div>
                        <Input
                          value={getPropString(selected.props, "title")}
                          onChange={(e) => updateBlock(selected.id, { props: { ...(selected.props ?? {}), title: e.target.value } })}
                        />
                      </div>
                    )}

                    {(selected.type === "text" || selected.type === "footer") && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">text</div>
                        <Input
                          value={getPropString(selected.props, "text")}
                          onChange={(e) => updateBlock(selected.id, { props: { ...(selected.props ?? {}), text: e.target.value } })}
                        />
                      </div>
                    )}

                    <Button variant="destructive" onClick={deleteSelected} className="rounded-xl">
                      Delete block
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

                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground">merchantName</div>
                      <Input
                        value={previewData.merchantName}
                        onChange={(e) => setPreviewData((d) => ({ ...d, merchantName: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground">taxRate (%)</div>
                      <Input
                        value={String(previewData.taxRate)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setPreviewData((d) => ({ ...d, taxRate: Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0 }));
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
                  onMouseDown={() => setSelectedId(null)}
                >
                  {/* grid lines */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-15"
                    style={{
                      backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)` ,
                      backgroundSize: `${GRID}px ${GRID}px`,
                    }}
                  />

                  {blocks.map((b) => {
                    const active = b.id === selectedId;
                    return (
                      <Rnd
                        key={b.id}
                        size={{ width: b.w, height: b.h }}
                        position={{ x: b.x, y: b.y }}
                        bounds="parent"
                        enableResizing
                        dragGrid={[GRID, GRID]}
                        resizeGrid={[GRID, GRID]}
                        onDragStart={() => setSelectedId(b.id)}
                        onResizeStart={() => setSelectedId(b.id)}
                        onDragStop={(_, d) => {
                          const nx = snap(d.x);
                          const ny = snap(d.y);
                          updateBlock(b.id, { x: clamp(nx, 0, PAGE_W - b.w), y: clamp(ny, 0, PAGE_H - b.h) });
                        }}
                        onResizeStop={(_, __, ref, ___, pos) => {
                          const nw = snap(ref.offsetWidth);
                          const nh = snap(ref.offsetHeight);
                          const nx = snap(pos.x);
                          const ny = snap(pos.y);
                          updateBlock(b.id, {
                            x: clamp(nx, 0, PAGE_W - nw),
                            y: clamp(ny, 0, PAGE_H - nh),
                            w: clamp(nw, GRID, PAGE_W),
                            h: clamp(nh, GRID, PAGE_H),
                          });
                        }}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedId(b.id);
                          }}
                          className={
                            "h-full w-full rounded-xl border text-left p-2 text-xs font-bold shadow-sm transition-colors bg-background/80 " +
                            (active ? "border-primary ring-2 ring-primary/30" : "border-border/40")
                          }
                        >
                          {b.type}
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
