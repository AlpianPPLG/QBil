import type { TemplateBlock } from "@/lib/schema";

export type SelectedMap = Record<string, boolean>;

export function isSelected(selected: SelectedMap, id: string) {
  return !!selected[id];
}

export function selectedIds(selected: SelectedMap): string[] {
  return Object.keys(selected).filter((k) => selected[k]);
}

export function ensureSingleSelection(id: string): SelectedMap {
  return { [id]: true };
}

export function toggleSelection(selected: SelectedMap, id: string): SelectedMap {
  const next = { ...selected };
  next[id] = !next[id];
  // Normalize: if false remove to keep map small
  if (!next[id]) delete next[id];
  return next;
}

export function clearSelection(): SelectedMap {
  return {};
}

export function hasAnySelection(selected: SelectedMap) {
  return Object.keys(selected).length > 0;
}

/**
 * Select a contiguous range between anchorId and targetId based on the provided orderedIds.
 * If anchorId isn't found, it will behave like single selection on targetId.
 */
export function rangeSelection(input: {
  orderedIds: string[];
  anchorId: string | null;
  targetId: string;
}): SelectedMap {
  const { orderedIds, anchorId, targetId } = input;

  const targetIdx = orderedIds.indexOf(targetId);
  if (targetIdx === -1) return ensureSingleSelection(targetId);

  const anchorIdx = anchorId ? orderedIds.indexOf(anchorId) : -1;
  if (anchorIdx === -1) return ensureSingleSelection(targetId);

  const lo = Math.min(anchorIdx, targetIdx);
  const hi = Math.max(anchorIdx, targetIdx);

  const next: SelectedMap = {};
  for (let i = lo; i <= hi; i += 1) next[orderedIds[i]] = true;
  return next;
}

/**
 * Computes next selection state from a click with modifiers.
 */
export function nextSelectionFromClick(input: {
  orderedIds: string[];
  current: SelectedMap;
  anchorId: string | null;
  targetId: string;
  mode: "single" | "toggle" | "range";
}): { selected: SelectedMap; anchorId: string } {
  const { orderedIds, current, anchorId, targetId, mode } = input;

  if (mode === "range") {
    return { selected: rangeSelection({ orderedIds, anchorId, targetId }), anchorId: anchorId ?? targetId };
  }

  if (mode === "toggle") {
    const selected = toggleSelection(current, targetId);
    return { selected: hasAnySelection(selected) ? selected : ensureSingleSelection(targetId), anchorId: targetId };
  }

  return { selected: ensureSingleSelection(targetId), anchorId: targetId };
}

export function moveBlocks(blocks: TemplateBlock[], ids: string[], delta: { dx: number; dy: number }) {
  const idSet = new Set(ids);
  return blocks.map((b) => (idSet.has(b.id) ? { ...b, x: b.x + delta.dx, y: b.y + delta.dy } : b));
}

export function reorderBlocksById(input: {
  blocks: TemplateBlock[];
  fromId: string;
  toId: string;
}): TemplateBlock[] {
  const { blocks, fromId, toId } = input;
  if (fromId === toId) return blocks;

  const sorted = blocks.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const fromIdx = sorted.findIndex((b) => b.id === fromId);
  const toIdx = sorted.findIndex((b) => b.id === toId);
  if (fromIdx === -1 || toIdx === -1) return blocks;

  const [moved] = sorted.splice(fromIdx, 1);
  sorted.splice(toIdx, 0, moved);

  // Normalize order to be dense and stable
  return sorted.map((b, idx) => ({ ...b, order: idx + 1 }));
}
