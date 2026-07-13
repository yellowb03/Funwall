/**
 * Seeded pseudo-random number generator with named streams.
 *
 * Algorithm: Mulberry32 per stream, with stream seeds derived from a master
 * seed via FNV-1a hashing. Stable across server and browser JS engines.
 *
 * @see agent-work/shared/CONTRACTS.md §11
 * @see docs/adr/ADR-006-seeded-rng.md
 */

export const RNG_STREAM_NAMES = [
  "contentOrder",
  "board",
  "bonus",
  "visual",
] as const;

export type RngStreamName = (typeof RNG_STREAM_NAMES)[number];

export interface SeededRng {
  readonly seed: string;
  stream(name: RngStreamName): RngStream;
  /** Convenience: next float from the contentOrder stream. */
  next(): number;
  int(minInclusive: number, maxInclusive: number): number;
  shuffle<T>(items: readonly T[]): T[];
  pick<T>(items: readonly T[]): T;
}

export interface RngStream {
  readonly name: RngStreamName;
  /** Float in [0, 1). */
  next(): number;
  /** Inclusive integer range. */
  int(minInclusive: number, maxInclusive: number): number;
  shuffle<T>(items: readonly T[]): T[];
  pick<T>(items: readonly T[]): T;
}

/** FNV-1a 32-bit hash — deterministic string → u32. */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32 PRNG step. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function createStream(name: RngStreamName, seedState: number): RngStream {
  const nextFloat = mulberry32(seedState);

  const stream: RngStream = {
    name,
    next: nextFloat,
    int(minInclusive, maxInclusive) {
      if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive)) {
        throw new Error("RngStream.int requires integer bounds");
      }
      if (maxInclusive < minInclusive) {
        throw new Error("RngStream.int max must be >= min");
      }
      const span = maxInclusive - minInclusive + 1;
      return minInclusive + Math.floor(nextFloat() * span);
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(nextFloat() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error("RngStream.pick requires a non-empty array");
      }
      return items[Math.floor(nextFloat() * items.length)]!;
    },
  };

  return stream;
}

/**
 * Create a seeded RNG. Game-affecting selections must use this, never Math.random.
 */
export function createSeededRng(seed: string): SeededRng {
  if (!seed || seed.length === 0) {
    throw new Error("createSeededRng requires a non-empty seed string");
  }

  const master = fnv1a32(seed);
  const streams = new Map<RngStreamName, RngStream>();

  for (const name of RNG_STREAM_NAMES) {
    const streamSeed = fnv1a32(`${seed}::${name}`) ^ master;
    streams.set(name, createStream(name, streamSeed >>> 0));
  }

  const primary = streams.get("contentOrder")!;

  return {
    seed,
    stream(name) {
      const s = streams.get(name);
      if (!s) {
        throw new Error(`Unknown RNG stream: ${name}`);
      }
      return s;
    },
    next: () => primary.next(),
    int: (min, max) => primary.int(min, max),
    shuffle: (items) => primary.shuffle(items),
    pick: (items) => primary.pick(items),
  };
}

/** Generate a cryptographically-strong-enough seed string for a new session. */
export function generateSessionSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  // Fallback for rare environments without Web Crypto UUID.
  return `seed_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9)}`;
}
