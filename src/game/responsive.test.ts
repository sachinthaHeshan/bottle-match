import { describe, expect, it } from 'vitest';
import { stageFrame } from './responsive';

describe('stageFrame', () => {
  it('keeps a phone portrait board between the badge and the footer', () => {
    const frame = stageFrame(1280, 2770, 'phone');
    expect(frame.portrait).toBe(true);
    expect(frame.hudWidth * 2 + frame.pad * 3).toBeLessThanOrEqual(frame.width + 1);
    expect(frame.bannerWidth + frame.musicSize * 2).toBeLessThan(frame.width);
    expect(frame.rackMaxHeight).toBeGreaterThan(frame.height * 0.45);
  });

  it('keeps the rack large on a phone held sideways', () => {
    const frame = stageFrame(1560, 720, 'phone');
    expect(frame.portrait).toBe(false);
    expect(frame.rackMaxHeight).toBeGreaterThan(frame.height * 0.62);
    expect(frame.hudWidth * 2 + frame.pad * 3).toBeLessThanOrEqual(frame.width + 1);
    expect(frame.bannerWidth + frame.musicSize * 2).toBeLessThan(frame.width);
  });

  it('matches the desktop badge sizes', () => {
    const frame = stageFrame(1280, 720, 'desktop');
    expect(frame.bannerWidth).toBeCloseTo(220, 0);
    expect(frame.hudWidth).toBeCloseTo(340, 0);
    expect(frame.rackMaxWidth).toBeLessThan(frame.width);
  });

  it('gives a tablet portrait more margin than a phone', () => {
    const tablet = stageFrame(1536, 2048, 'tablet');
    const phone = stageFrame(1536, 2048, 'phone');
    expect(tablet.portrait).toBe(true);
    expect(tablet.bannerWidth).toBeLessThan(phone.bannerWidth);
    expect(tablet.hudWidth).toBeLessThan(phone.hudWidth);
  });
});
