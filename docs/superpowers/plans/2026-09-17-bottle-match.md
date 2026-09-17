# Bottle Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Vite + Phaser 3 Bottle Match game where the player click-places blue/green bottles into the rack’s top slots to guess a hidden sequence.

**Architecture:** Pure game logic lives in `src/game/logic.ts` (unit-tested, no Phaser). `GameScene` loads the provided art, lays out the rack/slots/palette, and drives input, scoring UI, and the win overlay. `main.ts` only constructs the Phaser.Game.

**Tech Stack:** Vite, Phaser 3, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-09-17-bottle-match-design.md`

## Global Constraints

- Game size is 1280×720, scale mode FIT, auto-center.
- Use existing art only: `bg.png`, `rack.png`, `blue-bottle.png`, `green-bottle.png`.
- `rack.png` has **4** top openings and **4** curtain silhouettes (measured from the PNG). Slot count is 4, not 5.
- Click-to-place from a blue/green palette; no drag-and-drop.
- Curtain label is `?` until the board is full, then the integer count of exact position matches.
- No sound, timers, lives, extra colors, or backend.
- Do not commit unless the user asks.

---

### Task 1: Vite + Phaser + Vitest scaffold and assets

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/style.css`
- Create: `src/main.ts` (minimal Phaser boot; scene filled in Task 3)
- Create: `src/game/GameScene.ts` (empty scene stub)
- Copy: `images/*.png` → `public/images/`

**Interfaces:**
- Consumes: none
- Produces: `npm run dev` serves a blank Phaser canvas; `npm test` runs Vitest

- [ ] **Step 1: Write package.json, tsconfig, vite config, HTML, CSS, stub scene**

`package.json` scripts: `dev` (vite), `build` (`tsc --noEmit && vite build`), `test` (`vitest run`). Dependencies: `phaser`. Dev: `typescript`, `vite`, `vitest`.

`vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: { environment: 'node' },
});
```

`src/main.ts` boots Phaser with width 1280, height 720, parent `#game`, `Phaser.Scale.FIT` + `CENTER_BOTH`, scene `GameScene`.

- [ ] **Step 2: Copy assets into `public/images/`**

- [ ] **Step 3: `npm install` and confirm `npm run dev` starts**

---

### Task 2: Pure logic + unit tests

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/logic.ts`
- Create: `src/game/logic.test.ts`

**Interfaces:**
- Consumes: none
- Produces:

```ts
export const SLOT_COUNT = 4;
export type BottleColor = 'blue' | 'green';

export function emptySlots(): (BottleColor | null)[];
export function createSecret(random?: () => number): BottleColor[];
export function placeBottle(
  playerSlots: (BottleColor | null)[],
  index: number,
  selectedColor: BottleColor | null,
): (BottleColor | null)[];
export function countCorrect(
  secret: BottleColor[],
  playerSlots: (BottleColor | null)[],
): number;
export function isBoardFull(playerSlots: (BottleColor | null)[]): boolean;
export function curtainLabel(
  secret: BottleColor[],
  playerSlots: (BottleColor | null)[],
): string;
```

- [ ] **Step 1: Write failing tests in `src/game/logic.test.ts`**

Cover: secret length 4 and only blue/green; empty slots; place/replace/clear/no-op/out-of-range; countCorrect exact positions only; isBoardFull; curtainLabel `?` vs number.

- [ ] **Step 2: Run `npm test` and confirm failures**

- [ ] **Step 3: Implement `types.ts` and `logic.ts`**

`placeBottle`: copy the array. Out-of-range index → return original. If `selectedColor` is set, write it to the index (place or replace). If `selectedColor` is null and the slot is filled, set it to null (clear). If null and already empty, leave it.

`createSecret`: `Array.from({ length: SLOT_COUNT }, () => (random() < 0.5 ? 'blue' : 'green'))`.

- [ ] **Step 4: Run `npm test` and confirm pass**

---

### Task 3: GameScene layout, input, scoring, win overlay

**Files:**
- Modify: `src/game/GameScene.ts`
- Modify: `src/main.ts` if the scene import path needs updating

**Interfaces:**
- Consumes: all Task 2 helpers
- Produces: playable round + Play Again

Layout constants, as fractions of the rack texture (1380×1140):

```ts
const SLOT_X = [290 / 1380, 555 / 1380, 821 / 1380, 1088 / 1380];
const TOP_Y = 210 / 1140;      // trough floor; bottle origin (0.5, 1)
const HIDDEN_Y = 700 / 1140;   // silhouette bottoms
const SCORE_Y = 560 / 1140;    // curtain center
```

World position from a center-origin rack sprite:

```ts
x = rack.x - rack.displayWidth / 2 + SLOT_X[i] * rack.displayWidth
y = rack.y - rack.displayHeight / 2 + fracY * rack.displayHeight
```

Draw order: background → player bottles (show through transparent slot holes) → rack → hidden bottles (alpha 0 until win) → palette → curtain number → win overlay.

Input:
- Palette click toggles `selectedColor` and scales the chosen bottle to 1.12.
- Slot click (invisible Zone over each top opening) calls `placeBottle` unless `won`.
- After each place, refresh sprites, curtain text, and if `curtainLabel === '5'` wait — win is `countCorrect === SLOT_COUNT` while board full (i.e. 4).
- On win: lock input, show hidden bottles, show overlay “You matched them!” + Play Again.
- Play Again calls `startRound()`.

- [ ] **Step 1: Implement GameScene fully**

- [ ] **Step 2: `npm test` still passes; `npm run dev` runs the game**

- [ ] **Step 3: Verify in the browser** — place bottles, see `?` then a number, win at 4/4, Play Again resets. Tune slot Y/X if bottles miss the openings.

---

## Spec coverage

- Vite + Phaser 3 canvas 1280×720 FIT — Task 1
- Assets copied, not replaced — Task 1
- Hidden random sequence, click-to-place, replace, clear, deselect — Tasks 2–3
- Curtain `?` / count — Tasks 2–3
- Win reveal + Play Again — Task 3
- Unit tests for logic — Task 2
- Slot count aligned to the actual 4-slot rack PNG — Tasks 2–3
