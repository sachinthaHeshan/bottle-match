# Bottle Match — Design Spec

Date: 2026-09-17

## Goal

A browser puzzle game: guess a hidden 4-bottle sequence of blue and green bottles (matching the four openings in `rack.png`). The player places bottles in the rack’s top row. When all four slots are filled, a number on the curtain shows how many positions match the secret. The player wins at 4/4.

## Stack

- Vite
- Phaser 3
- TypeScript
- No backend, no extra routes, no sound in v1

## Assets (existing)

Copy from `images/` into `public/images/`:

- `bg.png` — landscape background
- `rack.png` — wooden rack with 5 top slots and a curtain covering the hidden row
- `blue-bottle.png` — player/secret bottle
- `green-bottle.png` — player/secret bottle

Do not generate replacement art.

## Canvas and layout

- Game size: 1280×720, landscape
- Scale mode: FIT, centered in the page, dark or meadow-matching page background
- Layers, back to front:
  1. Full-canvas `bg.png`
  2. Centered `rack.png` (sized to fit with margin for palette and title)
  3. Hidden-row bottles (invisible until win; aligned to the four curtain silhouettes)
  4. Top-row player bottles (aligned to the four open slots)
  5. Palette bottles below the rack: blue on the left, green on the right
  6. Correct-count text centered on the curtain
  7. Win overlay: “You matched them!” plus a Play Again button

Slot hit areas are invisible rectangles over the five top openings. Palette bottles are themselves clickable.

Exact slot X positions are measured against `rack.png` during implementation so bottles sit in the openings, not floating beside them.

## Gameplay

### Secret

On each round start, generate `secret: BottleColor[]` of length 4. Each index is independently `'blue'` or `'green'` with equal probability. Duplicates are allowed. The secret is not shown until the player wins.

### Palette selection

- Click the blue palette bottle → `selectedColor = 'blue'` (visual highlight on blue, clear green).
- Click the green palette bottle → `selectedColor = 'green'`.
- Click the already-selected palette bottle → `selectedColor = null` (deselect).

### Placing, replacing, clearing

While not in the won state:

- Click an empty top slot with a selected color → place that color in the slot.
- Click a filled top slot with a selected color → replace with the selected color.
- Click a filled top slot with no color selected → clear the slot (`null`).
- Click an empty top slot with no color selected → no-op.

Selection stays after a place/replace so the player can fill several slots of the same color without re-clicking the palette.

### Scoring

`correctCount` is the number of indices `i` where `playerSlots[i] === secret[i]`. Empty slots never match.

Display rules:

- If any of the four top slots is empty, the curtain text is `?`.
- If all four are filled, the curtain text is the integer `0`–`4`.
- Recalculate immediately after every place, replace, or clear.

Position match only. There is no “right color, wrong slot” hint.

### Win

When `correctCount === 4`:

- Enter `won` state
- Ignore further slot and palette clicks
- Reveal the five secret bottles in the hidden row (curtain stays in the art; bottles appear aligned to the silhouettes)
- Show win copy and Play Again

Play Again:

- Generate a new secret
- Clear all top slots
- Hide secret bottles
- Reset selection and score display to `?`
- Hide the win overlay
- Re-enable input

## Data model

```ts
type BottleColor = 'blue' | 'green';

type GameState = {
  secret: BottleColor[];           // length 4
  playerSlots: (BottleColor | null)[]; // length 4
  selectedColor: BottleColor | null;
  won: boolean;
};
```

Pure helpers (unit-tested, no Phaser):

- `createSecret(): BottleColor[]`
- `countCorrect(secret, playerSlots): number`
- `isBoardFull(playerSlots): boolean`
- `placeBottle(playerSlots, index, selectedColor): (BottleColor | null)[]`  
  Implements place / replace / clear as specified above. Returns a new array. Ignores out-of-range index. If `won` is handled in the scene, this helper does not need a `won` flag.

## File structure

```
public/images/     bg.png, rack.png, blue-bottle.png, green-bottle.png
src/main.ts        Phaser.Game config, parent #game
src/game/types.ts  BottleColor and shared types
src/game/logic.ts  secret, scoring, placeBottle
src/game/GameScene.ts  assets, layout, input, win overlay
index.html
vite.config.ts
package.json
```

## Visual feedback (required)

- Selected palette bottle: scale up slightly and/or a glow/tint so the chosen color is obvious.
- Curtain number: large, readable, centered on the fabric (not on the top slots).
- Page title is optional; if present, keep it short (“Bottle Match”).

## Out of scope (v1)

- Sound, timers, lives, levels, undo stack, drag-and-drop, more than two colors, “correct color wrong position” hints, persistence, mobile-specific UI beyond FIT scaling.

## Success criteria

1. `npm install` and `npm run dev` launches the game in the browser.
2. A new secret is generated on load and on Play Again.
3. Player can fill, replace, and clear the four top slots via click-to-place.
4. Curtain shows `?` until the board is full, then the exact number of correct positions.
5. At 4/4 the secret bottles appear and Play Again starts a new round.
6. Unit tests cover secret length/colors, scoring, board-full, and place/replace/clear.
