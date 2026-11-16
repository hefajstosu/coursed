import { describe, expect, it } from "vitest";
import { categoryFormSchema } from "@/schemas/admin-categories";

const base = { name: "Frontend", slug: "frontend" };

describe("categoryFormSchema", () => {
  // Regresja: pusty select „brak rodzica” wysyłał "" i łamał FK (P2003).
  it("normalizes an empty parentId to undefined", () => {
    const parsed = categoryFormSchema.parse({ ...base, parentId: "", description: "" });
    expect(parsed.parentId).toBeUndefined();
    expect(parsed.description).toBeUndefined();
  });

  it("keeps a real parentId", () => {
    expect(categoryFormSchema.parse({ ...base, parentId: "cat_1" }).parentId).toBe("cat_1");
  });

  it("rejects an invalid slug", () => {
    expect(categoryFormSchema.safeParse({ ...base, slug: "Front End" }).success).toBe(false);
  });
});
