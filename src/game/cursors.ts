import arrowUrl from '../../images/cursor-arrow-32.png';
import pointerUrl from '../../images/cursor-pointer-32.png';
import type Phaser from 'phaser';

/** Tip of the arrow, in cursor-image pixels. */
const ARROW_HOTSPOT = '2 1';
/** Tip of the pointing finger, in cursor-image pixels. */
const POINTER_HOTSPOT = '8 0';

export const ARROW_CURSOR = `url("${arrowUrl}") ${ARROW_HOTSPOT}, auto`;
export const POINTER_CURSOR = `url("${pointerUrl}") ${POINTER_HOTSPOT}, pointer`;

export function useArrowCursor(scene: Phaser.Scene): void {
  scene.input.setDefaultCursor(ARROW_CURSOR);
}
