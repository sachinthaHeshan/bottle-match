import { describe, expect, it } from 'vitest';
import {
  COVER_SRC_W,
  RACK_CAP_W,
  RACK_SRC_W,
  coverMiddleStretch,
  expandedWidth,
  rackStretch,
  slotCountForLevel,
  slotLogicalX,
} from './rack';

describe('rack stretch', () => {
  it('leaves the level 1 shelf at its original width and marks', () => {
    expect(slotCountForLevel(1)).toBe(4);
    expect(rackStretch(4)).toBe(1);
    expect(expandedWidth(1)).toBe(RACK_SRC_W);
    expect([0, 1, 2, 3].map((index) => slotLogicalX(4, index))).toEqual([295, 558, 821, 1084]);
  });

  it('adds one bottle on each level through ten', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((level) => slotCountForLevel(level))).toEqual([
      4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('grows only the middle enough for 10 bottles at the same spacing', () => {
    expect(slotCountForLevel(7)).toBe(10);
    const stretch = rackStretch(10);
    const width = expandedWidth(stretch);
    const slots = Array.from({ length: 10 }, (_, index) => slotLogicalX(10, index));

    expect(stretch).toBeGreaterThan(1);
    expect(slots[1] - slots[0]).toBeCloseTo(263);
    expect(slots[0]).toBeGreaterThan(RACK_CAP_W);
    expect(slots[9]).toBeLessThan(width - RACK_CAP_W);
    expect(width - slots[9]).toBeCloseTo(RACK_SRC_W - 1084);
  });

  it('keeps the curtain knobs the same size on level 1', () => {
    const rackWidth = 1380 * 0.5;
    const coverScale = (rackWidth * 0.9) / COVER_SRC_W;
    expect(coverMiddleStretch(rackWidth, coverScale)).toBeCloseTo(1);
  });
});
