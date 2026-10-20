/** Device pixels per CSS pixel. Capped so retina screens stay sharp without a huge canvas. */
export function renderScale(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
}
