import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, px } from "./display";
import {
  countCorrect,
  createSecret,
  createWrongOrder,
  minimumSwaps,
  paletteForLevel,
  swapBottles,
  victoryStars,
  type BottleColor,
} from "./logic";
import { BOTTLE_COLORS } from "./types";
import { POINTER_CURSOR, useArrowCursor } from "./cursors";
import {
  createMusicButton,
  playBackgroundMusic,
  syncBackgroundMusic,
} from "./music";
import {
  addBottleShadow,
  addSharpSlice,
  sliceBottleSheet,
  useSharpTextures,
} from "./sharpBottles";
import {
  COVER_CAP_W,
  COVER_MID_W,
  COVER_SRC_H,
  COVER_SRC_W,
  MAX_LEVEL,
  MAX_SLOTS,
  RACK_CAP_W,
  RACK_MID_W,
  RACK_SRC_H,
  SLOT_PITCH,
  coverMiddleStretch,
  expandedWidth,
  rackStretch,
  slotCountForLevel,
  slotLogicalX,
} from "./rack";

const TOP_SHELF_Y = 318 / 1140;
const BOTTOM_SHELF_Y = 748 / 1140;
const TOP_BOTTLE_HEIGHT = 0.26;
const BOTTOM_BOTTLE_HEIGHT = 0.23;
/** Height of each curtain silhouette, as a fraction of the rack height. */
const SHADOW_HEIGHT = BOTTOM_BOTTLE_HEIGHT * 0.94;
const LIP_TOP = 330;
const LIP_HEIGHT = 96;
const RACK_HEIGHT = 404;
const RACK_CENTER_Y = 418;
const TUTORIAL_KEY = "bottle-match-tutorial";

/** Tight crops of images/numbers.png, in order from 0 through 10. */
const NUMBER_FRAMES = [
  [66, 11, 349, 347],
  [436, 14, 234, 341],
  [712, 13, 328, 345],
  [1062, 13, 320, 345],
  [1406, 13, 346, 345],
  [1785, 10, 301, 348],
  [55, 360, 339, 359],
  [411, 366, 326, 349],
  [771, 360, 339, 356],
  [1144, 360, 335, 359],
  [1518, 360, 552, 354],
] as const;

/** Crops of images/time-moves.png. Time is the left badge, moves the right. */
const TIME_FRAME = { x: 0, y: 160, w: 1098, h: 420 };
const MOVES_FRAME = { x: 1104, y: 160, w: 1068, h: 420 };
/** Center of the empty wood well inside each crop. */
const TIME_WELL = {
  x: 639 / TIME_FRAME.w,
  y: (413 - TIME_FRAME.y) / TIME_FRAME.h,
};
const MOVES_WELL = {
  x: (1740 - MOVES_FRAME.x) / MOVES_FRAME.w,
  y: (414 - MOVES_FRAME.y) / MOVES_FRAME.h,
};

/** Tight crops of images/levels.png, levels 1 through 7. */
const LEVEL_FRAMES = [
  [33, 35, 482, 316],
  [531, 32, 478, 319],
  [1025, 30, 481, 320],
  [31, 401, 488, 309],
  [534, 399, 476, 309],
  [1025, 399, 485, 312],
  [527, 714, 487, 301],
] as const;

export class GameScene extends Phaser.Scene {
  private level = 1;
  private secret: BottleColor[] = [];
  private playerSlots: BottleColor[] = [...BOTTLE_COLORS];
  private selectedIndex: number | null = null;
  private swapping = false;
  private expanding = false;
  private won = false;
  private moves = 0;
  private bestMoves = 2;
  private roundStartedAt = 0;
  private midStretch = 1;

  private rackLeft!: Phaser.GameObjects.Image;
  private rackMid!: Phaser.GameObjects.Image;
  private rackRight!: Phaser.GameObjects.Image;
  private lipLeft!: Phaser.GameObjects.Image;
  private lipMid!: Phaser.GameObjects.Image;
  private lipRight!: Phaser.GameObjects.Image;
  private cover!: Phaser.GameObjects.Container;
  private coverLeft!: Phaser.GameObjects.Image;
  private coverMids: Phaser.GameObjects.Image[] = [];
  private coverRight!: Phaser.GameObjects.Image;
  private coverHomeY = 0;
  private coverHeight = 1;
  private levelBanner!: Phaser.GameObjects.Image;
  private levelBannerBase = 1;
  private zones: Phaser.GameObjects.Zone[] = [];
  private victoryTimer?: Phaser.Time.TimerEvent;
  private playerBottles: Phaser.GameObjects.Image[] = [];
  private hiddenBottles: Phaser.GameObjects.Image[] = [];
  private bottleShadows: Phaser.GameObjects.Image[] = [];
  private scoreMark!: Phaser.GameObjects.Image;
  private correctLabel!: Phaser.GameObjects.Image;
  private winBackdrop!: Phaser.GameObjects.Rectangle;
  private winOverlay!: Phaser.GameObjects.Container;
  private movesText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private movesHud!: Phaser.GameObjects.Image;
  private timeHud!: Phaser.GameObjects.Image;
  private movesHudText!: Phaser.GameObjects.Text;
  private timeHudText!: Phaser.GameObjects.Text;
  private shownSecond = -1;
  private clockRunning = false;
  private continueButton!: Phaser.GameObjects.Image;
  private continueBase = 1;
  private stars: Phaser.GameObjects.Image[] = [];
  private bannerWidth = 1;
  private bannerHeight = 1;
  private confettiBack!: Phaser.GameObjects.Particles.ParticleEmitter;
  private confettiFront!: Phaser.GameObjects.Particles.ParticleEmitter;
  private tutorial!: Phaser.GameObjects.Image;
  private tutorialActive = false;

