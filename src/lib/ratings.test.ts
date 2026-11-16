import { describe, expect, it } from "vitest";
import { computeRatings, USER_RATING_MIN_COUNT } from "@/lib/ratings";

const users = (...v: number[]) => ({ userValues: v, criticValues: [] as number[] });

describe("computeRatings", () => {
  it("averages users and critics 50/50 regardless of group size", () => {
    const r = computeRatings({ userValues: [10, 10, 10, 10, 10, 10], criticValues: [4] });
    expect(r.user.avg).toBe(10);
    expect(r.critic.avg).toBe(4);
    expect(r.overall).toBe(7);
    expect(r.flags.singleSourceOnly).toBe(false);
  });

  it("falls back to the only available source and flags it", () => {
    const r = computeRatings(users(8, 9, 10));
    expect(r.overall).toBe(9);
    expect(r.critic.avg).toBeNull();
    expect(r.flags.singleSourceOnly).toBe(true);
  });

  it("hides the user average below the minimum count but keeps the count", () => {
    const values = Array.from({ length: USER_RATING_MIN_COUNT - 1 }, () => 9);
    const r = computeRatings({ userValues: values, criticValues: [6] });
    expect(r.user.avg).toBeNull();
    expect(r.user.count).toBe(values.length);
    expect(r.flags.userTooFew).toBe(true);
    // Za mało ocen userów → ogólna liczona tylko z krytyków.
    expect(r.overall).toBe(6);
  });

  it("reports no ratings when both groups are empty", () => {
    const r = computeRatings({ userValues: [], criticValues: [] });
    expect(r.overall).toBeNull();
    expect(r.flags.noRatings).toBe(true);
    expect(r.flags.userTooFew).toBe(false);
  });

  it("rounds to one decimal place", () => {
    const r = computeRatings(users(7, 8, 8));
    expect(r.user.avg).toBe(7.7);
  });

  it("averages aspect ratings independently, null when missing", () => {
    const r = computeRatings({
      ...users(5, 5, 5),
      aspects: { content: [6, 9], instructor: [], worth: [3] },
    });
    expect(r.aspects).toEqual({ content: 7.5, instructor: null, worth: 3 });
  });
});
