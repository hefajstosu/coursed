// Reguła ocen coursed.pl:
// - osobne średnie dla USER i CRITIC,
// - ocena ogólna = średnia 50/50 jeśli istnieją oba typy,
// - jeśli istnieje tylko jeden typ — overall = ten jeden + flag singleSourceOnly,
// - progi "za mało ocen" ukrywają średnią danego typu (count zostaje).

export const USER_RATING_MIN_COUNT = 3;
export const CRITIC_RATING_MIN_COUNT = 1;

export type ComputedRatings = {
  overall: number | null;
  user: { avg: number | null; count: number };
  critic: { avg: number | null; count: number };
  flags: {
    singleSourceOnly: boolean;
    userTooFew: boolean;
    criticTooFew: boolean;
    noRatings: boolean;
  };
};

export function computeRatings(input: {
  userValues: readonly number[];
  criticValues: readonly number[];
}): ComputedRatings {
  const userCount = input.userValues.length;
  const criticCount = input.criticValues.length;

  const userAvgRaw = average(input.userValues);
  const criticAvgRaw = average(input.criticValues);

  const userTooFew = userCount > 0 && userCount < USER_RATING_MIN_COUNT;
  const criticTooFew = criticCount > 0 && criticCount < CRITIC_RATING_MIN_COUNT;

  const userAvg = userTooFew ? null : userAvgRaw;
  const criticAvg = criticTooFew ? null : criticAvgRaw;

  const hasUser = userAvg !== null;
  const hasCritic = criticAvg !== null;

  let overall: number | null = null;
  if (hasUser && hasCritic) {
    overall = (userAvg + criticAvg) / 2;
  } else if (hasUser) {
    overall = userAvg;
  } else if (hasCritic) {
    overall = criticAvg;
  }

  return {
    overall: round1(overall),
    user: { avg: round1(userAvg), count: userCount },
    critic: { avg: round1(criticAvg), count: criticCount },
    flags: {
      singleSourceOnly: (hasUser && !hasCritic) || (!hasUser && hasCritic),
      userTooFew,
      criticTooFew,
      noRatings: !hasUser && !hasCritic,
    },
  };
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function round1(n: number | null): number | null {
  if (n === null) return null;
  return Math.round(n * 10) / 10;
}