  constructor() {
    super("GameScene");
  }

  preload(): void {
    this.load.image("rack", "images/rack2.png");
    this.load.image("cover", "images/Cover.png");
    this.load.image("victory", "images/victory-5.png");
    this.load.image("continue", "images/continue-button.png");
    this.load.image("star", "images/star.png");
    this.load.image("tap-bottle", "images/tap-a-bottle-tooltip.png");
    this.load.image(
      "tap-swap",
      "images/Tap%20Another%20to%20Swap%20Bottle.png",
    );
    this.load.audio("tap", "audio/tap.wav");
    this.load.audio("swap", "audio/swap.wav");
    this.load.audio("bg", "audio/bg.mp3");
    this.load.audio("victory", "audio/victory.mp3");
    this.load.image("sound", "images/mute-unmute.png");
    this.load.image("numbers", "images/numbers.png");
    this.load.image("correct", "images/correct.png");
    this.load.image("levels", "images/levels.png");
    this.load.image("time-moves", "images/time-moves.png");
    this.load.image("bottles", "images/bottles.png");
    this.load.image("bottle-shadow-src", "images/bottle-shadow.png");
  }

  create(): void {
    useArrowCursor(this);
    playBackgroundMusic(this);
    useSharpTextures(this);
    sliceBottleSheet(this);
    this.addNumberFrames();
    this.addLevelFrames();

    this.levelBanner = this.add
      .image(GAME_WIDTH / 2, px(78), "level-1")
      .setOrigin(0.5)
      .setDepth(8);
    this.fitLevelBanner(1);

    this.buildStretchRack();

    this.playerBottles = Array.from({ length: MAX_SLOTS }, () =>
      this.add.image(0, 0, "blue").setOrigin(0.5, 1).setDepth(5),
    );
    this.hiddenBottles = Array.from({ length: MAX_SLOTS }, () =>
      this.add.image(0, 0, "blue").setOrigin(0.5, 1).setDepth(2),
    );
    this.zones = this.playerBottles.map((_, index) => {
      const zone = this.add.zone(0, 0, 10, 10).setOrigin(0.5, 0.5).setDepth(8);
      zone.on("pointerdown", () => this.onSlotClicked(index));
      return zone;
    });

    this.scoreMark = this.add
      .image(GAME_WIDTH / 2, this.cover.y, "numbers", "count-0")
      .setOrigin(0.5, 0.5)
      .setDepth(7);
    this.addCorrectFrame();
    this.correctLabel = this.add
      .image(GAME_WIDTH / 2, this.cover.y, "correct", "label")
      .setOrigin(0.5, 0)
      .setDepth(7);
    this.fitScore();

    this.winOverlay = this.buildWinOverlay();
    this.winOverlay.setVisible(false);
    this.buildTutorial();
    createMusicButton(this);
    this.buildPlayHud();

    this.startRound();
  }

  update(): void {
    if (!this.clockRunning) {
      return;
    }
    const elapsed = this.elapsedSeconds();
    if (elapsed === this.shownSecond) {
      return;
    }
    this.shownSecond = elapsed;
    this.timeHudText.setText(this.formatClock(elapsed));
  }

