import { describe, it, expect } from "vitest";
import { generateReferenceId } from "@/lib/id";

describe("generateReferenceId", () => {
  it("generates an INV-prefixed id", () => {
    const id = generateReferenceId();
    expect(id.startsWith("INV-")).toBe(true);
    expect(id.length).toBeGreaterThan(4);
  });
});

