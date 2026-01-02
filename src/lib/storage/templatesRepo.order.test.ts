import { describe, it, expect, beforeEach, vi } from "vitest";
import { templatesRepo } from "@/lib/storage/templatesRepo";

function mockStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
}

describe("templatesRepo block normalization", () => {
  beforeEach(() => {
    const storage = mockStorage();
    // @ts-expect-error test shim
    globalThis.window = {};
    // @ts-expect-error test shim
    globalThis.localStorage = storage;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T00:00:00.000Z"));
  });

  it("normalizes blocks to include order/locked/hidden/name/props", () => {
    const tpl = templatesRepo.create({
      name: "T",
      blocks: [
        // minimal legacy-like block
        { id: "b1", type: "text", x: 0, y: 0, w: 100, h: 50 },
        { id: "b2", type: "header", x: 0, y: 100, w: 100, h: 50, props: { title: "X" } },
      ],
    });

    expect(tpl.blocks[0].props).toBeTruthy();
    expect(typeof tpl.blocks[0].order).toBe("number");
    expect(tpl.blocks[0].locked).toBe(false);
    expect(tpl.blocks[0].hidden).toBe(false);
    expect(typeof tpl.blocks[0].name).toBe("string");
  });
});

