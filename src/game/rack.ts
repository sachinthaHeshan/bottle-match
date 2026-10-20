/** Source pixels of rack2.png. The curved posts stay in the end caps; only the middle stretches. */
export const RACK_SRC_W = 1380;
export const RACK_SRC_H = 1140;
export const RACK_CAP_W = 220;
export const RACK_MID_W = RACK_SRC_W - RACK_CAP_W * 2;

/** Source pixels of Cover.png. The gold knobs stay in the end caps. */
export const COVER_SRC_W = 1774;
export const COVER_SRC_H = 887;
export const COVER_CAP_W = 220;
export const COVER_MID_W = COVER_SRC_W - COVER_CAP_W * 2;

export const LEVEL1_SLOTS = 4;
export const MAX_LEVEL = 7;
export const MAX_SLOTS = LEVEL1_SLOTS + MAX_LEVEL - 1;

const LEVEL1_SLOT_X = [295, 558, 821, 1084];
const SLOT_LEFT = LEVEL1_SLOT_X[0];
const SLOT_RIGHT_INSET = RACK_SRC_W - LEVEL1_SLOT_X[LEVEL1_SLOT_X.length - 1];
export const SLOT_PITCH = (LEVEL1_SLOT_X[LEVEL1_SLOT_X.length - 1] - SLOT_LEFT) / (LEVEL1_SLOTS - 1);

/** Level 1 has four bottles. Each later level adds one, up to ten on level 7. */
export function slotCountForLevel(level: number): number {
  const clamped = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level) || 1));
  return LEVEL1_SLOTS + clamped - 1;
}

/** Horizontal scale of the rack's middle slice. Level 1 is 1, so the shelf looks unchanged. */
export function rackStretch(slotCount: number): number {
  if (slotCount <= LEVEL1_SLOTS) {
    return 1;
  }
  const width = SLOT_LEFT + (slotCount - 1) * SLOT_PITCH + SLOT_RIGHT_INSET;
  return (width - RACK_CAP_W * 2) / RACK_MID_W;
}

export function expandedWidth(stretch: number): number {
  return RACK_CAP_W * 2 + RACK_MID_W * stretch;
}

/** Bottle center along the assembled rack, in the same pixels as the source art. */
export function slotLogicalX(slotCount: number, index: number): number {
  if (slotCount <= LEVEL1_SLOTS) {
    return LEVEL1_SLOT_X[index] ?? LEVEL1_SLOT_X[0];
  }
  return SLOT_LEFT + index * SLOT_PITCH;
}

/**
 * How far to stretch the curtain middle so the cloth stays about 90% of the rack
 * while the end knobs keep their level-1 size.
 */
export function coverMiddleStretch(rackDisplayWidth: number, coverScale: number): number {
  const desiredSrc = (rackDisplayWidth * 0.9) / coverScale;
  return (desiredSrc - COVER_CAP_W * 2) / COVER_MID_W;
}