  private buildStretchRack(): void {
    this.addSliceFrames(
      this.textures.get("rack"),
      "rack",
      RACK_CAP_W,
      RACK_MID_W,
      RACK_SRC_H,
      0,
    );
    this.addSliceFrames(
      this.textures.get("rack"),
      "lip",
      RACK_CAP_W,
      RACK_MID_W,
      LIP_HEIGHT,
      LIP_TOP,
    );
    this.addSliceFrames(
      this.textures.get("cover"),
      "cover",
      COVER_CAP_W,
      COVER_MID_W,
      COVER_SRC_H,
      0,
    );

    const piece = (frame: string, depth: number) =>
      this.add.image(0, 0, "rack", frame).setOrigin(0, 0.5).setDepth(depth);
    this.rackLeft = piece("rack-left", 2);
    this.rackMid = piece("rack-mid", 2);
    this.rackRight = piece("rack-right", 2);
    this.lipLeft = piece("lip-left", 6);
    this.lipMid = piece("lip-mid", 6);
    this.lipRight = piece("lip-right", 6);

    this.coverLeft = this.add
      .image(0, 0, "cover", "cover-left")
      .setOrigin(0, 0.5);
    this.coverMids = [0, 1, 2].map(() =>
      this.add
        .image(0, 0, "cover", "cover-mid")
        .setOrigin(0, 0.5)
        .setVisible(false),
    );
    this.coverRight = this.add
      .image(0, 0, "cover", "cover-right")
      .setOrigin(0, 0.5);
    this.cover = this.add
      .container(GAME_WIDTH / 2, 0, [
        this.coverLeft,
        ...this.coverMids,
        this.coverRight,
      ])
      .setDepth(4);
    addBottleShadow(this);
    this.bottleShadows = Array.from({ length: MAX_SLOTS }, () =>
      this.add
        .image(0, 0, "bottle-shadow")
        .setOrigin(0.5, 1)
        .setAlpha(0.88)
        .setVisible(false),
    );
    this.cover.add(this.bottleShadows);
    this.layoutRack(1);
  }

  private addSliceFrames(
    texture: Phaser.Textures.Texture,
    prefix: string,
    cap: number,
    mid: number,
    height: number,
    y: number,
  ): void {
    const frames: Array<[string, number, number]> = [
      [`${prefix}-left`, 0, cap],
      [`${prefix}-mid`, cap, mid],
      [`${prefix}-right`, cap + mid, cap],
    ];
    for (const [name, x, width] of frames) {
      if (!texture.has(name)) {
        texture.add(name, 0, x, y, width, height);
      }
    }
  }

  private rackScale(): number {
    return px(RACK_HEIGHT) / RACK_SRC_H;
  }

  private layoutRack(stretch: number): void {
    this.midStretch = stretch;
    const scale = this.rackScale();
    const displayW = expandedWidth(stretch) * scale;
    const leftEdge = GAME_WIDTH / 2 - displayW / 2;
    const y = px(RACK_CENTER_Y);
    const seam = 1;

    const place = (
      left: Phaser.GameObjects.Image,
      mid: Phaser.GameObjects.Image,
      right: Phaser.GameObjects.Image,
      pieceY: number,
    ) => {
      left.setPosition(leftEdge, pieceY).setScale(scale);
      mid
        .setPosition(leftEdge + RACK_CAP_W * scale - seam, pieceY)
        .setScale(scale * stretch, scale);
      right
        .setPosition(
          leftEdge + (RACK_CAP_W + RACK_MID_W * stretch) * scale - seam * 2,
          pieceY,
        )
        .setScale(scale);
    };

    place(this.rackLeft, this.rackMid, this.rackRight, y);
    const lipCenter = LIP_TOP + LIP_HEIGHT / 2;
    place(
      this.lipLeft,
      this.lipMid,
      this.lipRight,
      y + (lipCenter - RACK_SRC_H / 2) * scale,
    );
    this.layoutCover(displayW);
    if (!this.expanding && this.zones.length > 0) {
      this.layoutSlots();
    }
  }

  private layoutCover(rackDisplayWidth: number): void {
    const coverScale =
      (expandedWidth(1) * this.rackScale() * 0.9) / COVER_SRC_W;
    const stretch = coverMiddleStretch(rackDisplayWidth, coverScale);
    const tiles = Math.min(
      this.coverMids.length,
      Math.max(1, Math.round(stretch)),
    );
    const tileStretch = stretch / tiles;
    const displayW = (COVER_CAP_W * 2 + COVER_MID_W * stretch) * coverScale;
    this.coverHeight = COVER_SRC_H * coverScale;

    const overlap = 2;
    let cursor = -displayW / 2;
    this.coverLeft.setScale(coverScale).setPosition(cursor, 0);
    cursor += COVER_CAP_W * coverScale;
    this.coverMids.forEach((mid, index) => {
      const shown = index < tiles;
      mid.setVisible(shown);
      if (!shown) {
        return;
      }
      mid
        .setScale(coverScale * tileStretch, coverScale)
        .setPosition(cursor - overlap, 0);
      cursor += COVER_MID_W * tileStretch * coverScale - overlap;
    });
    this.coverRight.setScale(coverScale).setPosition(cursor - overlap, 0);

    const topShelf = this.slotPoint(0, TOP_SHELF_Y).y;
    this.coverHomeY = topShelf + this.coverHeight * 0.42;
    if (!this.won && !this.expanding) {
      this.cover.setPosition(GAME_WIDTH / 2, this.coverHomeY);
    } else {
      this.cover.setX(GAME_WIDTH / 2);
    }
    this.scoreMark?.setPosition(GAME_WIDTH / 2, this.cover.y);
    this.fitScore();
  }

