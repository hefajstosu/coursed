import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("transliterates Polish characters, including ł", () => {
    expect(slugify("Zażółć gęślą jaźń")).toBe("zazolc-gesla-jazn");
    expect(slugify("Łódź")).toBe("lodz");
  });

  it("collapses separators and trims dashes", () => {
    expect(slugify("  Next.js 16 — od zera!  ")).toBe("next-js-16-od-zera");
  });

  it("returns an empty string when nothing is left", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("caps the length at 200 characters", () => {
    expect(slugify("a".repeat(500))).toHaveLength(200);
  });
});
