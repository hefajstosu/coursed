import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
vi.mock("@/lib/db", () => ({ db: { review: { findFirst } } }));

const { spamHeuristics, isCrossCourseDuplicate } = await import("@/lib/spam");

describe("spamHeuristics", () => {
  it("accepts a normal review", () => {
    expect(spamHeuristics("Solidny kurs, dużo praktyki i dobre tempo.")).toEqual({ ok: true });
  });

  it("allows two links but rejects a third", () => {
    expect(spamHeuristics("https://a.pl i https://b.pl").ok).toBe(true);
    expect(spamHeuristics("https://a.pl https://b.pl http://c.pl").ok).toBe(false);
  });

  it("rejects shouting, counting Polish uppercase letters", () => {
    const shout = "ŻÓŁĆ ŚWIETNY KURS POLECAM KAŻDEMU NAPRAWDĘ BARDZO";
    expect(spamHeuristics(shout).ok).toBe(false);
  });

  it("skips the caps check for short texts", () => {
    expect(spamHeuristics("SUPER KURS").ok).toBe(true);
  });
});

describe("isCrossCourseDuplicate", () => {
  beforeEach(() => findFirst.mockReset());

  it("ignores short bodies without querying the database", async () => {
    expect(await isCrossCourseDuplicate("u1", "c1", "krótko")).toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("looks for the same body on other courses of the same user", async () => {
    findFirst.mockResolvedValue({ id: "r1" });
    const body = "Ten sam długi tekst opinii wklejony pod kilka różnych kursów.";
    expect(await isCrossCourseDuplicate("u1", "c1", body)).toBe(true);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u1", courseId: { not: "c1" } }),
      }),
    );
  });
});
