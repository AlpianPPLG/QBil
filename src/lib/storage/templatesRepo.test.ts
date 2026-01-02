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

describe("templatesRepo", () => {
  beforeEach(() => {
    const storage = mockStorage();
    // @ts-expect-error test shim
    globalThis.window = {};
    // @ts-expect-error test shim
    globalThis.localStorage = storage;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T00:00:00.000Z"));
  });

  it("creates and updates a template", () => {
    const tpl = templatesRepo.create({ name: "My Template" });
    expect(tpl.name).toBe("My Template");

    const updated = templatesRepo.update(tpl.id, { name: "My Template 2" });
    expect(updated.name).toBe("My Template 2");

    const list = templatesRepo.list();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(tpl.id);
  });

  it("seedDefaultsIfEmpty adds defaults once", () => {
    templatesRepo.seedDefaultsIfEmpty();
    const first = templatesRepo.list();
    expect(first.length).toBeGreaterThan(0);

    templatesRepo.seedDefaultsIfEmpty();
    const second = templatesRepo.list();
    expect(second.length).toBe(first.length);
  });
});

