export type Guide =
  | { kind: "v"; x: number }
  | { kind: "h"; y: number };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AlignmentResult {
  x?: number;
  y?: number;
  guides: Guide[];
}

function centerX(r: Rect) {
  return r.x + r.w / 2;
}

function centerY(r: Rect) {
  return r.y + r.h / 2;
}

/**
 * Light alignment helper.
 * Currently supports snapping block center to page center.
 */
export function alignToPageCenter(input: {
  rect: Rect;
  page: { width: number; height: number };
  threshold?: number;
}): AlignmentResult {
  const { rect, page } = input;
  const threshold = input.threshold ?? 6;

  const cx = centerX(rect);
  const cy = centerY(rect);

  const pageCx = page.width / 2;
  const pageCy = page.height / 2;

  const guides: Guide[] = [];
  const res: AlignmentResult = { guides };

  if (Math.abs(cx - pageCx) <= threshold) {
    res.x = Math.round(pageCx - rect.w / 2);
    guides.push({ kind: "v", x: pageCx });
  }

  if (Math.abs(cy - pageCy) <= threshold) {
    res.y = Math.round(pageCy - rect.h / 2);
    guides.push({ kind: "h", y: pageCy });
  }

  return res;
}