  private layoutSlots(): void {
    const count = this.playerSlots.length;
    const scale = this.rackScale();
    const level1Width = expandedWidth(1) * scale;
    const zoneHeight = level1Width * 0.28;
    const zoneWidth =
      count <= 4 ? level1Width * 0.2 : SLOT_PITCH * scale * 0.92;

    this.zones.forEach((zone, index) => {
      if (index >= count) {
        this.playerBottles[index]?.setVisible(false);
        this.hiddenBottles[index]?.setVisible(false);
        this.bottleShadows[index]?.setVisible(false);
        if (zone.input) {
          zone.disableInteractive();
        }
        return;
      }
      const top = this.slotPoint(index, TOP_SHELF_Y);
      const bottom = this.slotPoint(index, BOTTOM_SHELF_Y);
      this.playerBottles[index].setPosition(top.x, top.y);
      this.hiddenBottles[index].setPosition(bottom.x, bottom.y);
      const shadowHeight = px(RACK_HEIGHT) * SHADOW_HEIGHT;
      this.bottleShadows[index]
        .setVisible(true)
        .setScale(shadowHeight / this.bottleShadows[index].height)
        .setPosition(bottom.x - this.cover.x, bottom.y - this.cover.y);
      zone
        .setPosition(top.x, top.y - zoneHeight * 0.42)
        .setSize(zoneWidth, zoneHeight);
      zone.setInteractive({ cursor: POINTER_CURSOR });
    });
  }

  private slotPoint(index: number, yFrac: number): { x: number; y: number } {
    const scale = this.rackScale();
    const leftEdge =
      GAME_WIDTH / 2 - (expandedWidth(this.midStretch) * scale) / 2;
    const height = RACK_SRC_H * scale;
    return {
      x: leftEdge + slotLogicalX(slotCountForLevel(this.level), index) * scale,
      y: px(RACK_CENTER_Y) - height / 2 + yFrac * height,
    };
  }

  private bottleScale(color: BottleColor, heightFraction: number): number {
    const frame = this.textures.getFrame(color);
    return (px(RACK_HEIGHT) * heightFraction) / frame.height;
  }

  private startRound(): void {
    const palette = paletteForLevel(this.level);
    this.secret = createSecret(Math.random, palette);
    this.playerSlots = createWrongOrder(this.secret);
    this.bestMoves = minimumSwaps(this.secret, this.playerSlots);
    this.selectedIndex = null;
    this.swapping = false;
    this.won = false;
    this.moves = 0;
    this.roundStartedAt = this.time.now;
    this.clockRunning = true;
    this.shownSecond = -1;
    this.refreshPlayHud();
    this.hideVictory();
    this.fitLevelBanner(this.level);
    this.layoutRack(rackStretch(palette.length));
    this.resetCover();
    this.secret.forEach((color, index) => {
      this.hiddenBottles[index]
        .setTexture(color)
        .setScale(this.bottleScale(color, BOTTOM_BOTTLE_HEIGHT))
        .setVisible(true);
    });
    this.syncPlayerBottles();
    this.syncSelection();
    this.syncCurtain();
    this.beginTutorialIfNeeded();
  }

  private advanceLevel(): void {
    const nextLevel = this.level + 1;
    if (nextLevel > MAX_LEVEL) {
      this.startRound();
      return;
    }

    this.expanding = true;
    const from = this.midStretch;
    this.level = nextLevel;
    this.fitLevelBanner(nextLevel, true);
    for (const sprite of [...this.playerBottles, ...this.hiddenBottles]) {
      sprite.setVisible(false);
    }
    this.cover.setVisible(false);
    this.scoreMark.setVisible(false);
    this.correctLabel.setVisible(false);

    const state = { stretch: from };
    this.tweens.add({
      targets: state,
      stretch: rackStretch(slotCountForLevel(nextLevel)),
      duration: 720,
      ease: "Cubic.easeInOut",
      onUpdate: () => this.layoutRack(state.stretch),
      onComplete: () => {
        this.expanding = false;
        this.startRound();
      },
    });
  }

  private onSlotClicked(index: number): void {
    if (
      this.won ||
      this.swapping ||
      this.expanding ||
      index >= this.playerSlots.length
    ) {
      return;
    }
    if (this.selectedIndex === null) {
      this.selectedIndex = index;
      this.sound.play("tap");
      this.syncSelection();
      this.refreshTutorial();
      return;
    }
    if (this.selectedIndex === index) {
      this.selectedIndex = null;
      this.sound.play("tap");
      this.syncSelection();
      this.refreshTutorial();
      return;
    }

    const first = this.selectedIndex;
    this.selectedIndex = null;
    this.syncSelection();
    this.hideTutorial();
    this.sound.play("swap");
    this.swapWithMotion(first, index);
  }

