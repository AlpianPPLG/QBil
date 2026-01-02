import { describe, expect, it } from "vitest";
import { safeFilename, batchZipName } from "@/lib/export/zip";

describe("export/zip", () => {
  it("safeFilename replaces invalid characters", () => {
    expect(safeFilename('INV:001/2026?*"<>|')).toBe("INV-001-2026-");
  });

  it("batchZipName includes date", () => {
    const name = batchZipName("invoices");
    expect(name.startsWith("invoices-")).toBe(true);
    expect(name.length).toBeGreaterThan("invoices-".length);
  });
});

