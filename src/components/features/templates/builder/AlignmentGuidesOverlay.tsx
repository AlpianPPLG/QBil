"use client";

import React from "react";
import type { Guide } from "@/lib/templates/alignment";

export function AlignmentGuidesOverlay({ guides }: { guides: Guide[] }) {
  if (!guides.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {guides.map((g, idx) =>
        g.kind === "v" ? (
          <div
            key={`${g.kind}-${idx}`}
            className="absolute top-0 bottom-0 w-px bg-primary/60"
            style={{ left: g.x }}
          />
        ) : (
          <div
            key={`${g.kind}-${idx}`}
            className="absolute left-0 right-0 h-px bg-primary/60"
            style={{ top: g.y }}
          />
        )
      )}
    </div>
  );
}