  private swapWithMotion(first: number, second: number): void {
    this.swapping = true;
    const bottleA = this.playerBottles[first];
    const bottleB = this.playerBottles[second];
    const ax = this.slotPoint(first, TOP_SHELF_Y).x;
    const bx = this.slotPoint(second, TOP_SHELF_Y).x;
    const shelfY = this.slotPoint(first, TOP_SHELF_Y).y;
    this.tweens.killTweensOf([bottleA, bottleB]);
    bottleA.setDepth(7);
    bottleB.setDepth(7);

    this.tweens.add({
      targets: bottleA,
      x: bx,
      y: shelfY,
      duration: 180,
      ease: "Quad.easeInOut",
    });
    this.tweens.add({
      targets: bottleB,
      x: ax,
      y: shelfY,
      duration: 180,
      ease: "Quad.easeInOut",
      onComplete: () => {
        bottleA.setPosition(ax, shelfY).setDepth(5);
        bottleB.setPosition(bx, shelfY).setDepth(5);
        this.playerSlots = swapBottles(this.playerSlots, first, second);
        this.moves += 1;
        this.movesHudText.setText(String(this.moves));
        this.syncPlayerBottles();
        this.syncCurtain();
        this.swapping = false;
        this.finishTutorial();
        this.checkWin();
      },
    });
  }

  private syncPlayerBottles(): void {
    this.playerBottles.forEach((sprite, index) => {
      const color = this.playerSlots[index];
      if (!color) {
        sprite.setVisible(false);
        return;
      }
      sprite
        .setTexture(color)
        .setVisible(true)
        .setScale(this.bottleScale(color, TOP_BOTTLE_HEIGHT));
    });
  }

  private syncSelection(): void {
    this.playerBottles.forEach((sprite, index) => {
      const color = this.playerSlots[index];
      if (!color) {
        return;
      }
      const base = this.bottleScale(color, TOP_BOTTLE_HEIGHT);
      const selected = index === this.selectedIndex && !this.won;
      const restY = this.slotPoint(index, TOP_SHELF_Y).y;
      const lift = base * this.textures.getFrame(color).height * 0.42;

      this.tweens.killTweensOf(sprite);
      sprite.setDepth(selected ? 7 : 5);
      this.tweens.add({
        targets: sprite,
        y: selected ? restY - lift : restY,
        scaleX: selected ? base * 1.12 : base,
        scaleY: selected ? base * 1.12 : base,
        duration: 160,
        ease: selected ? "Back.easeOut" : "Quad.easeOut",
      });
    });
  }

  private syncCurtain(): void {
    if (this.won) {
      this.scoreMark.setVisible(false);
      this.correctLabel.setVisible(false);
      return;
    }
    const count = Math.min(
      NUMBER_FRAMES.length - 1,
      countCorrect(this.secret, this.playerSlots),
    );
    const frame = `count-${count}`;
    const changed = this.scoreMark.frame.name !== frame;
    this.scoreMark.setVisible(true).setFrame(frame);
    this.correctLabel.setVisible(true);
    this.fitScore();
    if (!changed) {
      return;
    }
    const scale = this.scoreMark.scaleX;
    this.tweens.killTweensOf(this.scoreMark);
    this.scoreMark.setScale(scale * 0.84);
    this.tweens.add({
      targets: this.scoreMark,
      scaleX: scale,
      scaleY: scale,
      duration: 180,
      ease: "Back.easeOut",
    });
  }

  private addCorrectFrame(): void {
    const texture = this.textures.get("correct");
    if (!texture.has("label")) {
      texture.add("label", 0, 64, 81, 2060, 539);
    }
  }

  private fitScore(): void {
    if (!this.scoreMark) {
      return;
    }
    const target = this.coverHeight * 0.36;
    this.scoreMark.setScale(target / this.scoreMark.frame.height);
    this.placeCorrectLabel();
  }

  private placeCorrectLabel(): void {
    if (!this.correctLabel) {
      return;
    }
    const numberHeight = this.scoreMark.displayHeight;
    const labelHeight = numberHeight * 0.72;
    this.correctLabel.setScale(labelHeight / this.correctLabel.height);
    const gap = Math.max(px(2), Math.round(numberHeight * 0.04));
    this.correctLabel.setPosition(
      this.scoreMark.x,
      this.scoreMark.y + numberHeight / 2 + gap,
    );
  }

  private addLevelFrames(): void {
    LEVEL_FRAMES.forEach(([x, y, width, height], index) => {
      addSharpSlice(this, "levels", `level-${index + 1}`, x, y, width, height);
    });
  }

  private fitLevelBanner(level: number, pop = false): void {
    const clamped = Math.min(LEVEL_FRAMES.length, Math.max(1, level));
    this.levelBanner.setTexture(`level-${clamped}`);
    this.levelBannerBase = px(220) / this.levelBanner.frame.width;
    this.tweens.killTweensOf(this.levelBanner);
    if (!pop) {
      this.levelBanner.setScale(this.levelBannerBase);
      return;
    }
    this.levelBanner.setScale(this.levelBannerBase * 0.65);
    this.tweens.add({
      targets: this.levelBanner,
      scale: this.levelBannerBase,
      duration: 420,
      ease: "Back.easeOut",
    });
  }

