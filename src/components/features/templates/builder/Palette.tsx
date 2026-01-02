"use client";

import React from "react";
import type { TemplateBlockType } from "@/lib/schema";
import { Button } from "@/components/ui/button";

const PALETTE: Array<{ type: TemplateBlockType; label: string }> = [
  { type: "header", label: "Header" },
  { type: "merchant", label: "Merchant" },
  { type: "items", label: "Items" },
  { type: "totals", label: "Totals" },
  { type: "qr", label: "QR" },
  { type: "note", label: "Note" },
  { type: "footer", label: "Footer" },
  { type: "text", label: "Text" },
];

export function Palette() {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Palette</div>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE.map((b) => (
          <Button
            key={b.type}
            variant="secondary"
            className="justify-start"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/qbilling-block", JSON.stringify({ type: b.type }));
              e.dataTransfer.effectAllowed = "copy";
            }}
          >
            + {b.label}
          </Button>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground">
        Tip: drag a block to the canvas to add it.
      </div>
    </div>
  );
}

