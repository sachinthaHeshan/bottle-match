import { slotCountForLevel } from './rack';
import { BOTTLE_COLORS, SLOT_COUNT, type BottleColor } from './types';

export { SLOT_COUNT };
export type { BottleColor };

/**
 * Level 1 uses the first four bottle types. Each later level adds the next
 * type, so level 7 is one of every bottle.
 */
export function paletteForLevel(level: number): BottleColor[] {
  const count = slotCountForLevel(level);
  return BOTTLE_COLORS.slice(0, count);
}

export function createSecret(
  random: () => number = Math.random,
  palette: readonly BottleColor[] = BOTTLE_COLORS,
): BottleColor[] {
  return shuffleList(palette, random);
}

/** A full rack where no bottle sits in its secret slot. */
export function createWrongOrder(
  secret: BottleColor[],
  random: () => number = Math.random,
): BottleColor[] {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const order = shuffleList(secret, random);
    if (order.every((color, index) => color !== secret[index])) {
      return order;
    }
  }
  const rotated = secret.map((_, index) => secret[(index + 1) % secret.length]);
  return repairFixedPoints(rotated, secret);
}

export function swapBottles(
  slots: BottleColor[],
  first: number,
  second: number,
): BottleColor[] {
  if (
    first === second ||
    first < 0 ||
    second < 0 ||
    first >= slots.length ||
    second >= slots.length
  ) {
    return slots;
  }

  const next = [...slots];
  [next[first], next[second]] = [next[second], next[first]];
  return next;
}

export function countCorrect(secret: BottleColor[], playerSlots: BottleColor[]): number {
  return secret.reduce(
    (count, color, index) => count + (playerSlots[index] === color ? 1 : 0),
    0,
  );
}

export function curtainLabel(secret: BottleColor[], playerSlots: BottleColor[]): string {
  return String(countCorrect(secret, playerSlots));
}

/** Fewest swaps that can turn this rack into the secret order. */
export function minimumSwaps(secret: BottleColor[], order: BottleColor[]): number {
  if (new Set(secret).size === secret.length) {
    return minimumSwapsUnique(secret, order);
  }
  return minimumSwapsRepeated(secret, order);
}

function minimumSwapsUnique(secret: BottleColor[], order: BottleColor[]): number {
  const home = new Map(secret.map((color, index) => [color, index]));
  const seen = new Array<boolean>(order.length).fill(false);
  let cycles = 0;

  for (let start = 0; start < order.length; start += 1) {
    if (seen[start]) {
      continue;
    }
    cycles += 1;
    let index = start;
    while (!seen[index]) {
      seen[index] = true;
      index = home.get(order[index]) ?? index;
    }
  }

  return order.length - cycles;
}

const COLOR_CODE: Record<BottleColor, number> = Object.fromEntries(
  BOTTLE_COLORS.map((color, index) => [color, index]),
) as Record<BottleColor, number>;
const COLOR_RADIX = BOTTLE_COLORS.length;

/**
 * Bottles that already match stay put. The rest are a small search, because two
 * blues are interchangeable and a single permutation would over-count the swaps.
 */
function minimumSwapsRepeated(secret: BottleColor[], order: BottleColor[]): number {
  const free = secret.flatMap((color, index) => (color === order[index] ? [] : [index]));
  if (free.length === 0) {
    return 0;
  }

  const start = encodeSlots(order, free);
  const goal = encodeSlots(secret, free);
  const dist = new Map<number, number>([[start, 0]]);
  const queue = [start];

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const steps = dist.get(current) ?? 0;
    const digits = decodeSlots(current, free.length);

    for (let i = 0; i < free.length; i += 1) {
      for (let j = i + 1; j < free.length; j += 1) {
        if (digits[i] === digits[j]) {
          continue;
        }
        const nextDigits = digits.slice();
        [nextDigits[i], nextDigits[j]] = [nextDigits[j], nextDigits[i]];
        const next = encodeDigits(nextDigits);
        if (dist.has(next)) {
          continue;
        }
        if (next === goal) {
          return steps + 1;
        }
        dist.set(next, steps + 1);
        queue.push(next);
      }
    }
  }

  return free.length;
}

function encodeSlots(colors: BottleColor[], indexes: number[]): number {
  return encodeDigits(indexes.map((index) => COLOR_CODE[colors[index]]));
}

function encodeDigits(digits: number[]): number {
  return digits.reduce((value, digit) => value * COLOR_RADIX + digit, 0);
}

function decodeSlots(value: number, length: number): number[] {
  const digits = new Array<number>(length);
  for (let index = length - 1; index >= 0; index -= 1) {
    digits[index] = value % COLOR_RADIX;
    value = Math.floor(value / COLOR_RADIX);
  }
  return digits;
}

/**
 * Winning always earns a star. Up to 12 extra swaps still earns 3 stars,
 * and up to 24 extra swaps earns 2. Only a clear longer than 3 minutes costs one star.
 */
export function victoryStars(moves: number, seconds: number, bestMoves: number): 1 | 2 | 3 {
  const extra = Math.max(0, moves - Math.max(0, bestMoves));
  let stars = extra <= 12 ? 3 : extra <= 24 ? 2 : 1;
  if (seconds > 180 && stars > 1) {
    stars -= 1;
  }
  if (stars >= 3) {
    return 3;
  }
  if (stars === 2) {
    return 2;
  }
  return 1;
}

function shuffleList<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function repairFixedPoints(order: BottleColor[], secret: BottleColor[]): BottleColor[] {
  const next = [...order];
  for (let index = 0; index < next.length; index += 1) {
    if (next[index] !== secret[index]) {
      continue;
    }
    const swapWith = next.findIndex(
      (color, other) =>
        other !== index && color !== secret[index] && next[index] !== secret[other],
    );
    if (swapWith === -1) {
      continue;
    }
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
  }
  return next;
}
