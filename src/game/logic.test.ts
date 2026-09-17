import { describe, expect, it } from 'vitest';
import {
  SLOT_COUNT,
  countCorrect,
  createSecret,
  curtainLabel,
  emptySlots,
  isBoardFull,
  placeBottle,
} from './logic';

describe('emptySlots', () => {
  it('returns four empty slots', () => {
    expect(emptySlots()).toEqual([null, null, null, null]);
  });
});

describe('createSecret', () => {
  it('returns four blue/green colors from the rng', () => {
    const values = [0.1, 0.7, 0.2, 0.9];
    let i = 0;
    const secret = createSecret(() => values[i++] ?? 0);
    expect(secret).toEqual(['blue', 'green', 'blue', 'green']);
    expect(secret).toHaveLength(SLOT_COUNT);
  });

  it('only emits blue or green', () => {
    const secret = createSecret(() => 0.3);
    expect(secret.every((color) => color === 'blue' || color === 'green')).toBe(
      true,
    );
  });
});

describe('placeBottle', () => {
  it('places a selected color into an empty slot', () => {
    expect(placeBottle(emptySlots(), 1, 'blue')).toEqual([
      null,
      'blue',
      null,
      null,
    ]);
  });

  it('replaces a filled slot when a color is selected', () => {
    const slots = placeBottle(emptySlots(), 0, 'blue');
    expect(placeBottle(slots, 0, 'green')).toEqual([
      'green',
      null,
      null,
      null,
    ]);
  });

  it('clears a filled slot when no color is selected', () => {
    const slots = placeBottle(emptySlots(), 2, 'green');
    expect(placeBottle(slots, 2, null)).toEqual([null, null, null, null]);
  });

  it('does nothing when clearing an empty slot', () => {
    expect(placeBottle(emptySlots(), 0, null)).toEqual(emptySlots());
  });

  it('ignores out-of-range indexes', () => {
    const slots = placeBottle(emptySlots(), 0, 'blue');
    expect(placeBottle(slots, -1, 'green')).toBe(slots);
    expect(placeBottle(slots, 4, 'green')).toBe(slots);
  });
});

describe('countCorrect', () => {
  const secret = ['blue', 'green', 'blue', 'green'] as const;

  it('counts exact position matches only', () => {
    expect(countCorrect([...secret], ['blue', 'green', 'green', 'blue'])).toBe(
      2,
    );
  });

  it('does not count empty slots', () => {
    expect(countCorrect([...secret], ['blue', null, 'blue', null])).toBe(2);
  });

  it('returns 4 when every slot matches', () => {
    expect(countCorrect([...secret], [...secret])).toBe(4);
  });
});

describe('isBoardFull', () => {
  it('is false when any slot is empty', () => {
    expect(isBoardFull(['blue', 'green', 'blue', null])).toBe(false);
  });

  it('is true when every slot is filled', () => {
    expect(isBoardFull(['blue', 'green', 'blue', 'green'])).toBe(true);
  });
});

describe('curtainLabel', () => {
  const secret = ['blue', 'blue', 'green', 'green'] as const;

  it('shows ? until the board is full', () => {
    expect(curtainLabel([...secret], ['blue', 'blue', 'green', null])).toBe('?');
  });

  it('shows the correct-count when the board is full', () => {
    expect(curtainLabel([...secret], ['blue', 'green', 'green', 'blue'])).toBe(
      '2',
    );
  });
});
