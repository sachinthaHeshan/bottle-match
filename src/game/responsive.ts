import type Phaser from 'phaser';
import { renderScale } from './display';

export type DeviceKind = 'phone' | 'tablet' | 'desktop';

export type StageFrame = {
  width: number;
  height: number;
  kind: DeviceKind;
  portrait: boolean;
  pad: number;
  musicSize: number;
  bannerWidth: number;
  hudWidth: number;
  /** Y where the rack band starts, under the level badge. */
  top: number;
  /** Y where the rack band ends, above the moves and time badges. */
  bottom: number;
  rackMaxWidth: number;
  rackMaxHeight: number;
  centerX: number;
};

export function cssViewport(): { width: number; height: number } {
  const el = document.getElementById('game');
  return {
    width: el?.clientWidth || window.innerWidth,
    height: el?.clientHeight || window.innerHeight,
  };
}

export function deviceKind(cssWidth: number, cssHeight: number): DeviceKind {
  const shortSide = Math.min(cssWidth, cssHeight);
  const portrait = cssHeight > cssWidth * 1.02;
  if (shortSide < 600) {
    return 'phone';
  }
  if (!portrait && cssWidth >= 1180 && cssHeight >= 640) {
    return 'desktop';
  }
  return 'tablet';
}

/**
 * Landscape design size. Phaser EXPAND grows the other axis so the canvas
 * matches the screen instead of letterboxing a 16:9 board.
 * Phones stay at 1x so a tall screen does not overflow the GPU texture limit.
 */
export function gameBaseSize(): { width: number; height: number } {
  const view = cssViewport();
  const shortSide = Math.min(view.width, view.height);
  const dpr = shortSide < 700 ? 1 : renderScale();
  return {
    width: Math.round(1280 * dpr),
    height: Math.round(720 * dpr),
  };
}

export function stageFrame(
  width: number,
  height: number,
  kind: DeviceKind = deviceKind(cssViewport().width, cssViewport().height),
): StageFrame {
  const portrait = height > width * 1.02;
  const landscapePhone = !portrait && kind === 'phone';
  const shortSide = Math.min(width, height);
  const pad = shortSide * (kind === 'phone' ? 0.018 : kind === 'tablet' ? 0.018 : 0.012);
  const musicSize =
    shortSide *
    (landscapePhone ? 0.085 : kind === 'phone' ? 0.12 : kind === 'tablet' ? 0.1 : 84 / 720);
  const bannerWidth = Math.min(
    landscapePhone
      ? shortSide * 0.2
      : portrait
        ? width * (kind === 'tablet' ? 0.38 : 0.46)
        : kind === 'phone'
          ? shortSide * 0.38
          : kind === 'tablet'
            ? shortSide * 0.26
            : shortSide * (220 / 720),
    width - musicSize * 2 - pad * 2,
  );
  const bannerHeight = bannerWidth * (316 / 482);
  const hudWidth = Math.min(
    (width - pad * 3) / 2,
    landscapePhone
      ? shortSide * 0.34
      : portrait
        ? width * (kind === 'tablet' ? 0.32 : 0.4)
        : kind === 'phone'
          ? shortSide * 0.42
          : kind === 'tablet'
            ? shortSide * 0.32
            : shortSide * (340 / 720),
  );
  const hudHeight = hudWidth * (420 / 1098);
  const top = landscapePhone
    ? Math.max(musicSize, bannerHeight) + pad * 0.35
    : portrait
      ? bannerHeight + pad * 1.45
      : Math.max(musicSize, bannerHeight * 0.7) + pad;
  const bottom = hudHeight + pad * (landscapePhone ? 0.35 : portrait ? 1.4 : kind === 'phone' ? 1.05 : 1.2);

  return {
    width,
    height,
    kind,
    portrait,
    pad,
    musicSize,
    bannerWidth: Math.max(shortSide * (landscapePhone ? 0.14 : 0.16), bannerWidth),
    hudWidth: Math.max(shortSide * (landscapePhone ? 0.24 : 0.18), hudWidth),
    top,
    bottom,
    rackMaxWidth: Math.max(80, width - pad * 2),
    rackMaxHeight: Math.max(80, height - top - bottom),
    centerX: width / 2,
  };
}

export function applyResponsiveGameScale(game: Phaser.Game): void {
  const sync = () => game.scale.refresh();
  window.addEventListener('orientationchange', () => {
    window.setTimeout(sync, 180);
  });
  window.visualViewport?.addEventListener('resize', sync);
  window.addEventListener('load', sync);
  requestAnimationFrame(sync);
}
