import type Phaser from "phaser";
import { BOTTLE_COLORS, type BottleColor } from "./types";

/** Tight crops of images/bottles.png, one frame per bottle type. */
export const BOTTLE_FRAMES: Record<
  BottleColor,
  { x: number; y: number; w: number; h: number }
> = {
  red: { x: 13, y: 10, w: 327, h: 418 },
  blue: { x: 368, y: 15, w: 316, h: 405 },
  green: { x: 721, y: 11, w: 323, h: 419 },
  pink: { x: 1068, y: 20, w: 352, h: 404 },
  yellow: { x: 1438, y: 15, w: 324, h: 408 },
  purple: { x: 20, y: 448, w: 319, h: 418 },
  orange: { x: 370, y: 453, w: 312, h: 414 },
  cyan: { x: 735, y: 449, w: 307, h: 414 },
  gold: { x: 1066, y: 447, w: 358, h: 418 },
  violet: { x: 1446, y: 439, w: 315, h: 427 },
};

const ART_KEYS = [
  "rack",
  "cover",
  "title",
  "play",
  "victory",
  "continue",
  "star",
  "tap-bottle",
  "tap-swap",
  "sound",
  "numbers",
  "levels",
  "bottles",
];

/**
 * Uploads each loaded artwork image unchanged into a power-of-two texture
 * so the GPU can mipmap it. Scaling that texture down then stays sharp.
 */
export function useSharpTextures(scene: Phaser.Scene): void {
  for (const key of ART_KEYS) {
    if (!scene.textures.exists(key)) {
      continue;
    }

    const source = scene.textures.get(key).getSourceImage();
    if (!(source instanceof HTMLImageElement)) {
      continue;
    }

    const canvas = document.createElement("canvas");
    canvas.width = nextPowerOfTwo(source.width);
    canvas.height = nextPowerOfTwo(source.height);

    const context = canvas.getContext("2d");
    if (!context) {
      continue;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0);

    scene.textures.remove(key);
    const texture = scene.textures.addCanvas(key, canvas);
    if (!texture) {
      continue;
    }

    texture.get().setSize(source.width, source.height, 0, 0);
  }
}

/** Cuts each bottle out of the loaded sheet into its own mipmapped texture. */
export function sliceBottleSheet(scene: Phaser.Scene): void {
  for (const color of BOTTLE_COLORS) {
    const frame = BOTTLE_FRAMES[color];
    addSharpSlice(scene, "bottles", color, frame.x, frame.y, frame.w, frame.h);
  }
}

/** Copies one rectangle out of a loaded image into its own mipmapped texture. */
export function addSharpSlice(
  scene: Phaser.Scene,
  sourceKey: string,
  frameName: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const source = scene.textures.get(sourceKey).getSourceImage();
  if (
    !(source instanceof HTMLImageElement) &&
    !(source instanceof HTMLCanvasElement)
  ) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = nextPowerOfTwo(width);
  canvas.height = nextPowerOfTwo(height);
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, x, y, width, height, 0, 0, width, height);

  if (scene.textures.exists(frameName)) {
    scene.textures.remove(frameName);
  }
  const texture = scene.textures.addCanvas(frameName, canvas);
  texture?.get().setSize(width, height, 0, 0);
}

/** Extra blur on images/bottle-shadow.png so silhouettes read through the curtain. */
const SHADOW_BLUR_PX = 60;

/** Soft bottle silhouette on the curtain, from images/bottle-shadow.png. */
export function addBottleShadow(scene: Phaser.Scene): void {
  if (!scene.textures.exists("bottle-shadow-src")) {
    return;
  }
  if (scene.textures.exists("bottle-shadow")) {
    scene.textures.remove("bottle-shadow");
  }

  const source = scene.textures.get("bottle-shadow-src").getSourceImage();
  if (
    !(source instanceof HTMLImageElement) &&
    !(source instanceof HTMLCanvasElement)
  ) {
    return;
  }

  const pad = SHADOW_BLUR_PX * 2;
  const width = source.width + pad * 2;
  const height = source.height + pad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = nextPowerOfTwo(width);
  canvas.height = nextPowerOfTwo(height);
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.filter = `blur(${SHADOW_BLUR_PX}px)`;
  context.drawImage(source, pad, pad, source.width, source.height);
  context.filter = "none";

  scene.textures
    .addCanvas("bottle-shadow", canvas)
    ?.get()
    .setSize(width, height, 0, 0);
}

function nextPowerOfTwo(value: number): number {
  let size = 1;
  while (size < value) {
    size *= 2;
  }
  return size;
}
