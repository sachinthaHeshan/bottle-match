/** Device pixels per CSS pixel. Capped so retina screens stay sharp without a huge canvas. */
export const RENDER_SCALE = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

export const GAME_WIDTH = Math.round(1280 * RENDER_SCALE);
export const GAME_HEIGHT = Math.round(720 * RENDER_SCALE);

export function px(value: number): number {
  return Math.round(value * RENDER_SCALE);
}
