// Seeded, deterministic RNG. No Math.random anywhere in the engine.

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Standard normal (mean 0, sd 1). */
  normal(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** Weighted pick; weights must be >= 0 and not all zero. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number): Rng {
  const raw = mulberry32(seed);
  const next = () => raw();
  const normal = () => {
    // Box-Muller; 1 - next() keeps the log argument above 0.
    const u = 1 - next();
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return {
    next,
    normal,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    weighted: (items, weight) => {
      let total = 0;
      for (const it of items) total += weight(it);
      let r = next() * total;
      for (const it of items) {
        r -= weight(it);
        if (r < 0) return it;
      }
      return items[items.length - 1];
    },
  };
}

/** Mixes the game seed and the turn number into one 32-bit seed. */
export function hashSeed(seed: number, turn: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (turn + 0x7f4a7c15), 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Each turn gets its own RNG derived from (seed, turn). A turn can then be
 * replayed on its own, which is what the leaderboard verifier relies on.
 */
export function rngForTurn(seed: number, turn: number): Rng {
  return createRng(hashSeed(seed, turn));
}
