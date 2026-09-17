import { SLOT_COUNT, type BottleColor } from './types';

export { SLOT_COUNT };
export type { BottleColor };

export function emptySlots(): (BottleColor | null)[] {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

export function createSecret(random: () => number = Math.random): BottleColor[] {
  return Array.from({ length: SLOT_COUNT }, () =>
    random() < 0.5 ? 'blue' : 'green',
  );
}

export function placeBottle(
  playerSlots: (BottleColor | null)[],
  index: number,
  selectedColor: BottleColor | null,
): (BottleColor | null)[] {
  if (index < 0 || index >= playerSlots.length) {
    return playerSlots;
  }

  const next = [...playerSlots];
  if (selectedColor) {
    next[index] = selectedColor;
  } else if (next[index] !== null) {
    next[index] = null;
  }
  return next;
}

export function countCorrect(
  secret: BottleColor[],
  playerSlots: (BottleColor | null)[],
): number {
  return secret.reduce(
    (count, color, index) => count + (playerSlots[index] === color ? 1 : 0),
    0,
  );
}

export function isBoardFull(playerSlots: (BottleColor | null)[]): boolean {
  return playerSlots.every((slot) => slot !== null);
}

export function curtainLabel(
  secret: BottleColor[],
  playerSlots: (BottleColor | null)[],
): string {
  if (!isBoardFull(playerSlots)) {
    return '?';
  }
  return String(countCorrect(secret, playerSlots));
}