  private addNumberFrames(): void {
    const texture = this.textures.get("numbers");
    NUMBER_FRAMES.forEach(([x, y, width, height], index) => {
      const name = `count-${index}`;
      if (!texture.has(name)) {
        texture.add(name, 0, x, y, width, height);
      }
    });
  }

  private checkWin(): void {
    if (
      countCorrect(this.secret, this.playerSlots) !== this.playerSlots.length
    ) {
      return;
    }
    this.won = true;
    this.selectedIndex = null;
    this.syncSelection();
    this.revealSecret();
  }

  private revealSecret(): void {
    this.tweens.killTweensOf([
      this.cover,
      this.scoreMark,
      this.correctLabel,
      ...this.hiddenBottles,
    ]);
    this.tweens.add({
      targets: [this.scoreMark, this.correctLabel],
      alpha: 0,
      duration: 160,
    });

    this.hiddenBottles.forEach((sprite) => {
      const full = sprite.scaleX;
      sprite.setScale(full * 0.9);
      this.tweens.add({
        targets: sprite,
        scaleX: full,
        scaleY: full,
        duration: 460,
        delay: 260,
        ease: "Back.easeOut",
      });
    });

    this.tweens.add({
      targets: this.cover,
      y: this.coverHomeY + this.coverHeight * 0.9,
      alpha: 0,
      duration: 720,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.cover.setVisible(false);
        this.scoreMark.setVisible(false);
        this.correctLabel.setVisible(false);
        this.victoryTimer = this.time.delayedCall(560, () => {
          this.victoryTimer = undefined;
          this.playVictoryFanfare();
          this.showVictory();
        });
      },
    });
  }

  private resetCover(): void {
    this.victoryTimer?.remove(false);
    this.victoryTimer = undefined;
    this.tweens.killTweensOf([
      this.cover,
      this.scoreMark,
      this.correctLabel,
      ...this.hiddenBottles,
    ]);
    this.cover
      .setPosition(GAME_WIDTH / 2, this.coverHomeY)
      .setAlpha(1)
      .setVisible(true);
    this.scoreMark.setAlpha(1).setVisible(true);
    this.correctLabel.setAlpha(1).setVisible(true);
    this.fitScore();
  }

  private playVictoryFanfare(): void {
    const music = this.sound.get("bg");
    if (music?.isPlaying) {
      music.pause();
    }
    const swap = this.sound.get("swap");
    if (swap?.isPlaying) {
      swap.stop();
    }

    this.sound.get("victory")?.destroy();
    const fanfare = this.sound.add("victory");
    fanfare.once("complete", () => {
      this.resumeBackgroundMusic();
      fanfare.destroy();
    });
    fanfare.play();
  }

  private stopVictoryFanfare(): void {
    const fanfare = this.sound.get("victory");
    if (fanfare) {
      if (fanfare.isPlaying) {
        fanfare.stop();
      }
      fanfare.destroy();
    }
    this.resumeBackgroundMusic();
  }

  private resumeBackgroundMusic(): void {
    syncBackgroundMusic(this);
  }

  private buildWinOverlay(): Phaser.GameObjects.Container {
    this.makeConfettiTexture();

    this.winBackdrop = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x1a120c,
        0.45,
      )
      .setDepth(20)
      .setVisible(false);
    this.winBackdrop.setInteractive();

    const burst = {
      x: { min: 0, max: GAME_WIDTH },
      y: px(-20),
      lifespan: 3200,
      speedX: { min: -120, max: 120 },
      speedY: { min: 40, max: 220 },
      gravityY: px(280),
      scale: { min: 0.55, max: 1.25 },
      rotate: { start: 0, end: 360 },
      tint: [0xff5a5a, 0xffd84a, 0x5dffa1, 0x5ac8ff, 0xff7ad9, 0xfff1a8],
      emitting: false,
    };
    this.confettiBack = this.add
      .particles(0, 0, "confetti", { ...burst, frequency: 30, quantity: 2 })
      .setDepth(21);
    this.confettiFront = this.add
      .particles(0, 0, "confetti", {
        ...burst,
        frequency: 90,
        quantity: 1,
        scale: { min: 0.7, max: 1.45 },
      })
      .setDepth(23);

    const overlay = this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setDepth(22);
    const banner = this.add.image(0, 0, "victory");
    banner.setScale(
      Math.min(
        (GAME_HEIGHT * 0.94) / banner.height,
        (GAME_WIDTH * 0.72) / banner.width,
      ),
    );
    const width = banner.displayWidth;
    const height = banner.displayHeight;
    this.bannerWidth = width;
    this.bannerHeight = height;
    this.stars = [0, 1, 2].map(() =>
      this.add.image(0, 0, "star").setOrigin(0.5).setVisible(false),
    );

    const scoreStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif',
      fontSize: `${Math.round(height * 0.034)}px`,
      color: "#fff6dc",
      stroke: "#5c2e0c",
      strokeThickness: Math.max(px(2), Math.round(height * 0.004)),
    };
    this.movesText = this.add
      .text((0.315 - 0.5) * width, (0.767 - 0.5) * height, "0", scoreStyle)
      .setOrigin(0.5);
    this.timeText = this.add
      .text((0.683 - 0.5) * width, (0.767 - 0.5) * height, "0:00", scoreStyle)
      .setOrigin(0.5);

    this.continueButton = this.add.image(
      (0.499 - 0.5) * width,
      (0.865 - 0.5) * height,
      "continue",
    );
    this.continueBase = (height * 0.1) / this.continueButton.height;
    this.continueButton.setScale(this.continueBase);
    this.continueButton.setInteractive({ cursor: POINTER_CURSOR });
    this.continueButton.on("pointerover", () =>
      this.continueButton.setScale(this.continueBase * 1.04),
    );
    this.continueButton.on("pointerout", () =>
      this.continueButton.setScale(this.continueBase),
    );
    this.continueButton.on("pointerdown", () => {
      this.continueButton.disableInteractive();
      this.tweens.add({
        targets: this.continueButton,
        scale: this.continueBase * 0.96,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          if (this.level < MAX_LEVEL) {
            this.hideVictory();
            this.advanceLevel();
            return;
          }
          this.startRound();
        },
      });
    });

    overlay.add([
      banner,
      ...this.stars,
      this.movesText,
      this.timeText,
      this.continueButton,
    ]);
    overlay.setVisible(false);
    return overlay;
  }

  private makeConfettiTexture(): void {
    if (this.textures.exists("confetti")) {
      return;
    }
    const graphic = this.add.graphics().setVisible(false);
    graphic.fillStyle(0xffffff);
    graphic.fillRoundedRect(0, 0, px(14), px(22), px(3));
    graphic.generateTexture("confetti", px(14), px(22));
    graphic.destroy();
  }

  private buildTutorial(): void {
    this.tutorial = this.add
      .image(0, 0, "tap-bottle")
      .setDepth(9)
      .setVisible(false);
  }

  private tutorialDone(): boolean {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === "1";
    } catch {
      return false;
    }
  }

  private beginTutorialIfNeeded(): void {
    if (this.tutorialDone()) {
      this.tutorialActive = false;
      this.hideTutorial();
      return;
    }
    this.tutorialActive = true;
    this.placeTutorial(0, "tap-bottle");
  }

  private refreshTutorial(): void {
    if (!this.tutorialActive) {
      return;
    }
    if (this.selectedIndex === null) {
      this.placeTutorial(0, "tap-bottle");
      return;
    }
    const next = this.selectedIndex === 0 ? 1 : 0;
    this.placeTutorial(next, "tap-swap");
  }

  private placeTutorial(index: number, key: "tap-bottle" | "tap-swap"): void {
    const tip =
      key === "tap-bottle" ? { x: 0.501, y: 0.966 } : { x: 0.503, y: 0.961 };
    this.tutorial.setTexture(key).setOrigin(tip.x, tip.y);
    this.tutorial.setScale(
      px(key === "tap-swap" ? 380 : 320) / this.tutorial.width,
    );

    const color = this.playerSlots[index];
    const height =
      this.bottleScale(color, TOP_BOTTLE_HEIGHT) *
      this.textures.getFrame(color).height;
    const rest = this.slotPoint(index, TOP_SHELF_Y);
    // Lowest point of the bob. Keep the arrow above the cap. The swap banner
    // is wide enough to cover a raised neighbor, so that step sits higher.
    const raisedClearance = key === "tap-swap" ? px(14) : 0;
    const capY = rest.y - height - px(8) - raisedClearance;
    this.tweens.killTweensOf(this.tutorial);
    this.tutorial.setPosition(rest.x, capY).setVisible(true);
    this.tweens.add({
      targets: this.tutorial,
      y: capY - px(10),
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private hideTutorial(): void {
    this.tweens.killTweensOf(this.tutorial);
    this.tutorial.setVisible(false);
  }

  private finishTutorial(): void {
    if (!this.tutorialActive) {
      return;
    }
    this.tutorialActive = false;
    this.hideTutorial();
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      // The guide still stays hidden for this visit.
    }
  }

  private addHudFrames(): void {
    const texture = this.textures.get("time-moves");
    if (!texture.has("time")) {
      texture.add(
        "time",
        0,
        TIME_FRAME.x,
        TIME_FRAME.y,
        TIME_FRAME.w,
        TIME_FRAME.h,
      );
    }
    if (!texture.has("moves")) {
      texture.add(
        "moves",
        0,
        MOVES_FRAME.x,
        MOVES_FRAME.y,
        MOVES_FRAME.w,
        MOVES_FRAME.h,
      );
    }
  }

  private buildPlayHud(): void {
    this.addHudFrames();
    const margin = px(6);
    const width = px(340);
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif',
      color: "#fff6dc",
      stroke: "#5c2e0c",
      align: "center",
    };

    this.movesHud = this.add
      .image(margin, GAME_HEIGHT - margin, "time-moves", "moves")
      .setOrigin(0, 1)
      .setDepth(14);
    this.timeHud = this.add
      .image(GAME_WIDTH - margin, GAME_HEIGHT - margin, "time-moves", "time")
      .setOrigin(1, 1)
      .setDepth(14);
    this.movesHudText = this.add
      .text(0, 0, "0", labelStyle)
      .setOrigin(0.5)
      .setDepth(15);
    this.timeHudText = this.add
      .text(0, 0, "0:00", labelStyle)
      .setOrigin(0.5)
      .setDepth(15);

    this.movesHud.setScale(width / this.movesHud.width);
    this.timeHud.setScale(width / this.timeHud.width);
    this.placeWellLabel(this.movesHud, this.movesHudText, MOVES_WELL);
    this.placeWellLabel(this.timeHud, this.timeHudText, TIME_WELL);
  }

  private placeWellLabel(
    badge: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
    well: { x: number; y: number },
  ): void {
    const fontSize = Math.round(badge.displayHeight * 0.11);
    label.setStyle({
      fontSize: `${fontSize}px`,
      strokeThickness: Math.max(px(3), Math.round(fontSize * 0.16)),
    });
    label.setPosition(
      badge.x + (well.x - badge.originX) * badge.displayWidth,
      badge.y + (well.y - badge.originY) * badge.displayHeight,
    );
  }

  private refreshPlayHud(): void {
    this.movesHudText.setText(String(this.moves));
    const elapsed = this.elapsedSeconds();
    this.shownSecond = elapsed;
    this.timeHudText.setText(this.formatClock(elapsed));
  }

  private elapsedSeconds(): number {
    return Math.max(
      0,
      Math.floor((this.time.now - this.roundStartedAt) / 1000),
    );
  }

  private formatClock(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  private showVictory(): void {
    this.clockRunning = false;
    const elapsed = this.elapsedSeconds();
    this.shownSecond = elapsed;
    this.movesText.setText(String(this.moves));
    this.timeText.setText(this.formatClock(elapsed));
    this.movesHudText.setText(String(this.moves));
    this.timeHudText.setText(this.formatClock(elapsed));
    this.presentStars(victoryStars(this.moves, elapsed, this.bestMoves));

    this.winBackdrop.setVisible(true).setAlpha(0);
    this.winOverlay.setVisible(true).setAlpha(0).setScale(0.35);
    this.confettiBack.explode(70, GAME_WIDTH / 2, GAME_HEIGHT * 0.2);
    this.confettiBack.start();
    this.confettiFront.start();

    this.tweens.add({ targets: this.winBackdrop, alpha: 1, duration: 280 });
    this.tweens.add({
      targets: this.winOverlay,
      alpha: 1,
      scale: 1,
      duration: 520,
      ease: "Back.easeOut",
    });
  }

  private presentStars(count: 1 | 2 | 3): void {
    const width = this.bannerWidth;
    const height = this.bannerHeight;
    // Cover each wooden star placeholder. The middle slot is slightly larger.
    const stages = [
      {
        x: (0.198 - 0.5) * width,
        y: (0.53 - 0.5) * height,
        size: 0.335,
        show: count >= 1,
        delay: 0,
      },
      {
        x: (0.5 - 0.5) * width,
        y: (0.516 - 0.5) * height,
        size: 0.358,
        show: count >= 2,
        delay: 340,
      },
      {
        x: (0.802 - 0.5) * width,
        y: (0.53 - 0.5) * height,
        size: 0.335,
        show: count >= 3,
        delay: 680,
      },
    ];

    this.stars.forEach((star, index) => {
      this.tweens.killTweensOf(star);
      const stage = stages[index];
      if (!stage.show) {
        star.setVisible(false);
        return;
      }
      const scale = (width * stage.size) / star.width;
      star
        .setPosition(stage.x, stage.y)
        .setAngle(0)
        .setScale(0)
        .setVisible(true);
      this.tweens.add({
        targets: star,
        scale,
        duration: 420,
        delay: 280 + stage.delay,
        ease: "Back.easeOut",
      });
    });
  }

  private hideVictory(): void {
    this.victoryTimer?.remove(false);
    this.victoryTimer = undefined;
    this.stopVictoryFanfare();
    this.tweens.killTweensOf([
      this.winBackdrop,
      this.winOverlay,
      this.continueButton,
      ...this.stars,
    ]);
    this.stars.forEach((star) => star.setVisible(false));
    this.continueButton
      .setScale(this.continueBase)
      .setInteractive({ cursor: POINTER_CURSOR });
    this.confettiBack.stop(true);
    this.confettiFront.stop(true);
    this.winBackdrop.setVisible(false);
    this.winOverlay.setVisible(false).setScale(1).setAlpha(1);
  }
}
