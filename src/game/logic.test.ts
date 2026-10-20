import { describe, expect, it } from 'vitest';
import {
  SLOT_COUNT,
  countCorrect,
  createSecret,
  createWrongOrder,
  curtainLabel,
  minimumSwaps,
  paletteForLevel,
  swapBottles,
  victoryStars,
} from './logic';
import { BOTTLE_COLORS } from './types';

describe('createSecret', () => {
  it('is a permutation of every bottle', () => {
    const secret = createSecret(() => 0);
    expect(secret).toHaveLength(SLOT_COUNT);
    expect([...secret].sort()).toEqual([...BOTTLE_COLORS].sort());
  });

  it('follows the rng when shuffling', () => {
    expect(createSecret(() => 0)).toEqual([
      'blue',
      'green',
      'pink',
      'yellow',
      'purple',
      'orange',
      'cyan',
      'gold',
      'violet',
      'red',
    ]);
  });
});

describe('createWrongOrder', () => {
  it('uses each bottle once and matches no secret slot', () => {
    const secret = ['blue', 'green', 'yellow', 'red'] as const;
    const order = createWrongOrder([...secret], () => 0.5);
    expect([...order].sort()).toEqual([...secret].sort());
    expect(order.every((color, index) => color !== secret[index])).toBe(true);
  });

  it('rotates when every shuffle still matches the secret', () => {
    const secret = createSecret(() => 0);
    const order = createWrongOrder(secret, () => 0);
    expect(countCorrect(secret, order)).toBe(0);
    expect([...order].sort()).toEqual([...secret].sort());
  });
});

describe('swapBottles', () => {
  const slots = ['blue', 'green', 'yellow', 'red'] as const;

  it('swaps the two chosen slots', () => {
    expect(swapBottles([...slots], 0, 2)).toEqual(['yellow', 'green', 'blue', 'red']);
  });

  it('returns the same slots when both indexes match', () => {
    const current = [...slots];
    expect(swapBottles(current, 1, 1)).toBe(current);
  });

  it('ignores out-of-range indexes', () => {
    const current = [...slots];
    expect(swapBottles(current, -1, 1)).toBe(current);
    expect(swapBottles(current, 0, 4)).toBe(current);
  });
});

describe('countCorrect', () => {
  const secret = ['blue', 'green', 'yellow', 'red'] as const;

  it('counts exact position matches only', () => {
    expect(countCorrect([...secret], ['blue', 'yellow', 'green', 'red'])).toBe(2);
  });

  it('returns 4 when the order matches', () => {
    expect(countCorrect([...secret], [...secret])).toBe(4);
  });

  it('returns 0 for a full mismatch', () => {
    expect(countCorrect([...secret], ['green', 'yellow', 'red', 'blue'])).toBe(0);
  });
});

describe('minimumSwaps', () => {
  const secret = ['blue', 'green', 'yellow', 'red'] as const;

  it('counts two swaps for two swapped pairs', () => {
    expect(minimumSwaps([...secret], ['green', 'blue', 'red', 'yellow'])).toBe(2);
  });

  it('counts three swaps for a four-bottle cycle', () => {
    expect(minimumSwaps([...secret], ['green', 'yellow', 'red', 'blue'])).toBe(3);
  });

  it('counts zero when the rack is already solved', () => {
    expect(minimumSwaps([...secret], [...secret])).toBe(0);
  });
});

describe('victoryStars', () => {
  it('awards 3 stars for a comfortable clear, including a slow one under 3 minutes', () => {
    expect(victoryStars(2, 12, 2)).toBe(3);
    expect(victoryStars(3, 20, 3)).toBe(3);
    expect(victoryStars(14, 40, 2)).toBe(3);
    expect(victoryStars(2, 180, 2)).toBe(3);
  });

  it('awards 2 stars for a loose clear or one that runs past 3 minutes', () => {
    expect(victoryStars(26, 40, 2)).toBe(2);
    expect(victoryStars(2, 181, 2)).toBe(2);
  });

  it('keeps a single star when the clear is far off the shortest path', () => {
    expect(victoryStars(30, 40, 2)).toBe(1);
  });
});

describe('level palettes', () => {
  it('adds one bottle each level from four through ten', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((level) => paletteForLevel(level).length)).toEqual([
      4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('deals a unique bottle for every slot and uses all ten on the last level', () => {
    expect(paletteForLevel(1)).toEqual(['red', 'blue', 'green', 'pink']);
    expect(paletteForLevel(7)).toEqual([...BOTTLE_COLORS]);
    expect(new Set(paletteForLevel(7)).size).toBe(BOTTLE_COLORS.length);
  });

  it('shuffles a full rack that is not already solved', () => {
    const secret = createSecret(() => 0.3, paletteForLevel(7));
    const order = createWrongOrder(secret, () => 0.3);
    expect([...order].sort()).toEqual([...secret].sort());
    expect(countCorrect(secret, order)).toBeLessThan(secret.length);
  });
});

describe('minimumSwaps with repeated colors', () => {
  it('counts one swap when two duplicates are crossed', () => {
    expect(
      minimumSwaps(
        ['blue', 'blue', 'green'],
        ['green', 'blue', 'blue'],
      ),
    ).toBe(1);
  });

  it('counts two swaps for two crossed pairs', () => {
    expect(
      minimumSwaps(
        ['blue', 'green', 'blue', 'green'],
        ['green', 'blue', 'green', 'blue'],
      ),
    ).toBe(2);
  });

  it('counts zero when repeated colors already match', () => {
    expect(minimumSwaps(['red', 'red', 'yellow'], ['red', 'red', 'yellow'])).toBe(0);
  });

  it('finishes a full level 7 rack quickly', () => {
    const secret = createSecret(() => 0.2, paletteForLevel(7));
    const order = createWrongOrder(secret, () => 0.8);
    const started = performance.now();
    const swaps = minimumSwaps(secret, order);
    expect(performance.now() - started).toBeLessThan(250);
    expect(swaps).toBeGreaterThanOrEqual(0);
    expect(swaps).toBeLessThan(order.length);
  });
});

describe('curtainLabel', () => {
  it('shows how many bottles are in the right slot', () => {
    expect(
      curtainLabel(
        ['blue', 'green', 'yellow', 'red'],
        ['blue', 'yellow', 'green', 'red'],
      ),
    ).toBe('2');
  });
});
