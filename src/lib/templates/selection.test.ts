import { describe, expect, it } from "vitest";
import type { TemplateBlock } from "@/lib/schema";
import {
  nextSelectionFromClick,
  rangeSelection,
  reorderBlocksById,
  toggleSelection,
} from "@/lib/templates/selection";

describe("templates/selection", () => {
  it("toggleSelection toggles in and out", () => {
    const s1 = toggleSelection({}, "a");
    expect(s1).toEqual({ a: true });

    const s2 = toggleSelection(s1, "a");
    expect(s2).toEqual({});
  });

  it("rangeSelection selects between anchor and target", () => {
    const ids = ["top", "mid", "bot"];
    expect(rangeSelection({ orderedIds: ids, anchorId: "top", targetId: "bot" })).toEqual({
      top: true,
      mid: true,
      bot: true,
    });
  });

  it("nextSelectionFromClick range uses anchor", () => {
    const ids = ["a", "b", "c", "d"];
    const res1 = nextSelectionFromClick({ orderedIds: ids, current: {}, anchorId: null, targetId: "b", mode: "single" });
    expect(res1.selected).toEqual({ b: true });

    const res2 = nextSelectionFromClick({ orderedIds: ids, current: res1.selected, anchorId: res1.anchorId, targetId: "d", mode: "range" });
    expect(res2.selected).toEqual({ b: true, c: true, d: true });
  });

  it("nextSelectionFromClick toggle keeps at least one selected", () => {
    const ids = ["a", "b"];
    const res1 = nextSelectionFromClick({ orderedIds: ids, current: {}, anchorId: null, targetId: "a", mode: "single" });
    const res2 = nextSelectionFromClick({ orderedIds: ids, current: res1.selected, anchorId: res1.anchorId, targetId: "a", mode: "toggle" });

    // If you toggle off the only selected item, we normalize to keep it selected.
    expect(res2.selected).toEqual({ a: true });
  });
});

describe("templates/reorder", () => {
  it("reorderBlocksById moves an item before target and normalizes order", () => {
    const blocks: TemplateBlock[] = [
      { id: "a", type: "text", x: 0, y: 0, w: 10, h: 10, props: {}, name: "", order: 1, locked: false, hidden: false },
      { id: "b", type: "text", x: 0, y: 0, w: 10, h: 10, props: {}, name: "", order: 2, locked: false, hidden: false },
      { id: "c", type: "text", x: 0, y: 0, w: 10, h: 10, props: {}, name: "", order: 3, locked: false, hidden: false },
    ];

    const next = reorderBlocksById({ blocks, fromId: "c", toId: "a" });
    expect(next.map((b) => b.id)).toEqual(["c", "a", "b"]);
    expect(next.map((b) => b.order)).toEqual([1, 2, 3]);
  });
});
