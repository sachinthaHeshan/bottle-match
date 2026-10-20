/** Ten bottle types, in sheet order: top row, then bottom row of images/bottles.png. */
export const BOTTLE_COLORS = [
  'red',
  'blue',
  'green',
  'pink',
  'yellow',
  'purple',
  'orange',
  'cyan',
  'gold',
  'violet',
] as const;

export type BottleColor = (typeof BOTTLE_COLORS)[number];

export const SLOT_COUNT = BOTTLE_COLORS.length;
