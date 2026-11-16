import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it.each(["/", "/kursy/react?sort=new", "/profil#opinie"])("keeps internal path %s", (p) => {
    expect(safeRedirectPath(p)).toBe(p);
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "kursy"])(
    "rejects %s",
    (p) => {
      expect(safeRedirectPath(p)).toBe("/");
    },
  );

  it("falls back for non-string values", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined, "/login")).toBe("/login");
  });
});
